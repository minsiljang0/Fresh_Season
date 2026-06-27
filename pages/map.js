import { useState, useMemo, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { REGIONS } from '../lib/regions'
import { SEASONAL_FOODS_SEED, CATEGORIES, getAllIngredients } from '../lib/seasonalFoods'
import { KOREA_PATHS } from '../lib/koreaPaths'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

const REGION_SHORT = {
  seoul:'서울', busan:'부산', daegu:'대구', incheon:'인천',
  gwangju:'광주', daejeon:'대전', ulsan:'울산', sejong:'세종',
  gyeonggi:'경기', gangwon:'강원', chungbuk:'충북', chungnam:'충남',
  jeonbuk:'전북', jeonnam:'전남', gyeongbuk:'경북', gyeongnam:'경남', jeju:'제주',
}

const REGION_ORDER = [
  'gangwon','gyeonggi','incheon','seoul','chungnam','chungbuk','sejong','daejeon',
  'jeonbuk','jeonnam','gwangju','gyeongbuk','gyeongnam','daegu','ulsan','busan','jeju'
]

// 지역별 라벨 위치 (실제 GeoJSON SVG 500x700 좌표계)
const REGION_LABEL_POS = {
  gangwon:  [370, 200],
  gyeonggi: [210, 270],
  incheon:  [148, 285],
  seoul:    [210, 248],
  sejong:   [232, 368],
  daejeon:  [240, 393],
  chungnam: [168, 355],
  chungbuk: [278, 308],
  jeonbuk:  [195, 445],
  jeonnam:  [180, 530],
  gwangju:  [207, 478],
  gyeongbuk:[328, 308],
  gyeongnam:[278, 468],
  daegu:    [295, 398],
  ulsan:    [358, 412],
  busan:    [328, 498],
  jeju:     [175, 648],
}

function categoryColor(cat) {
  const m = { fish:'#0ea5e9', veg:'#22c55e', fruit:'#f97316', grain:'#eab308', meat:'#ef4444', mushroom:'#a855f7' }
  return m[cat] || '#888'
}
function categoryBg(cat) {
  const m = { fish:'#0ea5e919', veg:'#22c55e19', fruit:'#f9731619', grain:'#eab30819', meat:'#ef444419', mushroom:'#a855f719' }
  return m[cat] || '#88888819'
}

// 한국 지도 컴포넌트
function KoreaMap({ filtered, selRegion, setSelRegion, selMonth }) {
  const [hovered, setHovered] = useState(null)

  const regionCounts = useMemo(() => {
    const counts = {}
    REGION_ORDER.forEach(r => { counts[r] = 0 })
    filtered.forEach(f => { if (counts[f.region] !== undefined) counts[f.region]++ })
    return counts
  }, [filtered])

  const maxCount = Math.max(...Object.values(regionCounts), 1)

  function getRegionColor(regionId) {
    const count = regionCounts[regionId] || 0
    const isSelected = selRegion === regionId
    const isHovered = hovered === regionId
    if (isSelected) return '#16a34a'
    if (count === 0) return '#e8f5e8'
    const intensity = 0.15 + (count / maxCount) * 0.65
    if (isHovered) return `rgba(22,163,74,${Math.min(intensity + 0.15, 0.95)})`
    return `rgba(22,163,74,${intensity})`
  }

  return (
    <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'12px 14px 8px', borderBottom:'1px solid var(--border)' }}>
        <p style={{ fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:'0.05em' }}>🗺 제철 지도</p>
        {selRegion !== 'all' && (
          <button onClick={() => setSelRegion('all')}
            style={{ marginTop:4, fontSize:10, padding:'2px 8px', borderRadius:999, border:'1px solid var(--accent)', background:'rgba(34,197,94,0.12)', color:'var(--accent)', cursor:'pointer', fontFamily:'inherit' }}>
            {REGION_SHORT[selRegion]} ✕ 해제
          </button>
        )}
      </div>
      <div style={{ flex:1, overflow:'hidden', padding:'4px 8px' }}>
        <svg
          viewBox="90 100 400 580"
          style={{ width:'100%', height:'100%' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {REGION_ORDER.map(regionId => {
            const pathD = KOREA_PATHS[regionId]
            if (!pathD) return null
            const [lx, ly] = REGION_LABEL_POS[regionId]
            const count = regionCounts[regionId]
            const isSelected = selRegion === regionId
            const isHovered = hovered === regionId
            return (
              <g key={regionId}
                onClick={() => setSelRegion(selRegion === regionId ? 'all' : regionId)}
                onMouseEnter={() => setHovered(regionId)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor:'pointer' }}>
                <path
                  d={pathD}
                  fill={getRegionColor(regionId)}
                  stroke={isSelected ? '#15803d' : '#a7d7a7'}
                  strokeWidth={isSelected ? 1.5 : 0.6}
                  style={{ transition:'fill 0.15s' }}
                />
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                  style={{
                    fontSize: ['sejong','gwangju','daejeon','daegu','ulsan'].includes(regionId) ? 7 : 9,
                    fill: isSelected ? '#fff' : count > 0 ? '#0f1f0f' : '#9ca3af',
                    fontWeight: isSelected ? 700 : 600,
                    pointerEvents:'none', userSelect:'none',
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  }}>
                  {REGION_SHORT[regionId]}
                </text>
                {count > 0 && (
                  <text x={lx} y={ly + 11} textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize:7, fill: isSelected ? '#dcfce7' : '#15803d', pointerEvents:'none', userSelect:'none' }}>
                    {count}개
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      <div style={{ padding:'6px 14px 10px', borderTop:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, justifyContent:'center' }}>
          <span style={{ fontSize:9, color:'var(--text3)' }}>적음</span>
          {[0.18,0.32,0.46,0.58,0.70].map((op,i) => (
            <div key={i} style={{ width:14, height:10, borderRadius:2, background:`rgba(34,197,94,${op})` }} />
          ))}
          <span style={{ fontSize:9, color:'var(--text3)' }}>많음</span>
        </div>
        <p style={{ fontSize:9, color:'var(--text3)', textAlign:'center', marginTop:3 }}>클릭하면 지역 필터</p>
      </div>
    </div>
  )
}

export default function MapPage() {
  const [selMonth, setSelMonth]       = useState(new Date().getMonth() + 1)
  const [selCategory, setSelCategory] = useState('all')
  const [selRegion, setSelRegion]     = useState('all')
  const [selTV, setSelTV]             = useState('all')
  const [selHealth, setSelHealth]     = useState('all')
  const [query, setQuery]             = useState('')
  const [view, setView]               = useState('cards')
  const [dbSeasonalFoods, setDbSeasonalFoods] = useState([])
  const [tvShows, setTvShows]                = useState([])
  const [dbHealthBenefits, setDbHealthBenefits] = useState([])
  const searchRef = useRef(null)

  // DB 데이터 로드
  useEffect(() => {
    // 3개 API 병렬 로드
    Promise.all([
      fetch('/api/map/seasonal-foods').then(r => r.ok ? r.json() : {}),
      fetch('/api/admin/map-data?type=tv_shows').then(r => r.ok ? r.json() : []),
      fetch('/api/admin/map-data?type=health_benefits').then(r => r.ok ? r.json() : []),
    ]).then(([sfData, tvData, hbData]) => {
      // seasonal-foods: 새 포맷 { foods, healthBenefits } 또는 구 포맷 배열
      if (Array.isArray(sfData)) {
        setDbSeasonalFoods(sfData)
      } else {
        setDbSeasonalFoods(sfData.foods || [])
      }
      setTvShows(tvData || [])
      // health_benefits는 map-data API에서 직접 — 관리자와 항상 동일한 소스
      setDbHealthBenefits(Array.isArray(hbData) ? hbData : [])
    }).catch(() => {})
  }, [])

  // TV 프로그램 목록 (시드 + DB 합산)
  const TV_PROGRAMS_SEED = ['생활의달인','한국인의밥상','수요미식회','6시내고향','VJ특공대','백종원의골목식당']
  const TV_PROGRAMS = useMemo(() => {
    const dbNames = tvShows.map(t => t.name)
    const all = [...TV_PROGRAMS_SEED, ...dbNames.filter(n => !TV_PROGRAMS_SEED.includes(n))]
    return all
  }, [tvShows])

  // DB에서 로드한 건강효능을 필터 형태로 변환 (관리자에서 수정하면 즉시 반영)
  const HEALTH_FILTERS = useMemo(() => {
    return dbHealthBenefits.map(hb => ({
      id:    hb.id,
      label: hb.name,
      name:  hb.name,
    }))
  }, [dbHealthBenefits])

  // DB seasonal_foods + 시드 합산
  const allFoods = useMemo(() => {
    if (dbSeasonalFoods.length > 0) {
      // DB 데이터가 있으면 DB 우선, 시드는 DB에 없는 것만
      const dbIngredients = new Set(dbSeasonalFoods.map(f => f.ingredient + '_' + f.region))
      const seedOnly = SEASONAL_FOODS_SEED.filter(f => !dbIngredients.has(f.ingredient + '_' + f.region))
      return [...dbSeasonalFoods, ...seedOnly]
    }
    return SEASONAL_FOODS_SEED
  }, [dbSeasonalFoods])

  // 필터링
  const filtered = useMemo(() => {
    let data = allFoods
    if (selMonth !== 0) data = data.filter(f => f.months.includes(selMonth))
    if (selCategory !== 'all') data = data.filter(f => f.category === selCategory)
    if (selRegion !== 'all') data = data.filter(f => f.region === selRegion)
    if (selTV !== 'all') data = data.filter(f => f.tvPrograms && f.tvPrograms.includes(selTV))
    if (selHealth !== 'all') {
      // DB 연결 기반 필터링 (healthIds) + 레거시 텍스트 폴백
      data = data.filter(f => {
        if (f.healthIds && f.healthIds.length > 0) {
          return f.healthIds.includes(selHealth)
        }
        // 레거시 데이터는 health 텍스트에서 건강효능 이름으로 검색
        const hb = dbHealthBenefits.find(h => h.id === selHealth)
        if (hb) return f.health.includes(hb.name)
        return false
      })
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      data = data.filter(f =>
        f.ingredient.includes(q) ||
        f.district.includes(q) ||
        f.health.includes(q) ||
        (f.tvPrograms && f.tvPrograms.some(t => t.includes(q)))
      )
    }
    return data
  }, [selMonth, selCategory, selRegion, selTV, selHealth, query, allFoods, dbHealthBenefits])

  const byRegion = useMemo(() => {
    const map = {}
    REGION_ORDER.forEach(r => { map[r] = [] })
    filtered.forEach(f => { if (map[f.region]) map[f.region].push(f) })
    return map
  }, [filtered])

  const byIngredient = useMemo(() => {
    const map = {}
    filtered.forEach(f => {
      if (!map[f.ingredient]) map[f.ingredient] = []
      map[f.ingredient].push(f)
    })
    return map
  }, [filtered])

  const totalCount = filtered.length
  const regionCount = Object.values(byRegion).filter(v => v.length > 0).length

  // TV 프로그램별 카운트 (TV 필터 제외한 나머지 조건 적용)
  const tvCounts = useMemo(() => {
    let base = allFoods
    if (selMonth !== 0) base = base.filter(f => f.months.includes(selMonth))
    if (selCategory !== 'all') base = base.filter(f => f.category === selCategory)
    if (selRegion !== 'all') base = base.filter(f => f.region === selRegion)
    if (selHealth !== 'all') {
      base = base.filter(f => {
        if (f.healthIds && f.healthIds.length > 0) return f.healthIds.includes(selHealth)
        const hb = dbHealthBenefits.find(h => h.id === selHealth)
        if (hb) return f.health.includes(hb.name)
        return false
      })
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      base = base.filter(f =>
        f.ingredient.includes(q) || f.district.includes(q) ||
        f.health.includes(q) || (f.tvPrograms && f.tvPrograms.some(t => t.includes(q)))
      )
    }
    const counts = {}
    TV_PROGRAMS.forEach(tv => {
      counts[tv] = base.filter(f => f.tvPrograms && f.tvPrograms.includes(tv)).length
    })
    return counts
  }, [allFoods, selMonth, selCategory, selRegion, selHealth, query, TV_PROGRAMS, dbHealthBenefits])

  // 건강 효능별 카운트 (Health 필터 제외한 나머지 조건 적용)
  const healthCounts = useMemo(() => {
    let base = allFoods
    if (selMonth !== 0) base = base.filter(f => f.months.includes(selMonth))
    if (selCategory !== 'all') base = base.filter(f => f.category === selCategory)
    if (selRegion !== 'all') base = base.filter(f => f.region === selRegion)
    if (selTV !== 'all') base = base.filter(f => f.tvPrograms && f.tvPrograms.includes(selTV))
    if (query.trim()) {
      const q = query.toLowerCase()
      base = base.filter(f =>
        f.ingredient.includes(q) || f.district.includes(q) ||
        f.health.includes(q) || (f.tvPrograms && f.tvPrograms.some(t => t.includes(q)))
      )
    }
    const counts = {}
    dbHealthBenefits.forEach(hb => {
      counts[hb.id] = base.filter(f => {
        if (f.healthIds && f.healthIds.length > 0) return f.healthIds.includes(hb.id)
        return f.health.includes(hb.name)
      }).length
    })
    return counts
  }, [allFoods, selMonth, selCategory, selRegion, selTV, query, dbHealthBenefits])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <Head>
        <title>제철 식재료 한눈에 보기 — Fresh Season</title>
        <meta name="description" content="전국 17개 시도 × 12개월 제철 식재료를 한눈에 확인하세요. 지역·카테고리·월별 필터와 키워드 검색으로 원하는 식재료를 바로 찾을 수 있습니다." />
        <meta property="og:title" content="제철 식재료 한눈에 보기 — Fresh Season" />
        <meta property="og:description" content="전국 17개 시도 × 12개월 제철 식재료를 한눈에 확인하세요." />
        <meta property="og:image" content="https://www.fsfood.kr/og-image.png" />
        <meta property="og:url" content="https://www.fsfood.kr/map" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://www.fsfood.kr/map" />
      </Head>
      <Header />

      <main className="wrap" style={{ paddingBottom: 80 }}>

        {/* 헤더 */}
        <section style={{ padding: '40px 0 24px', textAlign: 'center' }}>
          <div style={{ display:'inline-block', padding:'4px 14px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:999, fontSize:12, fontWeight:700, color:'var(--text3)', marginBottom:16 }}>
            🗺 전국 제철 식재료 지도
          </div>
          <h1 style={{ fontSize:'clamp(22px,4vw,36px)', fontWeight:900, letterSpacing:'-0.5px', marginBottom:10, lineHeight:1.2 }}>
            17개 시도 × 12개월<br />
            <span style={{ color:'var(--accent)' }}>제철 식재료 한눈에</span>
          </h1>
          <p style={{ fontSize:14, color:'var(--text2)' }}>
            {totalCount}개 데이터 · {regionCount}개 지역 · 지역·월·카테고리·효능 통합 검색
          </p>
        </section>

        {/* ── 컨트롤 바 ── */}
        <div style={{ background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:16, padding:20, marginBottom:20 }}>

          {/* 검색 */}
          <div style={{ position:'relative', marginBottom:16 }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16, pointerEvents:'none' }}>🔍</span>
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="식재료·산지·효능 검색 (Ctrl+K)"
              style={{
                width:'100%', padding:'11px 40px 11px 38px',
                background:'var(--surface2)', border:'1.5px solid var(--border)',
                borderRadius:10, fontSize:14, color:'var(--text)',
                outline:'none', fontFamily:'inherit',
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{
                position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--text3)', lineHeight:1,
              }}>×</button>
            )}
          </div>

          {/* 월 선택 */}
          <div style={{ marginBottom:14 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:8, letterSpacing:'0.05em' }}>📅 월</p>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              <button onClick={() => setSelMonth(0)}
                style={{ padding:'5px 10px', borderRadius:8, border:'1.5px solid', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                  borderColor: selMonth===0 ? 'var(--accent)' : 'var(--border)',
                  background: selMonth===0 ? 'rgba(34,197,94,0.12)' : 'var(--surface2)',
                  color: selMonth===0 ? 'var(--accent)' : 'var(--text2)',
                }}>전체</button>
              {MONTHS.map((m,i) => {
                const mon = i+1
                const on = selMonth === mon
                return (
                  <button key={mon} onClick={() => setSelMonth(mon)}
                    style={{ padding:'5px 10px', borderRadius:8, border:'1.5px solid', fontSize:12, fontWeight:on?700:500, cursor:'pointer', fontFamily:'inherit',
                      borderColor: on ? 'var(--accent)' : 'var(--border)',
                      background: on ? 'rgba(34,197,94,0.12)' : 'var(--surface2)',
                      color: on ? 'var(--accent)' : 'var(--text2)',
                    }}>{m}</button>
                )
              })}
            </div>
          </div>

          {/* 건강 효능 필터 — 드롭다운 (카테고리 위) */}
          <div style={{ marginBottom:14, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:8, letterSpacing:'0.05em' }}>
              💊 건강 효능
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <select
                value={selHealth}
                onChange={e => setSelHealth(e.target.value)}
                style={{
                  padding:'7px 14px', borderRadius:10,
                  border: selHealth !== 'all' ? '1.5px solid #10b981' : '1.5px solid var(--border)',
                  background: selHealth !== 'all' ? '#10b98111' : 'var(--surface2)',
                  color: selHealth !== 'all' ? '#10b981' : 'var(--text)',
                  fontSize:13, fontFamily:'inherit', cursor:'pointer',
                  fontWeight: selHealth !== 'all' ? 700 : 400,
                  minWidth:180,
                }}
              >
                <option value="all">전체 효능</option>
                {HEALTH_FILTERS.map(hf => (
                  <option key={hf.id} value={hf.id}>
                    {hf.label}{healthCounts[hf.id] > 0 ? ` (${healthCounts[hf.id]})` : ''}
                  </option>
                ))}
              </select>
              {selHealth !== 'all' && (
                <span style={{ fontSize:12, color:'var(--text3)' }}>
                  <span style={{ fontWeight:700, color:'#10b981' }}>{healthCounts[selHealth] || 0}개</span> 해당
                </span>
              )}
              {selHealth !== 'all' && (
                <button onClick={() => setSelHealth('all')}
                  style={{ padding:'4px 10px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text3)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                  ✕ 초기화
                </button>
              )}
            </div>
          </div>

          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            {/* 카테고리 */}
            <div style={{ flex:1, minWidth:200 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:8, letterSpacing:'0.05em' }}>🏷 카테고리</p>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                <button onClick={() => setSelCategory('all')}
                  style={{ padding:'4px 10px', borderRadius:20, border:'1.5px solid', fontSize:12, cursor:'pointer', fontFamily:'inherit',
                    borderColor: selCategory==='all' ? '#888' : 'var(--border)',
                    background: selCategory==='all' ? 'var(--surface3)' : 'var(--surface2)',
                    color: selCategory==='all' ? 'var(--text)' : 'var(--text2)', fontWeight: selCategory==='all'?700:400,
                  }}>전체</button>
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setSelCategory(c.id === selCategory ? 'all' : c.id)}
                    style={{ padding:'4px 10px', borderRadius:20, border:'1.5px solid', fontSize:12, cursor:'pointer', fontFamily:'inherit',
                      borderColor: selCategory===c.id ? c.color : 'var(--border)',
                      background: selCategory===c.id ? c.color+'22' : 'var(--surface2)',
                      color: selCategory===c.id ? c.color : 'var(--text2)',
                      fontWeight: selCategory===c.id ? 700 : 400,
                    }}>{c.emoji} {c.label}</button>
                ))}
              </div>
            </div>

            {/* 지역 드롭다운 */}
            <div style={{ flex:'0 0 auto' }}>
              <p style={{ fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:8, letterSpacing:'0.05em' }}>📍 지역</p>
              <select value={selRegion} onChange={e => setSelRegion(e.target.value)}
                style={{ padding:'6px 12px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontSize:13, fontFamily:'inherit', cursor:'pointer' }}>
                <option value="all">전체 지역</option>
                {REGION_ORDER.map(r => (
                  <option key={r} value={r}>{REGION_SHORT[r]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 뷰 전환 + 리셋 */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)' }}>
            <div style={{ display:'flex', gap:4 }}>
              {[['table','📋 지역별 표'],['cards','🃏 카드'],['ingredient','🥕 식재료별']].map(([v,label]) => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding:'5px 12px', borderRadius:8, border:'1.5px solid', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                    borderColor: view===v ? 'var(--accent)' : 'var(--border)',
                    background: view===v ? 'rgba(34,197,94,0.12)' : 'var(--surface2)',
                    color: view===v ? 'var(--accent)' : 'var(--text2)',
                  }}>{label}</button>
              ))}
            </div>
            <button onClick={() => { setSelMonth(new Date().getMonth()+1); setSelCategory('all'); setSelRegion('all'); setSelTV('all'); setSelHealth('all'); setQuery('') }}
              style={{ padding:'5px 12px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--surface2)', color:'var(--text3)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
              🔄 초기화
            </button>
          </div>
        </div>

        {/* ── 하단: 지도(1/3) + 결과(2/3) ── */}
        <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>

          {/* 왼쪽: 한국 지도 */}
          <div style={{
            flexShrink:0,
            width:'33%',
            minWidth:200,
            maxWidth:320,
            background:'var(--surface)',
            border:'1.5px solid var(--border)',
            borderRadius:16,
            overflow:'hidden',
            position:'sticky',
            top:80,
            height:'calc(100vh - 120px)',
            maxHeight:520,
          }}>
            <KoreaMap
              filtered={filtered}
              selRegion={selRegion}
              setSelRegion={setSelRegion}
              selMonth={selMonth}
            />
          </div>

          {/* 오른쪽: 검색 결과 */}
          <div style={{ flex:1, minWidth:0 }}>

            {/* 결과 없음 */}
            {totalCount === 0 && (
              <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text2)', background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:16 }}>
                <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
                <p style={{ fontSize:16, fontWeight:700 }}>검색 결과가 없어요</p>
                <p style={{ fontSize:13, marginTop:6, color:'var(--text3)' }}>조건을 바꿔서 다시 시도해보세요</p>
              </div>
            )}

            {/* ── 지역별 표 뷰 ── */}
            {view === 'table' && totalCount > 0 && (
              <div style={{ overflowX:'auto', borderRadius:16, border:'1.5px solid var(--border)' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth: selMonth === 0 ? 800 : 400 }}>
                  <thead>
                    <tr style={{ background:'var(--surface)' }}>
                      <th style={{ padding:'12px 14px', textAlign:'left', fontSize:12, fontWeight:700, color:'var(--text3)', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap', minWidth:70 }}>지역</th>
                      {selMonth === 0
                        ? MONTHS.map(m => (
                            <th key={m} style={{ padding:'12px 8px', textAlign:'center', fontSize:11, fontWeight:700, color:'var(--text3)', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{m}</th>
                          ))
                        : <th style={{ padding:'12px 14px', textAlign:'left', fontSize:12, fontWeight:700, color:'var(--text3)', borderBottom:'1px solid var(--border)' }}>제철 식재료</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    {REGION_ORDER
                      .filter(r => selRegion === 'all' || r === selRegion)
                      .filter(r => byRegion[r]?.length > 0)
                      .map((r, ri) => {
                        const regionInfo = REGIONS.find(x => x.id === r)
                        return (
                          <tr key={r} style={{ borderBottom:'1px solid var(--border)', background: ri%2===0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                            <td style={{ padding:'10px 14px', whiteSpace:'nowrap', verticalAlign:'top' }}>
                              <Link href={`/region/${r}`} style={{ textDecoration:'none', color:'inherit' }}>
                                <span style={{ fontSize:14, marginRight:4 }}>{regionInfo?.icon}</span>
                                <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{REGION_SHORT[r]}</span>
                              </Link>
                            </td>
                            {selMonth === 0
                              ? MONTHS.map((_, mi) => {
                                  const mon = mi+1
                                  const foods = SEASONAL_FOODS_SEED.filter(f =>
                                    f.region === r && f.months.includes(mon) &&
                                    (selCategory === 'all' || f.category === selCategory) &&
                                    (!query.trim() || f.ingredient.includes(query) || f.district.includes(query))
                                  )
                                  return (
                                    <td key={mon} style={{ padding:'8px 4px', textAlign:'center', verticalAlign:'top' }}>
                                      {foods.map((f,fi) => (
                                        <span key={fi} style={{
                                          display:'inline-block', fontSize:10, padding:'2px 5px', margin:'1px',
                                          borderRadius:999, background:categoryBg(f.category),
                                          color:categoryColor(f.category), whiteSpace:'nowrap',
                                        }}>
                                          <Link href={`/ingredient/${encodeURIComponent(f.ingredient)}`} style={{ color:'inherit', textDecoration:'none' }}>
                                            {f.ingredient}
                                          </Link>
                                        </span>
                                      ))}
                                    </td>
                                  )
                                })
                              : <td style={{ padding:'10px 14px', verticalAlign:'top' }}>
                                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                                    {byRegion[r].map((f,fi) => (
                                      <Link key={fi} href={`/ingredient/${encodeURIComponent(f.ingredient)}`}
                                        style={{ textDecoration:'none' }}>
                                        <span style={{
                                          display:'inline-flex', alignItems:'center', gap:4,
                                          fontSize:12, padding:'3px 8px', borderRadius:999,
                                          background:categoryBg(f.category), color:categoryColor(f.category), border:`1px solid ${categoryColor(f.category)}33`,
                                          cursor:'pointer', transition:'all 0.1s',
                                        }}>
                                          {CATEGORIES.find(c=>c.id===f.category)?.emoji} {f.ingredient}
                                          <span style={{ fontSize:10, opacity:0.7 }}>({f.district})</span>
                                        </span>
                                      </Link>
                                    ))}
                                  </div>
                                </td>
                            }
                          </tr>
                        )
                      })
                    }
                  </tbody>
                </table>
              </div>
            )}

            {/* ── 카드 뷰 ── */}
            {view === 'cards' && totalCount > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
                {filtered.map((f, i) => {
                  const regionInfo = REGIONS.find(x => x.id === f.region)
                  const cat = CATEGORIES.find(c => c.id === f.category)
                  return (
                    <div key={i} style={{
                      background:'var(--surface)', border:'1.5px solid var(--border)',
                      borderRadius:14, padding:16, transition:'border-color 0.15s',
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                        <div>
                          <Link href={`/ingredient/${encodeURIComponent(f.ingredient)}`}
                            style={{ textDecoration:'none', color:'inherit' }}>
                            <h3 style={{ fontSize:17, fontWeight:900, marginBottom:2 }}>{f.ingredient}</h3>
                          </Link>
                          <Link href={`/region/${f.region}`} style={{ textDecoration:'none' }}>
                            <span style={{ fontSize:12, color:'var(--text2)' }}>{regionInfo?.icon} {regionInfo?.name?.replace('특별자치도','').replace('광역시','').replace('특별자치시','').replace('특별시','').replace('도','도').trim()}</span>
                          </Link>
                        </div>
                        <span style={{
                          fontSize:11, padding:'3px 8px', borderRadius:999, fontWeight:700,
                          background:categoryBg(f.category), color:categoryColor(f.category),
                          border:`1px solid ${categoryColor(f.category)}44`, flexShrink:0,
                        }}>{cat?.emoji} {cat?.label}</span>
                      </div>

                      <p style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>📍 {f.district}</p>

                      <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:10 }}>
                        {f.months.sort((a,b)=>a-b).map(m => (
                          <span key={m} style={{
                            fontSize:10, padding:'2px 6px', borderRadius:6,
                            background: m===selMonth ? 'rgba(34,197,94,0.2)' : 'var(--surface2)',
                            color: m===selMonth ? 'var(--accent)' : 'var(--text3)',
                            border: m===selMonth ? '1px solid rgba(34,197,94,0.4)' : '1px solid var(--border)',
                            fontWeight: m===selMonth ? 700 : 400,
                          }}>{m}월</span>
                        ))}
                      </div>

                      <p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5, marginBottom:8 }}>
                        💊 {selHealth !== 'all'
                          ? f.health.split('·').map((part, pi) => {
                              const hb = dbHealthBenefits.find(h => h.id === selHealth)
                              const isMatch = hb && part.includes(hb.name)
                              return (
                                <span key={pi} style={isMatch ? { color:'#10b981', fontWeight:700 } : {}}>
                                  {pi > 0 ? '·' : ''}{part}
                                </span>
                              )
                            })
                          : f.health
                        }
                      </p>

                      {f.tvPrograms?.length > 0 && (
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          {f.tvPrograms.map(t => (
                            <span key={t} style={{ fontSize:10, padding:'2px 7px', borderRadius:999, background:'var(--surface2)', color:'var(--text3)', border:'1px solid var(--border)' }}>
                              📺 {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── 식재료별 뷰 ── */}
            {view === 'ingredient' && totalCount > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {Object.entries(byIngredient).sort(([a],[b])=>a.localeCompare(b,'ko')).map(([ing, foods]) => {
                  const cat = CATEGORIES.find(c => c.id === foods[0].category)
                  const allMonths = [...new Set(foods.flatMap(f=>f.months))].sort((a,b)=>a-b)
                  return (
                    <div key={ing} style={{ background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:14, padding:16 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, flexWrap:'wrap' }}>
                        <Link href={`/ingredient/${encodeURIComponent(ing)}`} style={{ textDecoration:'none', color:'inherit' }}>
                          <h3 style={{ fontSize:18, fontWeight:900 }}>{ing}</h3>
                        </Link>
                        <span style={{ fontSize:11, padding:'3px 8px', borderRadius:999, fontWeight:700, background:categoryBg(foods[0].category), color:categoryColor(foods[0].category), border:`1px solid ${categoryColor(foods[0].category)}44` }}>
                          {cat?.emoji} {cat?.label}
                        </span>
                        <span style={{ fontSize:12, color:'var(--text3)' }}>전국 {foods.length}곳</span>
                        <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginLeft:'auto' }}>
                          {allMonths.map(m => (
                            <span key={m} style={{ fontSize:10, padding:'2px 6px', borderRadius:6, background:'var(--surface2)', color:'var(--text3)', border:'1px solid var(--border)' }}>{m}월</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:8 }}>
                        {foods.map((f,fi) => {
                          const regionInfo = REGIONS.find(x => x.id === f.region)
                          return (
                            <div key={fi} style={{ background:'var(--surface2)', borderRadius:10, padding:'10px 12px' }}>
                              <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>
                                <Link href={`/region/${f.region}`} style={{ textDecoration:'none', color:'var(--text)' }}>
                                  {regionInfo?.icon} {REGION_SHORT[f.region]}
                                </Link>
                              </div>
                              <p style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>📍 {f.district}</p>
                              <p style={{ fontSize:11, color:'var(--text2)', lineHeight:1.5 }}>💊 {f.health}</p>
                              {f.tvPrograms?.length > 0 && (
                                <p style={{ fontSize:10, color:'var(--text3)', marginTop:4 }}>📺 {f.tvPrograms.join(', ')}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 요약 스탯 */}
            {totalCount > 0 && (
              <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))', gap:8 }}>
                {CATEGORIES.map(c => {
                  const cnt = filtered.filter(f => f.category === c.id).length
                  if (!cnt) return null
                  return (
                    <div key={c.id} style={{ background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:12, padding:'10px 12px', textAlign:'center' }}>
                      <div style={{ fontSize:20, marginBottom:4 }}>{c.emoji}</div>
                      <div style={{ fontSize:18, fontWeight:900, color:c.color }}>{cnt}</div>
                      <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{c.label}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </main>
      <Footer />
    </>
  )
}
