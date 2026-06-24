import { supabase, genId } from '../../../lib/supabase'

/** 현재 시각을 KST(UTC+9) 기준 ISO 문자열로 반환 */
function nowKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
}

export default async function handler(req, res) {
  const isAdmin = req.headers['x-admin-token'] === process.env.ADMIN_SECRET_TOKEN

  if (req.method === 'GET') {
    const { ingredient, program } = req.query
    let query = supabase.from('tv_recipes').select('*').order('created_at', { ascending: false })
    if (ingredient) query = query.ilike('ingredient', `%${ingredient}%`)
    if (program) query = query.ilike('program', `%${program}%`)
    const { data, error } = await query.limit(50)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data || [])
  }

  if (!isAdmin) return res.status(401).json({ error: '인증 필요' })

  if (req.method === 'POST') {
    const { ingredient, program, episode, title, summary, source_url } = req.body
    const recipeId = genId()
    const { error: e1 } = await supabase.from('tv_recipes').insert([{
      id: recipeId, ingredient, program, episode: episode || '',
      title, summary: summary || '', source_url: source_url || null,
      created_at: nowKST(),
    }])
    if (e1) return res.status(500).json({ error: e1.message })
    // 매핑 저장
    await supabase.from('recipe_ingredient_map').insert([{
      id: genId(), recipe_id: recipeId, ingredient,
      created_at: nowKST(),
    }])
    return res.status(200).json({ ok: true, id: recipeId })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    await supabase.from('recipe_ingredient_map').delete().eq('recipe_id', id)
    await supabase.from('tv_recipes').delete().eq('id', id)
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
