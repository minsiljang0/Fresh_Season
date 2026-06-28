import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function auth(req) {
  return req.headers['x-admin-token'] === process.env.ADMIN_TOKEN
}

function nowKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
}

export default async function handler(req, res) {
  if (!auth(req)) return res.status(401).json({ error: '인증 필요' })

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('mcp_connectors')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ mcps: data || [] })
  }

  if (req.method === 'POST') {
    const { name, url, description, is_active } = req.body
    if (!name || !url) return res.status(400).json({ error: 'name, url 필수' })
    const row = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name, url,
      description: description || null,
      is_active: is_active !== false,
      created_at: nowKST(),
    }
    const { error } = await supabase.from('mcp_connectors').insert([row])
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true, id: row.id })
  }

  if (req.method === 'PATCH') {
    const { action, id, is_active } = req.body
    if (action === 'toggle') {
      const { error } = await supabase.from('mcp_connectors').update({ is_active, updated_at: nowKST() }).eq('id', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true })
    }
    return res.status(400).json({ error: '알 수 없는 action' })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'id 필수' })
    const { error } = await supabase.from('mcp_connectors').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
