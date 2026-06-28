import Link from 'next/link'
import { useRouter } from 'next/router'
import { REGIONS } from '../lib/regions'
import { useState, useEffect, useRef } from 'react'

export default function Header() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const headerRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    const check = () => setIsMobile(window.innerWidth < 900)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { setOpen(false) }, [router.pathname])

  const showMobile = mounted && isMobile

  return (
    <>
      <header ref={headerRef} className="header" style={{ position:'sticky', top:0, zIndex:200 }}>
        <div className="header-inner">
          <Link href="/" className="logo">
            <div className="logo-icon">🥬</div>
            <span className="logo-text"><span>Fresh</span> Season</span>
          </Link>

          {/* 햄버거 버튼 */}
          {showMobile && (
            <button onClick={() => setOpen(v=>!v)} style={{
              background:'none', border:'none', cursor:'pointer', padding:'6px 10px',
              fontSize:26, lineHeight:1, color:'var(--text)', marginLeft:'auto'
            }}>{open ? '✕' : '☰'}</button>
          )}

          {/* 데스크탑 nav */}
          {!showMobile && (
            <nav className="header-nav">
              <Link href="/" className={`nav-link${router.pathname === '/' ? ' active' : ''}`}>홈</Link>
              {REGIONS.map(r => (
                <Link key={r.id} href={`/region/${r.id}`}
                  className={`nav-link${router.pathname === `/region/${r.id}` ? ' active' : ''}`}>
                  {r.icon} {r.name}
                </Link>
              ))}
              <Link href="/map" className={`nav-link${router.pathname === '/map' ? ' active' : ''}`}>🗺 제철지도</Link>
              <Link href="/global" className={`nav-link${router.pathname === '/global' ? ' active' : ''}`}>🌍 글로벌 푸드</Link>
              <Link href="/blog" className={`nav-link${router.pathname.startsWith('/blog') ? ' active' : ''}`}>📝 블로그</Link>
            </nav>
          )}
        </div>
      </header>

      {/* 모바일 드롭다운 — header 외부에 portal처럼 렌더링 */}
      {showMobile && open && (
        <div style={{
          position:'fixed', top:0, left:0, right:0, bottom:0,
          zIndex:199, display:'flex', flexDirection:'column',
        }}>
          {/* 헤더 높이만큼 투명 여백 */}
          <div style={{ height: headerRef.current?.offsetHeight || 56 }} onClick={() => setOpen(false)} />
          {/* 메뉴 본체 */}
          <div style={{
            flex:1, background:'var(--bg)', overflowY:'auto',
            borderTop:'1px solid var(--border)', padding:'8px 0 40px',
            boxShadow:'0 8px 24px rgba(0,0,0,0.12)'
          }}>
            <Link href="/" className={`nav-link${router.pathname === '/' ? ' active' : ''}`}
              style={{display:'block', padding:'13px 24px', fontSize:15}}>🏠 홈</Link>
            <div style={{padding:'8px 24px 4px', fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:'0.05em'}}>📍 지역별</div>
            {REGIONS.map(r => (
              <Link key={r.id} href={`/region/${r.id}`}
                className={`nav-link${router.pathname === `/region/${r.id}` ? ' active' : ''}`}
                style={{display:'block', padding:'10px 24px', fontSize:14}}>
                {r.icon} {r.name}
              </Link>
            ))}
            <div style={{height:1, background:'var(--border)', margin:'8px 24px'}} />
            <Link href="/map" className={`nav-link${router.pathname === '/map' ? ' active' : ''}`}
              style={{display:'block', padding:'13px 24px', fontSize:15}}>🗺️ 제철지도</Link>
            <Link href="/global" className={`nav-link${router.pathname === '/global' ? ' active' : ''}`}
              style={{display:'block', padding:'13px 24px', fontSize:15}}>🌍 글로벌 푸드</Link>
            <Link href="/blog" className={`nav-link${router.pathname.startsWith('/blog') ? ' active' : ''}`}
              style={{display:'block', padding:'13px 24px', fontSize:15}}>📝 블로그</Link>
          </div>
        </div>
      )}
    </>
  )
}
