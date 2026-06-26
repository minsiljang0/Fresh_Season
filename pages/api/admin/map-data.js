import { supabase, genId } from '../../../lib/supabase'

function nowKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
}

export default async function handler(req, res) {
  const isAdmin = req.headers['x-admin-token'] === process.env.ADMIN_SECRET_TOKEN
  const { type } = req.query

  // ── GET ──────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      if (type === 'health_benefits') {
        const { data, error } = await supabase.from('health_benefits').select('*').order('category').order('name')
        if (error) throw error
        return res.status(200).json(data || [])
      }
      if (type === 'tv_shows') {
        const { data, error } = await supabase.from('tv_shows').select('*').order('name')
        if (error) throw error
        return res.status(200).json(data || [])
      }
      if (type === 'chefs') {
        const { data, error } = await supabase.from('chefs').select('*').order('name')
        if (error) throw error
        return res.status(200).json(data || [])
      }
      if (type === 'show_chefs') {
        const { show_id } = req.query
        let q = supabase.from('show_chefs').select('*, chefs(id,name,role,specialty)')
        if (show_id) q = q.eq('show_id', show_id)
        const { data, error } = await q
        if (error) throw error
        return res.status(200).json(data || [])
      }
      if (type === 'ingredients') {
        const { data, error } = await supabase.from('ingredients').select('*').order('name')
        if (error) throw error
        return res.status(200).json(data || [])
      }
      if (type === 'show_ingredients') {
        const { show_id } = req.query
        let q = supabase.from('show_ingredients').select('*, ingredients(id,name,category)')
        if (show_id) q = q.eq('show_id', show_id)
        const { data, error } = await q
        if (error) throw error
        return res.status(200).json(data || [])
      }
      if (type === 'ingredient_health') {
        const { ingredient_id, health_id } = req.query
        let q = supabase.from('ingredient_health').select('*, health_benefits(id,name,category)')
        if (ingredient_id) q = q.eq('ingredient_id', ingredient_id)
        if (health_id) q = q.eq('health_id', health_id)
        const { data, error } = await q
        if (error) throw error
        return res.status(200).json(data || [])
      }
      if (type === 'ingredient_regions') {
        const { ingredient_id } = req.query
        let q = supabase.from('ingredient_regions').select('*')
        if (ingredient_id) q = q.eq('ingredient_id', ingredient_id)
        const { data, error } = await q
        if (error) throw error
        return res.status(200).json(data || [])
      }
      if (type === 'dishes') {
        const { data, error } = await supabase.from('dishes').select('*').order('name')
        if (error) throw error
        return res.status(200).json(data || [])
      }
      if (type === 'dish_ingredients') {
        const { dish_id } = req.query
        let q = supabase.from('dish_ingredients').select('*, ingredients(id,name,category)')
        if (dish_id) q = q.eq('dish_id', dish_id)
        const { data, error } = await q
        if (error) throw error
        return res.status(200).json(data || [])
      }
      if (type === 'recipes') {
        const q = req.query.q || ''
        let query = supabase.from('recipes')
          .select('*, dishes(id,name), tv_shows(id,name,broadcaster), chefs(id,name)')
          .order('created_at', { ascending: false })
          .limit(50)
        if (q) query = query.ilike('title', `%${q}%`)
        const { data, error } = await query
        if (error) throw error
        return res.status(200).json(data || [])
      }
      if (type === 'recipe_ingredients') {
        const { recipe_id } = req.query
        let q = supabase.from('recipe_ingredients').select('*, ingredients(id,name,category)')
        if (recipe_id) q = q.eq('recipe_id', recipe_id)
        const { data, error } = await q
        if (error) throw error
        return res.status(200).json(data || [])
      }
      // 기존 tv_recipes
      if (type === 'tv_recipes') {
        const { q } = req.query
        let query = supabase.from('tv_recipes').select('*').order('created_at', { ascending: false }).limit(50)
        if (q) query = query.ilike('title', `%${q}%`)
        const { data, error } = await query
        if (error) throw error
        return res.status(200).json(data || [])
      }
      return res.status(400).json({ error: 'type 파라미터 필요' })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  if (!isAdmin) return res.status(401).json({ error: '인증 필요' })

  // ── POST ─────────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body
    try {
      if (type === 'health_benefits') {
        const { data, error } = await supabase.from('health_benefits')
          .insert([{ id: genId(), name: body.name, description: body.description || '', category: body.category || '', coupang_url: body.coupang_url || '', age_groups: body.age_groups || [], caution: body.caution || '' }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      if (type === 'tv_shows') {
        const { data, error } = await supabase.from('tv_shows')
          .insert([{ id: genId(), name: body.name, broadcaster: body.broadcaster || '', category: body.category || '', description: body.description || '' }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      if (type === 'chefs') {
        const { data, error } = await supabase.from('chefs')
          .insert([{ id: genId(), name: body.name, role: body.role || '', specialty: body.specialty || '', description: body.description || '' }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      if (type === 'show_chefs') {
        const { data, error } = await supabase.from('show_chefs')
          .insert([{ id: genId(), show_id: body.show_id, chef_id: body.chef_id, role: body.role || '' }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      if (type === 'ingredients') {
        const { data, error } = await supabase.from('ingredients')
          .insert([{ id: genId(), name: body.name, category: body.category || 'veg', description: body.description || '' }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      if (type === 'show_ingredients') {
        const { show_id } = req.query
        let q = supabase.from('show_ingredients').select('*, ingredients(id,name,category)')
        if (show_id) q = q.eq('show_id', show_id)
        const { data, error } = await q
        if (error) throw error
        return res.status(200).json(data || [])
      }
      if (type === 'show_ingredients') {
        const { data, error } = await supabase.from('show_ingredients')
          .insert([{ id: genId(), show_id: body.show_id, ingredient_id: body.ingredient_id }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      if (type === 'ingredient_health') {
        const { data, error } = await supabase.from('ingredient_health')
          .insert([{ id: genId(), ingredient_id: body.ingredient_id, health_id: body.health_id, memo: body.memo || '' }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      if (type === 'ingredient_regions') {
        const { data, error } = await supabase.from('ingredient_regions')
          .insert([{ id: genId(), ingredient_id: body.ingredient_id, region: body.region, district: body.district || '', months: body.months || [] }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      if (type === 'dishes') {
        const { data, error } = await supabase.from('dishes')
          .insert([{ id: genId(), name: body.name, category: body.category || '', description: body.description || '' }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      if (type === 'dish_ingredients') {
        const { data, error } = await supabase.from('dish_ingredients')
          .insert([{ id: genId(), dish_id: body.dish_id, ingredient_id: body.ingredient_id, amount: body.amount || '', unit_per: body.unit_per || 1, memo: body.memo || '' }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      if (type === 'recipes') {
        const { data, error } = await supabase.from('recipes')
          .insert([{ id: genId(), dish_id: body.dish_id || null, show_id: body.show_id || null, chef_id: body.chef_id || null, episode: body.episode || '', aired_at: body.aired_at || null, title: body.title || '', summary: body.summary || '', source_url: body.source_url || '' }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      if (type === 'recipe_ingredients') {
        const { data, error } = await supabase.from('recipe_ingredients')
          .insert([{ id: genId(), recipe_id: body.recipe_id, ingredient_id: body.ingredient_id, amount: body.amount || '', unit_per: body.unit_per || 1, memo: body.memo || '' }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      // 기존 tv_recipes
      if (type === 'tv_recipes') {
        const recipeId = genId()
        const { error } = await supabase.from('tv_recipes')
          .insert([{ id: recipeId, ingredient: body.ingredient, program: body.program, episode: body.episode || '', title: body.title, summary: body.summary || '', source_url: body.source_url || null, created_at: nowKST() }])
        if (error) throw error
        await supabase.from('recipe_ingredient_map').insert([{ id: genId(), recipe_id: recipeId, ingredient: body.ingredient, created_at: nowKST() }])
        return res.status(200).json({ ok: true, id: recipeId })
      }
      return res.status(400).json({ error: 'type 파라미터 필요' })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ── PATCH ────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    const { id } = req.query
    const body = req.body
    try {
      const TABLE_MAP = {
        health_benefits: 'health_benefits',
        tv_shows: 'tv_shows',
        chefs: 'chefs',
        ingredients: 'ingredients',
        dishes: 'dishes',
        recipes: 'recipes',
      }
      const table = TABLE_MAP[type]
      if (!table) return res.status(400).json({ error: '수정 불가 type' })
      const { data, error } = await supabase.from(table).update(body).eq('id', id).select().single()
      if (error) throw error
      return res.status(200).json(data)
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ── DELETE ───────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query
    try {
      const TABLE_MAP = {
        health_benefits: 'health_benefits',
        tv_shows: 'tv_shows',
        chefs: 'chefs',
        show_chefs: 'show_chefs',
        ingredients: 'ingredients',
        show_ingredients: 'show_ingredients',
        ingredient_health: 'ingredient_health',
        ingredient_regions: 'ingredient_regions',
        dishes: 'dishes',
        dish_ingredients: 'dish_ingredients',
        recipes: 'recipes',
        recipe_ingredients: 'recipe_ingredients',
        tv_recipes: 'tv_recipes',
      }
      const table = TABLE_MAP[type]
      if (!table) return res.status(400).json({ error: '삭제 불가 type' })
      if (type === 'tv_recipes') {
        await supabase.from('recipe_ingredient_map').delete().eq('recipe_id', id)
      }
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      return res.status(200).json({ ok: true })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  res.status(405).end()
}
