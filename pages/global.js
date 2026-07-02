import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { SkeletonGrid } from '../components/SkeletonCard'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { resolveCoupangDisplay } from '../lib/coupang'
import { AdSlot } from '../components/AdSlot'
import { useAdSlot } from '../lib/AdSlotsContext'

// 카테고리별 색상/아이콘
const CAT_META = {
  fish:     { label:'수산물',   icon:'🐟', color:'#0ea5e9', bg:'#e0f2fe' },
  veg:      { label:'채소·나물', icon:'🥦', color:'#22c55e', bg:'#dcfce7' },
  fruit:    { label:'과일',     icon:'🍎', color:'#f97316', bg:'#ffedd5' },
  grain:    { label:'곡물·가공', icon:'🌾', color:'#eab308', bg:'#fef9c3' },
  meat:     { label:'육류',     icon:'🥩', color:'#ef4444', bg:'#fee2e2' },
  mushroom: { label:'버섯',     icon:'🍄', color:'#a855f7', bg:'#f3e8ff' },
  other:    { label:'기타',     icon:'🌿', color:'#14b8a6', bg:'#ccfbf1' },
}

// 건강효능 카테고리별 색상
const BENEFIT_COLOR = {
  '면역·항산화': '#16a34a',
  '두뇌·눈':     '#6366f1',
  '혈관·심장':   '#ef4444',
  '뼈·관절':     '#f59e0b',
  '소화·장':     '#10b981',
  '피부·미용':   '#ec4899',
  '체중·다이어트':'#8b5cf6',
  '항암':        '#dc2626',
}

function getBenefitColor(cat) {
  for (const key of Object.keys(BENEFIT_COLOR)) {
    if (cat && cat.includes(key.split('·')[0])) return BENEFIT_COLOR[key]
  }
  return '#6b7280'
}

export default function GlobalPage() {
  const middleSlot = useAdSlot('home_middle')
  const [ingredients, setIngredients] = useState([])
  const [healthMap, setHealthMap]     = useState({})   // ingredient_id → [benefit]
  const [loading, setLoading]         = useState(true)
  const [selCat, setSelCat]           = useState('all')
  const [selBenefit, setSelBenefit]   = useState('all')
  const [query, setQuery]             = useState('')
  const [allBenefits, setAllBenefits] = useState([])
  const [coupangLinks, setCoupangLinks]   = useState([])
  const [coupangWidgets, setCoupangWidgets] = useState([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [ingRes, benefitRes, coupangLinksRes, coupangWidgetsRes] = await Promise.all([
          fetch('/api/admin/map-data?type=ingredients'),
          fetch('/api/admin/map-data?type=health_benefits'),
          fetch('/api/admin/coupang-links'),
          fetch('/api/admin/coupang-widgets'),
        ])
        const allIng      = ingRes.ok  ? await ingRes.json()     : []
        const allBenefits = benefitRes.ok ? await benefitRes.json() : []
        if (coupangLinksRes.ok) setCoupangLinks(await coupangLinksRes.json())
        if (coupangWidgetsRes.ok) setCoupangWidgets(await coupangWidgetsRes.json())

        // is_global 식재료만 필터
        const globalIng = allIng.filter(i => i.is_global)
        setIngredients(globalIng)
        setAllBenefits(allBenefits)

        // 각 식재료의 건강효능 연결 로드
        if (globalIng.length) {
          const healthResults = await Promise.all(
            globalIng.map(i =>
              fetch(`/api/admin/map-data?type=ingredient_health&ingredient_id=${i.id}`)
                .then(r => r.ok ? r.json() : [])
                .then(rows => ({ id: i.id, benefits: rows.map(r => r.health_benefits).filter(Boolean) }))
            )
          )
          const map = {}
          healthResults.forEach(({ id, benefits }) => { map[id] = benefits })
          setHealthMap(map)
        }
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    load()
  }, [])

  // 카테고리 목록 (실제 있는 것만)
  const categories = useMemo(() => {
    const cats = [...new Set(ingredients.map(i => i.category || 'other'))]
    return cats.sort()
  }, [ingredients])

  // 건강효능 목록 (실제 연결된 것만)
  const benefitOptions = useMemo(() => {
    const seen = new Set()
    const result = []
    Object.values(healthMap).flat().forEach(b => {
      if (!seen.has(b.id)) { seen.add(b.id); result.push(b) }
    })
    return result.sort((a, b) => a.name.localeCompare(b.name))
  }, [healthMap])

  // 필터링
  const filtered = useMemo(() => {
    return ingredients.filter(i => {
      const catOk  = selCat === 'all' || (i.category || 'other') === selCat
      const benefits = healthMap[i.id] || []
      const benOk  = selBenefit === 'all' || benefits.some(b => b.id === selBenefit)
      const qOk    = !query || i.name.includes(query) || (i.description || '').includes(query)
      return catOk && benOk && qOk
    })
  }, [ingredients, selCat, selBenefit, query, healthMap])

  const catMeta = (cat) => CAT_META[cat] || CAT_META.other

  return (
    <>
      <Head>
        <title>🌍 글로벌 슈퍼푸드 — Fresh Season</title>
        <meta name="description" content="세계 10대 슈퍼푸드, 글로벌 건강식재료 정보와 건강효능을 한눈에 확인하세요." />
      </Head>
      <Header />
      <main style={{ maxWidth:1100, margin:'0 auto', padding:'32px 16px 80px' }}>

        {/* 전체 페이지 중단 배너 */}
        <div className="ad-banner-slot" style={{ maxWidth: '100%', padding: 0, margin: '0 0 20px' }}>
          <AdSlot slot="home_middle" label="중단 배너 광고" slotData={middleSlot} />
        </div>

        {/* 히어로 */}
        <div style={{
          background:'linear-gradient(135deg, #1e3a5f 0%, #0f766e 100%)',
          borderRadius:20, padding:'40px 36px', marginBottom:32, color:'#fff',
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', right:30, top:10, fontSize:80, opacity:0.15, userSelect:'none' }}>🌍</div>
          <div style={{ fontSize:13, fontWeight:700, letterSpacing:'0.1em', opacity:0.7, marginBottom:8 }}>
            GLOBAL SUPERFOODS
          </div>
          <h1 style={{ fontSize:28, fontWeight:900, margin:'0 0 8px', lineHeight:1.3 }}>
            세계가 인정한 슈퍼푸드
          </h1>
          <p style={{ fontSize:15, opacity:0.8, margin:'0 0 20px' }}>
            세계 10대 슈퍼푸드부터 글로벌 건강식품까지 — 원산지·효능·활용법 총정리
          </p>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            {[
              { icon:'🌿', label:'항산화 강자' },
              { icon:'🧠', label:'뇌 건강 식품' },
              { icon:'❤️', label:'심혈관 보호' },
              { icon:'💪', label:'근육·단백질' },
            ].map(t => (
              <div key={t.label} style={{
                display:'flex', alignItems:'center', gap:6,
                background:'rgba(255,255,255,0.12)', borderRadius:999, padding:'6px 14px',
                fontSize:13, fontWeight:600,
              }}>
                {t.icon} {t.label}
              </div>
            ))}
          </div>
        </div>

        {/* 필터 */}
        <div style={{
          background:'#fff', borderRadius:14, padding:'18px 20px', marginBottom:24,
          boxShadow:'0 1px 6px rgba(0,0,0,0.06)', border:'1px solid #e5e7eb',
          display:'flex', gap:12, flexWrap:'wrap', alignItems:'center',
        }}>
          {/* 검색 */}
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="🔍 식재료 검색..."
            style={{
              border:'1.5px solid #e5e7eb', borderRadius:10, padding:'8px 14px',
              fontSize:14, outline:'none', fontFamily:'inherit', width:200,
            }}
          />

          {/* 카테고리 */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <button
              onClick={() => setSelCat('all')}
              style={{
                padding:'6px 14px', borderRadius:999, border:`1.5px solid ${selCat==='all'?'#3b82f6':'#e5e7eb'}`,
                background: selCat==='all' ? '#3b82f6' : '#fff',
                color: selCat==='all' ? '#fff' : '#6b7280',
                fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              }}>전체</button>
            {categories.map(cat => {
              const m = catMeta(cat)
              return (
                <button key={cat}
                  onClick={() => setSelCat(selCat === cat ? 'all' : cat)}
                  style={{
                    padding:'6px 14px', borderRadius:999,
                    border:`1.5px solid ${selCat===cat ? m.color : '#e5e7eb'}`,
                    background: selCat===cat ? m.color : '#fff',
                    color: selCat===cat ? '#fff' : '#6b7280',
                    fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                  }}>
                  {m.icon} {m.label}
                </button>
              )
            })}
          </div>

          {/* 건강효능 드롭다운 */}
          {benefitOptions.length > 0 && (
            <select
              value={selBenefit}
              onChange={e => setSelBenefit(e.target.value)}
              style={{
                border:'1.5px solid #e5e7eb', borderRadius:10, padding:'7px 12px',
                fontSize:13, fontFamily:'inherit', background:'#fff', cursor:'pointer', outline:'none',
              }}>
              <option value="all">💊 건강효능 전체</option>
              {benefitOptions.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}

          <span style={{ fontSize:13, color:'#9ca3af', marginLeft:'auto' }}>
            {filtered.length}개
          </span>
        </div>

        {/* 카드 그리드 */}
        {loading ? (
          <><style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
          <SkeletonGrid count={8} isMobile={false} /></>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'#9ca3af' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
            <div style={{ fontSize:15 }}>
              {ingredients.length === 0
                ? '아직 등록된 글로벌 식재료가 없습니다.\n관리자 페이지에서 식재료 등록 시 "🌍 해외 식재료"를 체크하면 여기에 표시됩니다.'
                : '검색 결과가 없습니다.'}
            </div>
          </div>
        ) : (
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))',
            gap:18,
          }}>
            {filtered.map(ing => {
              const m       = catMeta(ing.category || 'other')
              const benefits = healthMap[ing.id] || []
              return (
                <div key={ing.id} style={{
                  background:'#fff', borderRadius:16, overflow:'hidden',
                  boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #e5e7eb',
                  transition:'transform 0.15s, box-shadow 0.15s',
                  cursor:'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(0,0,0,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.07)' }}
                >
                  {/* 헤더 */}
                  <div style={{
                    background:`linear-gradient(135deg, ${m.color}22 0%, ${m.color}11 100%)`,
                    borderBottom:`1px solid ${m.color}33`,
                    padding:'18px 20px 14px',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:44, height:44, borderRadius:12,
                        background:m.bg, border:`2px solid ${m.color}44`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:22,
                      }}>{m.icon}</div>
                      <div>
                        <div style={{ fontSize:16, fontWeight:900, color:'#111827' }}>{ing.name}</div>
                        <div style={{ fontSize:11, color:m.color, fontWeight:700 }}>{m.label}</div>
                      </div>
                    </div>
                    <div style={{
                      fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:999,
                      background:'#dbeafe', border:'1px solid #3b82f6', color:'#1d4ed8',
                    }}>🌍 글로벌</div>
                  </div>

                  {/* 바디 */}
                  <div style={{ padding:'14px 20px 18px' }}>
                    {ing.description && (
                      <p style={{ fontSize:13, color:'#374151', lineHeight:1.6, margin:'0 0 12px' }}>
                        {ing.description}
                      </p>
                    )}

                    {/* 건강효능 태그 */}
                    {benefits.length > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                        {benefits.slice(0, 5).map(b => (
                          <span key={b.id} style={{
                            fontSize:11, padding:'3px 8px', borderRadius:999,
                            background: getBenefitColor(b.category) + '18',
                            border: `1px solid ${getBenefitColor(b.category)}44`,
                            color: getBenefitColor(b.category),
                            fontWeight:600,
                          }}>
                            {b.name}
                          </span>
                        ))}
                        {benefits.length > 5 && (
                          <span style={{ fontSize:11, color:'#9ca3af', padding:'3px 6px' }}>
                            +{benefits.length - 5}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 쿠팡 링크 (개별 등록이 없으면 관리자 설정값으로 대체 노출) */}
                    {(() => {
                      const cp = resolveCoupangDisplay(coupangLinks, coupangWidgets, ing)
                      if (cp.links.length === 0 && cp.widgets.length === 0) return null
                      return (
                        <div style={{ marginTop:12 }}>
                          {cp.links.length > 0 && (
                            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                              {cp.links.map((l, i) => (
                                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer sponsored"
                                  style={{
                                    display:'inline-flex', alignItems:'center', gap:5,
                                    fontSize:12, fontWeight:700, color:'#fff',
                                    background:'#ea580c', borderRadius:8, padding:'6px 12px',
                                    textDecoration:'none',
                                  }}>
                                  🛒 {l.label}
                                </a>
                              ))}
                            </div>
                          )}
                          {cp.widgets.map((html, i) => (
                            <div key={i} style={{ marginTop:6 }} dangerouslySetInnerHTML={{ __html: html }} />
                          ))}
                          <div style={{ fontSize:10, color:'#9ca3af', marginTop:4 }}>
                            이 게시물은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 빈 상태 안내 (데이터 0개일 때 추가 안내) */}
        {!loading && ingredients.length === 0 && (
          <div style={{
            marginTop:32, background:'#eff6ff', border:'1px solid #bfdbfe',
            borderRadius:14, padding:'24px 28px',
          }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#1d4ed8', marginBottom:12 }}>
              💡 추천 등록 목록 — 세계 슈퍼푸드
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:8 }}>
              {[
                { name:'올리브오일',  cat:'곡물·가공', note:'폴리페놀·불포화지방산' },
                { name:'아보카도',    cat:'과일',      note:'오메가3·비타민E' },
                { name:'강황',        cat:'기타',      note:'커큐민·항염' },
                { name:'견과류(호두)', cat:'곡물·가공', note:'오메가3·비타민E' },
                { name:'녹차',        cat:'기타',      note:'카테킨·EGCG' },
                { name:'치아씨드',    cat:'기타',      note:'오메가3·식이섬유' },
                { name:'퀴노아',      cat:'곡물·가공', note:'완전단백질' },
                { name:'아로니아',    cat:'과일',      note:'안토시아닌' },
                { name:'아사이베리',  cat:'과일',      note:'항산화 최강' },
                { name:'생강',        cat:'채소·나물', note:'진저롤·항염' },
                { name:'고구마',      cat:'채소·나물', note:'베타카로틴' },
                { name:'달걀',        cat:'기타',      note:'완전단백질·루테인' },
              ].map(item => (
                <div key={item.name} style={{
                  background:'#fff', borderRadius:10, padding:'10px 14px',
                  border:'1px solid #bfdbfe', fontSize:13,
                }}>
                  <div style={{ fontWeight:700, color:'#1e40af' }}>{item.name}</div>
                  <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>{item.cat} · {item.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
      <Footer />
    </>
  )
}
