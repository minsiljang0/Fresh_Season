import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { REGIONS } from '../lib/regions'
import { SEASONS, getCurrentSeason, getSeasonByMonth } from '../lib/seasons'

export default function Home() {
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth() + 1)
  const [activeRegion, setActiveRegion] = useState(null)
  const [allFoods, setAllFoods] = useState([])
  const [loading, setLoading] = useState(true)

  const currentSeason = getCurrentSeason()

  // DB 데이터만 로드
  useEffect(() => {
    fetch('/api/map/seasonal-foods')
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        const foods = Array.isArray(data) ? data : (data.foods || [])
        setAllFoods(foods)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const monthFoods = useMemo(() =>
    allFoods.filter(f => f.months && f.months.includes(activeMonth)),
    [allFoods, activeMonth]
  )

  const filteredFoods = useMemo(() => {
    const base = activeRegion ? monthFoods.filter(f => f.region === activeRegion) : monthFoods
    // 식재료명 기준 중복 제거 후 가나다 정렬
    const seen = new Set()
    const unique = base.filter(f => {
      if (seen.has(f.ingredient)) return false
      seen.add(f.ingredient)
      return true
    })
    return unique.sort((a, b) => a.ingredient.localeCompare(b.ingredient, 'ko'))
  }, [monthFoods, activeRegion])

  const [expandedCards, setExpandedCards] = useState({})
  const toggleCard = (key) => setExpandedCards(p => ({...p, [key]: !p[key]}))

  return (
    <>
      <Head>
        <title>Fresh Season — 지역별 제철 먹거리 &amp; TV 레시피</title>
        <meta name="description" content="전국 17개 지역별 제철 식재료, 건강 효능, TV 방영 레시피를 한 곳에서 만나보세요. 지금 제철인 식재료를 확인하고 건강한 밥상을 차려보세요." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Fresh Season — 지역별 제철 먹거리 &amp; TV 레시피" />
        <meta property="og:description" content="전국 17개 지역별 제철 식재료, 건강 효능, TV 방영 레시피를 한 곳에서 만나보세요. 지금 제철인 식재료를 확인하고 건강한 밥상을 차려보세요." />
        <meta property="og:image" content="https://www.fsfood.kr/og-image.png" />
        <meta property="og:url" content="https://www.fsfood.kr/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Fresh Season" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Fresh Season — 지역별 제철 먹거리 &amp; TV 레시피" />
        <meta name="twitter:description" content="전국 17개 지역별 제철 식재료, 건강 효능, TV 방영 레시피를 한 곳에서 만나보세요. 지금 제철인 식재료를 확인하고 건강한 밥상을 차려보세요." />
        <meta name="twitter:image" content="https://www.fsfood.kr/og-image.png" />
        <link rel="canonical" href="https://www.fsfood.kr/" />
      </Head>
      <Header />
      <main className="wrap">

        {/* 히어로 */}
        <section className="hero">
          <div className="hero-badge">
            {currentSeason.icon} 지금은 {currentSeason.name}철 — {currentSeason.desc}
          </div>
          <h1 className="hero-title">
            지역에서 나고<br />
            <span style={{ color: 'var(--accent)' }}>제철에 먹는</span> 건강한 밥상
          </h1>
          <p className="hero-sub">전국 제철 식재료 × 건강 효능 × TV 방영 레시피</p>
        </section>

        {/* 월 선택 */}
        <section style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10, fontWeight: 700 }}>📅 월별 제철 보기</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
              const s = getSeasonByMonth(m)
              const on = m === activeMonth
              return (
                <button key={m} onClick={() => setActiveMonth(m)} className="month-pill"
                  style={{
                    borderColor: on ? s.color : undefined,
                    background: on ? `${s.color}22` : undefined,
                    color: on ? s.color : undefined,
                    fontWeight: on ? 700 : undefined,
                  }}>
                  {m}월
                </button>
              )
            })}
          </div>
        </section>

        {/* 지역 필터 */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10, fontWeight: 700 }}>🗺 지역 필터</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setActiveRegion(null)} className="month-pill"
              style={{ borderColor: !activeRegion ? '#888' : undefined, color: !activeRegion ? 'var(--text)' : undefined, fontWeight: 600 }}>
              전체
            </button>
            {REGIONS.map(r => {
              const on = activeRegion === r.id
              return (
                <button key={r.id} onClick={() => setActiveRegion(on ? null : r.id)} className="month-pill"
                  style={{ borderColor: on ? r.color : undefined, background: on ? `${r.color}22` : undefined, color: on ? r.color : undefined, fontWeight: 600 }}>
                  {r.icon} {r.name}
                </button>
              )
            })}
          </div>
        </section>

        {/* 이달의 제철 재료 */}
        <section style={{ marginBottom: 52 }}>
          <h2 className="section-title">
            {activeMonth}월 제철 재료
            <span>{loading ? '...' : `${filteredFoods.length}가지`}</span>
          </h2>
          {loading
            ? <p style={{ color: 'var(--text2)', fontSize: 14 }}>불러오는 중...</p>
            : filteredFoods.length === 0
              ? <p style={{ color: 'var(--text2)', fontSize: 14 }}>해당 조건의 제철 재료가 없어요.</p>
              : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {filteredFoods.map((food, i) => {
                    const region = REGIONS.find(r => r.id === food.region)
                    const cardKey = food.ingredient + '_' + i
                    const expanded = expandedCards[cardKey]
                    const shortDesc = food.health && food.health.length > 10 ? food.health.slice(0,10) + '...' : food.health
                    const BENEFIT_COLOR = {'면역':['#16a34a','#dcfce7'],'두뇌':['#6366f1','#ede9fe'],'눈':['#6366f1','#ede9fe'],'혈관':['#ef4444','#fee2e2'],'심장':['#ef4444','#fee2e2'],'혈압':['#ef4444','#fee2e2'],'뼈':['#f59e0b','#fef3c7'],'관절':['#f59e0b','#fef3c7'],'소화':['#10b981','#d1fae5'],'장':['#10b981','#d1fae5'],'피부':['#ec4899','#fce7f3'],'미용':['#ec4899','#fce7f3'],'체중':['#8b5cf6','#ede9fe'],'다이어트':['#8b5cf6','#ede9fe'],'항암':['#dc2626','#fee2e2'],'항산화':['#16a34a','#dcfce7']}
                    const getBenefitStyle = (cat) => { for (const [key,[color,bg]] of Object.entries(BENEFIT_COLOR)) { if(cat&&cat.includes(key)) return {color,bg} } return {color:'#6b7280',bg:'#f3f4f6'} }
                    return (
                      <div key={cardKey} className="card"
                        style={{ cursor:'pointer', padding:'12px 14px' }}
                        onClick={() => toggleCard(cardKey)}>
                        {/* 항상 보이는 부분 */}
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
                            <span style={{ fontSize:17, fontWeight:900, whiteSpace:'nowrap' }}>{food.ingredient}</span>
                            {/* 뱃지들 */}
                            <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                              {food.is_superfood && <span style={{fontSize:9,padding:'1px 5px',borderRadius:999,fontWeight:700,background:'#fef3c7',color:'#b45309',border:'1px solid #f59e0b'}}>🌟</span>}
                              {food.is_special && <span style={{fontSize:9,padding:'1px 5px',borderRadius:999,fontWeight:700,background:'#fef3c7',color:'#b45309',border:'1px solid #f59e0b'}}>🏆</span>}
                              {food.is_brand && <span style={{fontSize:9,padding:'1px 5px',borderRadius:999,fontWeight:700,background:'#fee2e2',color:'#dc2626',border:'1px solid #f87171'}}>🏷️</span>}
                              {(food.season_badge||[]).map(s=>s==='spring'?<span key={s} style={{fontSize:9,padding:'1px 5px',borderRadius:999,background:'#f0fdf4',color:'#166534',border:'1px solid #86efac'}}>🌸</span>:s==='summer'?<span key={s} style={{fontSize:9,padding:'1px 5px',borderRadius:999,background:'#fefce8',color:'#92400e',border:'1px solid #fde68a'}}>🌞</span>:s==='fall'?<span key={s} style={{fontSize:9,padding:'1px 5px',borderRadius:999,background:'#fff7ed',color:'#c2410c',border:'1px solid #fdba74'}}>🍂</span>:s==='winter'?<span key={s} style={{fontSize:9,padding:'1px 5px',borderRadius:999,background:'#eff6ff',color:'#1e40af',border:'1px solid #bae6fd'}}>❄️</span>:null)}
                              {(food.habitat_badge||[]).map(h=>h==='ocean'?<span key={h} style={{fontSize:9,padding:'1px 5px',borderRadius:999,background:'#f0f9ff',color:'#0c4a6e',border:'1px solid #38bdf8'}}>🌊</span>:h==='island'?<span key={h} style={{fontSize:9,padding:'1px 5px',borderRadius:999,background:'#f0f9ff',color:'#0369a1',border:'1px solid #7dd3fc'}}>🏝️</span>:h==='tidal'?<span key={h} style={{fontSize:9,padding:'1px 5px',borderRadius:999,background:'#f0fdfa',color:'#0f766e',border:'1px solid #5eead4'}}>🌊</span>:h==='mountain'?<span key={h} style={{fontSize:9,padding:'1px 5px',borderRadius:999,background:'#f7fee7',color:'#3f6212',border:'1px solid #a3e635'}}>🏔️</span>:h==='freshwater'?<span key={h} style={{fontSize:9,padding:'1px 5px',borderRadius:999,background:'#eff6ff',color:'#1d4ed8',border:'1px solid #93c5fd'}}>🐟</span>:null)}
                              {(food.farming_badge||[]).map(p=>p==='aquaculture'?<span key={p} style={{fontSize:9,padding:'1px 5px',borderRadius:999,background:'#fdf4ff',color:'#7e22ce',border:'1px solid #d8b4fe'}}>🤿</span>:p==='wild'?<span key={p} style={{fontSize:9,padding:'1px 5px',borderRadius:999,background:'#fff7ed',color:'#c2410c',border:'1px solid #fdba74'}}>🎣</span>:p==='fermented'?<span key={p} style={{fontSize:9,padding:'1px 5px',borderRadius:999,background:'#fef9c3',color:'#713f12',border:'1px solid #fde68a'}}>🥟</span>:null)}
                            </div>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                            {region && <span className="badge" style={{ background:`${region.color}22`, color:region.color, border:`1px solid ${region.color}44`, fontSize:10 }}>{region.icon} {region.name.replace('특별자치도','').replace('광역시','').replace('특별자치시','').replace('특별시','').replace('도','도').trim()}</span>}
                            <span style={{ fontSize:12, color:'var(--text3)' }}>{expanded ? '▲' : '▼'}</span>
                          </div>
                        </div>
                        {/* 설명 - 접힌 상태: 10자, 펼친 상태: 전체 */}
                        <p style={{ fontSize:11, color:'var(--text2)', marginTop:6, lineHeight:1.5 }}>
                          💚 {expanded ? food.health : shortDesc}
                        </p>
                        {/* 펼쳤을 때만 보이는 부분 */}
                        {expanded && (
                          <div style={{ marginTop:8 }}>
                            {/* 건강효능 태그 */}
                            {(food.healthBenefits||[]).length > 0 && (
                              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
                                {(food.healthBenefits||[]).slice(0,5).map(b => {
                                  const {color,bg} = getBenefitStyle(b.category)
                                  return <span key={b.id} style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:600,background:bg,border:`1px solid ${color}44`,color}}>{b.name}</span>
                                })}
                                {(food.healthBenefits||[]).length > 5 && <span style={{fontSize:10,color:'#9ca3af'}}>+{(food.healthBenefits||[]).length-5}</span>}
                              </div>
                            )}
                            {/* TV 프로그램 */}
                            {(food.tvPrograms||[]).length > 0 && (
                              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:6 }}>
                                {(food.tvPrograms||[]).map(tv => <span key={tv} className="tag">📺 {tv}</span>)}
                              </div>
                            )}
                            <Link href={`/ingredient/${encodeURIComponent(food.ingredient)}`}
                              onClick={e => e.stopPropagation()}
                              style={{ fontSize:11, color:'var(--accent)', fontWeight:700, textDecoration:'none' }}>
                              자세히 보기 →
                            </Link>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
          }
        </section>

        {/* 지역 카드 */}
        <section style={{ marginBottom: 64 }}>
          <h2 className="section-title">지역별 제철 탐색</h2>
          <div className="grid-regions">
            {REGIONS.map(r => (
              <Link key={r.id} href={`/region/${r.id}`} className="card"
                onMouseEnter={e => e.currentTarget.style.borderColor = r.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 14,
                  background: `${r.color}22`, border: `1.5px solid ${r.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>{r.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{r.name}</div>
                <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{r.desc}</p>
              </Link>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
