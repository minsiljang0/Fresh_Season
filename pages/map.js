import { useState, useMemo, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { REGIONS } from '../lib/regions'
import { CATEGORIES, CATEGORY_GROUPS } from '../lib/seasonalFoods'
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
  const found = CATEGORIES.find(c => c.id === cat)
  return found?.color || '#888'
}
function categoryBg(cat) {
  const found = CATEGORIES.find(c => c.id === cat)
  return found ? found.color + '19' : '#88888819'
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
  const [selAge, setSelAge]           = useState('all')
  const [selGender, setSelGender]     = useState('all')
  const [selSuperfood, setSelSuperfood] = useState(false)
  const [selBrand, setSelBrand] = useState(false)
  const [selSeason, setSelSeason] = useState('')
  const [selJeolgi, setSelJeolgi] = useState('')
  const [selSpecial, setSelSpecial] = useState('')
  const [selHabitat, setSelHabitat] = useState('')
  const [selFarming, setSelFarming] = useState('')
  const [query, setQuery]             = useState('')
  const [view, setView]               = useState('cards')
  const [dbSeasonalFoods, setDbSeasonalFoods] = useState([])
  const [tvShows, setTvShows]                = useState([])
  const [dbHealthBenefits, setDbHealthBenefits] = useState([])
  const searchRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [openSections, setOpenSections] = useState({month:true, health:true, category:true, region:true, age:false, gender:false, special:false, habitat:false, farming:false})
  const toggleSection = (key) => setOpenSections(p => ({...p, [key]:!p[key]}))
  const SectionHeader = ({label, skey}) => (
    <div onClick={() => toggleSection(skey)} style={{display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', marginBottom: openSections[skey] ? 8 : 0}}>
      <p style={{fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:'0.05em', margin:0}}>{label}</p>
      <span style={{fontSize:10, color:'var(--text3)'}}>{openSections[skey] ? '▲' : '▼'}</span>
    </div>
  )

  // 모바일 감지
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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

  // DB 데이터만 사용 — SEED 혼용 없음
  const allFoods = useMemo(() => {
    return dbSeasonalFoods
  }, [dbSeasonalFoods])

  // 필터링
  const filtered = useMemo(() => {
    let data = allFoods
    if (selMonth !== 0) data = data.filter(f => f.months.includes(selMonth))
    if (selCategory !== 'all') data = data.filter(f => f.category === selCategory)
    if (selRegion !== 'all') data = data.filter(f => f.region === selRegion)
    if (selTV !== 'all') data = data.filter(f => f.tvPrograms && f.tvPrograms.includes(selTV))
    // 연령 필터 (health_benefits의 age_groups 기반)
    if (selAge !== 'all') {
      const matchingHealthIds = new Set(
        dbHealthBenefits
          .filter(hb => (hb.age_groups||[]).includes(selAge) || (hb.age_groups||[]).includes('all'))
          .map(hb => hb.id)
      )
      data = data.filter(f => {
        if (f.healthIds && f.healthIds.length > 0) return f.healthIds.some(id => matchingHealthIds.has(id))
        return false
      })
    }
    // 성별 필터 (health_benefits의 gender 기반)
    if (selGender !== 'all') {
      const matchingHealthIds = new Set(
        dbHealthBenefits
          .filter(hb => !hb.gender || hb.gender === 'all' || hb.gender === selGender)
          .map(hb => hb.id)
      )
      data = data.filter(f => {
        if (f.healthIds && f.healthIds.length > 0) return f.healthIds.some(id => matchingHealthIds.has(id))
        return false
      })
    }
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
    if (selSuperfood) data = data.filter(f => f.is_superfood)
    if (selBrand) data = data.filter(f => f.is_brand)
    if (selSeason)  data = data.filter(f => Array.isArray(f.season_badge) ? f.season_badge.includes(selSeason) : f.season_badge === selSeason)
    if (selJeolgi)  data = data.filter(f => Array.isArray(f.jeolgi_badge) ? f.jeolgi_badge.includes(selJeolgi) : f.jeolgi_badge === selJeolgi)
    if (selSpecial) data = data.filter(f => Array.isArray(f.special_badge) ? f.special_badge.includes(selSpecial) : f.special_badge === selSpecial)
    if (selHabitat) data = data.filter(f => Array.isArray(f.habitat_badge) ? f.habitat_badge.includes(selHabitat) : f.habitat_badge === selHabitat)
    if (selFarming) data = data.filter(f => Array.isArray(f.farming_badge) ? f.farming_badge.includes(selFarming) : f.farming_badge === selFarming)
    return data
  }, [selMonth, selCategory, selRegion, selTV, selHealth, selAge, selGender, selSuperfood, selBrand, selSeason, selJeolgi, selSpecial, selHabitat, selFarming, query, allFoods, dbHealthBenefits])

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
  // 월별 카운트 (월 필터 제외)
  const monthCounts = useMemo(() => {
    let base = allFoods
    if (selCategory !== 'all') base = base.filter(f => f.category === selCategory)
    if (selRegion !== 'all') base = base.filter(f => f.region === selRegion)
    if (selTV !== 'all') base = base.filter(f => f.tvPrograms && f.tvPrograms.includes(selTV))
    if (selHealth !== 'all') {
      base = base.filter(f => {
        if (f.healthIds && f.healthIds.length > 0) return f.healthIds.includes(selHealth)
        const hb = dbHealthBenefits.find(h => h.id === selHealth)
        if (hb) return f.health.includes(hb.name)
        return false
      })
    }
    if (selAge !== 'all') {
      const ids = new Set(dbHealthBenefits.filter(hb => (hb.age_groups||[]).includes(selAge)||(hb.age_groups||[]).includes('all')).map(hb=>hb.id))
      base = base.filter(f => f.healthIds && f.healthIds.some(id => ids.has(id)))
    }
    if (selGender !== 'all') {
      const ids = new Set(dbHealthBenefits.filter(hb => !hb.gender||hb.gender==='all'||hb.gender===selGender).map(hb=>hb.id))
      base = base.filter(f => f.healthIds && f.healthIds.some(id => ids.has(id)))
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      base = base.filter(f => f.ingredient.includes(q)||f.district.includes(q)||f.health.includes(q)||(f.tvPrograms&&f.tvPrograms.some(t=>t.includes(q))))
    }
    const counts = {}
    for (let m = 1; m <= 12; m++) counts[m] = base.filter(f => f.months.includes(m)).length
    return counts
  }, [allFoods, selCategory, selRegion, selTV, selHealth, selAge, selGender, query, dbHealthBenefits])

  // 연령별 카운트 (연령 필터 제외)
  const ageCounts = useMemo(() => {
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
    if (selGender !== 'all') {
      const ids = new Set(dbHealthBenefits.filter(hb => !hb.gender||hb.gender==='all'||hb.gender===selGender).map(hb=>hb.id))
      base = base.filter(f => f.healthIds && f.healthIds.some(id => ids.has(id)))
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      base = base.filter(f => f.ingredient.includes(q)||f.district.includes(q)||f.health.includes(q)||(f.tvPrograms&&f.tvPrograms.some(t=>t.includes(q))))
    }
    const AGE_KEYS = ['infant','child','teen','adult','middle','senior']
    const counts = {}
    AGE_KEYS.forEach(age => {
      const ids = new Set(dbHealthBenefits.filter(hb=>(hb.age_groups||[]).includes(age)||(hb.age_groups||[]).includes('all')).map(hb=>hb.id))
      counts[age] = base.filter(f => f.healthIds && f.healthIds.some(id => ids.has(id))).length
    })
    return counts
  }, [allFoods, selMonth, selCategory, selRegion, selHealth, selGender, query, dbHealthBenefits])

  // 성별 카운트 (성별 필터 제외)
  const genderCounts = useMemo(() => {
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
    if (selAge !== 'all') {
      const ids = new Set(dbHealthBenefits.filter(hb=>(hb.age_groups||[]).includes(selAge)||(hb.age_groups||[]).includes('all')).map(hb=>hb.id))
      base = base.filter(f => f.healthIds && f.healthIds.some(id => ids.has(id)))
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      base = base.filter(f => f.ingredient.includes(q)||f.district.includes(q)||f.health.includes(q)||(f.tvPrograms&&f.tvPrograms.some(t=>t.includes(q))))
    }
    const maleIds = new Set(dbHealthBenefits.filter(hb=>!hb.gender||hb.gender==='all'||hb.gender==='male').map(hb=>hb.id))
    const femaleIds = new Set(dbHealthBenefits.filter(hb=>!hb.gender||hb.gender==='all'||hb.gender==='female').map(hb=>hb.id))
    return {
      male:   base.filter(f => f.healthIds && f.healthIds.some(id => maleIds.has(id))).length,
      female: base.filter(f => f.healthIds && f.healthIds.some(id => femaleIds.has(id))).length,
    }
  }, [allFoods, selMonth, selCategory, selRegion, selHealth, selAge, query, dbHealthBenefits])

  // 카테고리별 카운트 (카테고리 필터 제외)
  const categoryCounts = useMemo(() => {
    let base = allFoods
    if (selMonth !== 0) base = base.filter(f => f.months.includes(selMonth))
    if (selRegion !== 'all') base = base.filter(f => f.region === selRegion)
    if (selTV !== 'all') base = base.filter(f => f.tvPrograms && f.tvPrograms.includes(selTV))
    if (selHealth !== 'all') {
      base = base.filter(f => {
        if (f.healthIds && f.healthIds.length > 0) return f.healthIds.includes(selHealth)
        const hb = dbHealthBenefits.find(h => h.id === selHealth)
        if (hb) return f.health.includes(hb.name)
        return false
      })
    }
    if (selAge !== 'all') {
      const ids = new Set(dbHealthBenefits.filter(hb=>(hb.age_groups||[]).includes(selAge)||(hb.age_groups||[]).includes('all')).map(hb=>hb.id))
      base = base.filter(f => f.healthIds && f.healthIds.some(id => ids.has(id)))
    }
    if (selGender !== 'all') {
      const ids = new Set(dbHealthBenefits.filter(hb=>!hb.gender||hb.gender==='all'||hb.gender===selGender).map(hb=>hb.id))
      base = base.filter(f => f.healthIds && f.healthIds.some(id => ids.has(id)))
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      base = base.filter(f => f.ingredient.includes(q)||f.district.includes(q)||f.health.includes(q)||(f.tvPrograms&&f.tvPrograms.some(t=>t.includes(q))))
    }
    const counts = {}
    CATEGORIES.forEach(c => { counts[c.id] = base.filter(f => f.category === c.id).length })
    return counts
  }, [allFoods, selMonth, selRegion, selTV, selHealth, selAge, selGender, query, dbHealthBenefits])

  // 지역별 카운트 (지역 필터 제외)
  const regionCounts = useMemo(() => {
    let base = allFoods
    if (selMonth !== 0) base = base.filter(f => f.months.includes(selMonth))
    if (selCategory !== 'all') base = base.filter(f => f.category === selCategory)
    if (selTV !== 'all') base = base.filter(f => f.tvPrograms && f.tvPrograms.includes(selTV))
    if (selHealth !== 'all') {
      base = base.filter(f => {
        if (f.healthIds && f.healthIds.length > 0) return f.healthIds.includes(selHealth)
        const hb = dbHealthBenefits.find(h => h.id === selHealth)
        if (hb) return f.health.includes(hb.name)
        return false
      })
    }
    if (selAge !== 'all') {
      const ids = new Set(dbHealthBenefits.filter(hb=>(hb.age_groups||[]).includes(selAge)||(hb.age_groups||[]).includes('all')).map(hb=>hb.id))
      base = base.filter(f => f.healthIds && f.healthIds.some(id => ids.has(id)))
    }
    if (selGender !== 'all') {
      const ids = new Set(dbHealthBenefits.filter(hb=>!hb.gender||hb.gender==='all'||hb.gender===selGender).map(hb=>hb.id))
      base = base.filter(f => f.healthIds && f.healthIds.some(id => ids.has(id)))
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      base = base.filter(f => f.ingredient.includes(q)||f.district.includes(q)||f.health.includes(q)||(f.tvPrograms&&f.tvPrograms.some(t=>t.includes(q))))
    }
    const counts = {}
    REGION_ORDER.forEach(r => { counts[r] = base.filter(f => f.region === r).length })
    return counts
  }, [allFoods, selMonth, selCategory, selTV, selHealth, selAge, selGender, query, dbHealthBenefits])


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
        <section style={{ padding: isMobile ? '20px 0 14px' : '40px 0 24px', textAlign: 'center' }}>
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
        {isMobile && (
          <button onClick={() => setShowFilter(v=>!v)} style={{
            width:'100%', padding:'12px', borderRadius:12, marginBottom:10,
            border:'1.5px solid var(--border)', background: showFilter ? '#dcfce7' : 'var(--surface)',
            color: showFilter ? '#15803d' : 'var(--text2)', fontWeight:700, fontSize:14,
            cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8
          }}>⚙️ 필터 {showFilter ? '닫기 ▲' : '열기 ▼'}</button>
        )}
        <div style={{ background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:16, padding: isMobile ? 14 : 20, marginBottom:20, display: isMobile && !showFilter ? 'none' : 'block' }}>

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
            <SectionHeader label="📅 월" skey="month" />
            {openSections.month && <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
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
                    }}>
                    {m}
                    {monthCounts[mon] > 0 && <span style={{ display:'block', fontSize:9, fontWeight:700, color: on ? 'var(--accent)' : 'var(--text3)', marginTop:1 }}>{monthCounts[mon]}</span>}
                  </button>
                )
              })}
            </div>}
          </div>

          {/* 건강 효능 */}
          <div style={{ marginBottom:14, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
            <SectionHeader label={`💊 건강 효능 (${HEALTH_FILTERS.length})`} skey="health" />
            {openSections.health && <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
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
                {HEALTH_FILTERS.map(hf => {
                  const cnt = healthCounts[hf.id] ?? 0
                  return (
                    <option key={hf.id} value={hf.id}>
                      {hf.label} ({cnt})
                    </option>
                  )
                })}
              </select>
              {selHealth !== 'all' && (
                <button onClick={() => setSelHealth('all')}
                  style={{ padding:'4px 10px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text3)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                  ✕
                </button>
              )}
            </div>}
          </div>

          {/* 연령 */}
          <div style={{ marginBottom:14, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
            <SectionHeader label="👥 연령" skey="age" />
            {openSections.age && <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <select
                value={selAge}
                onChange={e => setSelAge(e.target.value)}
                style={{
                  padding:'7px 14px', borderRadius:10,
                  border: selAge !== 'all' ? '1.5px solid #f59e0b' : '1.5px solid var(--border)',
                  background: selAge !== 'all' ? '#f59e0b11' : 'var(--surface2)',
                  color: selAge !== 'all' ? '#d97706' : 'var(--text)',
                  fontSize:13, fontFamily:'inherit', cursor:'pointer',
                  fontWeight: selAge !== 'all' ? 700 : 400,
                  minWidth:160,
                }}
              >
                <option value="all">전체 연령</option>
                <option value="infant">{`👶 유아 (0-6세) (${ageCounts.infant||0})`}</option>
                <option value="child">{`🧒 어린이 (7-12세) (${ageCounts.child||0})`}</option>
                <option value="teen">{`🧑 청소년 (13-18세) (${ageCounts.teen||0})`}</option>
                <option value="adult">{`🧑‍💼 성인 (19-39세) (${ageCounts.adult||0})`}</option>
                <option value="middle">{`🧑‍🦳 중장년 (40-64세) (${ageCounts.middle||0})`}</option>
                <option value="senior">{`👴 노년 (65세+) (${ageCounts.senior||0})`}</option>
              </select>
              {selAge !== 'all' && (
                <button onClick={() => setSelAge('all')}
                  style={{ padding:'4px 10px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text3)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                  ✕
                </button>
              )}
            </div>}
          </div>

          {/* 성별 */}
          <div style={{ marginBottom:14, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
            <SectionHeader label="⚥ 성별" skey="gender" />
            {openSections.gender && <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <select
                value={selGender}
                onChange={e => setSelGender(e.target.value)}
                style={{
                  padding:'7px 14px', borderRadius:10,
                  border: selGender !== 'all' ? '1.5px solid #8b5cf6' : '1.5px solid var(--border)',
                  background: selGender !== 'all' ? '#8b5cf611' : 'var(--surface2)',
                  color: selGender !== 'all' ? '#7c3aed' : 'var(--text)',
                  fontSize:13, fontFamily:'inherit', cursor:'pointer',
                  fontWeight: selGender !== 'all' ? 700 : 400,
                  minWidth:130,
                }}
              >
                <option value="all">전체</option>
                <option value="male">{`♂ 남성 (${genderCounts.male||0})`}</option>
                <option value="female">{`♀ 여성 (${genderCounts.female||0})`}</option>
              </select>
              {selGender !== 'all' && (
                <button onClick={() => setSelGender('all')}
                  style={{ padding:'4px 10px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text3)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                  ✕
                </button>
              )}
            </div>}
          </div>

          {/* 특수 토글: 슈퍼푸드 / 특산품 / 해외 식재료 */}
          <div style={{ marginBottom:14, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
            <SectionHeader label="✨ 특수 필터" skey="special" />
            {openSections.special && <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {/* 슈퍼푸드 토글 */}
              <button
                onClick={() => setSelSuperfood(v => !v)}
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding:'6px 12px', borderRadius:20, border:'1.5px solid',
                  fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                  borderColor: selSuperfood ? '#f59e0b' : 'var(--border)',
                  background: selSuperfood ? '#f59e0b18' : 'var(--surface2)',
                  color: selSuperfood ? '#d97706' : 'var(--text2)',
                  transition:'all 0.15s',
                }}
              >
                <span style={{
                  width:28, height:16, borderRadius:8, border:'1.5px solid',
                  borderColor: selSuperfood ? '#f59e0b' : '#d1d5db',
                  background: selSuperfood ? '#f59e0b' : 'transparent',
                  display:'flex', alignItems:'center', padding:'0 2px',
                  transition:'all 0.15s', flexShrink:0,
                }}>
                  <span style={{
                    width:10, height:10, borderRadius:'50%', background:'#fff',
                    marginLeft: selSuperfood ? 'auto' : 0,
                    boxShadow:'0 1px 2px rgba(0,0,0,0.2)',
                    transition:'margin 0.15s',
                  }} />
                </span>
                🌟 슈퍼푸드
              </button>
            </div>}
          </div>

          {/* 서식지 뱃지 필터 */}
          <div style={{ marginBottom:14, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
            <SectionHeader label="🗺️ 서식지" skey="habitat" />
            {openSections.habitat && <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[
                { key:'ocean',      label:'🌊 바다',  bg:'#f0f9ff', color:'#0c4a6e', border:'#38bdf8' },
                { key:'island',     label:'🏝️ 섬',    bg:'#f0f9ff', color:'#0369a1', border:'#7dd3fc' },
                { key:'tidal',      label:'🌊 갯벌',  bg:'#f0fdfa', color:'#0f766e', border:'#5eead4' },
                { key:'freshwater', label:'🐟 민물',  bg:'#eff6ff', color:'#1d4ed8', border:'#93c5fd' },
                { key:'mountain',   label:'🏔️ 산',    bg:'#f7fee7', color:'#3f6212', border:'#a3e635' },
              ].map(h => (
                <button key={h.key} onClick={() => setSelHabitat(v => v === h.key ? '' : h.key)}
                  style={{
                    padding:'4px 10px', borderRadius:20, border:'1.5px solid', fontSize:12,
                    cursor:'pointer', fontFamily:'inherit', fontWeight: selHabitat===h.key ? 700 : 400,
                    borderColor: selHabitat===h.key ? h.border : 'var(--border)',
                    background: selHabitat===h.key ? h.bg : 'var(--surface2)',
                    color: selHabitat===h.key ? h.color : 'var(--text2)',
                  }}>
                  {h.label}
                  <span style={{ marginLeft:4, fontSize:10, fontWeight:700, background:'rgba(0,0,0,0.06)', borderRadius:999, padding:'1px 5px' }}>
                    {allFoods.filter(f => Array.isArray(f.habitat_badge) ? f.habitat_badge.includes(h.key) : f.habitat_badge === h.key).length}
                  </span>
                </button>
              ))}
            </div>}
          </div>

          {/* 카테고리 */}
          <div style={{ marginBottom:14 }}>
            <SectionHeader label="🏷 카테고리" skey="category" />
            {openSections.category && (
              <div>
                {/* 전체 버튼 */}
                <div style={{ marginBottom:8 }}>
                  <button onClick={() => setSelCategory('all')}
                    style={{ padding:'4px 10px', borderRadius:20, border:'1.5px solid', fontSize:12, cursor:'pointer', fontFamily:'inherit',
                      borderColor: selCategory==='all' ? '#888' : 'var(--border)',
                      background: selCategory==='all' ? 'var(--surface3)' : 'var(--surface2)',
                      color: selCategory==='all' ? 'var(--text)' : 'var(--text2)', fontWeight: selCategory==='all'?700:400,
                    }}>전체</button>
                </div>
                {/* 그룹별 카테고리 */}
                {CATEGORY_GROUPS.map(group => {
                  const groupCats = CATEGORIES.filter(c => group.ids.includes(c.id))
                  const isGroupActive = groupCats.some(c => c.id === selCategory)
                  return (
                    <div key={group.label} style={{ marginBottom:6 }}>
                      <p style={{ fontSize:10, fontWeight:700, color: isGroupActive ? 'var(--accent)' : 'var(--text3)', marginBottom:4, letterSpacing:'0.04em' }}>
                        {group.label}
                      </p>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        {groupCats.map(c => (
                          <button key={c.id} onClick={() => setSelCategory(c.id === selCategory ? 'all' : c.id)}
                            style={{ padding:'4px 10px', borderRadius:20, border:'1.5px solid', fontSize:12, cursor:'pointer', fontFamily:'inherit',
                              borderColor: selCategory===c.id ? c.color : 'var(--border)',
                              background: selCategory===c.id ? c.color+'22' : 'var(--surface2)',
                              color: selCategory===c.id ? c.color : 'var(--text2)',
                              fontWeight: selCategory===c.id ? 700 : 400,
                              opacity: (categoryCounts[c.id]||0) === 0 ? 0.4 : 1,
                            }}>
                            {c.emoji} {c.label}
                            {(categoryCounts[c.id]||0) > 0 && <span style={{ marginLeft:4, fontSize:10, fontWeight:700, background: selCategory===c.id ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.06)', borderRadius:999, padding:'1px 5px' }}>{categoryCounts[c.id]}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 지역 */}
          <div style={{ marginBottom:14 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:8, letterSpacing:'0.05em' }}>📍 지역</p>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <select value={selRegion} onChange={e => setSelRegion(e.target.value)}
                style={{
                  padding:'7px 14px', borderRadius:10,
                  border: selRegion !== 'all' ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                  background: selRegion !== 'all' ? 'rgba(34,197,94,0.08)' : 'var(--surface2)',
                  color: selRegion !== 'all' ? 'var(--accent)' : 'var(--text)',
                  fontSize:13, fontFamily:'inherit', cursor:'pointer',
                  fontWeight: selRegion !== 'all' ? 700 : 400,
                  minWidth:160,
                }}>
                <option value="all">전체 지역</option>
                {REGION_ORDER.map(r => (
                  <option key={r} value={r}>{`${REGION_SHORT[r]} (${regionCounts[r]||0})`}</option>
                ))}
              </select>
              {selRegion !== 'all' && (
                <button onClick={() => setSelRegion('all')}
                  style={{ padding:'4px 10px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text3)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                  ✕
                </button>
              )}
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
            <button onClick={() => { setSelMonth(new Date().getMonth()+1); setSelCategory('all'); setSelRegion('all'); setSelTV('all'); setSelHealth('all'); setSelAge('all'); setSelGender('all'); setSelSuperfood(false); setSelBrand(false); setSelSeason(''); setSelJeolgi(''); setSelSpecial(''); setSelHabitat(''); setSelFarming(''); setQuery('') }}
              style={{ padding:'5px 12px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--surface2)', color:'var(--text3)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
              🔄 초기화
            </button>
          </div>
        </div>

        {/* ── 하단: 지도 + 그래프 + 결과 ── */}

        {/* 데스크탑: 지도 + 그래프 상단 가로 배치 */}
        {!isMobile && (
          <div style={{ display:'flex', gap:16, alignItems:'flex-start', marginBottom:16 }}>
            {/* 지도 */}
            <div style={{
              flexShrink:0, width:320,
              background:'var(--surface)', border:'1.5px solid var(--border)',
              borderRadius:16, overflow:'hidden',
              position:'sticky', top:80,
              height:'calc(100vh - 120px)', maxHeight:520,
            }}>
              <KoreaMap
                filtered={filtered}
                selRegion={selRegion}
                setSelRegion={setSelRegion}
                selMonth={selMonth}
              />
            </div>
            {/* 그래프 */}
            {allFoods.length > 0 && (() => {
              const chartData = REGION_ORDER.map(id => {
                const r = REGIONS.find(x => x.id === id)
                return { id, name: r ? r.name.replace('특별자치도','').replace('광역시','').replace('특별자치시','').replace('특별시','').trim() : id, color: r?.color || '#888', count: regionCounts[id] || 0 }
              })
              const maxVal = Math.max(...chartData.map(d => d.count), 1)
              return (
                <div style={{ flex:1, background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:16, padding:'20px', position:'sticky', top:80, height:'calc(100vh - 120px)', maxHeight:520, display:'flex', flexDirection:'column' }}>
                  <p style={{ fontSize:12, color:'var(--text3)', fontWeight:700, marginBottom:14, letterSpacing:'0.05em' }}>📊 지역별 식재료 수</p>
                  <div style={{ display:'flex', alignItems:'flex-end', gap:5, flex:1 }}>
                    {chartData.map(d => (
                      <div key={d.id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, height:'100%', justifyContent:'flex-end' }}>
                        <span style={{ fontSize:9, color:'var(--text3)', fontWeight:700, lineHeight:1 }}>{d.count}</span>
                        <div style={{ width:'100%', height:`${Math.max((d.count/maxVal)*85,1)}%`, background:d.color, borderRadius:'4px 4px 0 0', opacity:0.8, transition:'height 0.4s' }} />
                        <span style={{ fontSize:9, color:'var(--text3)', lineHeight:1, textAlign:'center', writingMode:'vertical-rl', transform:'rotate(180deg)', height:36 }}>{d.name}</span>
                      </div>
                    ))}
                  </div>
                  {/* 카테고리 아이콘 그리드 — 바 차트 아래 */}
                  {totalCount > 0 && (
                    <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid var(--border)', display:'flex', gap:6, flexWrap:'wrap' }}>
                      {CATEGORIES.filter(c => (categoryCounts[c.id]||0) > 0).map(c => (
                        <button key={c.id}
                          onClick={() => setSelCategory(c.id === selCategory ? 'all' : c.id)}
                          style={{
                            display:'flex', alignItems:'center', gap:5,
                            background: selCategory===c.id ? c.color+'22' : 'var(--surface2)',
                            border: `1.5px solid ${selCategory===c.id ? c.color : 'var(--border)'}`,
                            borderRadius:10, padding:'5px 8px', cursor:'pointer', fontFamily:'inherit',
                            transition:'all 0.15s',
                          }}>
                          <span style={{ fontSize:15 }}>{c.emoji}</span>
                          <span style={{ display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
                            <span style={{ fontSize:13, fontWeight:900, color:c.color, lineHeight:1 }}>{categoryCounts[c.id]||0}</span>
                            <span style={{ fontSize:9, color:'var(--text3)', marginTop:1 }}>{c.label}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* 모바일: 지도 토글 버튼 */}
        {isMobile && (
          <div style={{ marginBottom:12 }}>
            <button onClick={() => setShowMap(v=>!v)} style={{
              width:'100%', padding:'10px', borderRadius:10, border:'1.5px solid var(--border)',
              background: showMap ? 'var(--accent)' : 'var(--surface)', color: showMap ? '#fff' : 'var(--text2)',
              fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit'
            }}>🗺️ 지도 {showMap ? '닫기 ▲' : '보기 ▼'}</button>
            {showMap && (
              <div style={{ marginTop:8, borderRadius:16, overflow:'hidden', border:'1.5px solid var(--border)', height:280 }}>
                <KoreaMap filtered={filtered} selRegion={selRegion} setSelRegion={setSelRegion} selMonth={selMonth} />
              </div>
            )}
          </div>
        )}

        {/* 카드 결과 영역 */}
        <div style={{ width:'100%' }}>
          <div style={{ flex:1, minWidth:0 }}>

            {/* 모바일: 요약 스탯 — 카드 결과 상단 (데스크탑은 바 차트 하단에 표시) */}
            {isMobile && totalCount > 0 && (
              <div style={{ marginBottom:12, display:'flex', gap:6, flexWrap:'wrap' }}>
                {CATEGORIES.filter(c => (categoryCounts[c.id]||0) > 0).map(c => (
                  <button key={c.id}
                    onClick={() => setSelCategory(c.id === selCategory ? 'all' : c.id)}
                    style={{
                      display:'flex', alignItems:'center', gap:3,
                      background: selCategory===c.id ? c.color+'22' : 'var(--surface)',
                      border: `1.5px solid ${selCategory===c.id ? c.color : 'var(--border)'}`,
                      borderRadius:10, padding:'6px 8px', cursor:'pointer', fontFamily:'inherit',
                      transition:'all 0.15s',
                    }}>
                    <span style={{ fontSize:16 }}>{c.emoji}</span>
                    <span style={{ fontSize:13, fontWeight:900, color:c.color }}>{categoryCounts[c.id]||0}</span>
                  </button>
                ))}
              </div>
            )}

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
                                  const foods = allFoods.filter(f =>
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
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                          <span style={{
                            fontSize:11, padding:'3px 8px', borderRadius:999, fontWeight:700,
                            background:categoryBg(f.category), color:categoryColor(f.category),
                            border:`1px solid ${categoryColor(f.category)}44`, flexShrink:0,
                          }}>{cat?.emoji} {cat?.label}</span>
                          <div style={{ display:'flex', gap:3, flexWrap:'wrap', justifyContent:'flex-end' }}>
                            {f.is_superfood && (
                              <span style={{ fontSize:10, padding:'2px 7px', borderRadius:999, fontWeight:700, background:'#f59e0b18', color:'#d97706', border:'1px solid #f59e0b44' }}>
                                🌟 슈퍼푸드
                              </span>
                            )}
                            {f.is_brand && (
                              <span style={{ fontSize:10, padding:'2px 7px', borderRadius:999, fontWeight:700, background:'#e6394618', color:'#e63946', border:'1px solid #e6394644' }}>
                                🏷️ 지역브랜드
                              </span>
                            )}
                            {(Array.isArray(f.season_badge)?f.season_badge:[f.season_badge]).filter(Boolean).map(s => (
                              s === 'spring' ? <span key="spring" style={{ fontSize:10, padding:'2px 7px', borderRadius:999, fontWeight:700, background:'#f0fdf4', color:'#166534', border:'1px solid #86efac' }}>🌸 봄</span> :
                              s === 'summer' ? <span key="summer" style={{ fontSize:10, padding:'2px 7px', borderRadius:999, fontWeight:700, background:'#fefce8', color:'#92400e', border:'1px solid #fde68a' }}>🌞 여름</span> :
                              s === 'fall'   ? <span key="fall"   style={{ fontSize:10, padding:'2px 7px', borderRadius:999, fontWeight:700, background:'#fff7ed', color:'#c2410c', border:'1px solid #fdba74' }}>🍂 가을</span> :
                              s === 'winter' ? <span key="winter" style={{ fontSize:10, padding:'2px 7px', borderRadius:999, fontWeight:700, background:'#eff6ff', color:'#1e40af', border:'1px solid #bae6fd' }}>❄️ 겨울</span> : null
                            ))}
                            {(Array.isArray(f.jeolgi_badge)?f.jeolgi_badge:[f.jeolgi_badge]).filter(Boolean).map(j=>(
                              j==='sambok'  ?<span key="sambok"  style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fff1f2',color:'#be123c',border:'1px solid #fecdd3'}}>🔥 삼복</span>:
                              j==='chopbok' ?<span key="chopbok" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fff1f2',color:'#be123c',border:'1px solid #fecdd3'}}>🔥 초복</span>:
                              j==='jungbok' ?<span key="jungbok" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fff1f2',color:'#be123c',border:'1px solid #fecdd3'}}>🔥 중복</span>:
                              j==='malbok'  ?<span key="malbok"  style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fff1f2',color:'#be123c',border:'1px solid #fecdd3'}}>🔥 말복</span>:
                              j==='chuseok' ?<span key="chuseok" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fefce8',color:'#854d0e',border:'1px solid #fde68a'}}>🌕 추석</span>:
                              j==='gimjang' ?<span key="gimjang" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f0fdf4',color:'#166534',border:'1px solid #86efac'}}>🥬 김장철</span>:
                              j==='dongji'  ?<span key="dongji"  style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#eff6ff',color:'#1e40af',border:'1px solid #bae6fd'}}>☯️ 동지</span>:
                              j==='seollal' ?<span key="seollal" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fdf4ff',color:'#7e22ce',border:'1px solid #e9d5ff'}}>🎍 설날</span>:
                              j==='ipchun'  ?<span key="ipchun"  style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f0fdf4',color:'#166534',border:'1px solid #86efac'}}>🌱 입춘</span>:
                              j==='daeboreum'?<span key="daeboreum" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fef9c3',color:'#713f12',border:'1px solid #fde68a'}}>🌕 정월대보름</span>:
                              j==='dano'    ?<span key="dano"     style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f0fdf4',color:'#166534',border:'1px solid #86efac'}}>🌿 단오</span>:
                              j==='hansik'  ?<span key="hansik"   style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fdf4ff',color:'#7e22ce',border:'1px solid #e9d5ff'}}>🌸 한식</span>:null
                            ))}
                            {(Array.isArray(f.special_badge)?f.special_badge:[f.special_badge]).filter(Boolean).map(s=>(
                              s==='boyangshik' ?<span key="bo" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fff7ed',color:'#c2410c',border:'1px solid #fed7aa'}}>💪 보양식</span>:
                              s==='jeolgi_food'?<span key="je" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fdf4ff',color:'#7e22ce',border:'1px solid #e9d5ff'}}>🎋 절기음식</span>:
                              s==='hangover'   ?<span key="ha" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fefce8',color:'#854d0e',border:'1px solid #fde68a'}}>🍶 해장</span>:
                              s==='diet'       ?<span key="di" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f0fdf4',color:'#166534',border:'1px solid #86efac'}}>🥗 다이어트</span>:null
                            ))}
                            {(Array.isArray(f.habitat_badge)?f.habitat_badge:[f.habitat_badge]).filter(Boolean).map(h=>(
                              h==='island'     ?<span key="isl" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f0f9ff',color:'#0369a1',border:'1px solid #7dd3fc'}}>🏝️ 섬</span>:
                              h==='freshwater' ?<span key="frw" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#eff6ff',color:'#1d4ed8',border:'1px solid #93c5fd'}}>🐟 민물</span>:
                              h==='tidal'      ?<span key="tid" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f0fdfa',color:'#0f766e',border:'1px solid #5eead4'}}>🌊 갯벌</span>:
                              h==='mountain'   ?<span key="mtn" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f7fee7',color:'#3f6212',border:'1px solid #a3e635'}}>🏔️ 산</span>:
                              h==='ocean'      ?<span key="ocn" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#f0f9ff',color:'#0c4a6e',border:'1px solid #38bdf8'}}>🌊 바다</span>:null
                            ))}
                            {(Array.isArray(f.farming_badge)?f.farming_badge:[f.farming_badge]).filter(Boolean).map(p=>(
                              p==='aquaculture'?<span key="aqu" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fdf4ff',color:'#7e22ce',border:'1px solid #d8b4fe'}}>🤿 양식</span>:
                              p==='wild'       ?<span key="wld" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fff7ed',color:'#c2410c',border:'1px solid #fdba74'}}>🎣 자연산</span>:
                              p==='fermented'  ?<span key="fer" style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:700,background:'#fef9c3',color:'#713f12',border:'1px solid #fde68a'}}>🥟 발효</span>:null
                            ))}
                            {f.is_global && (
                              <span style={{ fontSize:10, padding:'2px 7px', borderRadius:999, fontWeight:700, background:'#3b82f618', color:'#2563eb', border:'1px solid #3b82f644' }}>
                                🌍 해외
                              </span>
                            )}
                            {f.is_special && (
                              <span style={{ fontSize:10, padding:'2px 7px', borderRadius:999, fontWeight:700, background:'#8b5cf618', color:'#7c3aed', border:'1px solid #8b5cf644' }}>
                                🏆 특산품
                              </span>
                            )}
                            {f.is_limited && (
                              <span style={{ fontSize:10, padding:'2px 7px', borderRadius:999, fontWeight:700, background:'#ef444418', color:'#dc2626', border:'1px solid #ef444444' }}>
                                ⏰ 기간한정
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>📍 {f.district}</p>

                      <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:10 }}>
                        {selMonth !== 0
                          ? <span style={{fontSize:10,padding:'2px 6px',borderRadius:6,background:'rgba(34,197,94,0.2)',color:'var(--accent)',border:'1px solid rgba(34,197,94,0.4)',fontWeight:700}}>{selMonth}월 ✓</span>
                          : f.months.sort((a,b)=>a-b).map(m => (
                            <span key={m} style={{fontSize:10,padding:'2px 6px',borderRadius:6,background:'var(--surface2)',color:'var(--text3)',border:'1px solid var(--border)'}}>{m}월</span>
                          ))
                        }
                      </div>

                      {/* 건강효능 태그 */}
                      {(f.healthIds||[]).length > 0 && (() => {
                        const BENEFIT_COLOR = {'면역':['#16a34a','#dcfce7'],'두뇌':['#6366f1','#ede9fe'],'눈':['#6366f1','#ede9fe'],'혈관':['#ef4444','#fee2e2'],'심장':['#ef4444','#fee2e2'],'혈압':['#ef4444','#fee2e2'],'뼈':['#f59e0b','#fef3c7'],'관절':['#f59e0b','#fef3c7'],'소화':['#10b981','#d1fae5'],'장':['#10b981','#d1fae5'],'피부':['#ec4899','#fce7f3'],'미용':['#ec4899','#fce7f3'],'체중':['#8b5cf6','#ede9fe'],'다이어트':['#8b5cf6','#ede9fe'],'항암':['#dc2626','#fee2e2'],'항산화':['#16a34a','#dcfce7']}
                        const getBenefitStyle = (cat) => {
                          for (const [key,[color,bg]] of Object.entries(BENEFIT_COLOR)) { if(cat&&cat.includes(key)) return {color,bg} }
                          return {color:'#6b7280',bg:'#f3f4f6'}
                        }
                        const benefits = (f.healthIds||[]).map(id => dbHealthBenefits.find(h=>h.id===id)).filter(Boolean)
                        return (
                          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
                            {benefits.slice(0,5).map(b => {
                              const {color,bg} = getBenefitStyle(b.category)
                              return <span key={b.id} style={{fontSize:10,padding:'2px 7px',borderRadius:999,fontWeight:600,background:bg,border:`1px solid ${color}44`,color}}>{b.name}</span>
                            })}
                            {benefits.length > 5 && <span style={{fontSize:10,color:'#9ca3af',padding:'2px 4px'}}>+{benefits.length-5}</span>}
                          </div>
                        )
                      })()}

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
          </div>
        </div>
        </div>

      </main>
      <Footer />
    </>
  )
}
