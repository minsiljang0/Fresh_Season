import { supabase } from '../../lib/supabase'

// /health-map 페이지가 부위별 영양소 목록을 읽어가는 공개 API (인증 불필요, 읽기 전용)
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const { data, error } = await supabase
      .from('health_map_nutrients')
      .select('id, zone_id, nutrient, sort_order')
      .order('zone_id')
      .order('sort_order')
    if (error) throw error

    const nutrients = {}
    ;(data || []).forEach(row => {
      if (!nutrients[row.zone_id]) nutrients[row.zone_id] = []
      if (!nutrients[row.zone_id].includes(row.nutrient)) nutrients[row.zone_id].push(row.nutrient)
    })

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).json({ nutrients })
  } catch (e) {
    console.error('[health-map API]', e.message)
    return res.status(500).json({ error: e.message })
  }
}
