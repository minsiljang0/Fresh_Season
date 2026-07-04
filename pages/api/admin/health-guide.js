import { supabase, genId } from '../../../lib/supabase'

const GROUP_SCOPED = ['nutrients', 'issues', 'checkup_highlights']
const TABLE_OF = {
  groups: 'age_health_groups',
  nutrients: 'age_health_nutrients',
  issues: 'age_health_issues',
  checkup_highlights: 'age_health_checkup_highlights',
  checkup_common: 'age_health_checkup_common',
  cancer_screening: 'age_health_cancer_screening',
  sources: 'age_health_sources',
  meta: 'age_health_meta',
}

// 문자열/배열 어느 쪽으로 와도 text[] 배열로 정규화 ("a, b, c" 형태의 콤마 구분 문자열도 허용)
function toArray(v) {
  if (Array.isArray(v)) return v.map(s => String(s).trim()).filter(Boolean)
  if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean)
  return []
}

export default async function handler(req, res) {
  const isAdmin = req.headers['x-admin-token'] === process.env.ADMIN_SECRET_TOKEN
  const { type, id, age_group_id } = req.query
  const table = TABLE_OF[type]
  if (!table) return res.status(400).json({ error: '알 수 없는 type 입니다.' })

  // ── GET ──────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      let q = supabase.from(table).select('*')
      if (GROUP_SCOPED.includes(type) && age_group_id) q = q.eq('age_group_id', age_group_id)
      if (type === 'meta') q = q.eq('id', 'default')
      q = q.order(GROUP_SCOPED.includes(type) ? 'age_group_id' : (type === 'groups' ? 'sort_order' : 'sort_order'), { ascending: true })
      const { data, error } = await q
      if (error) throw error
      return res.status(200).json(type === 'meta' ? (data?.[0] || null) : data)
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  if (!isAdmin) return res.status(401).json({ error: '인증 필요' })
  const body = req.body || {}

  // ── POST (신규 추가) ─────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const row = { id: genId() }
      if (GROUP_SCOPED.includes(type)) row.age_group_id = body.age_group_id
      if (type === 'groups') {
        Object.assign(row, {
          id: body.id || row.id, label: body.label || '', age_range: body.age_range || '',
          emoji: body.emoji || '', kdri_range: body.kdri_range || '', for_me_note: body.for_me_note || '',
          sort_order: body.sort_order || 0,
        })
      } else if (type === 'cancer_screening') {
        Object.assign(row, {
          name: body.name || '', target: body.target || '', cycle: body.cycle || '', method: body.method || '',
          food_category: body.food_category || null, food_link_label: body.food_link_label || null,
          note: body.note || null, sort_order: body.sort_order || 0,
        })
      } else {
        Object.assign(row, {
          tags: toArray(body.tags), body: body.body || body.text || '',
          food_category: body.food_category || null, food_link_label: body.food_link_label || null,
          note: body.note || null, sort_order: body.sort_order || 0,
        })
      }
      const { data, error } = await supabase.from(table).insert([row]).select()
      if (error) throw error
      return res.status(200).json(data?.[0])
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ── PATCH (수정) ─────────────────────────────────────────
  if (req.method === 'PATCH') {
    try {
      const updates = {}
      if (type === 'groups') {
        for (const k of ['label', 'age_range', 'emoji', 'kdri_range', 'for_me_note', 'sort_order']) {
          if (body[k] !== undefined) updates[k] = body[k]
        }
      } else if (type === 'cancer_screening') {
        for (const k of ['name', 'target', 'cycle', 'method', 'food_category', 'food_link_label', 'note', 'sort_order']) {
          if (body[k] !== undefined) updates[k] = body[k]
        }
      } else if (type === 'meta') {
        for (const k of ['last_verified_label', 'checkup_common_title', 'checkup_common_subtitle', 'checkup_common_note', 'cancer_screening_title']) {
          if (body[k] !== undefined) updates[k] = body[k]
        }
      } else {
        if (body.tags !== undefined) updates.tags = toArray(body.tags)
        if (body.body !== undefined) updates.body = body.body
        if (body.text !== undefined) updates.body = body.text
        for (const k of ['food_category', 'food_link_label', 'note', 'sort_order', 'age_group_id']) {
          if (body[k] !== undefined) updates[k] = body[k]
        }
      }
      updates.updated_at = new Date().toISOString()
      const targetId = type === 'meta' ? 'default' : id
      if (!targetId) return res.status(400).json({ error: 'id 필요' })
      const { data, error } = await supabase.from(table).update(updates).eq('id', targetId).select()
      if (error) throw error
      return res.status(200).json(data?.[0])
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ── DELETE ───────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      if (!id) return res.status(400).json({ error: 'id 필요' })
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      return res.status(200).json({ ok: true })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  return res.status(405).end()
}
