import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const { data, error } = await supabase
      .from('seasonal_foods')
      .select('*')
      .order('region')

    if (error) throw error

    // map.js가 기대하는 형식으로 변환
    // seasonal_foods: { ingredient, region, district, months, health }
    // → seasonalFoods.js 시드와 동일한 구조로
    const formatted = (data || []).map(row => ({
      ingredient: row.ingredient,
      category:   row.category || 'veg',   // seasonal_foods에 category 없으면 기본값
      region:     row.region,
      district:   row.district || '',
      months:     Array.isArray(row.months) ? row.months : [],
      health:     row.health || '',
      tvPrograms: row.tv_programs || [],
      caution:    row.caution || '',
      source:     'db',
    }))

    return res.status(200).json(formatted)
  } catch (e) {
    console.error('seasonal-foods API error:', e)
    return res.status(500).json({ error: e.message })
  }
}
