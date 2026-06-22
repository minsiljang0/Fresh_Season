// 제철밥상 MCP 서버
// Claude가 이 툴들을 직접 호출해 블로그 글을 자동 발행합니다.
//
// 툴 목록:
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
//   get_keyword_data         — 찜한 키워드 조회
//
// Claude 자동화 흐름 (매일 실행):
//   1. get_publish_log()              → 이미 발행된 글 확인
//   2. get_seasonal_foods(month)      → 이달 제철 재료 목록
//   3. 미발행 재료 선택
//   4. get_tv_recipes(ingredient)     → 등록된 TV 레시피 확인
//   5. 없으면 웹검색으로 수집 후 link_recipe_to_ingredient() 호출
//   6. create_food_post()             → 블로그 글 자동 발행
//   7. naver_keyword_volume()         → 검색량 확인
//   8. pick_keyword()                 → 황금키워드 찜

import { createMcpHandler } from '@vercel/mcp-adapter'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

const handler = createMcpHandler(server => {

  // ── 발행 기록 조회 ──
  server.tool('get_publish_log',
    '발행된 블로그 글 기록 조회. 중복 방지용. 글쓰기 전 가장 먼저 호출.',
    { limit: z.number().optional().default(30) },
    async ({ limit }) => {
      const { data, error } = await supabase.from('publish_log')
        .select('*').order('published_at', { ascending: false }).limit(limit)
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }
  )

  // ── 발행 기록 추가 ──
  server.tool('add_publish_log',
    '블로그 글 발행 후 기록에 남기기.',
    { title: z.string(), slug: z.string(), category: z.string(), memo: z.string().optional() },
    async ({ title, slug, category, memo }) => {
      const { error } = await supabase.from('publish_log').insert([{
        id: genId(), title, slug, category, memo: memo || '',
        published_at: new Date().toISOString(),
      }])
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      return { content: [{ type: 'text', text: `발행 기록 완료: ${title}` }] }
    }
  )

  // ── 블로그 글 발행 ──
  server.tool('create_blog_post',
    '블로그 글을 사이트에 발행.',
    {
      title: z.string(),
      slug: z.string(),
      content: z.string(),
      category: z.string(),
      status: z.enum(['published','draft','scheduled']).optional().default('published'),
      scheduled_at: z.string().optional(),
    },
    async ({ title, slug, content, category, status, scheduled_at }) => {
      const { data, error } = await supabase.from('blog_posts').insert([{
        id: genId(), title, slug, content, category,
        status: status || 'published', post_type: 'blog',
        scheduled_at: scheduled_at || null,
        published_at: status === 'published' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      }]).select().single()
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      return { content: [{ type: 'text', text: `발행 완료: ${title} (${data.id})` }] }
    }
  )

  // ── 제철 식재료 조회 ──
  server.tool('get_seasonal_foods',
    '월/지역별 제철 식재료 조회. month(1-12) 또는 region 중 하나 이상 필요.',
    {
      month: z.number().min(1).max(12).optional(),
      region: z.enum(['gangwon','jeju','jeonla','gyeongsan','chungcheong','gyeonggi']).optional(),
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

  // ── TV 레시피 조회 ──
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

  // ── 제철 먹거리 글 자동 생성+발행 ──
  server.tool('create_food_post',
    '제철 먹거리 블로그 글을 자동 생성하고 발행.',
    {
      ingredient: z.string(),
      region: z.enum(['gangwon','jeju','jeonla','gyeongsan','chungcheong','gyeonggi']),
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

      const { data, error } = await supabase.from('blog_posts').insert([{
        id: genId(), title, slug, content, category: region,
        status: status || 'published', post_type: 'blog',
        published_at: status === 'published' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      }]).select().single()
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }

      await supabase.from('publish_log').insert([{
        id: genId(), title, slug, category: region,
        memo: `${ingredient} ${month}월 제철. TV: ${tv_recipes.map(r => r.program).join(', ')}`,
        published_at: new Date().toISOString(),
      }])
      return { content: [{ type: 'text', text: `발행 완료!\n제목: ${title}\nSlug: ${slug}` }] }
    }
  )

  // ── TV 레시피 등록 + 재료 매핑 ──
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
      return { content: [{ type: 'text', text: `연결 완료: ${ingredient} ↔ ${program} "${recipe_title}"` }] }
    }
  )

  // ── 지역 정보 조회 ──
  server.tool('get_region_info',
    '지역 ID로 지역명, 대표 식재료, 시군구 조회.',
    { region_id: z.enum(['gangwon','jeju','jeonla','gyeongsan','chungcheong','gyeonggi']) },
    async ({ region_id }) => {
      const INFO = {
        gangwon:     { name:'강원도',     desc:'동해 해산물·산나물·감자', cities:['강릉시','속초시','동해시','삼척시','춘천시'] },
        jeju:        { name:'제주도',     desc:'감귤·흑돼지·전복·옥돔',   cities:['제주시','서귀포시'] },
        jeonla:      { name:'전라도',     desc:'쌀·김·낙지·굴비·홍어',    cities:['전주시','광주광역시','목포시','여수시'] },
        gyeongsan:   { name:'경상도',     desc:'과메기·대구·사과·한우',   cities:['부산광역시','대구광역시','포항시','경주시'] },
        chungcheong: { name:'충청도',     desc:'인삼·딸기·오리·게장',     cities:['대전광역시','세종시','청주시','천안시'] },
        gyeonggi:    { name:'경기·수도권', desc:'쌀·배·포도·한강 민물',   cities:['서울특별시','인천광역시','수원시','고양시'] },
      }
      return { content: [{ type: 'text', text: JSON.stringify({ id: region_id, ...INFO[region_id] }, null, 2) }] }
    }
  )

  // ── 네이버 키워드 검색량 ──
  server.tool('naver_keyword_volume',
    '네이버 검색광고 API로 키워드 월간 검색량 조회.',
    { keyword: z.string() },
    async ({ keyword }) => {
      try {
        const ts = Date.now().toString()
        const { createHmac } = await import('crypto')
        const sig = createHmac('sha256', process.env.NAVER_SECRET_KEY || '')
          .update(`${ts}.GET./keywordstool`).digest('base64')
        const r = await fetch(`https://api.searchad.naver.com/keywordstool?hintKeywords=${encodeURIComponent(keyword)}&showDetail=1`, {
          headers: { 'X-Timestamp': ts, 'X-API-KEY': process.env.NAVER_ACCESS_KEY || '', 'X-Customer': process.env.NAVER_CUSTOMER_ID || '', 'X-Signature': sig }
        })
        const data = await r.json()
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      } catch (e) {
        return { content: [{ type: 'text', text: `오류: ${e.message}` }] }
      }
    }
  )

  // ── 키워드 찜 ──
  server.tool('pick_keyword',
    '나중에 글로 쓸 키워드 찜하기.',
    { keyword: z.string(), hint: z.string().optional(), memo: z.string().optional() },
    async ({ keyword, hint, memo }) => {
      const { error } = await supabase.from('keyword_picks').insert([{
        id: genId(), keyword, hint: hint || '', memo: memo || '',
        created_at: new Date().toISOString(),
      }])
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      return { content: [{ type: 'text', text: `찜 완료: ${keyword}` }] }
    }
  )

  // ── 찜 키워드 조회 ──
  server.tool('get_keyword_data',
    '찜한 키워드 조회. hint로 필터 가능.',
    { hint: z.string().optional() },
    async ({ hint }) => {
      let q = supabase.from('keyword_picks').select('*').is('used_at', null)
      if (hint) q = q.ilike('hint', `%${hint}%`)
      const { data, error } = await q.order('created_at', { ascending: false })
      if (error) return { content: [{ type: 'text', text: `오류: ${error.message}` }] }
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }
  )

})

export { handler as GET, handler as POST }
