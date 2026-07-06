import { supabase, genId } from '../../../lib/supabase'

/** 현재 시각을 KST(UTC+9) 기준 ISO 문자열로 반환 */
function nowKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
}

// 블로그 "레시피" 카테고리 글과 지도관리(MapAdminPanel)의 recipes 테이블을
// id를 공유해서 서로 자동 연동한다 (블로그 ↔ 지도관리 양쪽에서 보이도록).
const RECIPE_SYNC_CATEGORY = '레시피'

async function syncRecipeRow(post) {
  if (!post) return
  try {
    if (post.category === RECIPE_SYNC_CATEGORY) {
      await supabase.from('recipes').upsert([{
        id: post.id,
        title: post.title,
        summary: post.summary || '',
        thumbnail: post.cover_image || '',
      }], { onConflict: 'id' })
    } else {
      // 카테고리가 레시피가 아니게 바뀌었으면 지도관리 목록에서도 내려준다
      await supabase.from('recipes').delete().eq('id', post.id)
    }
  } catch (e) {
    console.error('[레시피 동기화] 오류:', e.message)
  }
}

export default async function handler(req, res) {
  const isAdmin = req.headers['x-admin-token'] === process.env.ADMIN_SECRET_TOKEN

  // 예약 발행 자동 전환
  try {
    const now = nowKST()
    await supabase.from('blog_posts').update({ status: 'published', published_at: now })
      .eq('status', 'scheduled').lte('scheduled_at', now)
  } catch {}

  // 제목 점수·SEO 점수·네이버 요약글·인스타 카드뉴스는 관리자 내부 참고용 —
  // 일반 방문자(비로그인) 응답에는 절대 포함하지 않는다.
  const stripAdminScores = (row) => {
    if (!row) return row
    const { title_score, seo_score, naver_summary, instagram_cards, ...rest } = row
    return rest
  }

  if (req.method === 'GET') {
    const { id, slug, category, limit = 20, offset = 0, q, post_type } = req.query
    if (id) {
      let query = supabase.from('blog_posts').select('*').eq('id', id)
      if (!isAdmin) query = query.eq('status', 'published')
      const { data, error } = await query.single()
      if (error || !data) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json(isAdmin ? data : stripAdminScores(data))
    }
    if (slug) {
      let query = supabase.from('blog_posts').select('*').eq('slug', slug)
      if (!isAdmin) query = query.eq('status', 'published')
      const { data, error } = await query.single()
      if (error || !data) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json(isAdmin ? data : stripAdminScores(data))
    }
    let query = supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    if (!isAdmin) query = query.eq('status', 'published')
    query = query.eq('post_type', post_type || 'blog')
    if (category) query = query.eq('category', category)
    if (q) {
      // 콤마·괄호는 Supabase or() 구문 파서를 깨뜨릴 수 있어 검색어에서 제거
      const safeQ = String(q).replace(/[(),]/g, ' ').trim()
      if (safeQ) query = query.or(`title.ilike.%${safeQ}%,content.ilike.%${safeQ}%`)
    }
    query = query.range(Number(offset), Number(offset) + Number(limit) - 1)
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    const rows = data || []
    return res.status(200).json(isAdmin ? rows : rows.map(stripAdminScores))
  }

  if (!isAdmin) return res.status(401).json({ error: '인증 필요' })

  if (req.method === 'POST') {
    const { title, slug, content, category, author, status = 'published', scheduled_at, summary, tags, cover_image, title_score, seo_score, naver_summary, instagram_cards } = req.body
    if (!title || !slug || !content) return res.status(400).json({ error: '필수 항목 누락' })
    const { data, error } = await supabase.from('blog_posts').insert([{
      id: genId(), title, slug, content, category: category || '',
      summary: summary || '', tags: Array.isArray(tags) ? tags : [], cover_image: cover_image || '',
      // ⚠️ blog_posts 테이블의 실제 컬럼명은 author가 아니라 author_name 이다.
      author_name: (author && String(author).trim()) || 'Fresh Season 편집팀',
      status, post_type: 'blog',
      scheduled_at: scheduled_at || null,
      published_at: status === 'published' ? nowKST() : null,
      // 제목 점수(10점 만점)·SEO 점수(100점 만점)·네이버 요약글·인스타 카드뉴스 —
      // 관리자만 보는 내부 참고용, 공개 API 응답에서는 stripAdminScores로 제외된다
      title_score: title_score ?? null,
      seo_score: seo_score ?? null,
      naver_summary: naver_summary ?? null,
      instagram_cards: instagram_cards ?? null,
      created_at: nowKST(),
    }]).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await syncRecipeRow(data)

    // Google Indexing API + IndexNow — 발행 즉시 색인 요청
    const indexStatus = { google: null, indexnow: null }

    if (status === 'published') {
      const pageUrl = `https://www.fsfood.kr/blog/${data.slug}`

      // 1) Google Indexing API
      try {
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
          throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 환경변수가 설정되어 있지 않습니다')
        }
        const { GoogleAuth } = require('google-auth-library')
        const auth = new GoogleAuth({
          credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
          scopes: ['https://www.googleapis.com/auth/indexing'],
        })
        const client = await auth.getClient()
        const res2 = await client.request({
          url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
          method: 'POST',
          data: { url: pageUrl, type: 'URL_UPDATED' },
        })
        indexStatus.google = { ok: true, status: res2.status }
        console.log('[Indexing API] 성공:', pageUrl, res2.status)
      } catch (e) {
        // googleapis 에러는 e.message에 실제 사유가 안 담기는 경우가 많아서
        // response.data까지 같이 꺼내서 진짜 원인을 노출시킨다.
        const detail = e?.response?.data || e?.message || String(e)
        indexStatus.google = { ok: false, error: detail }
        console.error('[Indexing API] 오류:', JSON.stringify(detail))
      }

      // 2) IndexNow — Bing·Naver·Yandex 색인 요청
      try {
        const INDEXNOW_KEY = process.env.INDEXNOW_KEY
        if (!INDEXNOW_KEY) throw new Error('INDEXNOW_KEY 환경변수가 설정되어 있지 않습니다')
        const r = await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            host: 'www.fsfood.kr',
            key: INDEXNOW_KEY,
            keyLocation: `https://www.fsfood.kr/${INDEXNOW_KEY}.txt`,
            urlList: [pageUrl],
          }),
        })
        indexStatus.indexnow = { ok: r.ok, status: r.status }
        if (!r.ok) console.error('[IndexNow] 오류 응답:', r.status, await r.text().catch(() => ''))
      } catch (e) {
        indexStatus.indexnow = { ok: false, error: e.message }
        console.error('[IndexNow] 오류:', e.message)
      }
    }

    // 관리자 화면에서 발행 직후 색인 요청 성공/실패를 바로 확인할 수 있도록 같이 내려준다.
    return res.status(200).json({ ...data, _indexStatus: indexStatus })
  }

  if (req.method === 'PUT') {
    const { id, ...updates } = req.body
    if (!id) return res.status(400).json({ error: 'id 필요' })
    const { data, error } = await supabase.from('blog_posts').update(updates).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await syncRecipeRow(data)
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id 필요' })
    await supabase.from('blog_posts').delete().eq('id', id)
    await supabase.from('recipes').delete().eq('id', id) // 연동된 지도관리 레시피도 같이 삭제
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
