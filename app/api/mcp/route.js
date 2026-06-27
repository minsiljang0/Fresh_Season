// app/api/mcp/route.js
//
// 우리 사이트 블로그 자동화용 MCP(Model Context Protocol) 서버.
// Vercel 공식 mcp-handler 패키지로 Streamable HTTP 프로토콜을 구현합니다.
// Claude(연결된 커넥터)가 이 툴들을 직접 호출해서 "오늘 블로그 글" 글감을
// 사람 개입 없이 스스로 판단할 수 있게 하는 것이 목적입니다.
//
// 노출 툴 17개 (실제 등록 기준):
//   - get_publish_log     : 발행 기록 조회 (메모 포함, 중복 방지 + 키워드 사용 추적용, STEP 1에서 가장 먼저 호출)
//   - get_keyword_data    : 도구별 찜한 키워드 + 캐시된 TOP 키워드 조회 (Supabase, hint로 좁혀서 봄)
//   - search_keyword_data : keyword_stats 전체를 hint 구분 없이 검색/열람, competition 필터로 황금키워드 탐색
//   - naver_keyword_volume: 특정 키워드의 실시간 네이버 검색량 조회 (네이버 API 직접 호출, 저장 안 함)
//   - save_keyword_data   : naver_keyword_volume 조회 결과를 TOP 키워드 캐시에 저장 (쓰기 작업)
//   - pick_keyword        : 나중에 쓸 키워드를 찜(bookmark)해두기, 계획 메모 포함 (쓰기 작업)
//   - search_keyword_picks: 찜해둔 키워드 검색/열람, 기본은 미사용만 (그룹 구분 없음)
//   - mark_keyword_used   : 찜 키워드를 글에 실제로 썼을 때 사용 처리 — 날짜·글 자동 기록 (쓰기 작업)
//   - suggest_feature     : 새 도구가 아니라 "기존 도구에 기능 추가" 제안을 검토 메모와 함께 기록 (쓰기 작업)
//   - get_feature_ideas   : suggest_feature로 기록해둔 기능 추가 제안 목록 조회
//   - add_publish_log     : 글 작성 후 발행 기록에 자동으로 남기기, 찜 키워드 사용 메모 포함 (쓰기 작업)
//   - create_blog_post    : 블로그 글 본문을 실제로 사이트에 발행 (쓰기 작업, 기본 status=published)
//   - get_tool_info       : 도구별 최신 기능 설명 조회 (STEP 1에서 get_publish_log와 함께 호출)
//   - update_tool_info    : 도구 기능 설명 갱신 (사용자가 대화 중 직접 정정해줬을 때만 호출, 쓰기 작업)
//
// keyword_picks 테이블에 사용 처리 컬럼이 필요합니다 (최초 1회, Supabase SQL 에디터에서 실행):
//
// alter table keyword_picks
//   add column if not exists used_at timestamptz,
//   add column if not exists used_in_title text,
//   add column if not exists used_in_slug text;
//
// suggest_feature/get_feature_ideas가 쓰는 feature_ideas 테이블도 최초 1회 생성 필요:
//
// create table if not exists feature_ideas (
//   id text primary key,
//   tool_id text not null,            -- 기능을 추가할 기존 도구 코드 (예: text-down)
//   feature_name text not null,       -- 추가할 기능 이름 (예: "맞춤법 검사")
//   keyword text,                     -- 근거가 된 키워드
//   pc integer, mobile integer, total integer, competition text,
//   notes text not null,              -- 구현 가능성 검토 결과 (비용/약관/대안 등)
//   status text not null default 'proposed',  -- proposed | building | done | rejected
//   created_at timestamptz not null default now()
// );
//
// "새 도구 만들기" vs "기존 도구에 기능 추가"는 의도적으로 분리했습니다 — 황금키워드가 발견됐다고
// 무조건 새 카테고리(DEFAULT_CATEGORIES)를 늘리는 게 아니라, 기존 도구와 결이 비슷하면
// suggest_feature로 "기능 추가" 후보로만 남겨둡니다. 정말 완전히 새로운 도구가 필요하다고
// 판단되면 그건 사람이 직접 사이트 도구 목록(DEFAULT_CATEGORIES)에 추가하고 TOOL_HINTS도
// 같이 갱신해야 합니다 (Claude가 임의로 새 카테고리를 만들지 않음).
//
// 황금키워드 운영 흐름 (검색량 높고 경쟁 낮은 키워드로 트래픽을 모으는 전략):
//   1. search_keyword_data(competition: "낮음")로 경쟁 낮은 후보를 검색량 순으로 훑어본다.
//      (admin 화면에서는 "🏆 황금키워드" 탭에서 같은 데이터를 사람이 직접 봄)
//   2. 글감으로만 쓸 거면 pick_keyword로 찜, "이미 있는 도구에 기능으로 추가하면 좋겠다" 싶으면
//      suggest_feature로 검토 메모와 함께 기록한다.
//   3. 글감을 정할 때마다 search_keyword_picks(기본 미사용만)·get_feature_ideas로 먼저 훑어,
//      오늘 쓸 만한 게 있는지 확인한다.
//   4. 찜 키워드를 실제로 글에 썼으면 mark_keyword_used를 호출한다 — used_at(날짜)·used_in_title/slug(어느 글)이
//      구조화된 컬럼으로 남기 때문에, admin "✅ 사용 키워드" 탭과 search_keyword_picks(include_used: true)에서
//      "그 키워드를 며칠에 어디에 썼는지"가 그대로 조회된다. (add_publish_log의 memo에도 같은 내용을 짧게
//      남겨두면 발행 기록 쪽에서도 한 번 더 확인할 수 있다.)
//
// get_keyword_data는 hint(도구 그룹)로 좁혀서 보고, search_keyword_data는 hint 구분 없이
// keyword_stats 전체를 본다 — 한 도구를 조사하다 다른 도구에도 쓸만한 키워드가 우연히
// 걸리는 경우가 많아서, 그런 "예상 못 한 연결"을 놓치지 않으려고 별도로 분리했습니다.
// (참고: admin 화면 KeywordPanel.js의 hint 표기 — voice-down은 "보이스", text-down은
// "텍스트" — 가 TOOL_HINTS의 "음성타이핑"/"글자수세기"와 다릅니다. get_keyword_data만 쓰면
// 이 불일치 때문에 데이터가 안 보일 수 있는데, search_keyword_data는 hint를 안 가리고
// 전체를 보기 때문에 이 불일치의 영향을 받지 않습니다.)
//
// save_keyword_data가 쓰는 keyword_stats 테이블은 이미 존재합니다
// (pages/api/tools/keyword-volume.js, keyword-top.js 등 admin API와 공유) —
// 별도 테이블 생성이 필요 없고, onConflict 'hint,keyword'로 upsert해 기존
// admin 수집 로직과 동일한 방식으로 동작합니다.
//
// tool_info 테이블 (Supabase에 최초 1회 생성 필요):
//
// create table tool_info (
//   tool_id text primary key,        -- 예: thumb-down, clock-down ...
//   name text,                       -- 도구명, 예: "카드뉴스 변환기"
//   description text not null,       -- 도구 기능 설명 (도구당 최신 1개, 덮어쓰기 방식)
//   path text,                       -- 경로, 예: /cardnews-down
//   updated_at timestamptz not null default now()
// );
//
// 이 테이블은 "도구가 정확히 무엇을 하는지"에 대한 살아있는 단일 정답을 보관합니다.
// Claude가 추측하거나 다른 글에서 유추한 내용으로는 절대 update_tool_info를 호출하지 않고,
// 사용자가 대화 중 직접 확인·정정해준 내용만 반영합니다.
//
// 필요한 환경변수 (Vercel 프로젝트 설정 > Environment Variables):
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY   - 기존 admin API들과 동일하게 사용
//   NAVER_AD_API_KEY / NAVER_AD_SECRET_KEY / NAVER_AD_CUSTOMER_ID - 네이버 검색광고 API
//   MCP_SHARED_SECRET                          - 이 MCP 서버 보호용 공유 비밀키 (직접 정해서 등록)
//
// claude.ai 커넥터 등록 주소 (Settings > Connectors > Add custom connector):
//   https://fresh-season.vercel.app/api/mcp?key=여기에_MCP_SHARED_SECRET_값
//
// ⚠️ 이 파일은 원래 app/.well-known/oauth-authorization-server/route.js 에
// 잘못된 경로로 들어가 있었습니다 (해당 경로는 실제로는 OAuth 메타데이터 전용
// 표준 경로라 MCP 핸들러가 거기 있으면 안 됩니다). app/api/mcp/route.js 로
// 옮기고, 기존 app/.well-known/oauth-authorization-server/route.js 파일은
// 삭제하세요.

import { createMcpHandler } from 'mcp-handler'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const REGION_CODES = [
  'seoul','busan','daegu','incheon','gwangju','daejeon','ulsan','sejong',
  'gyeonggi','gangwon','chungbuk','chungnam','jeonbuk','jeonnam','gyeongbuk','gyeongnam','jeju'
]

const REGION_LABELS = {
  seoul:'서울특별시', busan:'부산광역시', daegu:'대구광역시', incheon:'인천광역시',
  gwangju:'광주광역시', daejeon:'대전광역시', ulsan:'울산광역시', sejong:'세종특별자치시',
  gyeonggi:'경기도', gangwon:'강원특별자치도', chungbuk:'충청북도', chungnam:'충청남도',
  jeonbuk:'전북특별자치도', jeonnam:'전라남도', gyeongbuk:'경상북도', gyeongnam:'경상남도',
  jeju:'제주특별자치도',
}

function fmt(n) { return (n || 0).toLocaleString('ko-KR') }

// ── 네이버 검색광고 키워드도구 (기존 로직 그대로 유지) ──────────────────
const NAVER_BASE_URL = 'https://api.naver.com'
const NAVER_URI = '/keywordstool'

/** 현재 시각을 KST(UTC+9) 기준 ISO 문자열로 반환 */
function nowKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
}

function buildNaverHeaders() {
  const apiKey = process.env.NAVER_AD_API_KEY
  const secretKey = process.env.NAVER_AD_SECRET_KEY
  const customerId = process.env.NAVER_AD_CUSTOMER_ID
  if (!apiKey || !secretKey || !customerId) {
    throw new Error('네이버 검색광고 API 환경변수가 설정되지 않았습니다 (NAVER_AD_API_KEY / NAVER_AD_SECRET_KEY / NAVER_AD_CUSTOMER_ID)')
  }
  const timestamp = Date.now().toString()
  const message = `${timestamp}.GET.${NAVER_URI}`
  const signature = crypto.createHmac('sha256', secretKey).update(message).digest('base64')
  return {
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Timestamp': timestamp,
    'X-API-KEY': apiKey,
    'X-Customer': String(customerId),
    'X-Signature': signature,
  }
}

function normalizeKeywords(raw) {
  return String(raw || '').split(',').map(k => k.trim().replace(/\s+/g, '')).filter(Boolean).slice(0, 5)
}

async function fetchNaverKeywordData(keywords) {
  const headers = buildNaverHeaders()
  const hintKeywords = keywords.join(',')
  const url = `${NAVER_BASE_URL}${NAVER_URI}?hintKeywords=${encodeURIComponent(hintKeywords)}&showDetail=1`
  const response = await fetch(url, { method: 'GET', headers, signal: AbortSignal.timeout(8000) })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`네이버 API 오류 (${response.status}): ${text}`)
  }
  const data = await response.json()
  const list = Array.isArray(data?.keywordList) ? data.keywordList : []
  const parsed = list.map(item => {
    const pc = item.monthlyPcQcCnt === '< 10' ? 5 : Number(item.monthlyPcQcCnt) || 0
    const mobile = item.monthlyMobileQcCnt === '< 10' ? 5 : Number(item.monthlyMobileQcCnt) || 0
    return {
      keyword: item.relKeyword,
      monthlySearchPc: pc,
      monthlySearchMobile: mobile,
      monthlySearchTotal: pc + mobile,
      competition: item.compIdx,
    }
  }).sort((a, b) => b.monthlySearchTotal - a.monthlySearchTotal)

  // 네이버 블로그 검색 API로 문서수 병렬 조회
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET
  if (clientId && clientSecret) {
    const docCounts = await Promise.all(
      parsed.map(async (item) => {
        try {
          const res = await fetch(
            `https://openapi.naver.com/v1/search/blog?query=${encodeURIComponent(item.keyword)}&display=1`,
            {
              headers: { 'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret },
              signal: AbortSignal.timeout(5000),
            }
          )
          if (!res.ok) return null
          const d = await res.json()
          return d.total ?? null
        } catch {
          return null
        }
      })
    )
    return parsed.map((item, i) => ({ ...item, docCount: docCounts[i] }))
  }

  return parsed
}

// ── MCP 서버 정의 ─────────────────────────────────────────────────────
const baseHandler = createMcpHandler(
  (server) => {
    server.registerTool(
      'get_publish_log',
      {
        title: '블로그 발행 기록 조회',
        description:
          '지금까지 발행한 블로그 글 기록(도구/각도/제목/슬러그/발행일/메모)을 가져온다. ' +
          '오늘의 글감을 정하기 전, STEP 1에서 가장 먼저 호출해서 중복을 피하는 데 쓴다. ' +
          '메모에는 보통 그 글에서 어떤 찜 키워드를 어떻게 썼는지 적혀 있어, 황금키워드를 ' +
          '언제·어느 글에 썼는지 추적하는 용도로도 쓸 수 있다.',
        inputSchema: {
          region: z.enum(REGION_CODES).optional().describe('특정 시도로만 필터링하고 싶을 때'),
          limit: z.number().int().min(1).max(500).optional().describe('최대 개수 (기본 200)'),
        },
      },
      async ({ region, limit }) => {
        let q = supabase.from('publish_log').select('*').order('created_at', { ascending: false })
        if (region) q = q.eq('category', region)
        q = q.limit(limit || 200)
        const { data, error } = await q
        if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }], isError: true }
        if (!data || !data.length) {
          return { content: [{ type: 'text', text: '발행 기록: 없음 (처음 시작)' }] }
        }
        const lines = [`발행 기록 (${data.length}건, 최신순):`]
        data.forEach(l => {
          const dateStr = l.published_at || (l.created_at ? l.created_at.slice(0, 10) : '')
          lines.push(`- 시도: ${l.category} / 각도: ${l.angle} / 제목: ${l.title} / 슬러그: ${l.slug}${dateStr ? ' / 날짜: ' + dateStr : ''}${l.memo ? ' / 메모: ' + l.memo : ''}`)
        })
        return { content: [{ type: 'text', text: lines.join('\n') }] }
      }
    )

    server.registerTool(
      'get_keyword_data',
      {
        title: '도구별 키워드 검색량 조회 (캐시)',
        description:
          '특정 도구(tool_id)의 찜한 키워드와, 미리 수집해둔 TOP 검색량 키워드를 가져온다. ' +
          'STEP 1-5 키워드 각도 확정에 사용한다. 더 새로운 키워드 하나를 즉석에서 조회하고 싶으면 ' +
          'naver_keyword_volume 툴을 대신 쓴다.',
        inputSchema: {
          region: z.enum(REGION_CODES).describe('시도 코드. 예: gangwon, jeju'),
          limit: z.number().int().min(1).max(100).optional().describe('TOP 키워드 최대 개수 (기본 30)'),
        },
      },
      async ({ region, limit }) => {
        const hint = region
        const max = limit || 30
        const { data: topRows, error: topErr } = await supabase
          .from('keyword_stats').select('keyword, pc, mobile, total, competition')
          .eq('hint', hint).order('total', { ascending: false }).limit(max)
        if (topErr) return { content: [{ type: 'text', text: `오류: ${topErr.message}` }], isError: true }

        const { data: pickRows, error: pickErr } = await supabase
          .from('keyword_picks').select('keyword, pc, mobile, total, competition')
          .eq('tool_id', hint).order('total', { ascending: false })
        if (pickErr) return { content: [{ type: 'text', text: `오류: ${pickErr.message}` }], isError: true }

        const lines = []
        lines.push(`[시도] ${region} (${REGION_LABELS[region] || region})`)
        lines.push('')
        lines.push(`⭐ 찜한 키워드 (${pickRows.length}개):`)
        if (!pickRows.length) lines.push('- 없음')
        else pickRows.forEach(p => lines.push(`- ${p.keyword} · 합계 ${fmt(p.total)} (PC ${fmt(p.pc)} / 모바일 ${fmt(p.mobile)})${p.competition ? ' · 경쟁도 ' + p.competition : ''}`))
        lines.push('')
        lines.push(`📊 TOP 키워드 (검색량 순, 상위 ${topRows.length}개):`)
        if (!topRows.length) lines.push('- 데이터 없음 (admin > 키워드 관리에서 먼저 수집 필요)')
        else topRows.forEach((k, i) => lines.push(`${i + 1}. ${k.keyword} · 합계 ${fmt(k.total)} (PC ${fmt(k.pc)} / 모바일 ${fmt(k.mobile)})`))

        return { content: [{ type: 'text', text: lines.join('\n') }] }
      }
    )

    server.registerTool(
      'naver_keyword_volume',
      {
        title: '네이버 키워드 실시간 검색량 조회',
        description:
          '네이버 검색광고 키워드도구로 키워드별 월간 검색량(PC/모바일 합산)과 경쟁정도를 ' +
          '실시간으로 조회한다. NAVER_CLIENT_ID/SECRET 환경변수가 설정되어 있으면 네이버 블로그 ' +
          '문서수(docCount)도 함께 반환된다. 캐시에 없는 새 후보 키워드를 즉석에서 비교할 때 사용한다. ' +
          '조회 결과 중 나중에도 쓸만한 키워드가 있으면 save_keyword_data로 캐시에 저장해두면, ' +
          '다음 글 작성 때 get_keyword_data로 다시 불러와 재활용할 수 있다.',
        inputSchema: {
          hintKeywords: z.string().describe('쉼표로 구분된 한글 키워드 문자열, 최대 5개. 예: "유튜브썸네일,온라인타이머,포모도로타이머"'),
        },
      },
      async ({ hintKeywords }) => {
        const keywords = normalizeKeywords(hintKeywords)
        if (keywords.length === 0) {
          return { content: [{ type: 'text', text: '키워드가 비어있습니다. 쉼표로 구분된 키워드를 1개 이상 입력해주세요.' }], isError: true }
        }
        try {
          const results = await fetchNaverKeywordData(keywords)

          // keyword_stats에 자동 저장 (hint = 조회한 키워드명, created_at = 지금)
          const nowIso = nowKST()
          for (const hint of keywords) {
            const rows = results
              .filter(r => r.keyword)
              .map(r => ({
                hint,
                keyword: r.keyword,
                pc: r.monthlySearchPc || 0,
                mobile: r.monthlySearchMobile || 0,
                total: r.monthlySearchTotal || 0,
                competition: r.competition || '-',
                created_at: nowIso,
              }))
            if (rows.length > 0) {
              await supabase.from('keyword_stats').upsert(rows, { onConflict: 'hint,keyword' })
            }
          }

          return { content: [{ type: 'text', text: JSON.stringify({ query: keywords, saved: results.length, results }, null, 2) }] }
        } catch (err) {
          return { content: [{ type: 'text', text: `오류: ${err.message || '키워드 조회 중 오류가 발생했습니다.'}` }], isError: true }
        }
      }
    )

    server.registerTool(
      'search_keyword_data',
      {
        title: '전체 키워드 데이터 검색/열람 (도구·hint 구분 없음)',
        description:
          'get_keyword_data처럼 특정 도구(hint)로 좁혀서 보지 않고, keyword_stats 테이블 전체를 ' +
          '대상으로 검색·열람한다. 한 도구를 조사하다가 다른 도구에도 쓸만한 키워드가 우연히 걸리는 ' +
          '경우가 많기 때문에, 저장된 그룹(hint) 이름이 무엇이든 상관없이 전부 뒤져서 찾는다. query를 ' +
          '주면 키워드에 그 문자열이 포함된 것만, 비우면 검색량이 높은 순으로 전체를 반환한다. competition을 ' +
          '주면 그 경쟁도만 걸러서 본다 — 예를 들어 competition: "낮음"으로 호출하면 검색량은 정렬돼 있으니 ' +
          '위쪽이 곧 "검색량 높고 경쟁 낮은" 황금키워드 후보다. 결과의 [ ] 안 값은 그 키워드가 현재 어느 ' +
          'hint 그룹에 저장돼 있는지 보여준다 — 글 작성 중인 도구의 hint와 달라도 연결고리가 있으면 그대로 써도 된다.',
        inputSchema: {
          query: z.string().optional().describe('키워드에 포함될 부분 문자열. 비우면 전체 반환'),
          competition: z.string().optional().describe('경쟁도로 필터링 (예: "낮음"). 황금키워드 찾을 때 사용'),
          limit: z.number().int().min(1).max(300).optional().describe('최대 개수 (기본 100)'),
        },
      },
      async ({ query, competition, limit }) => {
        let q = supabase
          .from('keyword_stats')
          .select('hint, keyword, pc, mobile, total, competition')
          .order('total', { ascending: false })
          .limit(limit || 100)
        if (query) q = q.ilike('keyword', `%${query}%`)
        if (competition) q = q.eq('competition', competition)
        const { data, error } = await q
        if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }], isError: true }
        if (!data || !data.length) {
          return { content: [{ type: 'text', text: '검색 결과 없음' }] }
        }
        const lines = [`검색 결과 (${data.length}건, 검색량 순, hint 구분 없이 전체 대상):`]
        data.forEach(k =>
          lines.push(`- [${k.hint}] ${k.keyword} · 합계 ${fmt(k.total)} (PC ${fmt(k.pc)} / 모바일 ${fmt(k.mobile)})${k.competition ? ' · 경쟁도 ' + k.competition : ''}`)
        )
        return { content: [{ type: 'text', text: lines.join('\n') }] }
      }
    )

    server.registerTool(
      'pick_keyword',
      {
        title: '키워드 찜하기 (나중에 쓸 글감 bookmark)',
        description:
          '검색량 높고 경쟁 낮은 "황금키워드"처럼 지금 당장은 안 쓰더라도 나중에 글로 쓰고 싶은 ' +
          '키워드를 찜해둔다(keyword_picks에 upsert, 같은 group+keyword는 최신 값으로 덮어씀). memo에 ' +
          '"이 키워드면 이런 글을 써야겠다"는 계획을 짧게 적어두면, 나중에 search_keyword_picks로 ' +
          '다시 볼 때 바로 떠올릴 수 있다. group은 keyword_stats의 hint 값을 그대로 쓰거나, 마땅한 ' +
          'hint가 없으면 새 이름을 자유롭게 지어도 된다 — 정확한 분류보다 나중에 다시 찾을 수 있게 ' +
          '기록해두는 것이 목적이다.',
        inputSchema: {
          group: z.string().describe('이 키워드를 묶을 그룹/hint 이름. keyword_stats에 있던 hint를 그대로 쓰는 걸 권장'),
          keyword: z.string(),
          pc: z.number().optional(),
          mobile: z.number().optional(),
          total: z.number().optional(),
          competition: z.string().optional(),
          memo: z.string().optional().describe('어떤 글로 연결할지 계획 메모. 예: "text-down 맞춤법검사기 연계 글로 쓰면 좋음"'),
        },
        annotations: { destructiveHint: false, idempotentHint: true },
      },
      async ({ group, keyword, pc, mobile, total, competition, memo }) => {
        const row = {
          tool_id: group,
          hint: group,
          keyword,
          pc: pc || 0,
          mobile: mobile || 0,
          total: total != null ? total : (pc || 0) + (mobile || 0),
          competition: competition || null,
          memo: memo || null,
        }
        const { error } = await supabase
          .from('keyword_picks')
          .upsert(row, { onConflict: 'tool_id,keyword' })
        if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }], isError: true }
        return {
          content: [{
            type: 'text',
            text: `⭐ 찜 완료: [${group}] ${keyword}${memo ? ' — ' + memo : ''}`,
          }],
        }
      }
    )

    server.registerTool(
      'search_keyword_picks',
      {
        title: '찜한 키워드 전체 검색/열람 (그룹 구분 없음)',
        description:
          'pick_keyword로 찜해둔 키워드를 그룹(hint) 구분 없이 전체 열람·검색한다. 기본적으로 아직 ' +
          '글에 안 쓴(미사용) 키워드만 보여준다 — 글감을 정하기 전에 한 번씩 호출해서 "찜해둔 것 중 ' +
          '오늘 쓸 만한 게 있는지" 확인하면 좋다. 이미 쓴 것까지 같이 보고 싶으면 include_used를 true로 준다.',
        inputSchema: {
          query: z.string().optional().describe('키워드 또는 메모에 포함될 부분 문자열. 비우면 전체 반환'),
          include_used: z.boolean().optional().describe('true면 이미 사용 처리된 키워드도 함께 보여준다 (기본 false, 미사용만)'),
        },
      },
      async ({ query, include_used }) => {
        let q = supabase
          .from('keyword_picks')
          .select('tool_id, keyword, pc, mobile, total, competition, memo, used_at, used_in_title, used_in_slug')
          .order('total', { ascending: false })
        if (!include_used) q = q.is('used_at', null)
        const { data, error } = await q
        if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }], isError: true }
        let rows = data || []
        if (query) {
          const needle = query.toLowerCase()
          rows = rows.filter(r =>
            (r.keyword || '').toLowerCase().includes(needle) || (r.memo || '').toLowerCase().includes(needle)
          )
        }
        if (!rows.length) {
          return { content: [{ type: 'text', text: include_used ? '찜한 키워드 없음' : '미사용 찜 키워드 없음 (전부 글에 썼거나, 아직 찜한 게 없음)' }] }
        }
        const label = include_used ? '찜한 키워드 (사용 여부 포함)' : '⭐ 미사용 찜 키워드'
        const lines = [`${label} (${rows.length}개):`]
        rows.forEach(p => {
          const usedNote = p.used_at ? ` · ✅ 사용됨(${p.used_at.slice(0, 10)}, ${p.used_in_title || p.used_in_slug || '글 정보 없음'})` : ''
          lines.push(`- [${p.tool_id}] ${p.keyword} · 합계 ${fmt(p.total)} (PC ${fmt(p.pc)} / 모바일 ${fmt(p.mobile)})${p.competition ? ' · 경쟁도 ' + p.competition : ''}${p.memo ? ' · 메모: ' + p.memo : ''}${usedNote}`)
        })
        return { content: [{ type: 'text', text: lines.join('\n') }] }
      }
    )

    server.registerTool(
      'add_publish_log',
      {
        title: '블로그 발행 기록 추가',
        description:
          '새로 작성한 블로그 글 1편을 발행 기록에 남긴다. STEP 3에서 최종 아티팩트를 ' +
          '출력한 직후 호출해서, 같은 도구·각도를 다음에 또 쓰지 않도록 한다. 이 글에서 ' +
          'pick_keyword로 찜해뒀던 황금키워드를 실제로 썼다면, memo에 어떤 키워드를 어떻게 ' +
          '썼는지 짧게 남긴다(예: "찜 키워드 \'맞춤법검사기\' 사용"). target_keyword·search_pc·' +
          'search_mobile·search_total·competition을 함께 넘기면 발행 기록에 키워드 데이터도 ' +
          '같이 저장된다. created_at이 자동으로 ' +
          '날짜를 남기기 때문에, 이렇게 하면 "그 키워드를 며칠에 어느 글에 썼는지"가 ' +
          'get_publish_log 조회만으로 그대로 추적된다.',
        inputSchema: {
          category: z.enum(REGION_CODES).describe('시도 코드. 예: gangwon'),
          angle: z.string().describe('키워드 각도, 예: "제철 소개"'),
          title: z.string(),
          slug: z.string(),
          memo: z.string().optional().describe('이 글에서 사용한 찜 키워드나 특이사항 메모'),
          target_keyword: z.string().optional().describe('타겟 키워드, 예: "유튜브 썸네일 다운로드"'),
          search_pc: z.number().optional().describe('네이버 PC 월간 검색수'),
          search_mobile: z.number().optional().describe('네이버 모바일 월간 검색수'),
          search_total: z.number().optional().describe('PC+모바일 합계 검색수'),
          competition: z.string().optional().describe('경쟁도 (높음/중간/낮음)'),
          google_indexing: z.string().optional().describe('Google 색인 요청 결과 (success / error: ...)'),
          index_now: z.string().optional().describe('IndexNow 핑 전송 결과 (success:200 / error: ...)'),
        },
        annotations: { destructiveHint: false, idempotentHint: false },
      },
      async ({ category, angle, title, slug, memo, target_keyword, search_pc, search_mobile, search_total, competition, google_indexing, index_now }) => {
        const row = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
          category, angle, title, slug,
          memo: memo || null,
          target_keyword: target_keyword || null,
          search_pc: search_pc != null ? Number(search_pc) : null,
          search_mobile: search_mobile != null ? Number(search_mobile) : null,
          search_total: search_total != null ? Number(search_total) : null,
          competition: competition || null,
          google_indexing: google_indexing || null,
          index_now: index_now || null,
          published_at: null,
          created_at: nowKST(),
        }
        const { data, error } = await supabase.from('publish_log').insert([row]).select().single()
        if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }], isError: true }
        return { content: [{ type: 'text', text: `✅ 기록 추가됨: ${category} / ${angle} / ${title}` }] }
      }
    )

    server.registerTool(
      'create_blog_post',
      {
        title: '블로그 글 실제 발행 (본문 포함)',
        description:
          '작성한 블로그 글 본문 전체를 실제로 사이트에 올린다. 기본 상태는 published라 호출 즉시 ' +
          '사이트에 공개된다 — 사람 검수 단계 없음. STEP 3에서 글을 완성한 뒤 호출하고, 보통 ' +
          'add_publish_log와 함께(같이) 호출한다. status를 draft로 주면 admin에 임시저장만 되고 ' +
          '공개되지 않는다.',
        inputSchema: {
          title: z.string().describe('글 제목, 20~55자'),
          slug: z.string().describe('URL 슬러그, 영문 소문자+하이픈'),
          summary: z.string().optional().describe('SEO 요약, 80~120자'),
          content: z.string().describe('본문 마크다운 전체 (표·SVG·FAQ·CTA 포함)'),
          category: z.enum(REGION_CODES).describe('카테고리(=시도 코드). 예: gangwon'),
          tags: z.array(z.string()).optional().describe('태그 5~8개 권장'),
          cover_image: z.string().optional().describe('커버 이미지 URL'),
          status: z.enum(['published', 'draft', 'scheduled']).optional()
            .describe('기본값 published(즉시 공개). draft면 admin에만 저장되고 비공개.'),
          scheduled_at: z.string().optional().describe('status가 scheduled일 때만 사용, ISO 날짜'),
        },
        annotations: { destructiveHint: false, idempotentHint: false },
      },
      async ({ title, slug, summary, content, category, tags, cover_image, status, scheduled_at }) => {
        const finalStatus = status || 'published'
        const nowIso = nowKST()
        const row = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
          type: 'blog',
          title,
          slug,
          summary: summary || null,
          content,
          category,
          tags: Array.isArray(tags) ? tags : [],
          cover_image: cover_image || null,
          author: null,
          status: finalStatus,
          scheduled_at: finalStatus === 'scheduled' ? (scheduled_at || null) : null,
          published_at: finalStatus === 'published' ? nowIso : null,
          created_at: nowIso,
          updated_at: nowIso,
        }
        const { data, error } = await supabase.from('blog_posts').insert([row]).select().single()
        if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }], isError: true }

        // ── 색인 요청 (published 상태일 때만) ──────────────────────────────
        const indexingResult = { googleIndexing: null, indexNow: null }

        if (finalStatus === 'published') {
          const pageUrl = `https://fresh-season.vercel.app/blog/${slug}`

          // 1) Google Indexing API
          try {
            const { GoogleAuth } = await import('google-auth-library')
            const auth = new GoogleAuth({
              credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
              scopes: ['https://www.googleapis.com/auth/indexing'],
            })
            const client = await auth.getClient()
            await client.request({
              url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
              method: 'POST',
              data: { url: pageUrl, type: 'URL_UPDATED' },
            })
            console.log('[MCP Indexing API] 색인 요청 완료:', slug)
            indexingResult.googleIndexing = 'success'
          } catch (e) {
            console.error('[MCP Indexing API] 오류:', e.message)
            indexingResult.googleIndexing = 'error: ' + e.message
          }

          // 2) IndexNow — Bing·Naver·Yandex 색인 요청
          try {
            const INDEXNOW_KEY = process.env.INDEXNOW_KEY
            if (INDEXNOW_KEY) {
              const inRes = await fetch('https://api.indexnow.org/indexnow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({
                  host: 'fresh-season.vercel.app',
                  key: INDEXNOW_KEY,
                  keyLocation: `https://fresh-season.vercel.app/${INDEXNOW_KEY}.txt`,
                  urlList: [pageUrl],
                }),
              })
              console.log('[MCP IndexNow] 핑 전송 완료:', slug, '상태:', inRes.status)
              indexingResult.indexNow = 'success:' + inRes.status
            } else {
              indexingResult.indexNow = 'skipped: INDEXNOW_KEY 미설정'
            }
          } catch (e) {
            console.error('[MCP IndexNow] 오류:', e.message)
            indexingResult.indexNow = 'error: ' + e.message
          }
        }
        // ────────────────────────────────────────────────────────────────────

        const liveNote = finalStatus === 'published'
          ? `✅ 발행 완료 — https://fresh-season.vercel.app/blog/${slug} 에서 바로 확인 가능`
          : `✅ ${finalStatus === 'draft' ? '임시저장(draft)' : '예약(scheduled)'} 완료 — admin에서 확인 필요`

        const indexNote = finalStatus === 'published'
          ? `\n🔍 Google 색인: ${indexingResult.googleIndexing || '미실행'}\n⚡ IndexNow: ${indexingResult.indexNow || '미실행'}\n\nadd_publish_log 호출 시 google_indexing="${indexingResult.googleIndexing || ''}" index_now="${indexingResult.indexNow || ''}" 를 함께 넘겨주세요.`
          : ''

        return { content: [{ type: 'text', text: liveNote + indexNote }] }
      }
    )

    server.registerTool(
      'update_blog_post',
      {
        title: '발행된 글 수정',
        description:
          '발행된 블로그 글의 특정 필드를 수정한다. slug로 대상 글을 찾고, 전달된 필드만 업데이트한다 — ' +
          '넘기지 않은 필드는 기존 값 그대로 유지된다. 수정 즉시 사이트에 반영되므로 호출 전 ' +
          '변경 내용을 사용자에게 한 번 확인받는 것을 권장한다. 커버 이미지 교체, 본문·제목·태그·요약 수정, ' +
          '상태 변경 등 모든 글 수정 작업에 사용한다.',
        inputSchema: {
          slug: z.string().describe('수정할 글의 URL 슬러그 (필수, 대상 글 식별자)'),
          title: z.string().optional().describe('새 제목'),
          summary: z.string().optional().describe('새 SEO 요약'),
          content: z.string().optional().describe('새 본문 마크다운 전체'),
          cover_image: z.string().optional().describe('새 커버 이미지 URL'),
          tags: z.array(z.string()).optional().describe('새 태그 배열'),
          status: z.enum(['published', 'draft']).optional().describe('글 상태 변경'),
        },
        annotations: { destructiveHint: false, idempotentHint: true },
      },
      async ({ slug, title, summary, content, cover_image, tags, status }) => {
        const patch = {}
        if (title !== undefined)       patch.title = title
        if (summary !== undefined)     patch.summary = summary
        if (content !== undefined)     patch.content = content
        if (cover_image !== undefined) patch.cover_image = cover_image
        if (tags !== undefined)        patch.tags = tags
        if (status !== undefined)      patch.status = status
        if (Object.keys(patch).length === 0) {
          return { content: [{ type: 'text', text: '오류: 수정할 필드가 없습니다. title/summary/content/cover_image/tags/status 중 하나 이상을 전달해주세요.' }], isError: true }
        }
        patch.updated_at = nowKST()

        const { data, error } = await supabase
          .from('blog_posts')
          .update(patch)
          .eq('slug', slug)
          .select('slug, title, status')
          .single()
        if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }], isError: true }
        if (!data) return { content: [{ type: 'text', text: `슬러그 '${slug}'에 해당하는 글을 찾을 수 없습니다.` }], isError: true }

        const changedFields = Object.keys(patch).filter(k => k !== 'updated_at').join(', ')
        return {
          content: [{
            type: 'text',
            text: `✅ 수정 완료\n제목: ${data.title}\nslug: ${data.slug}\n변경 필드: ${changedFields}\n라이브 URL: https://fresh-season.vercel.app/blog/${data.slug}`,
          }],
        }
      }
    )


    server.registerTool(
      'get_tool_info',
      {
        title: '도구 기능 설명 조회',
        description:
          '사이트에 등록된 도구들의 최신 기능 설명을 가져온다. tool_id를 비우면 전체를 반환한다. ' +
          'STEP 1 시작 시 get_publish_log와 같은 타이밍에 한 번 호출해서, 글 작성 전에 도구 설명을 ' +
          '최신 상태로 확인하는 데 쓴다.',
        inputSchema: {
          tool_id: z.enum(REGION_CODES).optional().describe('특정 시도로만 조회하고 싶을 때, 비우면 전체'),
        },
      },
      async ({ tool_id }) => {
        let q = supabase.from('tool_info').select('*').order('tool_id')
        if (tool_id) q = q.eq('tool_id', tool_id)
        const { data, error } = await q
        if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }], isError: true }
        if (!data || !data.length) {
          return { content: [{ type: 'text', text: tool_id ? `${tool_id}: 등록된 설명 없음` : '등록된 도구 설명 없음 (아직 update_tool_info로 등록된 적 없음)' }] }
        }
        const lines = data.map(t =>
          `- [${t.tool_id}] ${t.name || ''}: ${t.description}${t.path ? ' (' + t.path + ')' : ''} · 갱신일 ${t.updated_at}`
        )
        return { content: [{ type: 'text', text: lines.join('\n') }] }
      }
    )

    server.registerTool(
      'update_tool_info',
      {
        title: '도구 기능 설명 갱신',
        description:
          '도구 기능 설명을 갱신한다 (도구당 최신 1개로 덮어씀). 사용자가 대화 중 직접 ' +
          '정정·확인해준 내용만 반영하고, 추측이나 다른 글에서 유추한 정보로는 절대 호출하지 않는다. ' +
          '호출 전 갱신할 내용을 한 줄로 요약해 사용자에게 보여준다.',
        inputSchema: {
          tool_id: z.enum(REGION_CODES).describe('시도 코드. 예: gangwon'),
          description: z.string().describe('갱신할 전체 기능 설명'),
          name: z.string().optional().describe('시도명 (선택, 비우면 기존 값 유지)'),
          path: z.string().optional().describe('시도 경로, 예: /region/gangwon (선택, 비우면 기존 값 유지)'),
        },
        annotations: { destructiveHint: false, idempotentHint: true },
      },
      async ({ tool_id, description, name, path }) => {
        const { data: prevRow } = await supabase
          .from('tool_info').select('description').eq('tool_id', tool_id).maybeSingle()
        const previousDescription = prevRow?.description || null

        const row = {
          tool_id,
          description,
          updated_at: nowKST(),
        }
        if (name) row.name = name
        if (path) row.path = path

        const { data, error } = await supabase
          .from('tool_info')
          .upsert(row, { onConflict: 'tool_id' })
          .select().single()
        if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }], isError: true }

        const lines = [`✅ ${tool_id} 설명 갱신됨`]
        if (previousDescription) lines.push(`이전: ${previousDescription}`)
        lines.push(`이후: ${description}`)
        return { content: [{ type: 'text', text: lines.join('\n') }] }
      }
    )

    server.registerTool(
      'get_seasonal_foods',
      {
        title: '제철 식재료 조회',
        description: '월/시도별 제철 식재료를 조회한다. month(1~12)로 이번 달 제철 재료를, region(시도 코드)으로 특정 지역 제철 재료를 필터링할 수 있다. 블로그 글감 선정 시 STEP 1에서 호출해 이번 달 제철 재료를 확인하는 데 쓴다. seasonal_foods 테이블을 조회하며 month와 region 중 하나 이상 필요.',
        inputSchema: {
          month: z.number().int().min(1).max(12).optional().describe('월 (1~12)'),
          region: z.enum(REGION_CODES).optional().describe('시도 코드'),
        },
      },
      async ({ month, region }) => {
        let q = supabase.from('seasonal_foods').select('*')
        if (region) q = q.eq('region', region)
        if (month) q = q.contains('months', [month])
        const { data, error } = await q.order('ingredient')
        if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }], isError: true }
        if (!data?.length) return { content: [{ type: 'text', text: '해당 조건의 제철 재료 없음' }] }
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'get_tv_recipes',
      {
        title: 'TV 레시피 조회',
        description: '재료명 또는 TV 프로그램명으로 등록된 TV 레시피를 조회한다. ingredient에 식재료명을 넣으면 해당 재료가 쓰인 레시피를, program에 방송명을 넣으면 해당 프로그램의 레시피를 필터링해 반환한다. 블로그 글 작성 시 TV 레시피 연계 콘텐츠 구성에 활용하며, tv_recipes 테이블을 최신순으로 최대 20건 반환한다.',
        inputSchema: {
          ingredient: z.string().optional().describe('재료명'),
          program: z.string().optional().describe('TV 프로그램명'),
        },
      },
      async ({ ingredient, program }) => {
        let q = supabase.from('tv_recipes').select('*')
        if (ingredient) q = q.ilike('ingredient', `%${ingredient}%`)
        if (program) q = q.ilike('program', `%${program}%`)
        const { data, error } = await q.order('created_at', { ascending: false }).limit(20)
        if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }], isError: true }
        if (!data?.length) return { content: [{ type: 'text', text: '등록된 TV 레시피 없음' }] }
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'get_region_info',
      {
        title: '지역 정보 조회',
        description: '시도 코드(region_id)로 해당 지역의 지역명, 대표 특산물 설명, 시군구 목록을 반환한다. 시도별 제철 먹거리 블로그 글 작성 시 지역 정보 확인에 사용한다. seoul, busan, daegu, incheon, gwangju, daejeon, ulsan, sejong, gyeonggi, gangwon, chungbuk, chungnam, jeonbuk, jeonnam, gyeongbuk, gyeongnam, jeju 중 하나를 입력한다.',
        inputSchema: {
          region_id: z.enum(REGION_CODES).describe('시도 코드'),
        },
      },
      async ({ region_id }) => {
        const INFO = {
          seoul:     { name:'서울특별시',     desc:'도심 식문화·전통시장·계절 먹거리', districts:['종로구','중구','용산구','성동구','광진구','동대문구','중랑구','성북구','강북구','도봉구','노원구','은평구','서대문구','마포구','양천구','강서구','구로구','금천구','영등포구','동작구','관악구','서초구','강남구','송파구','강동구'] },
          busan:     { name:'부산광역시',     desc:'고등어·대구·멸치·해운대 해산물', districts:['중구','서구','동구','영도구','부산진구','동래구','남구','북구','해운대구','사하구','금정구','강서구','연제구','수영구','사상구','기장군'] },
          daegu:     { name:'대구광역시',     desc:'사과·복숭아·한우·참외', districts:['중구','동구','서구','남구','북구','수성구','달서구','달성군','군위군'] },
          incheon:   { name:'인천광역시',     desc:'꽃게·새우·조기·강화 순무', districts:['중구','동구','미추홀구','연수구','남동구','부평구','계양구','서구','강화군','옹진군'] },
          gwangju:   { name:'광주광역시',     desc:'김치·한정식·낙지·무화과', districts:['동구','서구','남구','북구','광산구'] },
          daejeon:   { name:'대전광역시',     desc:'두부·순대·빵·계룡산 나물', districts:['동구','중구','서구','유성구','대덕구'] },
          ulsan:     { name:'울산광역시',     desc:'미역·전어·대게·고래고기', districts:['중구','남구','동구','북구','울주군'] },
          sejong:    { name:'세종특별자치시', desc:'쌀·연근·복숭아·딸기', districts:['세종시'] },
          gyeonggi:  { name:'경기도',         desc:'쌀·배·포도·인삼·딸기', districts:['수원시','성남시','의정부시','안양시','부천시','광명시','평택시','안산시','고양시','과천시','구리시','남양주시','오산시','시흥시','군포시','의왕시','하남시','용인시','파주시','이천시','안성시','김포시','화성시','광주시','양주시','포천시','여주시','연천군','가평군','양평군'] },
          gangwon:   { name:'강원특별자치도', desc:'오징어·황태·곰취·감자·도루묵', districts:['춘천시','원주시','강릉시','동해시','태백시','속초시','삼척시','홍천군','횡성군','영월군','평창군','정선군','철원군','화천군','양구군','인제군','고성군','양양군'] },
          chungbuk:  { name:'충청북도',       desc:'포도·사과·인삼·복숭아·대추', districts:['청주시','충주시','제천시','보은군','옥천군','영동군','증평군','진천군','괴산군','음성군','단양군'] },
          chungnam:  { name:'충청남도',       desc:'굴·대하·딸기·게장·천안 호두', districts:['천안시','공주시','보령시','아산시','서산시','논산시','계룡시','당진시','금산군','부여군','서천군','청양군','홍성군','예산군','태안군'] },
          jeonbuk:   { name:'전북특별자치도', desc:'쌀·콩나물·홍어·게장·전주비빔밥', districts:['전주시','군산시','익산시','정읍시','남원시','김제시','완주군','진안군','무주군','장수군','임실군','순창군','고창군','부안군'] },
          jeonnam:   { name:'전라남도',       desc:'낙지·김·굴비·홍어·전복·녹차', districts:['목포시','여수시','순천시','나주시','광양시','담양군','곡성군','구례군','고흥군','보성군','화순군','장흥군','강진군','해남군','영암군','무안군','함평군','영광군','장성군','완도군','진도군','신안군'] },
          gyeongbuk: { name:'경상북도',       desc:'사과·한우·과메기·대게·고등어', districts:['포항시','경주시','김천시','안동시','구미시','영주시','영천시','상주시','문경시','경산시','의성군','청송군','영양군','영덕군','청도군','고령군','성주군','칠곡군','예천군','봉화군','울진군','울릉군'] },
          gyeongnam: { name:'경상남도',       desc:'남해 멸치·통영 굴·사천 실치·하동 녹차', districts:['창원시','진주시','통영시','사천시','김해시','밀양시','거제시','양산시','의령군','함안군','창녕군','고성군','남해군','하동군','산청군','함양군','거창군','합천군'] },
          jeju:      { name:'제주특별자치도', desc:'감귤·흑돼지·전복·옥돔·한라봉', districts:['제주시','서귀포시'] },
        }
        return { content: [{ type: 'text', text: JSON.stringify({ id: region_id, ...INFO[region_id] }, null, 2) }] }
      }
    )

    server.registerTool(
      'get_system_prompt',
      {
        title: 'Claude 시스템 프롬프트(지침) 조회',
        description:
          'admin에 저장된 Claude 프로젝트 지침 전문을 가져온다. ' +
          '대화를 시작할 때 가장 먼저 호출해서 지침을 로드하고, 그 내용대로 행동한다. ' +
          '지침은 admin → 🤖 Claude 지침 메뉴에서 수정할 수 있다.',
        inputSchema: {},
      },
      async () => {
        const { data, error } = await supabase
          .from('system_prompts')
          .select('content, updated_at')
          .eq('id', 'main')
          .single()
        if (error || !data) {
          return { content: [{ type: 'text', text: '❌ 시스템 프롬프트를 불러오지 못했습니다. admin에서 저장했는지 확인해주세요.' }], isError: true }
        }
        return {
          content: [{
            type: 'text',
            text: '# 시스템 프롬프트 로드 완료 (저장일시: ' + data.updated_at + ')\n\n' + data.content,
          }],
        }
      }
    )

    server.registerTool(
      'get_content_ideas',
      {
        title: '글감 아이디어 조회',
        description:
          'admin 글감 관리에 저장된 아이디어·키워드·각도·메모를 가져온다. ' +
          'STEP 1에서 get_publish_log·get_tool_info와 함께 호출해서, ' +
          '사람이 미리 메모해둔 글감 후보 중 오늘 쓸 만한 것이 있는지 확인한다. ' +
          'category를 주면 해당 카테고리 관련 아이디어만 반환하고, 비우면 전체를 반환한다. ' +
          'status를 주면 그 상태만 필터링한다 (pending=미사용, used=사용됨). ' +
          '기본은 미사용(pending)만 반환한다.',
        inputSchema: {
          category: z.string().optional().describe('카테고리로 필터링 (recipe/ingredient/season/health/tips/region). 비우면 전체'),
          tab_id: z.string().optional().describe('특정 탭 ID로 필터링. 비우면 전체 탭'),
          type: z.enum(['keyword', 'idea', 'angle', 'memo']).optional().describe('종류로 필터링'),
          status: z.enum(['pending', 'used']).optional().describe('기본 pending(미사용만)'),
          limit: z.number().int().min(1).max(200).optional().describe('최대 개수 (기본 50)'),
        },
      },
      async ({ category, tab_id, type, status, limit }) => {
        let q = supabase
          .from('content_ideas')
          .select('*')
          .eq('status', status || 'pending')
          .order('created_at', { ascending: false })
          .limit(limit || 50)

        if (category) q = q.eq('tool_id', category)
        if (tab_id)   q = q.eq('tab_id', tab_id)
        if (type)     q = q.eq('type', type)

        const { data, error } = await q
        if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }], isError: true }
        if (!data || !data.length) {
          return { content: [{ type: 'text', text: '글감 아이디어 없음 (admin 글감 관리에서 추가 가능)' }] }
        }

        const TYPE_KR = { keyword: '키워드', idea: '아이디어', angle: '각도', memo: '메모' }
        const CAT_KR  = { recipe: '레시피', ingredient: '식재료', season: '제철/계절', health: '건강·효능', tips: '요리 팁', region: '지역 특산' }
        const lines = [`📋 글감 아이디어 (${data.length}건, ${status || 'pending'}):`]
        data.forEach(i => {
          const catLabel = i.tool_id ? ` [${CAT_KR[i.tool_id] || i.tool_id}]` : ' [공통]'
          const typeLabel = TYPE_KR[i.type] || i.type
          lines.push(`- (${typeLabel})${catLabel} ${i.content}${i.keyword ? ' / 키워드: ' + i.keyword : ''}${i.memo ? ' / 메모: ' + i.memo : ''}`)
        })
        return { content: [{ type: 'text', text: lines.join('\n') }] }
      }
    )

    server.registerTool(
      'update_system_prompt',
      {
        title: 'Claude 시스템 프롬프트(지침) 저장/수정',
        description:
          'admin에 저장된 Claude 프로젝트 지침을 덮어쓴다. ' +
          '사용자가 대화 중 지침 수정을 요청할 때만 호출한다. ' +
          '호출 전 반드시 변경 내용을 사용자에게 확인받는다. ' +
          '저장 즉시 다음 대화부터 새 지침이 적용된다.',
        inputSchema: {
          content: z.string().describe('저장할 지침 전문'),
        },
        annotations: { destructiveHint: true, idempotentHint: true },
      },
      async ({ content }) => {
        const { error } = await supabase
          .from('system_prompts')
          .upsert({ id: 'main', content, updated_at: nowKST() }, { onConflict: 'id' })
        if (error) {
          return { content: [{ type: 'text', text: `❌ 저장 실패: ${error.message}` }], isError: true }
        }
        return {
          content: [{
            type: 'text',
            text: '✅ 시스템 프롬프트 저장 완료 (' + nowKST() + ')\n저장된 내용:\n\n' + content,
          }],
        }
      }
    )


    // ══════════════════════════════════════════════════════════════
    //  맵 관리 데이터 조회/추가 툴 (건강효능·TV방송·셰프·식재료·요리·조리도구·레시피)
    // ══════════════════════════════════════════════════════════════

    // ── 식재료 ↔ 건강효능 크로스 연결 툴 ─────────────────────────────────

    server.registerTool(
      'link_ingredient_benefit',
      {
        title: '식재료 ↔ 건강효능 연결',
        description:
          '식재료(ingredient_id)와 건강효능(benefit_id)을 중간 테이블(ingredient_health_benefits)에 연결한다. ' +
          '이미 연결된 경우 중복 없이 무시(upsert). ' +
          'list_ingredients / list_health_benefits 조회 시 서로의 데이터가 함께 반환된다.',
        inputSchema: {
          ingredient_id: z.string().describe('식재료 ID (list_ingredients로 조회 후 사용)'),
          benefit_id:    z.string().describe('건강효능 ID (list_health_benefits로 조회 후 사용)'),
        },
        annotations: { destructiveHint: false, idempotentHint: true },
      },
      async ({ ingredient_id, benefit_id }) => {
        const { error } = await supabase
          .from('ingredient_health_benefits')
          .upsert({ ingredient_id, benefit_id }, { onConflict: 'ingredient_id,benefit_id' })
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        return { content: [{ type: 'text', text: `✅ 연결 완료: 식재료(${ingredient_id}) ↔ 건강효능(${benefit_id})` }] }
      }
    )

    server.registerTool(
      'unlink_ingredient_benefit',
      {
        title: '식재료 ↔ 건강효능 연결 해제',
        description: '식재료와 건강효능의 연결을 해제한다.',
        inputSchema: {
          ingredient_id: z.string().describe('식재료 ID'),
          benefit_id:    z.string().describe('건강효능 ID'),
        },
        annotations: { destructiveHint: true },
      },
      async ({ ingredient_id, benefit_id }) => {
        const { error } = await supabase
          .from('ingredient_health_benefits')
          .delete()
          .eq('ingredient_id', ingredient_id)
          .eq('benefit_id', benefit_id)
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        return { content: [{ type: 'text', text: `✅ 연결 해제: 식재료(${ingredient_id}) ↔ 건강효능(${benefit_id})` }] }
      }
    )

    server.registerTool(
      'get_ingredient_benefits',
      {
        title: '식재료의 건강효능 조회',
        description: '특정 식재료에 연결된 건강효능 목록을 가져온다. 식재료 이름으로 검색 가능.',
        inputSchema: {
          ingredient_id:   z.string().optional().describe('식재료 ID'),
          ingredient_name: z.string().optional().describe('식재료 이름 (부분 일치)'),
        },
      },
      async ({ ingredient_id, ingredient_name }) => {
        // 이름으로 ID 찾기
        let ingId = ingredient_id
        if (!ingId && ingredient_name) {
          const { data: found } = await supabase
            .from('ingredients').select('id,name').ilike('name', `%${ingredient_name}%`).limit(1).single()
          if (!found) return { content: [{ type: 'text', text: `❌ 식재료를 찾을 수 없습니다: ${ingredient_name}` }], isError: true }
          ingId = found.id
        }
        if (!ingId) return { content: [{ type: 'text', text: '❌ ingredient_id 또는 ingredient_name을 입력해주세요.' }], isError: true }

        const { data: ing } = await supabase.from('ingredients').select('id,name').eq('id', ingId).single()
        const { data, error } = await supabase
          .from('ingredient_health_benefits')
          .select('health_benefits(id,name,category,description)')
          .eq('ingredient_id', ingId)
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        const benefits = (data || []).map(r => r.health_benefits).filter(Boolean)
        return { content: [{ type: 'text', text: JSON.stringify({ ingredient: ing, health_benefits: benefits, count: benefits.length }, null, 2) }] }
      }
    )

    server.registerTool(
      'get_benefit_ingredients',
      {
        title: '건강효능의 식재료 조회',
        description: '특정 건강효능에 연결된 식재료 목록을 가져온다. 건강효능 이름으로 검색 가능.',
        inputSchema: {
          benefit_id:   z.string().optional().describe('건강효능 ID'),
          benefit_name: z.string().optional().describe('건강효능 이름 (부분 일치)'),
        },
      },
      async ({ benefit_id, benefit_name }) => {
        let hbId = benefit_id
        if (!hbId && benefit_name) {
          const { data: found } = await supabase
            .from('health_benefits').select('id,name').ilike('name', `%${benefit_name}%`).limit(1).single()
          if (!found) return { content: [{ type: 'text', text: `❌ 건강효능을 찾을 수 없습니다: ${benefit_name}` }], isError: true }
          hbId = found.id
        }
        if (!hbId) return { content: [{ type: 'text', text: '❌ benefit_id 또는 benefit_name을 입력해주세요.' }], isError: true }

        const { data: hb } = await supabase.from('health_benefits').select('id,name,category').eq('id', hbId).single()
        const { data, error } = await supabase
          .from('ingredient_health_benefits')
          .select('ingredients(id,name,category,season_start,season_end)')
          .eq('benefit_id', hbId)
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        const ingredients = (data || []).map(r => r.ingredients).filter(Boolean)
        return { content: [{ type: 'text', text: JSON.stringify({ health_benefit: hb, ingredients, count: ingredients.length }, null, 2) }] }
      }
    )

    server.registerTool(
      'link_ingredients_bulk',
      {
        title: '식재료 ↔ 건강효능 일괄 연결',
        description:
          '식재료 1개에 건강효능 여러 개를 한 번에 연결하거나, 건강효능 1개에 식재료 여러 개를 한 번에 연결한다. ' +
          '이미 연결된 항목은 중복 없이 무시(upsert).',
        inputSchema: {
          ingredient_id:  z.string().optional().describe('식재료 ID 1개 (이 경우 benefit_ids 필수)'),
          benefit_ids:    z.array(z.string()).optional().describe('연결할 건강효능 ID 배열'),
          benefit_id:     z.string().optional().describe('건강효능 ID 1개 (이 경우 ingredient_ids 필수)'),
          ingredient_ids: z.array(z.string()).optional().describe('연결할 식재료 ID 배열'),
        },
        annotations: { destructiveHint: false, idempotentHint: true },
      },
      async ({ ingredient_id, benefit_ids, benefit_id, ingredient_ids }) => {
        const rows = []
        if (ingredient_id && benefit_ids?.length) {
          benefit_ids.forEach(bid => rows.push({ ingredient_id, benefit_id: bid }))
        } else if (benefit_id && ingredient_ids?.length) {
          ingredient_ids.forEach(iid => rows.push({ ingredient_id: iid, benefit_id }))
        } else {
          return { content: [{ type: 'text', text: '❌ (ingredient_id + benefit_ids) 또는 (benefit_id + ingredient_ids) 조합으로 입력해주세요.' }], isError: true }
        }
        const { error } = await supabase
          .from('ingredient_health_benefits')
          .upsert(rows, { onConflict: 'ingredient_id,benefit_id' })
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        return { content: [{ type: 'text', text: `✅ 일괄 연결 완료: ${rows.length}건` }] }
      }
    )

    server.registerTool(
      'update_ingredient',
      {
        title: '식재료 정보 수정',
        description: '등록된 식재료의 정보(이름·카테고리·설명·제철 시작·종료월)를 수정한다. slug로 대상 식재료를 찾고, 전달된 필드만 업데이트한다.',
        inputSchema: {
          id:           z.string().describe('식재료 ID (필수)'),
          name:         z.string().optional().describe('식재료명'),
          category:     z.string().optional().describe('카테고리 id (예: fish)'),
          description:  z.string().optional().describe('설명'),
          season_start: z.number().optional().describe('제철 시작 월 (1~12)'),
          season_end:   z.number().optional().describe('제철 종료 월 (1~12)'),
        },
        annotations: { destructiveHint: false },
      },
      async ({ id, name, category, description, season_start, season_end }) => {
        const updates = {}
        if (name         !== undefined) updates.name = name
        if (category     !== undefined) updates.category = category
        if (description  !== undefined) updates.description = description
        if (season_start !== undefined) updates.season_start = season_start
        if (season_end   !== undefined) updates.season_end = season_end
        if (!Object.keys(updates).length) return { content: [{ type: 'text', text: '❌ 수정할 필드를 하나 이상 입력해주세요.' }], isError: true }
        const { data, error } = await supabase.from('ingredients').update(updates).eq('id', id).select().single()
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        return { content: [{ type: 'text', text: `✅ 식재료 수정 완료\n${JSON.stringify(data, null, 2)}` }] }
      }
    )

    server.registerTool(
      'list_health_benefits',
      {
        title: '건강효능 목록 조회',
        description: 'DB에 등록된 건강효능(health_benefits) 목록을 가져온다. 카테고리·이름으로 필터 가능. 연결된 식재료 목록도 함께 반환.',
        inputSchema: {
          category: z.string().optional().describe('카테고리 필터 (예: 면역·항산화)'),
          q:        z.string().optional().describe('이름 검색어'),
          limit:    z.number().optional().describe('최대 반환 개수 (기본 50)'),
        },
      },
      async ({ category, q, limit = 50 }) => {
        let query = supabase
          .from('health_benefits')
          .select(`
            id, name, category, description,
            ingredient_health_benefits (
              ingredient_id,
              ingredients ( id, name, category )
            )
          `)
          .order('name')
          .limit(limit)
        if (category) query = query.eq('category', category)
        if (q)        query = query.ilike('name', `%${q}%`)
        const { data, error } = await query
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        const result = (data || []).map(hb => ({
          id: hb.id,
          name: hb.name,
          category: hb.category,
          description: hb.description,
          ingredients: (hb.ingredient_health_benefits || []).map(r => r.ingredients).filter(Boolean),
        }))
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      }
    )

    server.registerTool(
      'add_health_benefit',
      {
        title: '건강효능 추가',
        description: '새 건강효능을 DB에 등록한다.',
        inputSchema: {
          name:        z.string().describe('효능명 (예: 면역력 강화)'),
          category:    z.string().optional().describe('카테고리 (예: 면역·항산화)'),
          description: z.string().optional().describe('상세 설명'),
        },
        annotations: { destructiveHint: false },
      },
      async ({ name, category = '', description = '' }) => {
        const id = 'hb_' + Date.now()
        const { data, error } = await supabase.from('health_benefits').insert([{ id, name, category, description }]).select().single()
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        return { content: [{ type: 'text', text: `✅ 건강효능 등록 완료\n${JSON.stringify(data, null, 2)}` }] }
      }
    )

    server.registerTool(
      'list_tv_shows',
      {
        title: 'TV방송 목록 조회',
        description: 'DB에 등록된 TV 요리방송 목록을 가져온다.',
        inputSchema: {
          q:     z.string().optional().describe('방송명 검색어'),
          limit: z.number().optional().describe('최대 반환 개수 (기본 50)'),
        },
      },
      async ({ q, limit = 50 }) => {
        let query = supabase.from('tv_shows').select('id,name,channel,category,air_day,description').order('name').limit(limit)
        if (q) query = query.ilike('name', `%${q}%`)
        const { data, error } = await query
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'add_tv_show',
      {
        title: 'TV방송 추가',
        description: '새 TV 요리방송을 DB에 등록한다.',
        inputSchema: {
          name:        z.string().describe('방송명 (예: 백종원의 골목식당)'),
          channel:     z.string().optional().describe('채널명 (예: SBS)'),
          category:    z.string().optional().describe('카테고리 (예: 요리경연)'),
          air_day:     z.string().optional().describe('방영 요일 (예: 수)'),
          description: z.string().optional().describe('방송 설명'),
        },
        annotations: { destructiveHint: false },
      },
      async ({ name, channel = '', category = '', air_day = '', description = '' }) => {
        const id = 'tv_' + Date.now()
        const { data, error } = await supabase.from('tv_shows').insert([{ id, name, channel, category, air_day, description }]).select().single()
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        return { content: [{ type: 'text', text: `✅ TV방송 등록 완료\n${JSON.stringify(data, null, 2)}` }] }
      }
    )

    server.registerTool(
      'list_chefs',
      {
        title: '셰프 목록 조회',
        description: 'DB에 등록된 셰프/요리사 목록을 가져온다.',
        inputSchema: {
          q:     z.string().optional().describe('이름 검색어'),
          limit: z.number().optional().describe('최대 반환 개수 (기본 50)'),
        },
      },
      async ({ q, limit = 50 }) => {
        let query = supabase.from('chefs').select('id,name,role,specialty,description').order('name').limit(limit)
        if (q) query = query.ilike('name', `%${q}%`)
        const { data, error } = await query
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'add_chef',
      {
        title: '셰프 추가',
        description: '새 셰프/요리사를 DB에 등록한다.',
        inputSchema: {
          name:        z.string().describe('셰프 이름 (예: 백종원)'),
          role:        z.string().optional().describe('역할 (예: 셰프, MC, 요리연구가)'),
          specialty:   z.string().optional().describe('전문 분야 (예: 한식, 양식)'),
          description: z.string().optional().describe('소개'),
        },
        annotations: { destructiveHint: false },
      },
      async ({ name, role = '', specialty = '', description = '' }) => {
        const id = 'chef_' + Date.now()
        const { data, error } = await supabase.from('chefs').insert([{ id, name, role, specialty, description }]).select().single()
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        return { content: [{ type: 'text', text: `✅ 셰프 등록 완료\n${JSON.stringify(data, null, 2)}` }] }
      }
    )

    server.registerTool(
      'list_ingredients',
      {
        title: '식재료 목록 조회',
        description: 'DB에 등록된 식재료 목록을 가져온다. 카테고리·이름으로 필터 가능. 연결된 건강효능 목록도 함께 반환.',
        inputSchema: {
          category: z.string().optional().describe('카테고리 id (예: fish, leaf_veg)'),
          q:        z.string().optional().describe('이름 검색어'),
          limit:    z.number().optional().describe('최대 반환 개수 (기본 50)'),
        },
      },
      async ({ category, q, limit = 50 }) => {
        let query = supabase
          .from('ingredients')
          .select(`
            id, name, category, description, season_start, season_end,
            ingredient_health_benefits (
              benefit_id,
              health_benefits ( id, name, category )
            )
          `)
          .order('name')
          .limit(limit)
        if (category) query = query.eq('category', category)
        if (q)        query = query.ilike('name', `%${q}%`)
        const { data, error } = await query
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        // 응답을 보기 좋게 정리
        const result = (data || []).map(ing => ({
          id: ing.id,
          name: ing.name,
          category: ing.category,
          description: ing.description,
          season_start: ing.season_start,
          season_end: ing.season_end,
          health_benefits: (ing.ingredient_health_benefits || []).map(r => r.health_benefits).filter(Boolean),
        }))
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      }
    )

    server.registerTool(
      'add_ingredient',
      {
        title: '식재료 추가',
        description: '새 식재료를 DB에 등록한다.',
        inputSchema: {
          name:         z.string().describe('식재료명 (예: 고등어)'),
          category:     z.string().optional().describe('카테고리 id (예: fish)'),
          description:  z.string().optional().describe('설명'),
          season_start: z.number().optional().describe('제철 시작 월 (1~12)'),
          season_end:   z.number().optional().describe('제철 종료 월 (1~12)'),
        },
        annotations: { destructiveHint: false },
      },
      async ({ name, category = '', description = '', season_start, season_end }) => {
        const id = 'ing_' + Date.now()
        const { data, error } = await supabase.from('ingredients').insert([{ id, name, category, description, season_start, season_end }]).select().single()
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        return { content: [{ type: 'text', text: `✅ 식재료 등록 완료\n${JSON.stringify(data, null, 2)}` }] }
      }
    )

    server.registerTool(
      'list_dishes',
      {
        title: '요리 목록 조회',
        description: 'DB에 등록된 요리(dish) 목록을 가져온다.',
        inputSchema: {
          category: z.string().optional().describe('카테고리 (예: 한식, 양식)'),
          q:        z.string().optional().describe('요리명 검색어'),
          limit:    z.number().optional().describe('최대 반환 개수 (기본 50)'),
        },
      },
      async ({ category, q, limit = 50 }) => {
        let query = supabase.from('dishes').select('id,name,category,description').order('name').limit(limit)
        if (category) query = query.eq('category', category)
        if (q)        query = query.ilike('name', `%${q}%`)
        const { data, error } = await query
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'add_dish',
      {
        title: '요리 추가',
        description: '새 요리를 DB에 등록한다.',
        inputSchema: {
          name:        z.string().describe('요리명 (예: 된장찌개)'),
          category:    z.string().optional().describe('카테고리 (예: 한식)'),
          description: z.string().optional().describe('요리 설명'),
        },
        annotations: { destructiveHint: false },
      },
      async ({ name, category = '', description = '' }) => {
        const id = 'dish_' + Date.now()
        const { data, error } = await supabase.from('dishes').insert([{ id, name, category, description }]).select().single()
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        return { content: [{ type: 'text', text: `✅ 요리 등록 완료\n${JSON.stringify(data, null, 2)}` }] }
      }
    )

    server.registerTool(
      'list_utensils',
      {
        title: '조리도구 목록 조회',
        description: 'DB에 등록된 조리도구(utensils) 목록을 가져온다. 카테고리·용도·요리종류로 필터 가능.',
        inputSchema: {
          category: z.string().optional().describe('카테고리 (예: 칼·도마, 냄비·팬)'),
          usage:    z.string().optional().describe('용도 (예: 가정용, 영업용)'),
          cuisine:  z.string().optional().describe('요리종류 (예: 한식, 양식, 중식)'),
          q:        z.string().optional().describe('이름 검색어'),
          limit:    z.number().optional().describe('최대 반환 개수 (기본 50)'),
        },
      },
      async ({ category, usage, cuisine, q, limit = 50 }) => {
        let query = supabase.from('utensils').select('id,name,category,cuisine,usage,description,coupang_url').order('name').limit(limit)
        if (category) query = query.eq('category', category)
        if (usage)    query = query.eq('usage', usage)
        if (cuisine)  query = query.eq('cuisine', cuisine)
        if (q)        query = query.ilike('name', `%${q}%`)
        const { data, error } = await query
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'add_utensil',
      {
        title: '조리도구 추가',
        description: '새 조리도구를 DB에 등록한다. 카테고리·용도·요리종류·쿠팡링크 포함 가능.',
        inputSchema: {
          name:        z.string().describe('도구명 (예: 산토쿠 칼)'),
          category:    z.string().optional().describe('카테고리 (예: 칼·도마)'),
          usage:       z.string().optional().describe('용도 (예: 가정용, 영업용, 공통)'),
          cuisine:     z.string().optional().describe('요리종류 (예: 한식, 양식, 공통)'),
          description: z.string().optional().describe('설명'),
          coupang_url: z.string().optional().describe('쿠팡 파트너스 URL'),
        },
        annotations: { destructiveHint: false },
      },
      async ({ name, category = '', usage = '', cuisine = '', description = '', coupang_url = '' }) => {
        const id = 'ut_' + Date.now()
        const { data, error } = await supabase.from('utensils').insert([{ id, name, category, cuisine, usage, description, coupang_url }]).select().single()
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        return { content: [{ type: 'text', text: `✅ 조리도구 등록 완료\n${JSON.stringify(data, null, 2)}` }] }
      }
    )

    server.registerTool(
      'list_recipes',
      {
        title: '레시피 목록 조회',
        description: 'DB에 등록된 레시피 목록을 가져온다.',
        inputSchema: {
          q:     z.string().optional().describe('레시피 제목 검색어'),
          limit: z.number().optional().describe('최대 반환 개수 (기본 30)'),
        },
      },
      async ({ q, limit = 30 }) => {
        let query = supabase.from('recipes').select('id,title,summary,episode,aired_at,source_url').order('created_at', { ascending: false }).limit(limit)
        if (q) query = query.ilike('title', `%${q}%`)
        const { data, error } = await query
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'add_recipe',
      {
        title: '레시피 추가',
        description: '새 레시피를 DB에 등록한다. 요리(dish_id)·방송(show_id)·셰프(chef_id)와 연결 가능.',
        inputSchema: {
          title:      z.string().describe('레시피 제목'),
          dish_id:    z.string().optional().describe('연결할 요리 ID (list_dishes로 조회 후 사용)'),
          show_id:    z.string().optional().describe('연결할 TV방송 ID (list_tv_shows로 조회 후 사용)'),
          chef_id:    z.string().optional().describe('연결할 셰프 ID (list_chefs로 조회 후 사용)'),
          episode:    z.string().optional().describe('회차 (예: 3화, 302회)'),
          aired_at:   z.string().optional().describe('방영일 (YYYY-MM-DD)'),
          summary:    z.string().optional().describe('레시피 요약'),
          source_url: z.string().optional().describe('출처 URL'),
        },
        annotations: { destructiveHint: false },
      },
      async ({ title, dish_id, show_id, chef_id, episode = '', aired_at, summary = '', source_url = '' }) => {
        const id = 'rec_' + Date.now()
        const { data, error } = await supabase.from('recipes').insert([{
          id, title,
          dish_id:  dish_id  || null,
          show_id:  show_id  || null,
          chef_id:  chef_id  || null,
          episode, aired_at: aired_at || null, summary, source_url
        }]).select().single()
        if (error) return { content: [{ type: 'text', text: `❌ ${error.message}` }], isError: true }
        return { content: [{ type: 'text', text: `✅ 레시피 등록 완료\n${JSON.stringify(data, null, 2)}` }] }
      }
    )

  },
  {},
  { basePath: '/api', maxDuration: 30, verboseLogs: true }
)

// ── 간단한 공유 비밀키 보호 ───────────────────────────────────────────
// claude.ai 커넥터 URL에 ?key=... 로 같이 등록해서 사용한다.
// (전체 OAuth 플로우 대신, 개인/소규모 사용에 맞춘 가벼운 보호 장치)
async function authedHandler(request) {
  const url = new URL(request.url)
  const key = url.searchParams.get('key')
  if (!process.env.MCP_SHARED_SECRET || key !== process.env.MCP_SHARED_SECRET) {
    return new Response(JSON.stringify({ error: '인증 필요 (key 파라미터 확인)' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return baseHandler(request)
}

export { authedHandler as GET, authedHandler as POST }
