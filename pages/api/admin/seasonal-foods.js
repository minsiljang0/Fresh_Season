import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function auth(req) {
  const token = req.headers['x-admin-token']
  return token && token === process.env.ADMIN_TOKEN
}

export default async function handler(req, res) {
  if (!auth(req)) return res.status(401).json({ error: '인증 필요' })
  if (req.method !== 'GET') return res.status(405).end()

  const month = parseInt(req.query.month)
  if (!month || month < 1 || month > 12) return res.status(400).json({ error: 'month 필수 (1~12)' })

  // 해당 월 제철 식재료 + 건강효능 + 산지 조인
  const { data, error } = await supabase.rpc('get_seasonal_ingredients_for_month', { p_month: month })

  if (error) {
    // RPC 없으면 직접 쿼리
    const { data: raw, error: e2 } = await supabase
      .from('ingredient_regions')
      .select(`
        region, district, months,
        ingredients!inner (
          id, name, category, description, months,
          ingredient_health ( health_benefits ( name ) )
        )
      `)
      .contains('months', [month])
    if (e2) return res.status(500).json({ error: e2.message })

    // 식재료별로 합치기
    const map = {}
    for (const row of raw || []) {
      const i = row.ingredients
      if (!map[i.id]) {
        map[i.id] = {
          id: i.id,
          name: i.name,
          category: i.category,
          description: i.description,
          months: i.months,
          regions: [],
          benefits: [],
        }
      }
      if (row.region && !map[i.id].regions.includes(row.region)) {
        map[i.id].regions.push(row.region)
      }
      for (const ih of i.ingredient_health || []) {
        const bn = ih.health_benefits?.name
        if (bn && !map[i.id].benefits.includes(bn)) map[i.id].benefits.push(bn)
      }
    }
    return res.json({ ingredients: Object.values(map).sort((a,b) => a.name.localeCompare(b.name)) })
  }

  return res.json({ ingredients: data || [] })
}
