import { useEffect } from 'react'

// 쿠팡(파트너스) 링크로 인식할 호스트 목록
const COUPANG_HOSTS = ['coupang.com', 'coupa.ng', 'link.coupang.com', 'www.coupang.com']

function isCoupangUrl(href) {
  try {
    const u = new URL(href, window.location.origin)
    return COUPANG_HOSTS.some(h => u.hostname === h || u.hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}

/**
 * CoupangRedirectGuard
 * 페이지 어디에 있든(글로벌푸드 페이지의 버튼, 블로그 본문, 게시판 글 등)
 * 쿠팡 링크를 클릭하면 자동으로 /redirect 대기 화면(쿨다운 배너 광고 포함)을
 * 거쳐서 이동하도록 클릭을 가로챈다. 블로그/게시판에 나중에 쿠팡 링크를
 * 추가해도 별도 작업 없이 항상 이 대기 화면을 거치게 된다.
 */
export default function CoupangRedirectGuard() {
  useEffect(() => {
    const handleClick = (e) => {
      const anchor = e.target.closest && e.target.closest('a[href]')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || !isCoupangUrl(href)) return
      // 이미 /redirect를 거쳐가는 링크는 무한루프 방지를 위해 그대로 둔다
      if (href.includes('/redirect?')) return

      e.preventDefault()
      const label = anchor.textContent?.trim().slice(0, 40) || ''
      const target = `/redirect?url=${encodeURIComponent(href)}${label ? `&label=${encodeURIComponent(label)}` : ''}`
      window.open(target, '_blank', 'noopener,noreferrer')
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  return null
}
