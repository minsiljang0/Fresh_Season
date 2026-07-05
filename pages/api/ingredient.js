import { supabase } from '../../lib/supabase'

// 이름(접미어) 검색 — 재료 칩 클릭 시 같은 계열(예: 쌀·철원오대쌀·이천쌀·찹쌀) 목록을 함께 보여주기 위함.
// /ingredient/[name] 페이지가 실제로 쓰는 기준(ingredient_regions 존재 여부)과 동일하게 "등록 여부"를 판단한다.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { name } = req.query
  if (!name) return res.status(400).json({ error: 'name 파라미터 필요' })

  const { data: ingredients, error } = await supabase
    .from('ingredients')
    .select('id,name,category,description,season_start,season_end')
    .ilike('name', `%${name}`)
    .order('name')
  if (error) return res.status(500).json({ error: error.message })
  if (!ingredients?.length) return res.status(200).json([])

  const { data: regions } = await supabase
    .from('ingredient_regions')
    .select('ingredient_id')
    .in('ingredient_id', ingredients.map(i => i.id))
  const registeredIds = new Set((regions || []).map(r => r.ingredient_id))

  return res.status(200).json(ingredients.map(ing => ({ ...ing, hasRegion: registeredIds.has(ing.id) })))
}
