import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { REGIONS, getRegion } from '../../lib/regions'
import { SEASONS } from '../../lib/seasons'

const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12]

export async function getStaticPaths() {
  return { paths: REGIONS.map(r => ({ params: { slug: r.id } })), fallback: false }
}
export async function getStaticProps({ params }) {
  return { props: { regionId: params.slug } }
}

export default function RegionPage({ regionId }) {
  const region = getRegion(regionId)
  const [activeSeason, setActiveSeason] = useState(null)
  const [activeMonth, setActiveMonth]   = useState(null)
  const [showCities, setShowCities]     = useState(false)
  const [allFoods, setAllFoods]         = useState([])
  const [loading, setLoading]           = useState(true)

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

  // 계절 or 월 필터 (월 우선)
  const filtered = useMemo(() => {
    if (activeMonth) return allFoods.filter(f => f.months.includes(activeMonth))
    if (activeSeason) {
      const s = SEASONS.find(s => s.id === activeSeason)
      return allFoods.filter(f => s && f.months.some(m => s.months.includes(m)))
    }
    return allFoods
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
      </Head>
      <Header />
      <main className="wrap">

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
          <h2 className="section-title">
            제철 식재료 <span>{loading ? '...' : `${filtered.length}가지`}</span>
          </h2>
          {loading ? (
            <p style={{ color:'var(--text3)', fontSize:14, padding:'20px 0' }}>불러오는 중...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color:'var(--text3)', fontSize:14, padding:'20px 0' }}>해당 조건의 식재료가 없어요.</p>
          ) : (
            <div className="grid-auto">
              {filtered.map((food, i) => (
                <Link key={i} href={`/ingredient/${encodeURIComponent(food.ingredient)}`} className="card"
                  onMouseEnter={e => e.currentTarget.style.borderColor = region.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      <span style={{ fontSize:19, fontWeight:900 }}>{food.ingredient}</span>
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20,
                        background: food.is_special ? '#fef3c7' : 'var(--surface2)',
                        border: `1px solid ${food.is_special ? '#f59e0b' : 'var(--border)'}`,
                        color: food.is_special ? '#b45309' : 'var(--text3)',
                        fontWeight: food.is_special ? 700 : 400,
                      }}>🏆 {food.is_special ? '특산품' : '일반'}</span>
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20,
                        background: food.is_limited ? '#d1fae5' : 'var(--surface2)',
                        border: `1px solid ${food.is_limited ? '#10b981' : 'var(--border)'}`,
                        color: food.is_limited ? '#059669' : 'var(--text3)',
                        fontWeight: food.is_limited ? 700 : 400,
                      }}>⏰ {food.is_limited && food.limited_days ? `${food.limited_days}간 한정` : '기간제한없음'}</span>
                    </div>
                    <div style={{ display:'flex', gap:3, flexWrap:'wrap', justifyContent:'flex-end' }}>
                      {food.months.slice(0,5).map(m => (
                        <span key={m} style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background:'var(--surface2)', color:'var(--text3)' }}>{m}월</span>
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6, marginBottom:10 }}>💚 {food.health}</p>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {(food.tvPrograms||[]).map(tv => <span key={tv} className="tag">📺 {tv}</span>)}
                  </div>
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
