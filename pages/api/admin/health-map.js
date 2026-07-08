import { supabase, genId } from '../../../lib/supabase'
import { DEFAULT_NUTRIENTS } from '../../../lib/healthMapZones'

export default async function handler(req, res) {
  const isAdmin = req.headers['x-admin-token'] === process.env.ADMIN_SECRET_TOKEN

  // ── GET: 전체 목록 (부위 구분 없이 다 내려주고, 관리자 화면에서 zone_id로 묶어서 씀) ──
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('health_map_nutrients')
        .select('*')
        .order('zone_id')
        .order('sort_order')
      if (error) throw error
      return res.status(200).json(data || [])
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  if (!isAdmin) return res.status(401).json({ error: '인증 필요' })
  const body = req.body || {}

  // ── POST: 영양소 1개 추가 ──
  if (req.method === 'POST') {
    try {
      if (!body.zone_id || !body.nutrient) throw new Error('zone_id, nutrient 필요')
      const { data, error } = await supabase
        .from('health_map_nutrients')
        .insert([{ id: genId(), zone_id: body.zone_id, nutrient: body.nutrient, sort_order: body.sort_order ?? 0 }])
        .select().single()
      if (error) throw error
      return res.status(200).json(data)
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ── POST-SEED: 아직 등록된 게 하나도 없는 부위에 한해 기본값을 채워넣기 (관리자 화면 "기본값 채우기" 버튼용) ──
  if (req.method === 'PUT' && req.query.action === 'seed_defaults') {
    try {
      const { data: existing, error: exErr } = await supabase.from('health_map_nutrients').select('zone_id')
      if (exErr) throw exErr
      const existingZones = new Set((existing || []).map(r => r.zone_id))
      const rows = []
      Object.entries(DEFAULT_NUTRIENTS).forEach(([zoneId, list]) => {
        if (existingZones.has(zoneId)) return // 이미 뭔가 있으면 건드리지 않음
        list.forEach((n, i) => rows.push({ id: genId(), zone_id: zoneId, nutrient: n, sort_order: i + 1 }))
      })
      if (rows.length > 0) {
        const { error } = await supabase.from('health_map_nutrients').insert(rows)
        if (error) throw error
      }
      return res.status(200).json({ ok: true, inserted: rows.length })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ── PATCH: 영양소 이름/순서 수정 ──
  if (req.method === 'PATCH') {
    try {
      const { id } = req.query
      if (!id) throw new Error('id 필요')
      const { data, error } = await supabase
        .from('health_map_nutrients')
        .update(body)
        .eq('id', id)
        .select().single()
      if (error) throw error
      return res.status(200).json(data)
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ── DELETE: 영양소 1개 삭제 ──
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query
      if (!id) throw new Error('id 필요')
      const { error } = await supabase.from('health_map_nutrients').delete().eq('id', id)
      if (error) throw error
      return res.status(200).json({ ok: true })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  res.status(405).end()
}
