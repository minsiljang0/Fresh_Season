import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function auth(req) {
  return req.headers['x-admin-token'] === process.env.ADMIN_SECRET_TOKEN
}

function nowKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
}

export default async function handler(req, res) {
  if (!auth(req)) return res.status(401).json({ error: '인증 필요' })

  // ── GET: 서버 목록 + 각 서버의 툴 목록
  if (req.method === 'GET') {
    const { data: servers, error: se } = await supabase
      .from('mcp_connectors')
      .select('*')
      .order('created_at', { ascending: true })
    if (se) return res.status(500).json({ error: se.message })

    const { data: tools, error: te } = await supabase
      .from('mcp_tools')
      .select('*')
      .order('created_at', { ascending: true })
    if (te) return res.status(500).json({ error: te.message })

    const result = (servers || []).map(s => ({
      ...s,
      tools: (tools || []).filter(t => t.server_id === s.id),
    }))
    return res.json({ servers: result })
  }

  // ── POST: 서버 추가 or 툴 추가
  if (req.method === 'POST') {
    const { type, server_id, name, url, description } = req.body

    // 서버 추가
    if (type === 'server') {
      if (!name || !url) return res.status(400).json({ error: 'name, url 필수' })
      const row = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        name, url,
        description: description || null,
        is_active: true,
        created_at: nowKST(),
      }
      const { error } = await supabase.from('mcp_connectors').insert([row])
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true, id: row.id })
    }

    // 툴 추가
    if (type === 'tool') {
      if (!server_id || !name) return res.status(400).json({ error: 'server_id, name 필수' })
      const row = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        server_id, name,
        description: description || null,
        is_active: true,
        created_at: nowKST(),
      }
      const { error } = await supabase.from('mcp_tools').insert([row])
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ ok: true, id: row.id })
    }

    return res.status(400).json({ error: 'type 필수 (server | tool)' })
  }

  // ── DELETE: 서버 삭제 or 툴 삭제
  if (req.method === 'DELETE') {
    const { type, id } = req.body
    if (!id) return res.status(400).json({ error: 'id 필수' })

    const table = type === 'server' ? 'mcp_connectors' : 'mcp_tools'
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
