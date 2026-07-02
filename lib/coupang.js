// 쿠팡 파트너스 대체(fallback) 노출 헬퍼
// 상품(식재료/도구/레시피 등)에 개별 coupang_url이 등록되어 있지 않을 때
// coupang_settings 테이블 값(경로 / 내 번호 / 위젯)을 활용해 대체 링크·위젯을 만들어준다.

export function buildCoupangFallbackUrl(coupangSettings, query) {
  if (!coupangSettings) return ''
  const { search_template, partner_id, partner_path } = coupangSettings

  if (search_template && query) {
    return search_template
      .replace('{query}', encodeURIComponent(query))
      .replace('{channel}', encodeURIComponent(partner_id || ''))
  }
  // 검색 템플릿이 없으면 파트너스 기본 경로(예: 개인 쿠팡 파트너스 대문 링크)로 대체
  return partner_path || ''
}

// 상품 자체 coupang_url이 있으면 그대로, 없고 fallback이 켜져 있으면 대체 정보를 반환
// 반환값: { url, widgetHtml, isFallback }
export function resolveCoupangDisplay(coupangSettings, { coupang_url, coupang_banner_html } = {}, query) {
  if (coupang_url || coupang_banner_html) {
    return { url: coupang_url || '', widgetHtml: coupang_banner_html || '', isFallback: false }
  }
  if (!coupangSettings || !coupangSettings.fallback_enabled) {
    return { url: '', widgetHtml: '', isFallback: false }
  }
  const mode = coupangSettings.fallback_mode || 'link'
  const url = mode !== 'widget' ? buildCoupangFallbackUrl(coupangSettings, query) : ''
  const widgetHtml = mode !== 'link' ? (coupangSettings.widget_html || '') : ''
  if (!url && !widgetHtml) return { url: '', widgetHtml: '', isFallback: false }
  return { url, widgetHtml, isFallback: true }
}
