import { supabase, genId } from '../../../lib/supabase'

function nowKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
}

export default async function handler(req, res) {
  const isAdmin = req.headers['x-admin-token'] === process.env.ADMIN_SECRET_TOKEN

  // GET — 목록 조회 (인증 불필요)
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

  // POST — 등록
  if (req.method === 'POST') {
    const { ingredient, region, district, months, health, category, tv_programs } = req.body
    if (!ingredient || !region || !months?.length || !health) {
      return res.status(400).json({ error: '필수 필드 누락' })
    }
    const { data, error } = await supabase.from('seasonal_foods').insert([{
      id: genId(),
      ingredient,
      region,
      district: district || '',
      months,
      health,
      category: category || 'fish',
      tv_programs: tv_programs || [],
      created_at: nowKST(),
    }]).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  // PATCH — 수정
  if (req.method === 'PATCH') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id 필요' })
    const { ingredient, region, district, months, health, category, tv_programs } = req.body
    const { data, error } = await supabase.from('seasonal_foods')
      .update({ ingredient, region, district: district||'', months, health, category: category||'fish', tv_programs: tv_programs||[] })
      .eq('id', id)
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  // DELETE — 삭제
  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id 필요' })
    const { error } = await supabase.from('seasonal_foods').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
