import { supabase } from '../../../lib/supabase'

// 쿠팡 파트너스 "기본 정보" — 단일 설정 (경로 / 내 번호 / 검색 템플릿 / 대체 위젯)
const ROW_ID = 'default'

const DEFAULTS = {
  id: ROW_ID,
  partner_path: '',
  partner_id: '',
  search_template: 'https://www.coupang.com/np/search?component=&q={query}&channel={channel}',
  widget_html: '',
  fallback_enabled: false,
  fallback_mode: 'link',
}

function isAdmin(req) {
  return req.headers['x-admin-token'] === process.env.ADMIN_SECRET_TOKEN
}

export default async function handler(req, res) {
  // 조회는 공개 (프론트에서 대체 링크 노출용으로 사용)
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('coupang_settings')
        .select('*')
        .eq('id', ROW_ID)
        .maybeSingle()
      if (error) throw error
      return res.status(200).json(data || DEFAULTS)
    } catch (err) {
      // 테이블이 아직 없거나 접속 실패 시에도 화면이 죽지 않도록 기본값 반환
      return res.status(200).json(DEFAULTS)
    }
  }

  // 저장은 관리자 인증 필요
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!isAdmin(req)) return res.status(401).json({ error: '인증 실패' })
    const {
      partner_path, partner_id, search_template,
      widget_html, fallback_enabled, fallback_mode,
    } = req.body || {}

    const row = {
      id: ROW_ID,
      partner_path: partner_path ?? '',
      partner_id: partner_id ?? '',
      search_template: search_template ?? DEFAULTS.search_template,
      widget_html: widget_html ?? '',
      fallback_enabled: !!fallback_enabled,
      fallback_mode: fallback_mode || 'link',
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('coupang_settings').upsert(row, { onConflict: 'id' })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
