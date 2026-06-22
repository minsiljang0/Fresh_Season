// Fresh Season MCP 서버
// Claude가 이 툴들을 직접 호출해 블로그 글을 자동 발행합니다.
//
// 툴 목록 (19개):
//   get_publish_log          — 발행 기록 조회 (중복 방지, 매번 먼저 호출)
//   add_publish_log          — 발행 기록 추가
//   create_blog_post         — 블로그 글 발행
//   get_seasonal_foods       — 월/지역별 제철 식재료 조회
//   get_tv_recipes           — 재료명·프로그램으로 TV 레시피 조회
//   create_food_post         — 제철 먹거리 글 자동 생성+발행
//   link_recipe_to_ingredient — TV 레시피 등록 + 재료 매핑
//   get_region_info          — 지역 정보 조회
//   naver_keyword_volume     — 네이버 키워드 검색량 조회
//   pick_keyword             — 키워드 찜
//   get_keyword_data         — 도구별 찜 키워드 + TOP 캐시 키워드 조회
//   save_keyword_data        — 검색량 조회 결과를 캐시에 저장 (재조회 방지)
//   search_keyword_data      — 전체 키워드 DB 검색 (hint 구분 없이)
//   search_keyword_picks     — 찜 키워드 전체 열람·검색 (미사용/전체 선택)
//   mark_keyword_used        — 찜 키워드를 글에 썼을 때 사용 처리
//   get_tool_info            — 사이트 도구/지역 기능 설명 조회
//   update_tool_info         — 도구 기능 설명 갱신
//   suggest_feature          — 기존 도구에 기능 추가 제안 기록
//   get_feature_ideas        — 기능 추가 제안 목록 조회
//
// Claude 자동화 흐름 (매일 실행):
//   1. get_publish_log()              → 이미 발행된 글 확인
//   2. get_tool_info()                → 시도별 지역 설명 최신 확인
//   3. search_keyword_picks()         → 찜해둔 키워드 중 오늘 쓸 만한 것 확인
//   4. get_seasonal_foods(month)      → 이달 제철 재료 목록
//   5. 미발행 재료 선택
//   6. get_tv_recipes(ingredient)     → 등록된 TV 레시피 확인
//   7. 없으면 웹검색 후 link_recipe_to_ingredient() 호출
//   8. get_keyword_data()             → 캐시된 키워드 확인
//   9. naver_keyword_volume()         → 실시간 검색량 확인
//  10. save_keyword_data()            → 조회 결과 캐시 저장
//  11. create_food_post()             → 블로그 글 자동 발행
//  12. add_publish_log()              → 발행 기록 추가
//  13. mark_keyword_used()            → 사용한 찜 키워드 처리
//  14. pick_keyword()                 → 황금키워드 찜

import { createMcpHandler } from '@vercel/mcp-adapter'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function fmt(n) { return (n || 0).toLocaleString('ko-KR') }

const REGION_CODES = [
  'seoul','busan','daegu','incheon','gwangju','daejeon','ulsan','sejong',
  'gyeonggi','gangwon','chungbuk','chungnam','jeonbuk','jeonnam','gyeongbuk','gyeongnam','jeju'
]

// ── 네이버 검색광고 API ────────────────────────────────────────────────
const NAVER_BASE_URL = 'https://api.naver.com'
const NAVER_URI = '/keywordstool'

function buildNaverHeaders() {
  const apiKey = process.env.NAVER_AD_API_KEY || process.env.NAVER_ACCESS_KEY
  const secretKey = process.env.NAVER_AD_SECRET_KEY || process.env.NAVER_SECRET_KEY
  const customerId = process.env.NAVER_AD_CUSTOMER_ID || process.env.NAVER_CUSTOMER_ID
  if (!apiKey || !secretKey || !customerId) {
    throw new Error('네이버 검색광고 API 환경변수가 설정되지 않았습니다')
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
  const url = `${NAVER_BASE_URL}${NAVER_URI}?hintKeywords=${encodeURIComponent(keywords.join(','))}&showDetail=1`
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

  // 네이버 블로그 문서수 병렬 조회
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
        } catch { return null }
      })
    )
    return parsed.map((item, i) => ({ ...item, docCount: docCounts[i] }))
  }
  return parsed
}

// ── MCP 서버 ──────────────────────────────────────────────────────────
const handler = createMcpHandler(server => {

  // ── 1. 발행 기록 조회 ──
  server.tool('get_publish_log',
    '발행된 블로그 글 기록 조회. 중복 방지용. 글쓰기 전 가장 먼저 호출. 메모에 사용한 찜 키워드 정보도 포함됨.',
    { limit: z.number().optional().default(200) },
    async ({ limit }) => {
      const { data, error } = await supabase.from('publish_log')
        .select('*').order('published_at', { ascending: false }).limit(limit)
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      if (!data?.length) return { content: [{ type: 'text', text: '발행 기록: 없음 (처음 시작)' }] }
      const lines = [`발행 기록 (${data.length}건, 최신순):`]
      data.forEach(l => {
        const dateStr = l.published_at ? l.published_at.slice(0, 10) : ''
        lines.push(`- 카테고리: ${l.category} / 제목: ${l.title} / 슬러그: ${l.slug}${dateStr ? ' / 날짜: ' + dateStr : ''}${l.memo ? ' / 메모: ' + l.memo : ''}`)
      })
      return { content: [{ type: 'text', text: lines.join('\n') }] }
    }
  )

  // ── 2. 발행 기록 추가 ──
  server.tool('add_publish_log',
    '블로그 글 발행 후 기록에 남기기. create_food_post 직후 호출. target_keyword 등 키워드 데이터도 함께 저장 가능.',
    {
      title: z.string(),
      slug: z.string(),
      category: z.string(),
      angle: z.string().optional().describe('글 각도. 예: "제철 소개"'),
      memo: z.string().optional().describe('사용한 찜 키워드나 특이사항 메모'),
      target_keyword: z.string().optional(),
      search_pc: z.number().optional(),
      search_mobile: z.number().optional(),
      search_total: z.number().optional(),
      competition: z.string().optional(),
    },
    async ({ title, slug, category, angle, memo, target_keyword, search_pc, search_mobile, search_total, competition }) => {
      const { error } = await supabase.from('publish_log').insert([{
        id: genId(), title, slug, category,
        angle: angle || null,
        memo: memo || null,
        target_keyword: target_keyword || null,
        search_pc: search_pc ?? null,
        search_mobile: search_mobile ?? null,
        search_total: search_total ?? null,
        competition: competition || null,
        published_at: new Date().toISOString(),
      }])
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      return { content: [{ type: 'text', text: `✅ 발행 기록 완료: ${title}` }] }
    }
  )

  // ── 3. 블로그 글 발행 ──
  server.tool('create_blog_post',
    '블로그 글을 사이트에 발행. 기본 status=published(즉시 공개). draft면 admin에만 저장.',
    {
      title: z.string(),
      slug: z.string(),
      content: z.string(),
      category: z.string(),
      summary: z.string().optional(),
      tags: z.array(z.string()).optional(),
      cover_image: z.string().optional(),
      status: z.enum(['published','draft','scheduled']).optional().default('published'),
      scheduled_at: z.string().optional(),
    },
    async ({ title, slug, content, category, summary, tags, cover_image, status, scheduled_at }) => {
      const finalStatus = status || 'published'
      const nowIso = new Date().toISOString()
      const { data, error } = await supabase.from('blog_posts').insert([{
        id: genId(), title, slug, content, category,
        summary: summary || null,
        tags: Array.isArray(tags) ? tags : [],
        cover_image: cover_image || null,
        status: finalStatus,
        post_type: 'blog',
        scheduled_at: finalStatus === 'scheduled' ? (scheduled_at || null) : null,
        published_at: finalStatus === 'published' ? nowIso : null,
        created_at: nowIso,
        updated_at: nowIso,
      }]).select().single()
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      const liveNote = finalStatus === 'published'
        ? `✅ 발행 완료 — https://fresh-season.vercel.app/blog/${slug} 에서 바로 확인 가능`
        : `✅ ${finalStatus === 'draft' ? '임시저장(draft)' : '예약(scheduled)'} 완료`
      return { content: [{ type: 'text', text: liveNote }] }
    }
  )

  // ── 4. 제철 식재료 조회 ──
  server.tool('get_seasonal_foods',
    '월/지역별 제철 식재료 조회. month(1-12) 또는 region 중 하나 이상 필요.',
    {
      month: z.number().min(1).max(12).optional(),
      region: z.enum(REGION_CODES).optional(),
    },
    async ({ month, region }) => {
      let q = supabase.from('seasonal_foods').select('*')
      if (region) q = q.eq('region', region)
      if (month) q = q.contains('months', [month])
      const { data, error } = await q.order('ingredient')
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      if (!data?.length) return { content: [{ type: 'text', text: '해당 조건의 제철 재료 없음' }] }
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }
  )

  // ── 5. TV 레시피 조회 ──
  server.tool('get_tv_recipes',
    '재료명 또는 TV 프로그램명으로 등록된 레시피 조회.',
    { ingredient: z.string().optional(), program: z.string().optional() },
    async ({ ingredient, program }) => {
      let q = supabase.from('tv_recipes').select('*')
      if (ingredient) q = q.ilike('ingredient', `%${ingredient}%`)
      if (program) q = q.ilike('program', `%${program}%`)
      const { data, error } = await q.order('created_at', { ascending: false }).limit(20)
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      if (!data?.length) return { content: [{ type: 'text', text: '등록된 TV 레시피 없음. link_recipe_to_ingredient로 먼저 등록하세요.' }] }
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }
  )

  // ── 6. 제철 먹거리 글 자동 생성+발행 ──
  server.tool('create_food_post',
    '제철 먹거리 블로그 글을 자동 생성하고 발행. SEO 85점 이상일 때만 호출. 기본 status=published(즉시 공개).',
    {
      ingredient: z.string(),
      region: z.enum(REGION_CODES),
      month: z.number(),
      health_info: z.string(),
      tv_recipes: z.array(z.object({ program: z.string(), title: z.string(), summary: z.string() })),
      keywords: z.array(z.string()).optional(),
      status: z.enum(['published','draft','scheduled']).optional().default('published'),
    },
    async ({ ingredient, region, month, health_info, tv_recipes, keywords, status }) => {
      const slug = `${region}-${ingredient}-${month}월-${Date.now().toString(36)}`
      const title = `${month}월 제철 ${ingredient} — 건강 효능과 TV 레시피`
      const recipeBlocks = tv_recipes.map(r =>
        `<h3>📺 ${r.program}: ${r.title}</h3><p>${r.summary}</p>`
      ).join('\n')
      const content = `
<h2>🌿 ${ingredient}란?</h2>
<p>${month}월, 최고의 ${ingredient}를 소개합니다.</p>
<h2>💚 건강 효능</h2>
<p>${health_info}</p>
<h2>📺 TV 방영 레시피</h2>
${recipeBlocks}
<h2>🔎 관련 키워드</h2>
<p>${(keywords || [ingredient]).join(', ')}</p>`.trim()

      const nowIso = new Date().toISOString()
      const finalStatus = status || 'published'
      const { data, error } = await supabase.from('blog_posts').insert([{
        id: genId(), title, slug, content, category: region,
        status: finalStatus, post_type: 'blog',
        published_at: finalStatus === 'published' ? nowIso : null,
        created_at: nowIso, updated_at: nowIso,
      }]).select().single()
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      return { content: [{ type: 'text', text: `✅ 발행 완료!\n제목: ${title}\nSlug: ${slug}\nURL: https://fresh-season.vercel.app/blog/${slug}` }] }
    }
  )

  // ── 7. TV 레시피 등록 + 재료 매핑 ──
  server.tool('link_recipe_to_ingredient',
    'TV 레시피를 등록하고 재료와 연결.',
    {
      ingredient: z.string(),
      program: z.string(),
      recipe_title: z.string(),
      recipe_summary: z.string(),
      episode: z.string().optional(),
      source_url: z.string().optional(),
      region: z.string().optional(),
    },
    async ({ ingredient, program, recipe_title, recipe_summary, episode, source_url, region }) => {
      const recipeId = genId()
      const { error: e1 } = await supabase.from('tv_recipes').insert([{
        id: recipeId, ingredient, program, episode: episode || '',
        title: recipe_title, summary: recipe_summary,
        source_url: source_url || null, created_at: new Date().toISOString(),
      }])
      if (e1) return { content: [{ type: 'text', text: `오류: ${e1.message}` }] }
      await supabase.from('recipe_ingredient_map').insert([{
        id: genId(), recipe_id: recipeId, ingredient, region: region || null,
        created_at: new Date().toISOString(),
      }])
      return { content: [{ type: 'text', text: `✅ 연결 완료: ${ingredient} ↔ ${program} "${recipe_title}"` }] }
    }
  )

  // ── 8. 지역 정보 조회 ──
  server.tool('get_region_info',
    '시도 ID로 지역명, 대표 식재료, 시군구 조회.',
    { region_id: z.enum(REGION_CODES) },
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

  // ── 9. 네이버 키워드 검색량 ──
  server.tool('naver_keyword_volume',
    '네이버 검색광고 API로 키워드 월간 검색량 실시간 조회. 최대 5개 쉼표 구분. 조회 후 save_keyword_data로 캐시 저장 권장.',
    { hintKeywords: z.string().describe('쉼표로 구분된 한글 키워드, 최대 5개. 예: "제주 감귤 제철,감귤 효능"') },
    async ({ hintKeywords }) => {
      const keywords = normalizeKeywords(hintKeywords)
      if (!keywords.length) return { content: [{ type: 'text', text: '키워드를 1개 이상 입력해주세요.' }] }
      try {
        const results = await fetchNaverKeywordData(keywords)
        return { content: [{ type: 'text', text: JSON.stringify({ query: keywords, results }, null, 2) }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `오류: ${e.message}` }] }
      }
    }
  )

  // ── 10. 키워드 찜 ──
  server.tool('pick_keyword',
    '나중에 글로 쓸 키워드 찜하기. memo에 어떤 글로 연결할지 계획 메모 권장.',
    {
      group: z.string().describe('키워드를 묶을 그룹/지역 코드. 예: "gangwon", "jeju"'),
      keyword: z.string(),
      pc: z.number().optional(),
      mobile: z.number().optional(),
      total: z.number().optional(),
      competition: z.string().optional(),
      memo: z.string().optional().describe('어떤 글로 연결할지 계획 메모'),
    },
    async ({ group, keyword, pc, mobile, total, competition, memo }) => {
      const row = {
        tool_id: group, hint: group, keyword,
        pc: pc || 0, mobile: mobile || 0,
        total: total != null ? total : (pc || 0) + (mobile || 0),
        competition: competition || null,
        memo: memo || null,
      }
      const { error } = await supabase.from('keyword_picks').upsert(row, { onConflict: 'tool_id,keyword' })
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      return { content: [{ type: 'text', text: `⭐ 찜 완료: [${group}] ${keyword}${memo ? ' — ' + memo : ''}` }] }
    }
  )

  // ── 11. 찜 키워드 + TOP 캐시 키워드 조회 ──
  server.tool('get_keyword_data',
    '특정 지역/그룹의 찜한 키워드 + 캐시된 TOP 검색량 키워드 조회. 키워드 각도 확정 전 호출.',
    {
      hint: z.string().describe('지역 코드 또는 그룹명. 예: "gangwon", "jeju"'),
      limit: z.number().optional().default(30),
    },
    async ({ hint, limit }) => {
      const max = limit || 30
      const { data: topRows, error: topErr } = await supabase
        .from('keyword_stats').select('keyword, pc, mobile, total, competition')
        .eq('hint', hint).order('total', { ascending: false }).limit(max)
      if (topErr) return { content: [{ type: 'text', text: `오류: ${topErr.message}` }] }

      const { data: pickRows, error: pickErr } = await supabase
        .from('keyword_picks').select('keyword, pc, mobile, total, competition, memo')
        .eq('tool_id', hint).is('used_at', null).order('total', { ascending: false })
      if (pickErr) return { content: [{ type: 'text', text: `오류: ${pickErr.message}` }] }

      const lines = [`[그룹] ${hint}`, '']
      lines.push(`⭐ 찜한 키워드 (${pickRows.length}개):`)
      if (!pickRows.length) lines.push('- 없음')
      else pickRows.forEach(p => lines.push(`- ${p.keyword} · 합계 ${fmt(p.total)} (PC ${fmt(p.pc)} / 모바일 ${fmt(p.mobile)})${p.competition ? ' · 경쟁도 ' + p.competition : ''}${p.memo ? ' · ' + p.memo : ''}`))
      lines.push('')
      lines.push(`📊 TOP 키워드 (검색량 순, 상위 ${topRows.length}개):`)
      if (!topRows.length) lines.push('- 데이터 없음 (naver_keyword_volume + save_keyword_data로 먼저 수집 필요)')
      else topRows.forEach((k, i) => lines.push(`${i + 1}. ${k.keyword} · 합계 ${fmt(k.total)} (PC ${fmt(k.pc)} / 모바일 ${fmt(k.mobile)})${k.competition ? ' · 경쟁도 ' + k.competition : ''}`))

      return { content: [{ type: 'text', text: lines.join('\n') }] }
    }
  )

  // ── 12. 검색량 결과 캐시 저장 ──
  server.tool('save_keyword_data',
    'naver_keyword_volume 조회 결과를 캐시에 저장. 다음에 get_keyword_data로 재사용 가능. 매번 실시간 조회 반복 방지.',
    {
      hint: z.string().describe('저장할 그룹/지역 코드. 예: "gangwon"'),
      keywords: z.array(z.object({
        keyword: z.string(),
        monthlySearchPc: z.number().optional(),
        monthlySearchMobile: z.number().optional(),
        monthlySearchTotal: z.number().optional(),
        competition: z.string().optional(),
      })).min(1).describe('naver_keyword_volume 응답의 results 배열을 그대로 전달'),
    },
    async ({ hint, keywords }) => {
      const rows = keywords.map(k => {
        const pc = k.monthlySearchPc || 0
        const mobile = k.monthlySearchMobile || 0
        const total = k.monthlySearchTotal != null ? k.monthlySearchTotal : pc + mobile
        return { hint, keyword: k.keyword, pc, mobile, total, competition: k.competition || '-' }
      })
      const { error } = await supabase.from('keyword_stats').upsert(rows, { onConflict: 'hint,keyword' })
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      return { content: [{ type: 'text', text: `✅ [${hint}] 키워드 ${rows.length}개 캐시 저장 완료. get_keyword_data로 바로 조회 가능.` }] }
    }
  )

  // ── 13. 전체 키워드 DB 검색 (hint 구분 없이) ──
  server.tool('search_keyword_data',
    '전체 키워드 DB를 hint 구분 없이 검색. competition="낮음"으로 필터하면 황금키워드 탐색 가능.',
    {
      query: z.string().optional().describe('키워드에 포함될 문자열. 비우면 전체 반환'),
      competition: z.string().optional().describe('경쟁도 필터. 예: "낮음"'),
      limit: z.number().optional().default(100),
    },
    async ({ query, competition, limit }) => {
      let q = supabase.from('keyword_stats')
        .select('hint, keyword, pc, mobile, total, competition')
        .order('total', { ascending: false }).limit(limit || 100)
      if (query) q = q.ilike('keyword', `%${query}%`)
      if (competition) q = q.eq('competition', competition)
      const { data, error } = await q
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      if (!data?.length) return { content: [{ type: 'text', text: '검색 결과 없음' }] }
      const lines = [`검색 결과 (${data.length}건, 검색량 순):`]
      data.forEach(k => lines.push(`- [${k.hint}] ${k.keyword} · 합계 ${fmt(k.total)} (PC ${fmt(k.pc)} / 모바일 ${fmt(k.mobile)})${k.competition ? ' · 경쟁도 ' + k.competition : ''}`))
      return { content: [{ type: 'text', text: lines.join('\n') }] }
    }
  )

  // ── 14. 찜 키워드 전체 열람·검색 ──
  server.tool('search_keyword_picks',
    '찜해둔 키워드를 그룹 구분 없이 전체 열람·검색. 글감 정하기 전 "오늘 쓸 만한 게 있나" 확인용.',
    {
      query: z.string().optional().describe('키워드 또는 메모에 포함될 문자열. 비우면 전체 반환'),
      include_used: z.boolean().optional().describe('true면 사용 처리된 키워드도 포함. 기본 false(미사용만)'),
    },
    async ({ query, include_used }) => {
      let q = supabase.from('keyword_picks')
        .select('tool_id, keyword, pc, mobile, total, competition, memo, used_at, used_in_title, used_in_slug')
        .order('total', { ascending: false })
      if (!include_used) q = q.is('used_at', null)
      const { data, error } = await q
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      let rows = data || []
      if (query) {
        const needle = query.toLowerCase()
        rows = rows.filter(r =>
          (r.keyword || '').toLowerCase().includes(needle) || (r.memo || '').toLowerCase().includes(needle)
        )
      }
      if (!rows.length) return { content: [{ type: 'text', text: include_used ? '찜한 키워드 없음' : '미사용 찜 키워드 없음' }] }
      const label = include_used ? '찜한 키워드 (사용 여부 포함)' : '⭐ 미사용 찜 키워드'
      const lines = [`${label} (${rows.length}개):`]
      rows.forEach(p => {
        const usedNote = p.used_at ? ` · ✅ 사용됨(${p.used_at.slice(0, 10)}, ${p.used_in_title || p.used_in_slug || ''})` : ''
        lines.push(`- [${p.tool_id}] ${p.keyword} · 합계 ${fmt(p.total)} (PC ${fmt(p.pc)} / 모바일 ${fmt(p.mobile)})${p.competition ? ' · 경쟁도 ' + p.competition : ''}${p.memo ? ' · 메모: ' + p.memo : ''}${usedNote}`)
      })
      return { content: [{ type: 'text', text: lines.join('\n') }] }
    }
  )

  // ── 15. 찜 키워드 사용 처리 ──
  server.tool('mark_keyword_used',
    '찜해둔 키워드를 글에 실제로 썼을 때 "사용됨" 처리. add_publish_log 직후 호출. 사용 날짜·글 정보 자동 기록.',
    {
      group: z.string().describe('pick_keyword에 쓴 것과 같은 그룹/지역 코드'),
      keyword: z.string(),
      used_in_title: z.string().describe('키워드를 사용한 글 제목'),
      used_in_slug: z.string().optional().describe('키워드를 사용한 글 슬러그'),
    },
    async ({ group, keyword, used_in_title, used_in_slug }) => {
      const nowIso = new Date().toISOString()
      const row = {
        tool_id: group, hint: group, keyword,
        used_at: nowIso,
        used_in_title: used_in_title || null,
        used_in_slug: used_in_slug || null,
      }
      const { error } = await supabase.from('keyword_picks').upsert(row, { onConflict: 'tool_id,keyword' })
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      return { content: [{ type: 'text', text: `✅ 사용 처리됨: [${group}] ${keyword} → "${used_in_title}" (${nowIso.slice(0, 10)})` }] }
    }
  )

  // ── 16. 도구/지역 기능 설명 조회 ──
  server.tool('get_tool_info',
    '시도별 지역 설명, 사이트 도구 기능 설명 조회. STEP 1 시작 시 get_publish_log와 함께 호출.',
    { tool_id: z.string().optional().describe('특정 시도/도구 코드로 조회. 비우면 전체') },
    async ({ tool_id }) => {
      let q = supabase.from('tool_info').select('*').order('tool_id')
      if (tool_id) q = q.eq('tool_id', tool_id)
      const { data, error } = await q
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      if (!data?.length) return { content: [{ type: 'text', text: tool_id ? `${tool_id}: 등록된 설명 없음` : '등록된 도구 설명 없음' }] }
      const lines = data.map(t =>
        `- [${t.tool_id}] ${t.name || ''}: ${t.description}${t.path ? ' (' + t.path + ')' : ''} · 갱신일 ${t.updated_at}`
      )
      return { content: [{ type: 'text', text: lines.join('\n') }] }
    }
  )

  // ── 17. 도구/지역 기능 설명 갱신 ──
  server.tool('update_tool_info',
    '시도/도구 기능 설명 갱신. 사용자가 직접 정정해준 내용만 반영. 추측으로 절대 호출하지 않음.',
    {
      tool_id: z.string().describe('시도/도구 코드. 예: "gangwon", "jeju"'),
      description: z.string().describe('갱신할 전체 기능 설명'),
      name: z.string().optional().describe('도구/지역명 (선택)'),
      path: z.string().optional().describe('경로. 예: /region/gangwon (선택)'),
    },
    async ({ tool_id, description, name, path }) => {
      const { data: prevRow } = await supabase
        .from('tool_info').select('description').eq('tool_id', tool_id).maybeSingle()
      const previousDescription = prevRow?.description || null

      const row = { tool_id, description, updated_at: new Date().toISOString() }
      if (name) row.name = name
      if (path) row.path = path

      const { error } = await supabase.from('tool_info').upsert(row, { onConflict: 'tool_id' }).select().single()
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      const lines = [`✅ ${tool_id} 설명 갱신됨`]
      if (previousDescription) lines.push(`이전: ${previousDescription}`)
      lines.push(`이후: ${description}`)
      return { content: [{ type: 'text', text: lines.join('\n') }] }
    }
  )

  // ── 18. 기능 추가 제안 기록 ──
  server.tool('suggest_feature',
    '기존 페이지/기능에 추가하면 좋을 아이디어 기록. 새 시도 페이지가 아닌 기존 구조에 기능을 붙일 때 사용.',
    {
      tool_id: z.string().describe('기능을 추가할 기존 도구/시도 코드'),
      feature_name: z.string().describe('추가할 기능 이름'),
      keyword: z.string().optional().describe('이 제안의 근거가 된 키워드'),
      pc: z.number().optional(),
      mobile: z.number().optional(),
      total: z.number().optional(),
      competition: z.string().optional(),
      notes: z.string().describe('구현 가능성 검토 결과 — 비용, 약관, 대안, 추천 방향 등'),
    },
    async ({ tool_id, feature_name, keyword, pc, mobile, total, competition, notes }) => {
      const row = {
        id: genId(), tool_id, feature_name,
        keyword: keyword || null,
        pc: pc || null, mobile: mobile || null, total: total || null,
        competition: competition || null, notes, status: 'proposed',
        created_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('feature_ideas').insert([row])
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      return { content: [{ type: 'text', text: `💡 기능 제안 기록됨: [${tool_id}] ${feature_name}${keyword ? ' (키워드: ' + keyword + ')' : ''}` }] }
    }
  )

  // ── 19. 기능 추가 제안 목록 조회 ──
  server.tool('get_feature_ideas',
    '기록해둔 기능 추가 제안 목록 조회. 새 글감 정하거나 사이트 로드맵 검토 시 확인.',
    {
      tool_id: z.string().optional().describe('특정 도구/시도로만 필터링'),
      status: z.enum(['proposed','building','done','rejected']).optional(),
    },
    async ({ tool_id, status }) => {
      let q = supabase.from('feature_ideas').select('*').order('created_at', { ascending: false })
      if (tool_id) q = q.eq('tool_id', tool_id)
      if (status) q = q.eq('status', status)
      const { data, error } = await q
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      if (!data?.length) return { content: [{ type: 'text', text: '기록된 기능 제안 없음' }] }
      const lines = [`💡 기능 추가 제안 (${data.length}건):`]
      data.forEach(f => {
        const vol = f.total ? ` · 검색량 ${fmt(f.total)}${f.competition ? '(경쟁 ' + f.competition + ')' : ''}` : ''
        lines.push(`- [${f.tool_id}/${f.status}] ${f.feature_name}${f.keyword ? ' (키워드: ' + f.keyword + ')' : ''}${vol}\n  └ ${f.notes}`)
      })
      return { content: [{ type: 'text', text: lines.join('\n') }] }
    }
  )

})

export { handler as GET, handler as POST }
