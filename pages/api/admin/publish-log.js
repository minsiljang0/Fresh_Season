import { supabase, genId } from '../../../lib/supabase'

export default async function handler(req, res) {
  const isAdmin = req.headers['x-admin-token'] === process.env.ADMIN_SECRET_TOKEN
  if (!isAdmin) return res.status(401).json({ error: '인증 필요' })

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('publish_log')
      .select('*').order('published_at', { ascending: false }).limit(50)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data || [])
  }

  if (req.method === 'POST') {
    const { title, slug, category, memo } = req.body
    const { error } = await supabase.from('publish_log').insert([{
      id: genId(), title, slug, category: category || '',
      memo: memo || '', published_at: new Date().toISOString(),
    }])
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
