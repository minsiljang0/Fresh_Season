import { supabase, genId } from '../../../lib/supabase'

export default async function handler(req, res) {
  const isAdmin = req.headers['x-admin-token'] === process.env.ADMIN_SECRET_TOKEN

  if (req.method === 'GET') {
    const { region, month } = req.query
    let query = supabase.from('seasonal_foods').select('*')
    if (region) query = query.eq('region', region)
    if (month) query = query.contains('months', [Number(month)])
    const { data, error } = await query.order('ingredient')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data || [])
  }

  if (!isAdmin) return res.status(401).json({ error: '인증 필요' })

  if (req.method === 'POST') {
    const { ingredient, region, months, health } = req.body
    const { data, error } = await supabase.from('seasonal_foods').insert([{
      id: genId(), ingredient, region, months, health,
      created_at: new Date().toISOString(),
    }]).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    await supabase.from('seasonal_foods').delete().eq('id', id)
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
