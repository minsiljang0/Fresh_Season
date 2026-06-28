import Link from 'next/link'
import { useRouter } from 'next/router'
import { REGIONS } from '../lib/regions'
import { useState, useEffect } from 'react'

export default function Header() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
    const check = () => setIsMobile(window.innerWidth < 900)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { setOpen(false) }, [router.pathname])

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="logo">
          <div className="logo-icon">🥬</div>
          <span className="logo-text"><span>Fresh</span> Season</span>
        </Link>

        {/* 햄버거 버튼 - 항상 렌더링하고 CSS로 숨김 */}
        <button onClick={() => setOpen(v=>!v)} style={{
          background:'none', border:'none', cursor:'pointer', padding:'6px 8px',
          fontSize:24, lineHeight:1, color:'var(--text)', marginLeft:'auto',
          display: mounted && isMobile ? 'block' : 'none'
        }}>{open ? '✕' : '☰'}</button>

        {/* 데스크탑 nav */}
        <nav className="header-nav" style={{ display: mounted && isMobile ? 'none' : 'flex' }}>
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
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {mounted && isMobile && open && (
        <div style={{
          position:'fixed', top:52, left:0, right:0, bottom:0,
          background:'var(--bg)', zIndex:999, overflowY:'auto',
          borderTop:'1px solid var(--border)', padding:'12px 0 40px'
        }}>
          <Link href="/" className={`nav-link${router.pathname === '/' ? ' active' : ''}`}
            style={{display:'block', padding:'12px 24px', fontSize:15}}>🏠 홈</Link>
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
            style={{display:'block', padding:'12px 24px', fontSize:15}}>🗺️ 제철지도</Link>
          <Link href="/global" className={`nav-link${router.pathname === '/global' ? ' active' : ''}`}
            style={{display:'block', padding:'12px 24px', fontSize:15}}>🌍 글로벌 푸드</Link>
          <Link href="/blog" className={`nav-link${router.pathname.startsWith('/blog') ? ' active' : ''}`}
            style={{display:'block', padding:'12px 24px', fontSize:15}}>📝 블로그</Link>
        </div>
      )}
    </header>
  )
}
