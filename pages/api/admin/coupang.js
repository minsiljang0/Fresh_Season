import { supabase, genId } from '../../../lib/supabase'

const DEFAULT_TEMPLATE = 'https://www.coupang.com/np/search?component=&q={query}&channel={channel}'

function isAdmin(req) {
  return req.headers['x-admin-token'] === process.env.ADMIN_SECRET_TOKEN
}

export default async function handler(req, res) {
  // 조회는 공개 (프론트에서 대체 링크 노출용으로 사용) — 등록된 세트 전체를 배열로 반환
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('coupang_settings')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return res.status(200).json(data || [])
    } catch (err) {
      // 테이블이 아직 없거나 접속 실패 시에도 화면이 죽지 않도록 빈 배열 반환
      return res.status(200).json([])
    }
  }

  // 새 세트 추가 — 관리자 인증 필요
  if (req.method === 'POST') {
    if (!isAdmin(req)) return res.status(401).json({ error: '인증 실패' })
    const {
      label, is_default, categories, partner_path, partner_id,
      search_template, widget_html, fallback_enabled, fallback_mode,
    } = req.body || {}

    const now = new Date().toISOString()
    const row = {
      id: genId(),
      label: label || '새 세트',
      is_default: !!is_default,
      categories: Array.isArray(categories) ? categories : [],
      partner_path: partner_path ?? '',
      partner_id: partner_id ?? '',
      search_template: search_template ?? DEFAULT_TEMPLATE,
      widget_html: widget_html ?? '',
      fallback_enabled: !!fallback_enabled,
      fallback_mode: fallback_mode || 'link',
      created_at: now,
      updated_at: now,
    }

    // 기본값(is_default)은 한 번에 하나만 — 새로 기본값으로 지정하면 기존 기본값은 해제
    if (row.is_default) {
      await supabase.from('coupang_settings').update({ is_default: false }).eq('is_default', true)
    }

    const { error } = await supabase.from('coupang_settings').insert(row)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(row)
  }

  // 기존 세트 수정 — 관리자 인증 필요, body에 id 포함
  if (req.method === 'PUT') {
    if (!isAdmin(req)) return res.status(401).json({ error: '인증 실패' })
    const { id, ...rest } = req.body || {}
    if (!id) return res.status(400).json({ error: 'id 필요' })

    const row = {
      label: rest.label ?? '',
      is_default: !!rest.is_default,
      categories: Array.isArray(rest.categories) ? rest.categories : [],
      partner_path: rest.partner_path ?? '',
      partner_id: rest.partner_id ?? '',
      search_template: rest.search_template ?? DEFAULT_TEMPLATE,
      widget_html: rest.widget_html ?? '',
      fallback_enabled: !!rest.fallback_enabled,
      fallback_mode: rest.fallback_mode || 'link',
      updated_at: new Date().toISOString(),
    }

    if (row.is_default) {
      await supabase.from('coupang_settings').update({ is_default: false }).eq('is_default', true).neq('id', id)
    }

    const { error } = await supabase.from('coupang_settings').update(row).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  // 세트 삭제 — 관리자 인증 필요, ?id=
  if (req.method === 'DELETE') {
    if (!isAdmin(req)) return res.status(401).json({ error: '인증 실패' })
    const { id } = req.query || {}
    if (!id) return res.status(400).json({ error: 'id 필요' })
    const { error } = await supabase.from('coupang_settings').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
