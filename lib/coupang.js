// 쿠팡 파트너스 대체(fallback) 노출 헬퍼
// 상품(식재료/조리기구 등)에 개별 coupang_url이 등록되어 있지 않을 때
// coupang_settings 테이블의 "여러 개" 세트 중 카테고리에 맞는 것을 찾아
// 대체 링크·위젯을 만들어준다.
//
// settingsList: coupang_settings 테이블의 모든 행(배열). 각 행(profile)은
//   { id, label, is_default, categories: string[], partner_path, partner_id,
//     search_template, widget_html, fallback_enabled, fallback_mode }

export function buildCoupangFallbackUrl(profile, query) {
  if (!profile) return ''
  const { search_template, partner_id, partner_path } = profile

  if (search_template && query) {
    return search_template
      .replace('{query}', encodeURIComponent(query))
      .replace('{channel}', encodeURIComponent(partner_id || ''))
  }
  // 검색 템플릿이 없으면 파트너스 기본 경로(예: 개인 쿠팡 파트너스 대문 링크)로 대체
  return partner_path || ''
}

// product.category(예: 'veg', 'fruit', 'utensil' 등)에 매칭되는 세트를 찾는다.
// 1) categories 배열에 해당 카테고리가 포함된 세트 우선
// 2) 없으면 is_default로 표시된 세트
// 3) 그마저 없으면 세트가 1개뿐일 때 그걸 사용(기존 단일설정 하위호환)
export function pickCoupangProfile(settingsList, category) {
  const list = Array.isArray(settingsList) ? settingsList : (settingsList ? [settingsList] : [])
  if (list.length === 0) return null

  if (category) {
    const matched = list.find(s => Array.isArray(s.categories) && s.categories.includes(category))
    if (matched) return matched
  }
  const def = list.find(s => s.is_default)
  if (def) return def

  return list.length === 1 ? list[0] : null
}

// 상품 자체 coupang_url이 있으면 그대로, 없고 fallback이 켜져 있으면 대체 정보를 반환
// 반환값: { url, widgetHtml, isFallback }
export function resolveCoupangDisplay(settingsList, { coupang_url, coupang_banner_html, category } = {}, query) {
  if (coupang_url || coupang_banner_html) {
    return { url: coupang_url || '', widgetHtml: coupang_banner_html || '', isFallback: false }
  }

  const profile = pickCoupangProfile(settingsList, category)
  if (!profile || !profile.fallback_enabled) {
    return { url: '', widgetHtml: '', isFallback: false }
  }
  const mode = profile.fallback_mode || 'link'
  const url = mode !== 'widget' ? buildCoupangFallbackUrl(profile, query) : ''
  const widgetHtml = mode !== 'link' ? (profile.widget_html || '') : ''
  if (!url && !widgetHtml) return { url: '', widgetHtml: '', isFallback: false }
  return { url, widgetHtml, isFallback: true }
}
