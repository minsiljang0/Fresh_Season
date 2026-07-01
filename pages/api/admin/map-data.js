import { supabase, genId } from '../../../lib/supabase'

function nowKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
}

// 한글 제목도 대응하는 간단 슬러그 생성 (BlogAdminPanel.js의 slugify와 동일 로직)
function slugifyTitle(text) {
  if (!text) return 'recipe'
  let r = text.trim().toLowerCase()
  if (/[가-힣]/.test(r)) {
    const eng = r.match(/[a-z0-9]+/g)
    return (eng && eng.join('').length >= 2) ? eng.join('-') : 'recipe-' + Date.now().toString(36)
  }
  return r.replace(/[^a-z0-9-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'recipe-' + Date.now().toString(36)
}

// 지도관리(MapAdminPanel)에서 레시피를 등록/수정/삭제하면 블로그(레시피 카테고리)에도 자동 반영한다.
// id를 공유해서 연동하며, 이미 연동된 블로그 글이 있으면 제목·요약만 갱신하고 본문은 블로그 쪽 편집을 건드리지 않는다.
async function syncBlogFromRecipe(recipe) {
  if (!recipe) return
  try {
    const { data: existing } = await supabase.from('blog_posts').select('id').eq('id', recipe.id).maybeSingle()
    if (existing) {
      await supabase.from('blog_posts').update({ title: recipe.title, summary: recipe.summary || '' }).eq('id', recipe.id)
    } else {
      const slug = `${slugifyTitle(recipe.title)}-${String(recipe.id).slice(-6)}`
      await supabase.from('blog_posts').insert([{
        id: recipe.id, title: recipe.title, slug, content: recipe.summary || '', category: '레시피',
        summary: recipe.summary || '', tags: [], cover_image: recipe.thumbnail || '',
        author_name: 'Fresh Season 편집팀', status: 'published', post_type: 'blog',
        published_at: nowKST(), created_at: nowKST(),
      }])
    }
  } catch (e) {
    console.error('[블로그 동기화] 오류:', e.message)
  }
}

export default async function handler(req, res) {
  const isAdmin = req.headers['x-admin-token'] === process.env.ADMIN_SECRET_TOKEN
  const { type } = req.query

  // ── GET ──────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      if (type === 'health_benefits') {
        const { data, error } = await supabase.from('health_benefits').select('*, ingredients:ingredient_health(id)').order('category').order('name')
        if (error) throw error
        return res.status(200).json(data || [])
      }
      if (type === 'tv_shows') {
        const { data, error } = await supabase.from('tv_shows').select('*').order('name')
        if (error) throw error
        return res.status(200).json(data || [])
      }
      if (type === 'tv_episodes') {
        const { show_id } = req.query
        let q = supabase.from('tv_episodes').select('*')
        if (show_id) q = q.eq('show_id', show_id)
        q = q.order('aired_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
        const { data, error } = await q
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
        const { data, error } = await supabase.from('ingredients').select('*, health_benefits:ingredient_health(id)').order('name')
        if (error) throw error
        return res.status(200).json(data || [])
      }
      if (type === 'health_tv_shows') {
        const { health_id } = req.query
        let q = supabase.from('health_tv_shows').select('*, tv_shows(id,name,broadcaster,category)')
        if (health_id) q = q.eq('health_id', health_id)
        const { data, error } = await q
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
        let q = supabase.from('ingredient_health').select('*, ingredients(id,name,category), health_benefits(id,name,category)')
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
      if (type === 'utensils') {
        const { data, error } = await supabase.from('utensils').select('*').order('name')
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
      if (type === 'recipe_tools') {
        const { recipe_id } = req.query
        let q = supabase.from('recipe_tools').select('*').order('name')
        if (recipe_id) q = q.eq('recipe_id', recipe_id)
        const { data, error } = await q
        if (error) throw error
        return res.status(200).json(data || [])
      }
      if (type === 'recipe_steps') {
        const { recipe_id } = req.query
        let q = supabase.from('recipe_steps').select('*').order('order_num')
        if (recipe_id) q = q.eq('recipe_id', recipe_id)
        const { data, error } = await q
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
          .insert([{ id: genId(), name: body.name, description: body.description || '', category: body.category || '', coupang_url: body.coupang_url || '', age_groups: body.age_groups || [], gender: body.gender || 'all', caution: body.caution || '' }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      if (type === 'tv_shows') {
        const { data, error } = await supabase.from('tv_shows')
          .insert([{ id: genId(), name: body.name, broadcaster: body.broadcaster || '', category: body.category || '', description: body.description || '', started_at: body.started_at || null, ended_at: body.ended_at || null, air_days: body.air_days || [] }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      if (type === 'tv_episodes') {
        if (!body.show_id) throw new Error('show_id 필요')
        const { data, error } = await supabase.from('tv_episodes')
          .insert([{ id: genId(), show_id: body.show_id, aired_at: body.aired_at || null, episode: body.episode || '', summary: body.summary || '' }])
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
          .insert([{ id: genId(), name: body.name, category: body.category || 'veg', description: body.description || '', coupang_url: body.coupang_url || '', caution: body.caution || '', is_special: body.is_special || false, is_limited: body.is_limited || false, limited_days: body.limited_days || null, is_global: body.is_global || false }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      if (type === 'health_tv_shows') {
        const { data, error } = await supabase.from('health_tv_shows')
          .insert([{ id: genId(), health_id: body.health_id, show_id: body.show_id }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
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
          .insert([{ id: genId(), ingredient_id: body.ingredient_id, region: body.region, district: body.district || '', months: body.months || [], label: body.label || '' }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      if (type === 'utensils') {
        const { data, error } = await supabase.from('utensils')
          .insert([{ id: genId(), name: body.name, category: body.category || '', cuisine: body.cuisine || '', usage: body.usage || '', description: body.description || '', coupang_url: body.coupang_url || '' }])
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
        await syncBlogFromRecipe(data)
        return res.status(200).json(data)
      }
      if (type === 'recipe_ingredients') {
        const { data, error } = await supabase.from('recipe_ingredients')
          .insert([{ id: genId(), recipe_id: body.recipe_id, ingredient_id: body.ingredient_id, amount: body.amount || '', unit_per: body.unit_per || 1, memo: body.memo || '' }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      if (type === 'recipe_tools') {
        const { data, error } = await supabase.from('recipe_tools')
          .insert([{ id: genId(), recipe_id: body.recipe_id, name: body.name }])
          .select().single()
        if (error) throw error
        return res.status(200).json(data)
      }
      if (type === 'recipe_steps') {
        const { data, error } = await supabase.from('recipe_steps')
          .insert([{ id: genId(), recipe_id: body.recipe_id, order_num: body.order_num || 1, description: body.description || '', photo_url: body.photo_url || '' }])
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
        tv_episodes: 'tv_episodes',
        chefs: 'chefs',
        ingredients: 'ingredients',
        dishes: 'dishes',
        utensils: 'utensils',
        recipes: 'recipes',
      }
      const table = TABLE_MAP[type]
      if (!table) return res.status(400).json({ error: '수정 불가 type' })
      const { data, error } = await supabase.from(table).update(body).eq('id', id).select().single()
      if (error) throw error
      if (type === 'recipes') await syncBlogFromRecipe(data)
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
        tv_episodes: 'tv_episodes',
        chefs: 'chefs',
        show_chefs: 'show_chefs',
        ingredients: 'ingredients',
        health_tv_shows: 'health_tv_shows',
        show_ingredients: 'show_ingredients',
        ingredient_health: 'ingredient_health',
        ingredient_regions: 'ingredient_regions',
        recipe_tools: 'recipe_tools',
        recipe_steps: 'recipe_steps',
        dishes: 'dishes',
        utensils: 'utensils',
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
      if (type === 'recipes') {
        await supabase.from('blog_posts').delete().eq('id', id) // 연동된 블로그 글도 같이 삭제
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
