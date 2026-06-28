import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function auth(req) {
  const token = req.headers['x-admin-token']
  return token && token === process.env.ADMIN_TOKEN
}

function nowKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
}

// 월별 탭 (1~12월 고정)
const MONTH_TABS = Array.from({ length: 12 }, (_, i) => {
  const m = i + 1
  const icons = ['❄️','🌸','🌸','🌿','🌿','☀️','☀️','☀️','🍂','🍂','🍁','❄️']
  const seasons = ['겨울','봄','봄','봄','초여름','여름','여름','여름','가을','가을','가을','겨울']
  return { id: `month_${m}`, icon: icons[i], label: `${m}월`, season: seasons[i], month: m }
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
    const row = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      tab_id,
      tool_id: section || null,   // section을 tool_id에 저장 (기존 컬럼 재활용)
      type: type || 'idea',
      content,
      keyword: keyword || null,
      memo: angle ? `[각도] ${angle}${memo ? ' | ' + memo : ''}` : (memo || null),
      status: 'pending',
      sort_order: null,
      created_at: nowKST(),
    }
    const { error } = await supabase.from('content_ideas').insert([row])
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true, id: row.id })
  }

  if (req.method === 'PATCH') {
    const { action } = req.body

    if (action === 'update_status') {
      const { id, status } = req.body
      const { error } = await supabase
        .from('content_ideas').update({ status, updated_at: nowKST() }).eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true })
    }

    if (action === 'update_sort') {
      // 순서 저장: [{ id, sort_order }]
      const { orders } = req.body
      const updates = orders.map(({ id, sort_order }) =>
        supabase.from('content_ideas').update({ sort_order }).eq('id', id)
      )
      await Promise.all(updates)
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
