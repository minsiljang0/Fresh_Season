// 쿠팡 파트너스 대체(fallback) 노출 헬퍼
// 상품(식재료/조리기구 등)에 개별 coupang_url이 등록되어 있지 않을 때
//  1) 기본 정보(파트너스 기본 경로/번호/검색템플릿)로 자동 생성한 검색 링크
//  2) 관리자가 추가한 "링크 목록" (링크만)
//  3) 관리자가 추가한 "위젯 목록" (위젯 코드만)
// 를 함께 모아서 보여준다. 링크와 위젯은 서로 완전히 별개의 목록이다.

// base: { partner_path, partner_id, search_template, fallback_enabled }
export function buildCoupangFallbackUrl(base, query) {
  if (!base) return ''
  const { search_template, partner_id, partner_path } = base

  if (search_template && query) {
    return search_template
      .replace('{query}', encodeURIComponent(query))
      .replace('{channel}', encodeURIComponent(partner_id || ''))
  }
  return partner_path || ''
}

// links:   [{ id, label, url, enabled }]         — 링크만
// widgets: [{ id, label, widget_html, enabled }] — 위젯만
//
// 반환값: { links: [{label, url}], widgets: [htmlString], isFallback }
export function resolveCoupangDisplay(base, links, widgets, { coupang_url, coupang_banner_html } = {}, query) {
  // 상품에 자체 쿠팡 링크/위젯이 있으면 그것만 보여준다
  if (coupang_url || coupang_banner_html) {
    return {
      links: coupang_url ? [{ label: '쿠팡에서 구매하기', url: coupang_url }] : [],
      widgets: coupang_banner_html ? [coupang_banner_html] : [],
      isFallback: false,
    }
  }

  const resultLinks = []
  const resultWidgets = []

  // 1) 기본 정보로 자동 생성한 검색 링크
  if (base?.fallback_enabled) {
    const url = buildCoupangFallbackUrl(base, query)
    if (url) resultLinks.push({ label: '쿠팡에서 관련 상품 보기', url })
  }

  // 2) 링크 목록 (켜져있는 것만)
  ;(Array.isArray(links) ? links : []).forEach(l => {
    if (l.enabled && l.url) resultLinks.push({ label: l.label || '쿠팡에서 보기', url: l.url })
  })

  // 3) 위젯 목록 (켜져있는 것만)
  ;(Array.isArray(widgets) ? widgets : []).forEach(w => {
    if (w.enabled && w.widget_html) resultWidgets.push(w.widget_html)
  })

  return {
    links: resultLinks,
    widgets: resultWidgets,
    isFallback: resultLinks.length > 0 || resultWidgets.length > 0,
  }
}
