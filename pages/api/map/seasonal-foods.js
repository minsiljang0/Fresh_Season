import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    // ① 기존 seasonal_foods 테이블 (레거시 데이터)
    const { data: legacy } = await supabase
      .from('seasonal_foods')
      .select('*')
      .order('region')

    // ② 맵관리 ingredient_regions + ingredients + health_benefits 조인
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
          caution,
          is_special,
          is_limited,
          limited_start,
          limited_end,
          ingredient_health (
            health_benefits (
              id,
              name,
              category
            )
          )
        )
      `)
      .order('region')

    if (error) throw error

    // ③ DB 건강효능 목록 전체 (map.js에서 필터 버튼 생성용)
    const { data: healthBenefits } = await supabase
      .from('health_benefits')
      .select('id, name, category')
      .order('category')
      .order('name')

    // 레거시 데이터 포맷
    const legacyFormatted = (legacy || []).map(row => ({
      ingredient: row.ingredient,
      category:   row.category || 'veg',
      region:     row.region,
      district:   row.district || '',
      months:     Array.isArray(row.months) ? row.months : [],
      health:     row.health || '',
      healthIds:  [],   // 레거시는 연결 ID 없음
      tvPrograms: row.tv_programs || [],
      caution:    row.caution || '',
      source:     'legacy',
    }))

    // 맵관리 데이터 포맷 — healthIds 포함
    const managedFormatted = (managed || [])
      .filter(row => row.ingredients)
      .map(row => {
        // ingredient_health → health_benefits 에서 id 배열 추출
        const healthIds = (row.ingredients.ingredient_health || [])
          .map(ih => ih.health_benefits?.id)
          .filter(Boolean)

        return {
          ingredient:    row.ingredients.name,
          category:      row.ingredients.category || 'veg',
          region:        row.region,
          district:      row.district || '',
          months:        Array.isArray(row.months) ? row.months : [],
          health:        row.ingredients.description || '',
          healthIds,
          tvPrograms:    [],
          caution:       row.ingredients.caution || '',
          is_special:    row.ingredients.is_special || false,
          is_limited:    row.ingredients.is_limited || false,
          limited_start: row.ingredients.limited_start || null,
          limited_end:   row.ingredients.limited_end || null,
          source:        'managed',
        }
      })

    // 맵관리 데이터 우선 — 레거시 중 중복 제거
    const managedKeys = new Set(
      managedFormatted.map(r => `${r.ingredient}::${r.region}::${r.district}`)
    )
    const filteredLegacy = legacyFormatted.filter(
      r => !managedKeys.has(`${r.ingredient}::${r.region}::${r.district}`)
    )

    return res.status(200).json({
      foods: [...managedFormatted, ...filteredLegacy],
      healthBenefits: healthBenefits || [],
    })
  } catch (e) {
    console.error('seasonal-foods API error:', e)
    return res.status(500).json({ error: e.message })
  }
}
