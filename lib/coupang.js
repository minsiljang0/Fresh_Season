// 쿠팡 파트너스 노출 헬퍼
// 상품(식재료/조리기구 등)에 개별 coupang_url이 등록되어 있지 않을 때
//  1) 관리자가 추가한 "링크 목록" (링크만)
//  2) 관리자가 추가한 "위젯 목록" 중 사이즈가 지정되지 않은 것 (제품 관련 위젯만)
// 를 함께 모아서 보여준다. 링크와 위젯은 서로 완전히 별개의 목록이다.
//
// * 사이즈(728x90/160x600/300x250 등)가 지정된 위젯은 "광고 슬롯 자동 로테이션" 전용이며
//   (components/AdSlot.js가 lib/adSlotSizes.js의 매핑으로 직접 골라 씀)
//   이 재료/지역 상세 페이지의 "구매하기" 박스에는 절대 노출하지 않는다.
//
// * 예전에는 "기본 정보(파트너스 경로/번호/검색템플릿)로 자동 생성한 검색 링크"
//   기능이 있었지만, 쿠팡 파트너스 공식 링크 생성 도구를 거치지 않고 만든 URL은
//   실적으로 집계되지 않아(쿠팡 파트너스 이용 가이드 STEP2 참고) 완전히 제거했다.
//   링크는 반드시 쿠팡 파트너스 사이트(partners.coupang.com)의
//   "간편 링크 만들기" 등으로 직접 생성한 뒤 "링크 목록"에 등록해야 한다.

// links:   [{ id, label, url, enabled }]         — 링크만
// widgets: [{ id, label, widget_html, enabled }] — 위젯만
//
// 반환값: { links: [{label, url}], widgets: [htmlString] }
export function resolveCoupangDisplay(links, widgets, { coupang_url, coupang_banner_html } = {}) {
  // 상품에 자체 쿠팡 링크/위젯이 있으면 그것만 보여준다
  if (coupang_url || coupang_banner_html) {
    return {
      links: coupang_url ? [{ label: '쿠팡에서 구매하기', url: coupang_url }] : [],
      widgets: coupang_banner_html ? [coupang_banner_html] : [],
    }
  }

  const resultLinks = []
  const resultWidgets = []

  // 링크 목록 (켜져있는 것만)
  ;(Array.isArray(links) ? links : []).forEach(l => {
    if (l.enabled && l.url) resultLinks.push({ label: l.label || '쿠팡에서 보기', url: l.url })
  })

  // 위젯 목록 (켜져있는 것만) — 단, "사이즈"가 지정된 배너는 광고 슬롯 자동 로테이션 전용이라
  // 여기(재료/지역 상세의 "구매하기" 박스)에는 노출하지 않는다.
  ;(Array.isArray(widgets) ? widgets : []).forEach(w => {
    if (w.enabled && w.widget_html && !w.size) resultWidgets.push(w.widget_html)
  })

  return { links: resultLinks, widgets: resultWidgets }
}
