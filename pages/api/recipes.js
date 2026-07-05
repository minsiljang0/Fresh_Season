import { supabase } from '../../lib/supabase'

export const RECIPE_CATEGORIES = ['밥', '죽', '면', '국', '탕', '찌개', '전골', '찜', '구이', '숙채', '생채', '회', '전', '장', '김치', '장아찌', '조림', '볶음', '한과', '떡', '음청류']

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { id, q, category, counts, limit = 30, offset = 0 } = req.query

  if (counts) {
    const { count: total } = await supabase.from('recipes').select('id', { count: 'exact', head: true })
    const byCategory = {}
    await Promise.all(RECIPE_CATEGORIES.map(async (c) => {
      const { count } = await supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('category', c)
      byCategory[c] = count || 0
    }))
    return res.status(200).json({ total: total || 0, byCategory })
  }

  if (id) {
    const { data, error } = await supabase
      .from('recipes')
      .select('*, dishes(id,name,category), tv_shows(id,name,broadcaster), chefs(id,name,role)')
      .eq('id', id)
      .single()
    if (error || !data) return res.status(404).json({ error: 'Not found' })

    const [{ data: ingredients }, { data: tools }, { data: steps }] = await Promise.all([
      supabase.from('recipe_ingredients').select('*, ingredients(id,name,category)').eq('recipe_id', id),
      supabase.from('recipe_tools').select('*').eq('recipe_id', id).order('name'),
      supabase.from('recipe_steps').select('*').eq('recipe_id', id).order('order_num'),
    ])

    return res.status(200).json({ ...data, ingredients: ingredients || [], tools: tools || [], steps: steps || [] })
  }

  let query = supabase
    .from('recipes')
    .select('id,title,summary,thumbnail,category,created_at, dishes(id,name,category)')
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)
  if (q) query = query.ilike('title', `%${q}%`)
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json(data || [])
}
