import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    // ── 3개 쿼리 병렬 실행 (기존 3번 API 호출 → 1번으로 통합) ──
    const [regionsRes, healthRes, tvRes] = await Promise.all([
      supabase
        .from('ingredient_regions')
        .select(`
          id, region, district, months,
          ingredients (
            id, name, category, description, caution,
            is_special, is_limited, is_superfood, is_global, is_brand,
            season_badge, jeolgi_badge, special_badge, habitat_badge, farming_badge,
            gender, age_groups, limited_days,
            coupang_url, coupang_banner_html,
            ingredient_health ( health_benefits ( id, name, category ) )
          )
        `)
        .order('region'),
      supabase
        .from('health_benefits')
        .select('id, name, category, age_groups, gender')
        .order('category').order('name'),
      supabase
        .from('tv_shows')
        .select('id, name')
        .order('name'),
    ])

    if (regionsRes.error) throw regionsRes.error

    const foods = (regionsRes.data || [])
      .filter(row => row.ingredients)
      .map(row => {
        const healthIds = (row.ingredients.ingredient_health || [])
          .map(ih => ih.health_benefits?.id).filter(Boolean)
        const healthBenefitsList = (row.ingredients.ingredient_health || [])
          .map(ih => ih.health_benefits).filter(Boolean)
        return {
          id:            row.ingredients.id,
          ingredient:    row.ingredients.name,
          category:      row.ingredients.category || 'veg',
          region:        row.region,
          district:      row.district || '',
          months:        Array.isArray(row.months) ? row.months : [],
          health:        row.ingredients.description || '',
          healthIds,
          healthBenefits: healthBenefitsList,
          tvPrograms:    [],
          caution:       row.ingredients.caution || '',
          is_special:    row.ingredients.is_special || false,
          is_limited:    row.ingredients.is_limited || false,
          is_superfood:  row.ingredients.is_superfood || false,
          is_global:     row.ingredients.is_global || false,
          is_brand:      row.ingredients.is_brand || false,
          season_badge:  row.ingredients.season_badge || [],
          jeolgi_badge:  row.ingredients.jeolgi_badge || [],
          special_badge: row.ingredients.special_badge || [],
          habitat_badge: row.ingredients.habitat_badge || [],
          farming_badge: row.ingredients.farming_badge || [],
          gender:        row.ingredients.gender || 'all',
          age_groups:    row.ingredients.age_groups || [],
          limited_days:  row.ingredients.limited_days || null,
          coupang_url:         row.ingredients.coupang_url || '',
          coupang_banner_html: row.ingredients.coupang_banner_html || '',
          source:        'managed',
        }
      })

    // Vercel Edge 캐시 60초 + stale-while-revalidate 300초
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')

    return res.status(200).json({
      foods,
      healthBenefits: healthRes.data || [],
      tvShows:        tvRes.data   || [],   // ← tv_shows도 함께 반환 (API 호출 절약)
    })
  } catch (e) {
    console.error('seasonal-foods API error:', e)
    return res.status(500).json({ error: e.message })
  }
}
