import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    // 맵관리 ingredient_regions + ingredients + health_benefits 조인 — DB 단독
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
          is_superfood,
          is_global,
          gender,
          age_groups,
          limited_days,
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

    // DB 건강효능 목록 전체 (map.js 필터 버튼용)
    const { data: healthBenefits } = await supabase
      .from('health_benefits')
      .select('id, name, category, age_groups, gender')
      .order('category')
      .order('name')

    // 포맷 변환
    const foods = (managed || [])
      .filter(row => row.ingredients)
      .map(row => {
        const healthIds = (row.ingredients.ingredient_health || [])
          .map(ih => ih.health_benefits?.id)
          .filter(Boolean)

        return {
          ingredient:   row.ingredients.name,
          category:     row.ingredients.category || 'veg',
          region:       row.region,
          district:     row.district || '',
          months:       Array.isArray(row.months) ? row.months : [],
          health:       row.ingredients.description || '',
          healthIds,
          tvPrograms:   [],
          caution:      row.ingredients.caution || '',
          is_special:   row.ingredients.is_special || false,
          is_limited:   row.ingredients.is_limited || false,
          is_superfood: row.ingredients.is_superfood || false,
          is_global:    row.ingredients.is_global || false,
          gender:       row.ingredients.gender || 'all',
          age_groups:   row.ingredients.age_groups || [],
          limited_days: row.ingredients.limited_days || null,
          source:       'managed',
        }
      })

    return res.status(200).json({
      foods,
      healthBenefits: healthBenefits || [],
    })
  } catch (e) {
    console.error('seasonal-foods API error:', e)
    return res.status(500).json({ error: e.message })
  }
}
