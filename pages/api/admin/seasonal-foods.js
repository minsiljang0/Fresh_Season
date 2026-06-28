import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function auth(req) {
  const token = req.headers['x-admin-token']
  return token && token === process.env.ADMIN_SECRET_TOKEN
}

export default async function handler(req, res) {
  if (!auth(req)) return res.status(401).json({ error: '인증 필요' })

  // 월별 저장된 식재료 ID 조회
  if (req.method === 'GET' && req.query.saved) {
    const month = parseInt(req.query.month)
    if (!month) return res.status(400).json({ error: 'month 필수' })
    const { data } = await supabase
      .from('monthly_ingredients')
      .select('ingredient_id')
      .eq('month', month)
    return res.json({ ids: (data||[]).map(r=>r.ingredient_id) })
  }

  // 식재료 불러오기 (기존)
  if (req.method === 'GET') {
    const month = parseInt(req.query.month)
    if (!month || month < 1 || month > 12) return res.status(400).json({ error: 'month 필수 (1~12)' })

    const { data: ings, error: e1 } = await supabase
      .from('ingredients')
      .select(`
        id, name, category, description, months, season_start, season_end,
        is_special, is_limited, is_global, is_superfood, is_brand, limited_days,
        age_groups, gender, caution, coupang_url,
        season_badge, jeolgi_badge, special_badge, habitat_badge, farming_badge,
        ingredient_health ( health_benefits ( id, name, category ) )
      `)
      .contains('months', [month])
      .order('name', { ascending: true })

    if (e1) return res.status(500).json({ error: e1.message })

    const ingIds = (ings || []).map(i => i.id)
    const { data: regions } = await supabase
      .from('ingredient_regions')
      .select('ingredient_id, region, district, months')
      .in('ingredient_id', ingIds)

    const regionMap = {}
    for (const r of regions || []) {
      if (!regionMap[r.ingredient_id]) regionMap[r.ingredient_id] = []
      regionMap[r.ingredient_id].push(r)
    }

    const REGION_LABELS = {
      seoul:'서울', busan:'부산', daegu:'대구', incheon:'인천', gwangju:'광주',
      daejeon:'대전', ulsan:'울산', sejong:'세종', gyeonggi:'경기', gangwon:'강원',
      chungbuk:'충북', chungnam:'충남', jeonbuk:'전북', jeonnam:'전남',
      gyeongbuk:'경북', gyeongnam:'경남', jeju:'제주', '해외':'해외',
    }

    const result = (ings || []).map(i => {
      const regs = regionMap[i.id] || []
      const regions_preview = [...new Set(regs.map(r => REGION_LABELS[r.region] || r.region))]
      const health_benefits = (i.ingredient_health || []).map(ih => ih.health_benefits).filter(Boolean)
      return { ...i, ingredient_health: undefined, health_benefits, regions: regs, regions_preview }
    })

    return res.json({ ingredients: result })
  }

  // 해당 월에 식재료 저장
  if (req.method === 'POST') {
    const { month, ingredient_ids } = req.body
    if (!month || !ingredient_ids?.length) return res.status(400).json({ error: 'month, ingredient_ids 필수' })
    const rows = ingredient_ids.map(id => ({
      id: `${month}_${id}`,
      month,
      ingredient_id: id,
    }))
    const { error } = await supabase
      .from('monthly_ingredients')
      .upsert(rows, { onConflict: 'id' })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true })
  }

  // 해당 월 식재료 삭제
  if (req.method === 'DELETE') {
    const { month, ingredient_id } = req.body
    await supabase.from('monthly_ingredients').delete().eq('month', month).eq('ingredient_id', ingredient_id)
    return res.json({ ok: true })
  }

  return res.status(405).end()
}
