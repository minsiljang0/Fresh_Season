import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { id, q, limit = 30, offset = 0 } = req.query

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
    .select('id,title,summary,thumbnail,created_at, dishes(id,name,category)')
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)
  if (q) query = query.ilike('title', `%${q}%`)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json(data || [])
}
