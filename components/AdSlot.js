import { useEffect, useMemo, useRef } from 'react'
import { SLOT_BANNER_SIZE } from '../lib/adSlotSizes'
import { useCoupangWidgets } from '../lib/AdSlotsContext'

// 광고 번호 뱃지 컴포넌트
function AdBadge({ number, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 20, height: 20, borderRadius: '50%',
        background: '#e63946', color: '#fff',
        fontSize: 11, fontWeight: 800, flexShrink: 0,
      }}>{number}</span>
      <span style={{ fontSize: 10, color: '#666', fontWeight: 600 }}>{label}</span>
    </div>
  )
}

// 관리자가 저장한 <script>/<ins> 코드를 안전하게 DOM에 주입 (innerHTML은 <script>를 실행하지 않으므로 직접 삽입)
function useInjectAdCode(containerRef, code, deps = []) {
  useEffect(() => {
    const el = containerRef.current
    if (!el || !code) return
    el.innerHTML = ''
    const wrapper = document.createElement('div')
    wrapper.innerHTML = code
    // 스크립트 태그는 innerHTML로 넣으면 실행되지 않으므로 새로 만들어 교체
    Array.from(wrapper.querySelectorAll('script')).forEach(oldScript => {
      const newScript = document.createElement('script')
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value))
      newScript.textContent = oldScript.textContent
      oldScript.replaceWith(newScript)
    })
    el.appendChild(wrapper)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// 사이즈가 맞고 켜져있는 쿠팡 배너 중 하나를 무작위로 고른다
function pickCoupangBanner(widgets, size) {
  if (!size) return null
  const matches = (Array.isArray(widgets) ? widgets : []).filter(w => w.enabled && w.widget_html && w.size === size)
  if (matches.length === 0) return null
  return matches[Math.floor(Math.random() * matches.length)]
}

/**
 * 슬롯 데이터(slotData.source: 'adsense'(기본) | 'coupang' | 'random')와
 * 사이즈가 맞는 쿠팡 배너 목록을 바탕으로 실제로 주입할 HTML을 결정한다.
 */
function useResolvedAdContent(slot, slotData) {
  const coupangWidgets = useCoupangWidgets()
  const size = SLOT_BANNER_SIZE[slot]
  // 페이지가 열려있는 동안은 같은 배너가 유지되도록 위젯 목록이 바뀔 때만 다시 고른다
  const coupangBanner = useMemo(() => pickCoupangBanner(coupangWidgets, size), [coupangWidgets, size])

  const source = slotData?.source || 'adsense'
  const hasAdsense = !!(slotData?.active && slotData?.code)
  const hasCoupang = !!(slotData?.active && coupangBanner)

  let injectHtml = null
  if (slotData?.active) {
    if (source === 'coupang') {
      injectHtml = hasCoupang ? coupangBanner.widget_html : null
    } else if (source === 'random') {
      const pool = []
      if (hasAdsense) pool.push(slotData.code)
      if (hasCoupang) pool.push(coupangBanner.widget_html)
      injectHtml = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
    } else {
      injectHtml = hasAdsense ? slotData.code : null
    }
  }

  return {
    injectHtml,
    isOff: !!(slotData && !slotData.active),
    isWaiting: !!(slotData?.active && !injectHtml),
  }
}

/**
 * AdSlot — 본문/배너용 광고 영역
 * slotData가 주어지면 관리자(admin)가 설정한 소스(애드센스 코드 / 쿠팡 배너 / 무작위)를 사용
 * slotData가 없거나 active=false면 기존 환경변수 기반 동작으로 폴백
 */
export function AdSlot({ slot, format = 'auto', tall = false, label = '광고', number, slotData = null, style: extraStyle = {} }) {
  const ref = useRef(null)
  const codeRef = useRef(null)
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  const { injectHtml, isOff, isWaiting } = useResolvedAdContent(slot, slotData)

  useInjectAdCode(codeRef, injectHtml, [injectHtml])

  useEffect(() => {
    if (injectHtml) return // 관리자 코드/쿠팡 배너 모드에서는 adsbygoogle 자동 push 불필요 (코드 자체에 포함됨)
    if (!client || !ref.current) return
    try { ;(window.adsbygoogle = window.adsbygoogle || []).push({}) } catch {}
  }, [client, injectHtml])

  // slotData가 명시적으로 전달됐는데 OFF(active=false) → 완전히 숨김
  if (isOff) return null

  if (injectHtml) return (
    <div style={{ ...extraStyle, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {number && <AdBadge number={number} label={label} />}
      <div ref={codeRef} style={{ maxWidth: '100%' }} />
    </div>
  )

  // 대기 상태(관리자 설정에 맞는 코드/배너가 아직 없음): 자리만 보여주고 광고는 없음
  if (isWaiting || !client) return (
    <div className={`ad-slot${tall ? ' tall' : ''}`} style={extraStyle}>
      {number && <AdBadge number={number} label={label} />}
      <span style={{ fontSize: 20 }}>📢</span>
      <span>{label} 영역</span>
      <span style={{ fontSize: 11, color: '#444', marginTop: 4 }}>관리자 페이지에서 광고 코드를 등록하세요</span>
    </div>
  )

  return (
    <div style={extraStyle}>
      {number && <AdBadge number={number} label={label} />}
      <ins ref={ref} className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}

/**
 * SidebarAd — 사이드바(세로형) 광고 영역
 * slotData가 주어지면 관리자(admin)가 설정한 소스(애드센스 코드 / 쿠팡 배너 / 무작위)를 사용
 */
export function SidebarAd({ slot, label = '광고', number, slotData = null }) {
  const ref = useRef(null)
  const codeRef = useRef(null)
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  const { injectHtml, isOff, isWaiting } = useResolvedAdContent(slot, slotData)

  useInjectAdCode(codeRef, injectHtml, [injectHtml])

  useEffect(() => {
    if (injectHtml) return
    if (!client || !ref.current) return
    try { ;(window.adsbygoogle = window.adsbygoogle || []).push({}) } catch {}
  }, [client, injectHtml])

  // OFF(active=false) → 완전히 숨김
  if (isOff) return null

  if (injectHtml) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {number && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 20, height: 20, borderRadius: '50%',
          background: '#e63946', color: '#fff',
          fontSize: 11, fontWeight: 800, marginBottom: 6,
        }}>{number}</span>
      )}
      <div ref={codeRef} style={{ maxWidth: '100%' }} />
    </div>
  )

  // 대기 상태: 자리만 보여주고 광고는 없음
  if (isWaiting || !client) return (
    <div className="sidebar-ad-placeholder">
      {number && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 20, height: 20, borderRadius: '50%',
          background: '#e63946', color: '#fff',
          fontSize: 11, fontWeight: 800, marginBottom: 6,
        }}>{number}</span>
      )}
      <span style={{ fontSize: 18 }}>📢</span>
      <span style={{ fontSize: 12, color: '#555', marginTop: 6 }}>{label}</span>
      <span style={{ fontSize: 10, color: '#444', marginTop: 4, textAlign: 'center' }}>160×600</span>
    </div>
  )

  return (
    <div>
      {number && <AdBadge number={number} label={label} />}
      <ins ref={ref} className="adsbygoogle"
        style={{ display: 'block', width: '160px', height: '600px' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="vertical"
        data-full-width-responsive="false"
      />
    </div>
  )
}
