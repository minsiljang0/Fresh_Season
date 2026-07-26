import { supabase } from '../../lib/supabase'

// /holiday-pharmacy 페이지가 지역별 공휴일 진료 약국 목록을 읽어가는 공개 API (인증 불필요, 읽기 전용)
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const { sido, q } = req.query
    let query = supabase
      .from('holiday_pharmacies')
      .select('id, name, sido, addr, tel, lat, lng, duty_time8_s, duty_time8_c, fetched_at')
      .order('name')
      .limit(200)

    if (sido) query = query.eq('sido', sido)
    if (q) query = query.or(`name.ilike.%${q}%,addr.ilike.%${q}%`)

    const { data, error } = await query
    if (error) throw error

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).json(data || [])
  } catch (e) {
    console.error('[holiday-pharmacy API]', e.message)
    return res.status(500).json({ error: e.message })
  }
}
