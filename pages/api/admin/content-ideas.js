import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function auth(req) {
  const token = req.headers['x-admin-token']
  return token && token === process.env.ADMIN_SECRET_TOKEN
}

function nowKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
}

const MONTH_TABS = Array.from({ length: 12 }, (_, i) => {
  const m = i + 1
  const icons = ['❄️','🌸','🌸','🌿','🌿','☀️','☀️','☀️','🍂','🍂','🍁','❄️']
  return { id: `month_${m}`, icon: icons[i], label: `${m}월`, month: m }
})

export default async function handler(req, res) {
  if (!auth(req)) return res.status(401).json({ error: '인증 필요' })

  if (req.method === 'GET') {
    const { data: ideas, error } = await supabase
      .from('content_ideas')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ tabs: MONTH_TABS, ideas: ideas || [] })
  }

  if (req.method === 'POST') {
    const { tab_id, section, type, content, keyword, angle, memo } = req.body
    if (!tab_id || !content) return res.status(400).json({ error: 'tab_id, content 필수' })
    const memoFinal = angle ? `[각도] ${angle}${memo ? ' | ' + memo : ''}` : (memo || null)
    const row = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      tab_id,
      tool_id: section || 'ingredient',
      type: type || 'idea',
      content,
      keyword: keyword || null,
      memo: memoFinal,
      status: 'pending',
      used_at: null,
      created_at: nowKST(),
    }
    const { error } = await supabase.from('content_ideas').insert([row])
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true, id: row.id })
  }

  if (req.method === 'PATCH') {
    const { action } = req.body

    if (action === 'update_status') {
      const { id, status, used_at, used_slug } = req.body
      const updateData = { status, updated_at: nowKST() }
      // used_at: 사용 처리 시 현재 시각, 되돌리기 시 null
      updateData.used_at = status === 'used' ? (used_at || nowKST()) : null
      updateData.used_slug = status === 'used' ? (used_slug || null) : null
      const { error } = await supabase
        .from('content_ideas').update(updateData).eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true })
    }

    if (action === 'update_sort') {
      const { orders } = req.body
      await Promise.all(
        orders.map(({ id, sort_order }) =>
          supabase.from('content_ideas').update({ sort_order }).eq('id', id)
        )
      )
      return res.json({ ok: true })
    }

    return res.status(400).json({ error: '알 수 없는 action' })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'id 필수' })
    const { error } = await supabase.from('content_ideas').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
