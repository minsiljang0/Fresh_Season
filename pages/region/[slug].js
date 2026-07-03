import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { REGIONS, getRegion } from '../../lib/regions'
import { SkeletonGrid } from '../../components/SkeletonCard'
import { SEASONS } from '../../lib/seasons'
import { AdSlot } from '../../components/AdSlot'
import { useAdSlot } from '../../lib/AdSlotsContext'
import { resolveCoupangDisplay } from '../../lib/coupang'

const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12]

export async function getStaticPaths() {
  return { paths: REGIONS.map(r => ({ params: { slug: r.id } })), fallback: false }
}
export async function getStaticProps({ params }) {
  return { props: { regionId: params.slug } }
}

export default function RegionPage({ regionId }) {
  const region = getRegion(regionId)
  const middleSlot = useAdSlot('home_middle')
  const [activeSeason, setActiveSeason] = useState(null)
  const [activeMonth, setActiveMonth]   = useState(null)
  const [showCities, setShowCities]     = useState(false)
  const [allFoods, setAllFoods]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [isMobile, setIsMobile]         = useState(false)
  const [coupangLinks, setCoupangLinks] = useState([])
  const [coupangWidgets, setCoupangWidgets] = useState([])

  // 쿠팡 파트너스 링크/위젯 목록 로드
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/coupang-links').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/admin/coupang-widgets').then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([links, widgets]) => {
      setCoupangLinks(Array.isArray(links) ? links : [])
      setCoupangWidgets(Array.isArray(widgets) ? widgets : [])
    })
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // DB에서만 데이터 로드 — 하드코딩 없음
  useEffect(() => {
    setLoading(true)
    fetch('/api/map/seasonal-foods')
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        const foods = Array.isArray(data) ? data : (data.foods || [])
        setAllFoods(foods.filter(f => f.region === regionId))
      })
      .catch(() => setAllFoods([]))
      .finally(() => setLoading(false))
  }, [regionId])

  if (!region) return null

  // 계절 or 월 필터 (월 우선) + 가나다 정렬
  const filtered = useMemo(() => {
    let data
    if (activeMonth) data = allFoods.filter(f => f.months.includes(activeMonth))
    else if (activeSeason) {
      const s = SEASONS.find(s => s.id === activeSeason)
      data = allFoods.filter(f => s && f.months.some(m => s.months.includes(m)))
    } else data = allFoods
    // 중복 제거 후 가나다 정렬
    const seen = new Set()
    return data.filter(f => { if(seen.has(f.ingredient)) return false; seen.add(f.ingredient); return true })
               .sort((a,b) => a.ingredient.localeCompare(b.ingredient, 'ko'))
  }, [allFoods, activeSeason, activeMonth])

  const handleSeason = (id) => { setActiveMonth(null); setActiveSeason(prev => prev === id ? null : id) }
  const handleMonth  = (m)  => { setActiveSeason(null); setActiveMonth(prev => prev === m ? null : m) }

  return (
    <>
      <Head>
        <title>{region.name} 제철 먹거리 — Fresh Season</title>
        <meta name="description" content={`${region.name} 지역의 제철 식재료와 건강 효능, TV 방영 레시피를 확인하세요.`} />
        <meta property="og:title" content={`${region.name} 제철 먹거리 — Fresh Season`} />
        <meta property="og:description" content={`${region.name} 지역의 제철 식재료와 건강 효능, TV 방영 레시피를 확인하세요.`} />
        <meta property="og:image" content="https://www.fsfood.kr/og-image.png" />
        <meta property="og:url" content={`https://www.fsfood.kr/region/${regionId}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Fresh Season" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`https://www.fsfood.kr/region/${regionId}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Fresh Season', item: 'https://www.fsfood.kr/' },
                { '@type': 'ListItem', position: 2, name: '제철지도', item: 'https://www.fsfood.kr/map' },
                { '@type': 'ListItem', position: 3, name: region.name, item: `https://www.fsfood.kr/region/${regionId}` },
              ],
            }),
          }}
        />
      </Head>
      <Header />
      <main className="wrap">

        {/* 전체 페이지 중단 배너 */}
        <div className="ad-banner-slot" style={{ padding: 0, margin: '20px 0 0' }}>
          <AdSlot slot="home_middle" label="중단 배너 광고" slotData={middleSlot} />
        </div>

        {/* 지역 헤더 */}
        <section className="detail-header">
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
            <div style={{
              width:58, height:58, borderRadius:16, fontSize:26,
              background:`${region.color}22`, border:`2px solid ${region.color}44`,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>{region.icon}</div>
            <div>
              <h1 style={{ fontSize:26, fontWeight:900, marginBottom:4 }}>{region.name}</h1>
              <p style={{ fontSize:13, color:'var(--text2)' }}>{region.desc}</p>
            </div>
          </div>
          <button onClick={() => setShowCities(!showCities)}
            style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'5px 12px', fontSize:12, color:'var(--text2)', cursor:'pointer', fontFamily:'inherit' }}>
            {showCities ? '▲' : '▼'} 포함 시군구 ({region.districts.length}개)
          </button>
          {showCities && (
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:10 }}>
              {region.districts.map(c => <span key={c} className="tag" style={{ fontSize:11 }}>{c}</span>)}
            </div>
          )}
        </section>

        {/* 지역 특산물 쇼핑하기 — 이 지역 특산품 중 쿠팡 정보가 등록된 재료만 개별 카드로 노출 */}
        {(() => {
          // 1순위: 이 지역 특산품(is_special)이면서 재료 자체에 쿠팡 URL/배너가 등록된 것들
          const specialFoods = allFoods.filter(f => f.is_special && (f.coupang_url || f.coupang_banner_html))

          if (specialFoods.length > 0) {
            return (
              <section className="detail-box" style={{ marginBottom: 24 }}>
                <p className="detail-label">🛒 {region.name} 특산물 쇼핑하기</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  {specialFoods.map((food, i) => {
                    const cp = resolveCoupangDisplay(coupangLinks, coupangWidgets, food)
                    if (cp.links.length === 0 && cp.widgets.length === 0) return null
                    return (
                      <div key={i} style={{ maxWidth: 180 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>{food.ingredient}</div>
                        {cp.widgets.map((html, j) => (
                          <div key={j} dangerouslySetInnerHTML={{ __html: html }} />
                        ))}
                        {cp.links.map((l, j) => (
                          <a key={j} href={l.url} target="_blank" rel="noopener noreferrer sponsored"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
                              fontSize: 12, fontWeight: 700, color: '#fff',
                              background: '#ea580c', borderRadius: 10, padding: '7px 14px',
                              textDecoration: 'none',
                            }}>
                            🛒 {l.label}
                          </a>
                        ))}
                      </div>
                    )
                  })}
                </div>
                <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 12 }}>
                  이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.
                </p>
              </section>
            )
          }

          // 2순위(폴백): 이 지역 특산품 중 쿠팡 정보가 등록된 재료가 하나도 없으면
          // 전체 공통 링크/위젯 목록(사이즈 없는 것만)으로 대체
          const cp = resolveCoupangDisplay(coupangLinks, coupangWidgets, {})
          if (cp.links.length === 0 && cp.widgets.length === 0) return null
          return (
            <section className="detail-box" style={{ marginBottom: 24 }}>
              <p className="detail-label">🛒 {region.name} 특산물 쇼핑하기</p>
              {cp.links.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {cp.links.map((l, i) => (
                    <a key={i} href={l.url} target="_blank" rel="noopener noreferrer sponsored"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: 13, fontWeight: 700, color: '#fff',
                        background: '#ea580c', borderRadius: 10, padding: '9px 16px',
                        textDecoration: 'none',
                      }}>
                      🛒 {l.label}
                    </a>
                  ))}
                </div>
              )}
              {cp.widgets.map((html, i) => (
                <div key={i} style={{ marginTop: 8 }} dangerouslySetInnerHTML={{ __html: html }} />
              ))}
              <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 8 }}>
                이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.
              </p>
            </section>
          )
        })()}

        {/* 계절 필터 */}
        <section style={{ marginBottom:10 }}>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button onClick={() => { setActiveSeason(null); setActiveMonth(null) }} className="month-pill"
              style={{
                borderColor: (!activeSeason && !activeMonth) ? region.color : undefined,
                background:  (!activeSeason && !activeMonth) ? `${region.color}22` : undefined,
                color:       (!activeSeason && !activeMonth) ? region.color : undefined,
                fontWeight: 600,
              }}>전체</button>
            {SEASONS.map(s => {
              const on = activeSeason === s.id
              return (
                <button key={s.id} onClick={() => handleSeason(s.id)} className="month-pill"
                  style={{ borderColor: on ? s.color : undefined, background: on ? `${s.color}22` : undefined, color: on ? s.color : undefined, fontWeight: 600 }}>
                  {s.icon} {s.name}
                </button>
              )
            })}
          </div>
        </section>

        {/* 월 필터 */}
        <section style={{ marginBottom:28 }}>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {MONTHS.map(m => {
              const on = activeMonth === m
              return (
                <button key={m} onClick={() => handleMonth(m)} className="month-pill"
                  style={{
                    borderColor: on ? region.color : undefined,
                    background:  on ? `${region.color}22` : undefined,
                    color:       on ? region.color : undefined,
                    fontWeight:  on ? 700 : 500,
                    fontSize: 12, padding: '4px 10px',
                  }}>
                  {m}월
                </button>
              )
            })}
          </div>
        </section>

        {/* 식재료 카드 */}
        <section style={{ marginBottom:52 }}>

          {/* 특산품 · 기간한정 전용 섹션 — 항상 표시 */}
          <div style={{ marginBottom:24 }}>
            <div style={{ marginBottom:14 }}>
              <h3 style={{ fontSize:14, fontWeight:800, marginBottom:8, color:'#b45309' }}>🏆 특산품</h3>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {allFoods.filter(f => f.is_special).length > 0
                  ? allFoods.filter(f => f.is_special).map((food, i) => (
                      <a key={i} href={`/ingredient/${encodeURIComponent(food.ingredient)}`}
                        style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 14px',
                          borderRadius:20, background:'#fef3c7', border:'1.5px solid #f59e0b',
                          color:'#b45309', fontWeight:700, fontSize:13, textDecoration:'none' }}>
                        🏆 {food.ingredient}
                      </a>
                    ))
                  : <span style={{ fontSize:13, color:'var(--text3)' }}>등록된 특산품이 없습니다</span>
                }
              </div>
            </div>
            <div>
              <h3 style={{ fontSize:14, fontWeight:800, marginBottom:8, color:'#059669' }}>⏰ 기간한정</h3>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {allFoods.filter(f => f.is_limited && f.limited_days).length > 0
                  ? allFoods.filter(f => f.is_limited && f.limited_days).map((food, i) => (
                      <a key={i} href={`/ingredient/${encodeURIComponent(food.ingredient)}`}
                        style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 14px',
                          borderRadius:20, background:'#d1fae5', border:'1.5px solid #10b981',
                          color:'#059669', fontWeight:700, fontSize:13, textDecoration:'none' }}>
                        ⏰ {food.ingredient} · {food.limited_days}간 한정
                      </a>
                    ))
                  : <span style={{ fontSize:13, color:'var(--text3)' }}>등록된 기간한정 상품이 없습니다</span>
                }
              </div>
            </div>
          </div>

          <h2 className="section-title">
            제철 식재료 <span>{loading ? '...' : `${filtered.length}가지`}</span>
          </h2>
          {loading ? (
            <SkeletonGrid count={6} isMobile={isMobile} />
          ) : filtered.length === 0 ? (
            <p style={{ color:'var(--text3)', fontSize:14, padding:'20px 0' }}>해당 조건의 식재료가 없어요.</p>
          ) : isMobile ? (
            /* 모바일: 2열 그리드 소형 카드 */
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
              {filtered.map((food, i) => (
                <Link key={i} href={`/ingredient/${encodeURIComponent(food.ingredient)}`} className="card"
                  style={{ padding:'10px 12px' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = region.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:19, fontWeight:900 }}>{food.ingredient}</span>
                    <div style={{ display:'flex', gap:3, flexWrap:'wrap', justifyContent:'flex-end' }}>
                      {food.months.slice(0,5).map(m => (
                        <span key={m} style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background:'var(--surface2)', color:'var(--text3)' }}>{m}월</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:8 }}>
                    {food.is_superfood && <span style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f59e0b18',color:'#d97706',border:'1px solid #f59e0b44'}}>🌟 슈퍼푸드</span>}
                    {food.is_brand     && <span style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#e6394618',color:'#e63946',border:'1px solid #e6394644'}}>🏷️ 지역브랜드</span>}
                    {food.is_special   && <span style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fef3c7',color:'#b45309',border:'1px solid #f59e0b'}}>🏆 특산품</span>}
                    {food.is_limited && food.limited_days && <span style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#d1fae5',color:'#059669',border:'1px solid #10b981'}}>⏰ {food.limited_days}간 한정</span>}
                    {food.is_global    && <span style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#3b82f618',color:'#2563eb',border:'1px solid #3b82f644'}}>🌍 해외</span>}
                    {(Array.isArray(food.season_badge)?food.season_badge:[food.season_badge]).filter(Boolean).map(s=>(
                      s==='spring'?<span key="sp" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f0fdf4',color:'#166534',border:'1px solid #86efac'}}>🌸 봄</span>:
                      s==='summer'?<span key="su" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fefce8',color:'#92400e',border:'1px solid #fde68a'}}>🌞 여름</span>:
                      s==='fall'  ?<span key="fa" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fff7ed',color:'#c2410c',border:'1px solid #fdba74'}}>🍂 가을</span>:
                      s==='winter'?<span key="wi" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#eff6ff',color:'#1e40af',border:'1px solid #bae6fd'}}>❄️ 겨울</span>:null
                    ))}
                    {(Array.isArray(food.jeolgi_badge)?food.jeolgi_badge:[food.jeolgi_badge]).filter(Boolean).map(j=>(
                      j==='sambok'    ?<span key="sambok"     style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fff1f2',color:'#be123c',border:'1px solid #fecdd3'}}>🔥 삼복</span>:
                      j==='chopbok'   ?<span key="chopbok"    style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fff1f2',color:'#be123c',border:'1px solid #fecdd3'}}>🔥 초복</span>:
                      j==='jungbok'   ?<span key="jungbok"    style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fff1f2',color:'#be123c',border:'1px solid #fecdd3'}}>🔥 중복</span>:
                      j==='malbok'    ?<span key="malbok"     style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fff1f2',color:'#be123c',border:'1px solid #fecdd3'}}>🔥 말복</span>:
                      j==='chuseok'   ?<span key="chuseok"   style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fefce8',color:'#854d0e',border:'1px solid #fde68a'}}>🌕 추석</span>:
                      j==='gimjang'   ?<span key="gimjang"   style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f0fdf4',color:'#166534',border:'1px solid #86efac'}}>🥬 김장철</span>:
                      j==='dongji'    ?<span key="dongji"    style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#eff6ff',color:'#1e40af',border:'1px solid #bae6fd'}}>☯️ 동지</span>:
                      j==='seollal'   ?<span key="seollal"   style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fdf4ff',color:'#7e22ce',border:'1px solid #e9d5ff'}}>🎍 설날</span>:
                      j==='ipchun'    ?<span key="ipchun"    style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f0fdf4',color:'#166534',border:'1px solid #86efac'}}>🌱 입춘</span>:
                      j==='daeboreum' ?<span key="daeboreum" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fef9c3',color:'#713f12',border:'1px solid #fde68a'}}>🌕 정월대보름</span>:
                      j==='dano'      ?<span key="dano"      style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f0fdf4',color:'#166534',border:'1px solid #86efac'}}>🌿 단오</span>:
                      j==='hansik'    ?<span key="hansik"    style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fdf4ff',color:'#7e22ce',border:'1px solid #e9d5ff'}}>🌸 한식</span>:null
                    ))}
                    {(Array.isArray(food.special_badge)?food.special_badge:[food.special_badge]).filter(Boolean).map(s=>(
                      s==='boyangshik' ?<span key="bo" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fff7ed',color:'#c2410c',border:'1px solid #fed7aa'}}>💪 보양식</span>:
                      s==='jeolgi_food'?<span key="je" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fdf4ff',color:'#7e22ce',border:'1px solid #e9d5ff'}}>🎋 절기음식</span>:
                      s==='hangover'   ?<span key="ha" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fefce8',color:'#854d0e',border:'1px solid #fde68a'}}>🍶 해장</span>:
                      s==='diet'       ?<span key="di" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f0fdf4',color:'#166534',border:'1px solid #86efac'}}>🥗 다이어트</span>:null
                    ))}
                    {(Array.isArray(food.habitat_badge)?food.habitat_badge:[food.habitat_badge]).filter(Boolean).map(h=>(
                      h==='island'    ?<span key="isl" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f0f9ff',color:'#0369a1',border:'1px solid #7dd3fc'}}>🏝️ 섬</span>:
                      h==='freshwater'?<span key="frw" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#eff6ff',color:'#1d4ed8',border:'1px solid #93c5fd'}}>🐟 민물</span>:
                      h==='tidal'     ?<span key="tid" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f0fdfa',color:'#0f766e',border:'1px solid #5eead4'}}>🌊 갯벌</span>:
                      h==='mountain'  ?<span key="mtn" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f7fee7',color:'#3f6212',border:'1px solid #a3e635'}}>🏔️ 산</span>:
                      h==='ocean'     ?<span key="ocn" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f0f9ff',color:'#0c4a6e',border:'1px solid #38bdf8'}}>🌊 바다</span>:null
                    ))}
                    {(Array.isArray(food.farming_badge)?food.farming_badge:[food.farming_badge]).filter(Boolean).map(p=>(
                      p==='aquaculture'?<span key="aqu" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fdf4ff',color:'#7e22ce',border:'1px solid #d8b4fe'}}>🤿 양식</span>:
                      p==='wild'       ?<span key="wld" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fff7ed',color:'#c2410c',border:'1px solid #fdba74'}}>🎣 자연산</span>:
                      p==='fermented'  ?<span key="fer" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fef9c3',color:'#713f12',border:'1px solid #fde68a'}}>🥟 발효</span>:null
                    ))}
                  </div>
                  {/* 건강효능 태그 */}
                  {(food.healthBenefits||[]).length > 0 && (() => {
                    const BENEFIT_COLOR = {'면역':['#16a34a','#dcfce7'],'두뇌':['#6366f1','#ede9fe'],'눈':['#6366f1','#ede9fe'],'혈관':['#ef4444','#fee2e2'],'심장':['#ef4444','#fee2e2'],'혈압':['#ef4444','#fee2e2'],'뼈':['#f59e0b','#fef3c7'],'관절':['#f59e0b','#fef3c7'],'소화':['#10b981','#d1fae5'],'장':['#10b981','#d1fae5'],'피부':['#ec4899','#fce7f3'],'미용':['#ec4899','#fce7f3'],'체중':['#8b5cf6','#ede9fe'],'다이어트':['#8b5cf6','#ede9fe'],'항암':['#dc2626','#fee2e2'],'항산화':['#16a34a','#dcfce7']}
                    const getBenefitStyle = (cat) => {
                      for (const [key,[color,bg]] of Object.entries(BENEFIT_COLOR)) { if(cat&&cat.includes(key)) return {color,bg} }
                      return {color:'#6b7280',bg:'#f3f4f6'}
                    }
                    return (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
                        {(food.healthBenefits||[]).slice(0,5).map(b => {
                          const {color,bg} = getBenefitStyle(b.category)
                          return <span key={b.id} style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:600,background:bg,border:`1px solid ${color}44`,color}}>{b.name}</span>
                        })}
                        {(food.healthBenefits||[]).length > 5 && <span style={{fontSize:10,color:'#9ca3af',padding:'2px 4px'}}>+{(food.healthBenefits||[]).length-5}</span>}
                      </div>
                    )
                  })()}
                  <p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6, marginBottom:10 }}>💚 {food.health}</p>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {(food.tvPrograms||[]).map(tv => <span key={tv} className="tag">📺 {tv}</span>)}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* 데스크탑: 원래 grid-auto 그대로 */
            <div className="grid-auto">
              {filtered.map((food, i) => (
                <Link key={i} href={`/ingredient/${encodeURIComponent(food.ingredient)}`} className="card"
                  onMouseEnter={e => e.currentTarget.style.borderColor = region.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:19, fontWeight:900 }}>{food.ingredient}</span>
                    <div style={{ display:'flex', gap:3, flexWrap:'wrap', justifyContent:'flex-end' }}>
                      {food.months.slice(0,5).map(m => (
                        <span key={m} style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background:'var(--surface2)', color:'var(--text3)' }}>{m}월</span>
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6, marginBottom:10 }}>💚 {food.health}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <Link href="/" className="back-link">← 전체 지역 보기</Link>
      </main>
      <Footer />
    </>
  )
}
