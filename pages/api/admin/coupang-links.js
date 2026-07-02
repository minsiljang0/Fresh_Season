import { supabase, genId } from '../../../lib/supabase'

// 쿠팡 파트너스 "여러 개의 링크" — 자유롭게 계속 추가할 수 있는 목록
// 각 항목: { id, label, url, widget_html, enabled }

function isAdmin(req) {
  return req.headers['x-admin-token'] === process.env.ADMIN_SECRET_TOKEN
}

export default async function handler(req, res) {
  // 조회는 공개 (프론트에서 대체 링크 노출용으로 사용)
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('coupang_links')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return res.status(200).json(data || [])
    } catch (err) {
      // 테이블이 아직 없거나 접속 실패 시에도 화면이 죽지 않도록 빈 배열 반환
      return res.status(200).json([])
    }
  }

  // 링크 추가 — 관리자 인증 필요
  if (req.method === 'POST') {
    if (!isAdmin(req)) return res.status(401).json({ error: '인증 실패' })
    const { label, url, widget_html, enabled } = req.body || {}

    const now = new Date().toISOString()
    const row = {
      id: genId(),
      label: label ?? '',
      url: url ?? '',
      widget_html: widget_html ?? '',
      enabled: enabled === undefined ? true : !!enabled,
      created_at: now,
      updated_at: now,
    }

    const { error } = await supabase.from('coupang_links').insert(row)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(row)
  }

  // 링크 수정 — 관리자 인증 필요, body에 id 포함
  if (req.method === 'PUT') {
    if (!isAdmin(req)) return res.status(401).json({ error: '인증 실패' })
    const { id, ...rest } = req.body || {}
    if (!id) return res.status(400).json({ error: 'id 필요' })

    const row = {
      label: rest.label ?? '',
      url: rest.url ?? '',
      widget_html: rest.widget_html ?? '',
      enabled: rest.enabled === undefined ? true : !!rest.enabled,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('coupang_links').update(row).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  // 링크 삭제 — 관리자 인증 필요, ?id=
  if (req.method === 'DELETE') {
    if (!isAdmin(req)) return res.status(401).json({ error: '인증 실패' })
    const { id } = req.query || {}
    if (!id) return res.status(400).json({ error: 'id 필요' })
    const { error } = await supabase.from('coupang_links').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
