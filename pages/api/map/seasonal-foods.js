import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    // ① 기존 seasonal_foods 테이블 (레거시 데이터)
    const { data: legacy } = await supabase
      .from('seasonal_foods')
      .select('*')
      .order('region')

    // ② 맵관리에서 관리하는 ingredient_regions + ingredients 조인
    const { data: managed, error } = await supabase
      .from('ingredient_regions')
      .select(`
        id,
        region,
        district,
        months,
        ingredients (
          id,
          name,
          category,
          description,
          caution
        )
      `)
      .order('region')

    if (error) throw error

    // 레거시 데이터 포맷
    const legacyFormatted = (legacy || []).map(row => ({
      ingredient: row.ingredient,
      category:   row.category || 'veg',
      region:     row.region,
      district:   row.district || '',
      months:     Array.isArray(row.months) ? row.months : [],
      health:     row.health || '',
      tvPrograms: row.tv_programs || [],
      caution:    row.caution || '',
      source:     'legacy',
    }))

    // 맵관리 데이터 포맷 (ingredient_regions + ingredients)
    const managedFormatted = (managed || [])
      .filter(row => row.ingredients)  // 식재료 연결된 것만
      .map(row => ({
        ingredient: row.ingredients.name,
        category:   row.ingredients.category || 'veg',
        region:     row.region,
        district:   row.district || '',
        months:     Array.isArray(row.months) ? row.months : [],
        health:     row.ingredients.description || '',
        tvPrograms: [],
        caution:    row.ingredients.caution || '',
        source:     'managed',
      }))

    // 맵관리 데이터 우선 — 레거시 중 맵관리에 없는 것만 보완
    const managedKeys = new Set(
      managedFormatted.map(r => `${r.ingredient}::${r.region}::${r.district}`)
    )
    const filteredLegacy = legacyFormatted.filter(
      r => !managedKeys.has(`${r.ingredient}::${r.region}::${r.district}`)
    )

    return res.status(200).json([...managedFormatted, ...filteredLegacy])
  } catch (e) {
    console.error('seasonal-foods API error:', e)
    return res.status(500).json({ error: e.message })
  }
}
