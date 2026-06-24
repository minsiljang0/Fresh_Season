import { supabase, genId } from '../../../lib/supabase'

/** 현재 시각을 KST(UTC+9) 기준 ISO 문자열로 반환 */
function nowKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
}

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
      memo: memo || '', published_at: nowKST(),
    }])
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
