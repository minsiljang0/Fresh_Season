import { supabase, genId } from '../../../lib/supabase'

/** 현재 시각을 KST(UTC+9) 기준 ISO 문자열로 반환 */
function nowKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
}

export default async function handler(req, res) {
  const isAdmin = req.headers['x-admin-token'] === process.env.ADMIN_SECRET_TOKEN

  // 예약 발행 자동 전환
  try {
    const now = nowKST()
    await supabase.from('blog_posts').update({ status: 'published', published_at: now })
      .eq('status', 'scheduled').lte('scheduled_at', now)
  } catch {}

  if (req.method === 'GET') {
    const { slug, category, limit = 20, offset = 0, q, post_type } = req.query
    if (slug) {
      let query = supabase.from('blog_posts').select('*').eq('slug', slug)
      if (!isAdmin) query = query.eq('status', 'published')
      const { data, error } = await query.single()
      if (error || !data) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json(data)
    }
    let query = supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    if (!isAdmin) query = query.eq('status', 'published')
    query = query.eq('post_type', post_type || 'blog')
    if (category) query = query.eq('category', category)
    if (q) query = query.ilike('title', `%${q}%`)
    query = query.range(Number(offset), Number(offset) + Number(limit) - 1)
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data || [])
  }

  if (!isAdmin) return res.status(401).json({ error: '인증 필요' })

  if (req.method === 'POST') {
    const { title, slug, content, category, status = 'published', scheduled_at } = req.body
    if (!title || !slug || !content) return res.status(400).json({ error: '필수 항목 누락' })
    const { data, error } = await supabase.from('blog_posts').insert([{
      id: genId(), title, slug, content, category: category || '',
      status, post_type: 'blog',
      scheduled_at: scheduled_at || null,
      published_at: status === 'published' ? nowKST() : null,
      created_at: nowKST(),
    }]).select().single()
    if (error) return res.status(500).json({ error: error.message })

    // Google Indexing API + IndexNow — 발행 즉시 색인 요청
    if (status === 'published') {
      const pageUrl = `https://www.fsfood.kr/blog/${data.slug}`

      // 1) Google Indexing API
      try {
        const { GoogleAuth } = require('google-auth-library')
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
      } catch (e) {
        console.error('[Indexing API] 오류:', e.message)
      }

      // 2) IndexNow — Bing·Naver·Yandex 색인 요청
      try {
        const INDEXNOW_KEY = process.env.INDEXNOW_KEY
        await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            host: 'www.fsfood.kr',
            key: INDEXNOW_KEY,
            keyLocation: `https://www.fsfood.kr/${INDEXNOW_KEY}.txt`,
            urlList: [pageUrl],
          }),
        })
      } catch (e) {
        console.error('[IndexNow] 오류:', e.message)
      }
    }

    return res.status(200).json(data)
  }

  if (req.method === 'PUT') {
    const { id, ...updates } = req.body
    if (!id) return res.status(400).json({ error: 'id 필요' })
    const { data, error } = await supabase.from('blog_posts').update(updates).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id 필요' })
    await supabase.from('blog_posts').delete().eq('id', id)
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
