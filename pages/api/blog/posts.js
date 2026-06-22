import { supabase, genId } from '../../../lib/supabase'

export default async function handler(req, res) {
  const isAdmin = req.headers['x-admin-token'] === process.env.ADMIN_SECRET_TOKEN

  // 예약 발행 자동 전환
  try {
    const now = new Date().toISOString()
    await supabase.from('blog_posts').update({ status: 'published', published_at: now })
      .eq('status', 'scheduled').lte('scheduled_at', now)
  } catch {}

  if (req.method === 'GET') {
    const { slug, category, limit = 20, offset = 0, q } = req.query
    if (slug) {
      let query = supabase.from('blog_posts').select('*').eq('slug', slug)
      if (!isAdmin) query = query.eq('status', 'published')
      const { data, error } = await query.single()
      if (error || !data) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json(data)
    }
    let query = supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    if (!isAdmin) query = query.eq('status', 'published')
    query = query.eq('post_type', 'blog')
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
      published_at: status === 'published' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
    }]).select().single()
    if (error) return res.status(500).json({ error: error.message })
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
