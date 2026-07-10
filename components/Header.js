import Link from 'next/link'
import { useRouter } from 'next/router'
import { REGIONS } from '../lib/regions'
import { useState, useEffect, useRef } from 'react'
import { AdSlot } from './AdSlot'
import { useAdSlot } from '../lib/AdSlotsContext'

export default function Header() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [regionCounts, setRegionCounts] = useState({})
  const headerRef = useRef(null)
  const topSlot = useAdSlot('home_top')

  useEffect(() => {
    setMounted(true)
    const check = () => setIsMobile(window.innerWidth < 900)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // 지역별 식재료 수 로드
  useEffect(() => {
    fetch('/api/map/seasonal-foods')
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        const foods = Array.isArray(data) ? data : (data.foods || [])
        const seen = {}
        foods.forEach(f => {
          if (!seen[f.region]) seen[f.region] = new Set()
          seen[f.region].add(f.ingredient)
        })
        const counts = {}
        Object.entries(seen).forEach(([r, s]) => { counts[r] = s.size })
        setRegionCounts(counts)
      })
      .catch(() => {})
  }, [])

  const handleNav = (href) => {
    setOpen(false)
    router.push(href)
  }

  const showMobile = mounted && isMobile

  return (
    <>
      {/* 전체 페이지 상단 배너 */}
      <div className="ad-banner-slot">
        <AdSlot slot="home_top" label="상단 배너 광고" slotData={topSlot} />
      </div>

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
              <Link href="/meal-plan" className={`nav-link${router.pathname.startsWith('/meal-plan') ? ' active' : ''}`}>🍽️ 월별 제철식단</Link>
              <Link href="/recipe" className={`nav-link${router.pathname.startsWith('/recipe') ? ' active' : ''}`}>🍳 레시피</Link>
              <Link href="/for-me" className={`nav-link${router.pathname === '/for-me' ? ' active' : ''}`}>🧬 맞춤 추천</Link>
              <Link href="/health-guide" className={`nav-link${router.pathname.startsWith('/health-guide') ? ' active' : ''}`}>📖 연령별 건강 가이드</Link>
              <Link href="/health-map" className={`nav-link${router.pathname.startsWith('/health-map') ? ' active' : ''}`}>🧍 신체건강지도</Link>
              <Link href="/global" className={`nav-link${router.pathname === '/global' ? ' active' : ''}`}>🌍 글로벌 푸드</Link>
              <Link href="/blog" className={`nav-link${router.pathname.startsWith('/blog') ? ' active' : ''}`}>📝 블로그</Link>
              <Link href="/board/free" className={`nav-link${router.pathname === '/board/free' ? ' active' : ''}`}>💬 자유게시판</Link>
              <Link href="/board/request" className={`nav-link${router.pathname === '/board/request' ? ' active' : ''}`}>📬 부탁해요</Link>
              <Link href="/holiday-pharmacy" className={`nav-link${router.pathname.startsWith('/holiday-pharmacy') ? ' active' : ''}`}>💊 휴일약국</Link>
            </nav>
          )}
        </div>
      </header>

      {/* 모바일 드롭다운 */}
      {showMobile && open && (
        <div style={{
          position:'fixed', top:0, left:0, right:0, bottom:0,
          zIndex:199, display:'flex', flexDirection:'column',
        }}>
          <div style={{ height: headerRef.current?.offsetHeight || 56 }} onClick={() => setOpen(false)} />
          <div style={{
            flex:1, background:'var(--bg)', overflowY:'auto',
            borderTop:'1px solid var(--border)', padding:'8px 0 40px',
            boxShadow:'0 8px 24px rgba(0,0,0,0.12)'
          }}>
            <a className={`nav-link${router.pathname === '/' ? ' active' : ''}`}
              style={{display:'block', padding:'13px 24px', fontSize:15, cursor:'pointer', textDecoration:'none'}}
              onClick={() => handleNav('/')}>🏠 홈</a>

            <div style={{padding:'8px 24px 4px', fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:'0.05em'}}>📍 지역별</div>

            {REGIONS.map(r => (
              <a key={r.id}
                className={`nav-link${router.pathname === `/region/${r.id}` ? ' active' : ''}`}
                style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 24px', fontSize:14, cursor:'pointer', textDecoration:'none'}}
                onClick={() => handleNav(`/region/${r.id}`)}>
                <span>{r.icon} {r.name}</span>
                {regionCounts[r.id] > 0 && (
                  <span style={{fontSize:12, fontWeight:700, color:r.color, background:`${r.color}18`, border:`1px solid ${r.color}44`, borderRadius:999, padding:'1px 8px'}}>
                    {regionCounts[r.id]}
                  </span>
                )}
              </a>
            ))}

            <div style={{height:1, background:'var(--border)', margin:'8px 24px'}} />

            <a className={`nav-link${router.pathname === '/map' ? ' active' : ''}`}
              style={{display:'block', padding:'13px 24px', fontSize:15, cursor:'pointer', textDecoration:'none'}}
              onClick={() => handleNav('/map')}>🗺️ 제철지도</a>
            <a className={`nav-link${router.pathname.startsWith('/meal-plan') ? ' active' : ''}`}
              style={{display:'block', padding:'13px 24px', fontSize:15, cursor:'pointer', textDecoration:'none'}}
              onClick={() => handleNav('/meal-plan')}>🍽️ 월별 제철식단</a>
            <a className={`nav-link${router.pathname.startsWith('/recipe') ? ' active' : ''}`}
              style={{display:'block', padding:'13px 24px', fontSize:15, cursor:'pointer', textDecoration:'none'}}
              onClick={() => handleNav('/recipe')}>🍳 레시피</a>
            <a className={`nav-link${router.pathname === '/for-me' ? ' active' : ''}`}
              style={{display:'block', padding:'13px 24px', fontSize:15, cursor:'pointer', textDecoration:'none'}}
              onClick={() => handleNav('/for-me')}>🧬 맞춤 추천</a>
            <a className={`nav-link${router.pathname.startsWith('/health-guide') ? ' active' : ''}`}
              style={{display:'block', padding:'13px 24px', fontSize:15, cursor:'pointer', textDecoration:'none'}}
              onClick={() => handleNav('/health-guide')}>📖 연령별 건강 가이드</a>
            <a className={`nav-link${router.pathname.startsWith('/health-map') ? ' active' : ''}`}
              style={{display:'block', padding:'13px 24px', fontSize:15, cursor:'pointer', textDecoration:'none'}}
              onClick={() => handleNav('/health-map')}>🧍 신체건강지도</a>
            <a className={`nav-link${router.pathname === '/global' ? ' active' : ''}`}
              style={{display:'block', padding:'13px 24px', fontSize:15, cursor:'pointer', textDecoration:'none'}}
              onClick={() => handleNav('/global')}>🌍 글로벌 푸드</a>
            <a className={`nav-link${router.pathname.startsWith('/blog') ? ' active' : ''}`}
              style={{display:'block', padding:'13px 24px', fontSize:15, cursor:'pointer', textDecoration:'none'}}
              onClick={() => handleNav('/blog')}>📝 블로그</a>
            <a className={`nav-link${router.pathname === '/board/free' ? ' active' : ''}`}
              style={{display:'block', padding:'13px 24px', fontSize:15, cursor:'pointer', textDecoration:'none'}}
              onClick={() => handleNav('/board/free')}>💬 자유게시판</a>
            <a className={`nav-link${router.pathname === '/board/request' ? ' active' : ''}`}
              style={{display:'block', padding:'13px 24px', fontSize:15, cursor:'pointer', textDecoration:'none'}}
              onClick={() => handleNav('/board/request')}>📬 부탁해요</a>
            <a className={`nav-link${router.pathname.startsWith('/holiday-pharmacy') ? ' active' : ''}`}
              style={{display:'block', padding:'13px 24px', fontSize:15, cursor:'pointer', textDecoration:'none'}}
              onClick={() => handleNav('/holiday-pharmacy')}>💊 휴일약국</a>
          </div>
        </div>
      )}
    </>
  )
}
