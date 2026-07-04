import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { REGIONS } from '../lib/regions'

const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12]

// 관리자 페이지(MapAdminPanel)의 연령대 구간과 동일한 기준
const AGE_GROUPS = [
  { id:'infant', label:'👶 유아',   range:'0~6세',   min:0,  max:6   },
  { id:'child',  label:'🧒 어린이', range:'7~12세',  min:7,  max:12  },
  { id:'teen',   label:'🧑 청소년', range:'13~18세', min:13, max:18  },
  { id:'adult',  label:'🧑‍💼 성인', range:'19~39세', min:19, max:39  },
  { id:'middle', label:'🧑‍🦳 중장년', range:'40~64세', min:40, max:64  },
  { id:'senior', label:'👴 노년',   range:'65세+',   min:65, max:999 },
]

function ageGroupFromBirthYear(birthYear) {
  if (!birthYear) return null
  const age = new Date().getFullYear() - birthYear
  if (age < 0 || age > 120) return null
  const g = AGE_GROUPS.find(g => age >= g.min && age <= g.max)
  return g ? g.id : null
}

// 재료의 caution(주의사항) 텍스트에 포함된 키워드로 매칭.
// healthCategory가 있으면 해당 건강효능 카테고리를 "추천 이유"로도 함께 활용.
const CONDITIONS = [
  { id:'diabetes',      label:'🍬 당뇨',            keyword:'당뇨',   healthCategory:'혈당·당뇨' },
  { id:'gout',          label:'🦶 통풍',            keyword:'통풍',   healthCategory:'통풍·요산' },
  { id:'kidney',        label:'🫘 신장 질환',        keyword:'신장',   healthCategory:'신장·비뇨' },
  { id:'hypertension',  label:'❤️ 고혈압',          keyword:'고혈압', healthCategory:'혈관·심장' },
  { id:'thyroid',       label:'🦋 갑상선 질환',      keyword:'갑상선', healthCategory:null },
  { id:'pregnant',      label:'🤰 임신 중',          keyword:'임산부', healthCategory:'임산부·태아' },
  { id:'nut',           label:'🥜 견과류 알레르기',   keyword:'견과류', healthCategory:null },
  { id:'shellfish',     label:'🦐 갑각류 알레르기',   keyword:'갑각류', healthCategory:null },
  { id:'gluten',        label:'🌾 밀·글루텐 알레르기', keyword:'글루텐', healthCategory:null },
  { id:'lactose',       label:'🥛 유당불내증',       keyword:'유당',   healthCategory:null },
  { id:'anticoagulant', label:'💊 항응고제 복용',     keyword:'항응고제', healthCategory:null },
]

// 연령대별로 특히 챙겨볼 만한 건강효능 카테고리 (있으면 추천 이유에 표시)
// 국가건강검진·국가암검진에서 해당 연령대에 강화되는 항목을 근거로 매핑함 (/health-guide/health-issues 참고)
const AGE_HEALTH_CATEGORY = {
  infant: [],
  child:  ['어린이성장'],
  teen:   ['수험생·집중력'],
  adult:  ['혈액·빈혈'],                          // 가임기 여성 철분 부족 이슈 반영
  middle: ['소화·장', '혈관·심장', '갱년기·호르몬'], // 40대 위암검진 시작(소화기), 심뇌혈관질환, 폐경 이슈 반영
  senior: ['노인·골감소증', '뼈·관절', '눈·두뇌'],   // 뼈 건강 + 인지·시력 관련 이슈 반영
}

// 체중관리(BMI) 관련 — 아시아·태평양 기준(대한비만학회 기준과 동일)
function bmiCategory(bmi) {
  if (bmi < 18.5) return { label:'저체중', color:'#3b82f6' }
  if (bmi < 23)   return { label:'정상',   color:'#16a34a' }
  if (bmi < 25)   return { label:'과체중', color:'#d97706' }
  if (bmi < 30)   return { label:'비만',   color:'#ea580c' }
  return { label:'고도비만', color:'#dc2626' }
}
const DIET_HEALTH_CATEGORY = '체중·다이어트'
const FORME_STORAGE_KEY = 'fresh_season_forme_inputs_v1'

// ── 식단표(주간/월간) 생성 관련 ──────────────────────────
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

const PROTEIN_CATS = ['fish','crustacean','shellfish','other_seafood','beef','pork','chicken','egg','processed_meat','meat','mushroom']
const VEG_CATS      = ['veg','root_veg','fruit_veg','herb_veg','wild_herb','seaweed']
const GRAIN_CATS    = ['grain']
const FRUIT_CATS    = ['fruit','tropical_fruit','berry']

const DISH_TEMPLATES = {
  fish: ['{n} 구이', '{n} 조림', '{n}탕'],
  crustacean: ['{n} 찜', '{n} 볶음'],
  shellfish: ['{n} 탕', '{n} 무침'],
  seaweed: ['{n} 무침', '{n} 국'],
  other_seafood: ['{n} 볶음', '{n} 무침'],
  veg: ['{n} 나물', '{n} 무침'],
  root_veg: ['{n} 조림', '{n} 볶음'],
  fruit_veg: ['{n} 볶음', '{n} 무침'],
  herb_veg: ['{n} 나물'],
  wild_herb: ['{n} 나물'],
  grain: ['{n}밥', '{n}죽'],
  processed: ['{n}'],
  beef: ['{n} 구이', '{n} 볶음'],
  pork: ['{n} 구이', '{n} 볶음'],
  chicken: ['{n} 구이', '{n} 볶음'],
  egg: ['{n}찜', '{n} 후라이'],
  processed_meat: ['{n} 구이'],
  meat: ['{n} 구이'],
  mushroom: ['{n} 볶음', '{n}전'],
  fruit: ['{n}'],
  tropical_fruit: ['{n}'],
  berry: ['{n}'],
}

function dishFor(food, rngIndex = 0) {
  const templates = DISH_TEMPLATES[food.category] || ['{n} 요리']
  const t = templates[rngIndex % templates.length]
  return t.replace('{n}', food.ingredient)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function cyclic(arr, i) { return arr.length ? arr[i % arr.length] : null }

// pool(추천 재료 목록)을 바탕으로 7일치 아침/점심/저녁 예시 식단을 만든다.
// 실제 존재하는 추천 재료만 사용하고, 없는 카테고리는 자연스럽게 생략한다.
function generateWeekPlan(pool) {
  const protein = shuffle(pool.filter(f => PROTEIN_CATS.includes(f.category)))
  const veg     = shuffle(pool.filter(f => VEG_CATS.includes(f.category)))
  const grain   = shuffle(pool.filter(f => GRAIN_CATS.includes(f.category)))
  const fruit   = shuffle(pool.filter(f => FRUIT_CATS.includes(f.category)))

  return DAY_LABELS.map((day, di) => {
    const p1 = cyclic(protein, di * 2)
    const p2 = cyclic(protein, di * 2 + 1)
    const v1 = cyclic(veg, di * 2)
    const v2 = cyclic(veg, di * 2 + 1)
    const g  = cyclic(grain, di)
    const fr = cyclic(fruit, di)
    const riceLine = g ? dishFor(g, 0) : '잡곡밥'

    return {
      day,
      breakfast: [riceLine, fr && dishFor(fr, di)].filter(Boolean),
      lunch:     [riceLine, v1 && dishFor(v1, di), p1 && dishFor(p1, di)].filter(Boolean),
      dinner:    [riceLine, v2 && dishFor(v2, di + 1), p2 && dishFor(p2, di + 1)].filter(Boolean),
    }
  })
}

// 카테고리별 "다이어트 중이면 참고할 만한" 일반적인 안내 (배제/금지가 아니라 적당량 권장 톤 유지)
const MODERATION_HINTS = {
  fruit:          '당분이 있는 편이라 적당량을 추천해요',
  tropical_fruit: '당분이 있는 편이라 적당량을 추천해요',
  berry:          '당분이 있는 편이라 적당량을 추천해요',
  grain:          '탄수화물 함량이 높은 편이라 양 조절을 고려해보세요',
  processed:      '나트륨·지방이 많을 수 있어요',
  processed_meat: '나트륨·지방이 많을 수 있어요',
  pork:           '지방 함량이 있는 편이라 조리법(찜·구이 등)을 신경 써보세요',
  beef:           '지방 함량이 있는 편이라 조리법을 신경 써보세요',
}

// 지역 페이지 카드와 동일한 뱃지 세트 + 이 재료가 나는 지역들을 함께 보여줌
function FoodBadges({ food }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
      {(food.regions || []).map(rid => {
        const r = REGIONS.find(rr => rr.id === rid)
        if (!r) return null
        return (
          <span key={rid} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, fontWeight: 700,
            background: `${r.color}18`, color: r.color, border: `1px solid ${r.color}44` }}>
            {r.icon} {r.name}
          </span>
        )
      })}
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
  )
}

// 건강효능 태그 (지역 페이지와 동일한 컬러 매핑)
function FoodHealthTags({ food }) {
  if (!(food.healthBenefits || []).length) return null
  const BENEFIT_COLOR = {'면역':['#16a34a','#dcfce7'],'두뇌':['#6366f1','#ede9fe'],'눈':['#6366f1','#ede9fe'],'혈관':['#ef4444','#fee2e2'],'심장':['#ef4444','#fee2e2'],'혈압':['#ef4444','#fee2e2'],'뼈':['#f59e0b','#fef3c7'],'관절':['#f59e0b','#fef3c7'],'소화':['#10b981','#d1fae5'],'장':['#10b981','#d1fae5'],'피부':['#ec4899','#fce7f3'],'미용':['#ec4899','#fce7f3'],'체중':['#8b5cf6','#ede9fe'],'다이어트':['#8b5cf6','#ede9fe'],'항암':['#dc2626','#fee2e2'],'항산화':['#16a34a','#dcfce7']}
  const getBenefitStyle = (cat) => {
    for (const [key,[color,bg]] of Object.entries(BENEFIT_COLOR)) { if (cat && cat.includes(key)) return { color, bg } }
    return { color: '#6b7280', bg: '#f3f4f6' }
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
      {(food.healthBenefits || []).slice(0, 5).map(b => {
        const { color, bg } = getBenefitStyle(b.category)
        return <span key={b.id} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, fontWeight: 600, background: bg, border: `1px solid ${color}44`, color }}>{b.name}</span>
      })}
      {(food.healthBenefits || []).length > 5 && <span style={{ fontSize: 10, color: '#9ca3af', padding: '2px 4px' }}>+{(food.healthBenefits || []).length - 5}</span>}
    </div>
  )
}

// 지병별 좋은/피할 음식, 체중관리 카드 등에서 공통으로 쓰는 간단 카드
function SimpleFoodCard({ food, borderColor, bg, textColor, text }) {
  return (
    <Link href={`/ingredient/${encodeURIComponent(food.ingredient)}`} className="card" style={{ borderColor, background: bg }}>
      <div style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 18, fontWeight: 900, display: 'block' }}>{food.ingredient}</span>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
          {[...food.months].sort((a, b) => a - b).map(m => (
            <span key={m} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--text3)' }}>{m}월</span>
          ))}
        </div>
      </div>
      <FoodBadges food={food} />
      {text && <p style={{ fontSize: 12, color: textColor, lineHeight: 1.6, fontWeight: 600 }}>{text}</p>}
    </Link>
  )
}

export default function ForMePage() {
  const [rawFoods, setRawFoods]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [birthYear, setBirthYear] = useState('')
  const [gender, setGender]       = useState('all')
  const [heightCm, setHeightCm]   = useState('')
  const [weightKg, setWeightKg]   = useState('')
  const [conditions, setConditions] = useState([])
  const [month, setMonth]         = useState(null)
  const [canNativeShare, setCanNativeShare] = useState(false)
  const [kakaoReady, setKakaoReady] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState('')
  const [origin, setOrigin] = useState('https://www.fsfood.kr')
  const [mealWeeks, setMealWeeks] = useState([])   // 생성된 식단 (주 단위 배열)
  const [planLength, setPlanLength] = useState(1)  // 1주 or 4주(한 달)

  // 공유된 링크(?by=&g=&h=&w=&c=&m=)로 들어온 경우가 최우선, 아니면 이전에 입력했던 값(세션 저장)을 복원,
  // 그것도 없으면 이번 달로 기본 설정 — 카드 클릭 후 뒤로가기 해도 입력값이 사라지지 않게 하기 위함
  useEffect(() => {
    let saved = {}
    try { saved = JSON.parse(sessionStorage.getItem(FORME_STORAGE_KEY) || '{}') } catch {}

    const params = new URLSearchParams(window.location.search)
    setBirthYear(params.get('by') ?? saved.birthYear ?? '')
    setGender(params.get('g') ?? saved.gender ?? 'all')
    setHeightCm(params.get('h') ?? saved.heightCm ?? '')
    setWeightKg(params.get('w') ?? saved.weightKg ?? '')
    setConditions(params.get('c') ? params.get('c').split(',').filter(Boolean) : (saved.conditions ?? []))
    const mParam = Number(params.get('m'))
    setMonth((mParam >= 1 && mParam <= 12) ? mParam : (saved.month ?? new Date().getMonth() + 1))

    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share)
    setOrigin(window.location.origin)
  }, [])

  // 입력값이 바뀔 때마다 세션에 저장 — 재료 카드를 눌러 이동했다가 뒤로가기 해도 그대로 복원됨
  useEffect(() => {
    if (month === null) return // 초기 복원 전에는 저장하지 않음(기본값으로 덮어쓰는 것 방지)
    try {
      sessionStorage.setItem(FORME_STORAGE_KEY, JSON.stringify({ birthYear, gender, heightCm, weightKg, conditions, month }))
    } catch {}
  }, [birthYear, gender, heightCm, weightKg, conditions, month])

  // 카카오톡 공유 SDK — NEXT_PUBLIC_KAKAO_JS_KEY가 설정된 경우에만 로드 (없으면 링크 복사로 대체)
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
    if (!key || typeof window === 'undefined') return
    const init = () => { if (window.Kakao && !window.Kakao.isInitialized()) window.Kakao.init(key); setKakaoReady(true) }
    if (window.Kakao) { init(); return }
    const script = document.createElement('script')
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
    script.onload = init
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    fetch('/api/map/seasonal-foods')
      .then(r => r.ok ? r.json() : {})
      .then(data => setRawFoods(Array.isArray(data) ? data : (data.foods || [])))
      .catch(() => setRawFoods([]))
      .finally(() => setLoading(false))
  }, [])

  // 지역과 무관하게 재료명 기준으로 합치고, 월과 지역은 지역별 데이터의 합집합으로 계산
  const allFoods = useMemo(() => {
    const map = {}
    rawFoods.forEach(f => {
      if (!map[f.ingredient]) {
        map[f.ingredient] = { ...f, months: [...(f.months || [])], regions: f.region ? [f.region] : [] }
      } else {
        const g = map[f.ingredient]
        ;(f.months || []).forEach(m => { if (!g.months.includes(m)) g.months.push(m) })
        if (f.region && !g.regions.includes(f.region)) g.regions.push(f.region)
      }
    })
    return Object.values(map)
  }, [rawFoods])

  const toggleCondition = (id) => setConditions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const userAgeGroup = ageGroupFromBirthYear(Number(birthYear) || null)
  const userAge = birthYear ? new Date().getFullYear() - Number(birthYear) : null
  const selectedConditions = CONDITIONS.filter(c => conditions.includes(c.id))

  const bmi = (Number(heightCm) > 0 && Number(weightKg) > 0)
    ? Number(weightKg) / ((Number(heightCm) / 100) ** 2)
    : null
  const bmiInfo = bmi ? bmiCategory(bmi) : null
  const wantsWeightCare = !!bmi && bmi >= 23 // 과체중 이상이면 체중관리 참고 정보 함께 노출

  const isDietFriendly = (f) =>
    (f.healthBenefits || []).some(hb => hb.category === DIET_HEALTH_CATEGORY) ||
    (Array.isArray(f.special_badge) ? f.special_badge.includes('diet') : f.special_badge === 'diet')

  const monthFoods = useMemo(() => {
    if (!month) return []
    return allFoods.filter(f => (f.months || []).includes(month))
      .sort((a, b) => a.ingredient.localeCompare(b.ingredient, 'ko'))
  }, [allFoods, month])

  const { avoidList, recommendList, moderationList } = useMemo(() => {
    const avoid = []
    const recommend = []
    const moderation = []
    monthFoods.forEach(f => {
      const matched = selectedConditions.filter(c => f.caution && f.caution.includes(c.keyword))
      if (matched.length > 0) { avoid.push({ ...f, matched }); return }

      const ageOk    = !userAgeGroup || !(f.age_groups || []).length || f.age_groups.includes('all') || f.age_groups.includes(userAgeGroup)
      const genderOk = gender === 'all' || !f.gender || f.gender === 'all' || f.gender === gender
      if (!ageOk || !genderOk) return

      const reasons = []
      selectedConditions.forEach(c => {
        if (c.healthCategory && (f.healthBenefits || []).some(hb => hb.category === c.healthCategory)) {
          reasons.push(`${c.label.replace(/^\S+\s/, '')} 관리에 도움`)
        }
      })
      const ageCats = userAgeGroup ? (AGE_HEALTH_CATEGORY[userAgeGroup] || []) : []
      ageCats.forEach(cat => {
        if ((f.healthBenefits || []).some(hb => hb.category === cat)) reasons.push(`${cat} 관련 효능`)
      })

      const dietFriendly = wantsWeightCare && isDietFriendly(f)
      if (dietFriendly) reasons.push('체중관리에 참고하기 좋음')

      recommend.push({ ...f, reasons })

      // 체중관리 참고 — 다이어트 친화 재료로 이미 분류된 건 제외하고, 카테고리상 조절이 필요할 수 있는 것만 별도 안내
      if (wantsWeightCare && !dietFriendly && MODERATION_HINTS[f.category]) {
        moderation.push({ ...f, hint: MODERATION_HINTS[f.category] })
      }
    })
    // ㄱㄴㄷ 순(가나다순) 정렬 — monthFoods가 이미 가나다순이라 자연스럽게 유지됨
    return { avoidList: avoid, recommendList: recommend, moderationList: moderation }
  }, [monthFoods, selectedConditions, userAgeGroup, gender, wantsWeightCare])

  // 체크한 지병별로 "좋은 음식" / "피해야 할 음식"을 따로 모아서 보여주기 위한 그룹
  const conditionGroups = useMemo(() => {
    return selectedConditions.map(c => ({
      condition: c,
      good: c.healthCategory ? monthFoods.filter(f => (f.healthBenefits || []).some(hb => hb.category === c.healthCategory)) : [],
      bad: monthFoods.filter(f => f.caution && f.caution.includes(c.keyword)),
    }))
  }, [monthFoods, selectedConditions])

  // 체중관리(다이어트)가 필요한 경우, 감량에 도움되는 음식만 따로 모은 목록
  const dietGoodList = useMemo(() => {
    if (!wantsWeightCare) return []
    return monthFoods.filter(f => isDietFriendly(f))
  }, [monthFoods, wantsWeightCare])

  // 식단표를 만들 때 쓸 재료 풀 — 체중관리 중이면 다이어트 친화 재료 비중을 살짝 높임
  const mealPool = wantsWeightCare && dietGoodList.length >= 4
    ? [...dietGoodList, ...dietGoodList, ...recommendList]
    : recommendList

  const regeneratePlan = (weeks) => {
    setPlanLength(weeks)
    setMealWeeks(Array.from({ length: weeks }, () => generateWeekPlan(mealPool)))
  }

  const ageGroupInfo = AGE_GROUPS.find(g => g.id === userAgeGroup)

  // ── 공유 기능 ──────────────────────────────────────────
  const SITE_ORIGIN = origin
  const SOIL_MESSAGE = '🇰🇷 신토불이! 한국 사람은 한국 땅에서, 그 계절에 나는 음식을 먹을 때 가장 건강한 에너지를 얻을 수 있어요.'

  // 내 입력값을 쿼리로 담은 "내 결과 그대로 보여주는" 링크
  const buildResultUrl = () => {
    const params = new URLSearchParams()
    if (birthYear) params.set('by', birthYear)
    if (gender !== 'all') params.set('g', gender)
    if (heightCm) params.set('h', heightCm)
    if (weightKg) params.set('w', weightKg)
    if (conditions.length) params.set('c', conditions.join(','))
    if (month) params.set('m', String(month))
    const qs = params.toString()
    return `${SITE_ORIGIN}/for-me${qs ? '?' + qs : ''}`
  }
  const inviteUrl = `${SITE_ORIGIN}/for-me`

  const buildResultShareText = () => {
    const topRec   = recommendList.slice(0, 3).map(f => f.ingredient)
    const topAvoid = avoidList.slice(0, 3).map(f => f.ingredient)
    let text = `🥕 ${month}월, 나에게 맞는 제철 먹거리 추천 결과!\n\n`
    text += `😋 추천: ${topRec.length ? topRec.join(', ') + (recommendList.length > topRec.length ? ` 외 ${recommendList.length - topRec.length}가지` : '') : '없음'}\n`
    if (avoidList.length) text += `⚠️ 주의: ${topAvoid.join(', ')}${avoidList.length > topAvoid.length ? ` 외 ${avoidList.length - topAvoid.length}가지` : ''}\n`
    text += `\n${SOIL_MESSAGE}`
    return text
  }
  const inviteShareText = `${SOIL_MESSAGE}\n\n나에게 맞는 이달의 제철 먹거리, 너도 한번 확인해봐 🥬`

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMsg('복사했어요! 원하는 곳에 붙여넣어 공유해보세요 🙌')
    } catch {
      setCopiedMsg('복사에 실패했어요. 직접 선택해서 복사해주세요.')
    }
    setTimeout(() => setCopiedMsg(''), 2500)
  }

  const nativeShare = async (title, text, url) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title, text, url }) } catch {}
    } else {
      copyToClipboard(`${text}\n\n${url}`)
    }
  }

  const shareKakao = (title, description, url) => {
    if (kakaoReady && window.Kakao) {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title, description,
          imageUrl: `${SITE_ORIGIN}/og-image.png`,
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [{ title: '확인하러 가기', link: { mobileWebUrl: url, webUrl: url } }],
      })
    } else {
      copyToClipboard(`${title}\n${description}\n\n${url}`)
    }
  }

  const shareBtnStyle = (bg, color = '#fff') => ({
    padding: '8px 13px', borderRadius: 8, border: 'none', background: bg, color,
    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none',
  })

  const ShareRow = ({ title, text, url }) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {canNativeShare && (
        <button onClick={() => nativeShare(title, text, url)} style={shareBtnStyle('#111827')}>📤 공유하기</button>
      )}
      <button onClick={() => shareKakao(title, text, url)} style={shareBtnStyle('#FEE500', '#3c1e1e')}>💬 카카오톡</button>
      <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`} style={shareBtnStyle('#6b7280')}>✉️ 이메일</a>
      <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" style={shareBtnStyle('#000')}>𝕏 트위터</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" style={shareBtnStyle('#1877f2')}>📘 페이스북</a>
      <button onClick={() => copyToClipboard(`${text}\n\n${url}`)} style={shareBtnStyle('#16a34a')}>🔗 복사</button>
      <span style={{ fontSize: 11, color: 'var(--text3)' }}>· 인스타그램은 복사한 내용을 스토리/DM에 붙여넣어 공유해보세요</span>
    </div>
  )

  return (
    <>
      <Head>
        <title>맞춤 제철 먹거리 추천 — Fresh Season</title>
        <meta name="description" content="나이, 성별, 지병(주의사항)을 입력하면 이달에 추천하는 제철 식재료와 피해야 할 식재료를 알려드려요." />
      </Head>
      <Header />
      <main className="wrap" style={{ paddingTop: 20, paddingBottom: 60 }}>

        <section style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>🧬 나에게 맞는 제철 먹거리</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            출생연도·성별·키/몸무게·지병(주의사항)을 알려주시면, 이번 달 제철 식재료 중 <b>추천할 것</b>과 <b>피하는(또는 적당히 조절하는) 게 좋은 것</b>을 정리해드려요.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
            연령대별 추천은 보건복지부·한국영양학회의 「2025 한국인 영양소 섭취기준」과 국민건강보험공단의 국가건강검진 기준을 참고해서 만들어져요. →{' '}
            <Link href="/health-guide" style={{ color: 'var(--accent, #16a34a)', fontWeight: 700 }}>연령별 건강 가이드 자세히 보기</Link>
          </p>
        </section>

        {/* 신토불이 메시지 */}
        <section style={{
          marginBottom: 24, padding: '16px 20px', borderRadius: 12,
          background: 'linear-gradient(135deg, #f0fdf4, #eff6ff)', border: '1px solid #bbf7d0',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 26 }}>🇰🇷</span>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', lineHeight: 1.6, margin: 0 }}>
            신토불이 — 한국 사람은 한국 땅에서, 그 계절에 나는 음식을 먹을 때 가장 건강한 에너지를 얻을 수 있어요.
          </p>
        </section>

        {/* 친구에게 추천하기 */}
        <section style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>👥 이 테스트, 친구에게도 추천해보세요</p>
          <ShareRow title="Fresh Season 맞춤 제철 추천" text={inviteShareText} url={inviteUrl} />
        </section>

        {/* 입력 폼 */}
        <section className="detail-box" style={{ marginBottom: 28, padding: '20px 22px' }}>
          <div style={{ display: 'grid', gap: 18 }}>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🎂 출생연도 (선택)</label>
              <input type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)}
                placeholder="예: 1990" min="1900" max={new Date().getFullYear()}
                style={{ width: 160, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, boxSizing: 'border-box' }} />
              {ageGroupInfo && (
                <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text2)' }}>
                  만 {userAge}세 · {ageGroupInfo.label} ({ageGroupInfo.range})
                  {' '}
                  <Link href={`/health-guide/nutrients#${userAgeGroup}`} style={{ color: 'var(--accent, #16a34a)', fontWeight: 700 }}>🥗 영양소 기준</Link>
                  {' · '}
                  <Link href={`/health-guide/health-issues#${userAgeGroup}`} style={{ color: 'var(--accent, #16a34a)', fontWeight: 700 }}>🩺 질환·검진 기준</Link>
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📏 키 / 몸무게 (선택)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <input type="number" value={heightCm} onChange={e => setHeightCm(e.target.value)}
                  placeholder="키 (cm)" min="50" max="250"
                  style={{ width: 110, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, boxSizing: 'border-box' }} />
                <input type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)}
                  placeholder="몸무게 (kg)" min="20" max="300"
                  style={{ width: 120, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, boxSizing: 'border-box' }} />
                {bmiInfo && (
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                    color: bmiInfo.color, background: `${bmiInfo.color}18`, border: `1px solid ${bmiInfo.color}44` }}>
                    BMI {bmi.toFixed(1)} · {bmiInfo.label}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                입력하시면 체중관리에 참고할 만한 재료도 함께 보여드려요. (BMI는 일반적인 참고 지표일 뿐, 진단이 아니에요)
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>⚥ 성별</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ id: 'all', label: '전체' }, { id: 'male', label: '♂ 남성' }, { id: 'female', label: '♀ 여성' }].map(g => (
                  <button key={g.id} type="button" onClick={() => setGender(g.id)} className="month-pill"
                    style={{
                      borderColor: gender === g.id ? '#3b82f6' : undefined,
                      background:  gender === g.id ? '#3b82f622' : undefined,
                      color:       gender === g.id ? '#3b82f6' : undefined,
                      fontWeight: gender === g.id ? 700 : 500,
                    }}>{g.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🩺 지병 · 주의사항 (해당되는 것 모두 선택)</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CONDITIONS.map(c => {
                  const on = conditions.includes(c.id)
                  return (
                    <button key={c.id} type="button" onClick={() => toggleCondition(c.id)} className="month-pill"
                      style={{
                        borderColor: on ? '#dc2626' : undefined,
                        background:  on ? '#dc262622' : undefined,
                        color:       on ? '#dc2626' : undefined,
                        fontWeight: on ? 700 : 500,
                      }}>{c.label}</button>
                  )
                })}
                {conditions.length > 0 && (
                  <button type="button" onClick={() => setConditions([])}
                    style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text3)', fontSize: 12, cursor: 'pointer' }}>
                    ✕ 초기화
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📅 기준 월</label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {MONTHS.map(m => (
                  <button key={m} type="button" onClick={() => setMonth(m)} className="month-pill"
                    style={{
                      borderColor: month === m ? '#16a34a' : undefined,
                      background:  month === m ? '#16a34a22' : undefined,
                      color:       month === m ? '#16a34a' : undefined,
                      fontWeight: month === m ? 700 : 500,
                      fontSize: 12, padding: '4px 10px',
                    }}>{m}월</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <p style={{ color: 'var(--text3)', fontSize: 14, padding: '20px 0' }}>불러오는 중...</p>
        ) : (
          <>
            {/* 추천 */}
            <section style={{ marginBottom: 40 }}>
              <h2 className="section-title">
                😋 {month}월 추천 식재료 <span>{recommendList.length}가지</span>
              </h2>
              {recommendList.length === 0 ? (
                <p style={{ color: 'var(--text3)', fontSize: 14, padding: '10px 0' }}>조건에 맞는 추천 재료가 없어요.</p>
              ) : (
                <div className="grid-auto">
                  {recommendList.map((food, i) => (
                    <Link key={i} href={`/ingredient/${encodeURIComponent(food.ingredient)}`} className="card">
                      <div style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 18, fontWeight: 900, display: 'block' }}>{food.ingredient}</span>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
                          {[...food.months].sort((a, b) => a - b).map(m => (
                            <span key={m} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--text3)' }}>{m}월</span>
                          ))}
                        </div>
                      </div>
                      {food.reasons.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                          {food.reasons.map((r, j) => (
                            <span key={j} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 700, background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac' }}>✅ {r}</span>
                          ))}
                        </div>
                      )}
                      <FoodBadges food={food} />
                      <FoodHealthTags food={food} />
                      <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>💚 {food.health}</p>
                      {(food.tvPrograms || []).length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                          {food.tvPrograms.map(tv => <span key={tv} className="tag">📺 {tv}</span>)}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* 지병별 맞춤 리스트 — 체크한 지병마다 "좋은 음식"과 "피해야 할 음식"을 따로 모아서 보여줌 */}
            <section style={{ marginBottom: 40 }}>
              <h2 className="section-title">
                🩺 지병별 맞춤 리스트
              </h2>
              {selectedConditions.length === 0 ? (
                <p style={{ color: 'var(--text3)', fontSize: 14, padding: '10px 0' }}>위에서 지병·주의사항을 선택하면 지병별로 좋은 음식 / 피해야 할 음식을 나눠서 보여드려요.</p>
              ) : (
                conditionGroups.map(g => (
                  <div key={g.condition.id} style={{ marginBottom: 28 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>{g.condition.label}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>✅ 좋은 음식 ({g.good.length}가지)</p>
                        {g.good.length === 0 ? (
                          <p style={{ color: 'var(--text3)', fontSize: 13, padding: '6px 0' }}>
                            {g.condition.healthCategory ? '이번 달엔 해당하는 재료가 없어요.' : '이 항목은 특정 효능 매칭이 없어 안내가 어려워요.'}
                          </p>
                        ) : (
                          <div className="grid-auto">
                            {g.good.map((food, i) => (
                              <SimpleFoodCard key={i} food={food} borderColor="#86efac" bg="#f0fdf4" textColor="#166534" text={`💚 ${food.health}`} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>🚫 피해야 할 음식 ({g.bad.length}가지)</p>
                        {g.bad.length === 0 ? (
                          <p style={{ color: 'var(--text3)', fontSize: 13, padding: '6px 0' }}>이번 달엔 특별히 주의할 재료가 없어요.</p>
                        ) : (
                          <div className="grid-auto">
                            {g.bad.map((food, i) => (
                              <SimpleFoodCard key={i} food={food} borderColor="#fca5a5" bg="#fff8f8" textColor="#b91c1c" text={food.caution} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>

            {/* 체중관리(다이어트)에 도움되는 음식만 모아보기 */}
            {wantsWeightCare && (
              <section style={{ marginBottom: 40 }}>
                <h2 className="section-title">
                  🥗 {month}월, 체중관리에 도움되는 음식 <span>{dietGoodList.length}가지</span>
                </h2>
                {dietGoodList.length === 0 ? (
                  <p style={{ color: 'var(--text3)', fontSize: 14, padding: '10px 0' }}>이번 달엔 다이어트 관련 배지가 등록된 재료가 없어요.</p>
                ) : (
                  <div className="grid-auto">
                    {dietGoodList.map((food, i) => (
                      <SimpleFoodCard key={i} food={food} borderColor="#86efac" bg="#f0fdf4" textColor="#166534" text={`💚 ${food.health}`} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 체중관리 참고 (BMI 과체중 이상일 때만 노출) */}
            {wantsWeightCare && (
              <section style={{ marginBottom: 40 }}>
                <h2 className="section-title">
                  🍽️ {month}월, 체중관리 중이면 적당히 <span>{moderationList.length}가지</span>
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
                  못 먹는 게 아니라 <b>양 조절을 참고</b>해보시라는 의미예요. 위 "체중관리에 도움되는 음식"과 함께 균형 있게 구성해보세요.
                </p>
                {moderationList.length === 0 ? (
                  <p style={{ color: 'var(--text3)', fontSize: 14, padding: '10px 0' }}>이번 달엔 특별히 더 챙겨볼 재료가 없어요.</p>
                ) : (
                  <div className="grid-auto">
                    {moderationList.map((food, i) => (
                      <SimpleFoodCard key={i} food={food} borderColor="#fde68a" bg="#fffbeb" textColor="#92400e" text={`💡 ${food.hint}`} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 식단표 만들기 */}
            <section style={{ marginBottom: 40 }}>
              <h2 className="section-title">🍽️ 추천 재료로 식단표 만들기</h2>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
                위 "😋 추천 식재료"를 재료 삼아 아침·점심·저녁 예시 식단을 짜드려요. 실제 조리법이 아니라 <b>재료 조합 아이디어</b>이니, 입맛과 상황에 맞게 바꿔서 활용해주세요.
              </p>
              {recommendList.length === 0 ? (
                <p style={{ color: 'var(--text3)', fontSize: 14, padding: '10px 0' }}>추천 재료가 있어야 식단표를 만들 수 있어요. 위 조건을 조정해보세요.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    <button type="button" onClick={() => regeneratePlan(1)}
                      style={{ padding: '9px 16px', borderRadius: 8, border: `1.5px solid ${planLength === 1 && mealWeeks.length ? '#16a34a' : 'var(--border)'}`,
                        background: planLength === 1 && mealWeeks.length ? '#f0fdf4' : 'var(--surface2)', color: planLength === 1 && mealWeeks.length ? '#16a34a' : 'var(--text2)',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>📅 1주 식단표</button>
                    <button type="button" onClick={() => regeneratePlan(4)}
                      style={{ padding: '9px 16px', borderRadius: 8, border: `1.5px solid ${planLength === 4 && mealWeeks.length ? '#16a34a' : 'var(--border)'}`,
                        background: planLength === 4 && mealWeeks.length ? '#f0fdf4' : 'var(--surface2)', color: planLength === 4 && mealWeeks.length ? '#16a34a' : 'var(--text2)',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🗓️ 1개월(4주) 식단표</button>
                    {mealWeeks.length > 0 && (
                      <button type="button" onClick={() => regeneratePlan(planLength)}
                        style={{ padding: '9px 16px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        🔁 다른 조합으로 다시 만들기
                      </button>
                    )}
                  </div>

                  {mealWeeks.map((week, wi) => (
                    <div key={wi} style={{ marginBottom: 24 }}>
                      {mealWeeks.length > 1 && <p style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>{wi + 1}주차</p>}
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 640 }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border)', width: 48 }}></th>
                              {week.map(d => (
                                <th key={d.day} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border)', fontWeight: 800 }}>{d.day}요일</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[['🌅 아침', 'breakfast'], ['🍚 점심', 'lunch'], ['🌙 저녁', 'dinner']].map(([label, key]) => (
                              <tr key={key}>
                                <td style={{ padding: '10px 10px', borderBottom: '1px solid var(--border)', fontWeight: 700, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{label}</td>
                                {week.map(d => (
                                  <td key={d.day} style={{ padding: '10px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text2)', lineHeight: 1.5 }}>
                                    {d[key].join(' + ')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </section>

            {/* 내 결과 공유하기 */}
            <section style={{ marginBottom: 28, padding: '16px 20px', borderRadius: 12, background: 'var(--surface2)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📤 내 결과 공유하기</p>
              <ShareRow title="내 맞춤 제철 추천 결과" text={buildResultShareText()} url={buildResultUrl()} />
            </section>
          </>
        )}

        <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: -20, marginBottom: 30 }}>
          ※ 이 페이지의 추천·주의·체중관리·식단표 정보는 일반적인 영양 정보를 바탕으로 한 참고용 아이디어이며, 의학적 진단·처방이나 전문 영양사의 맞춤 식단을 대신하지 않아요. BMI도 참고 지표일 뿐이니, 정확한 체중·식이 관리는 담당 의료진이나 영양 전문가와 상담해주세요.
        </p>

        <Link href="/" className="back-link">← 홈으로</Link>
      </main>

      {copiedMsg && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          background: '#111', color: '#fff', borderRadius: 999, padding: '12px 22px', fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)', maxWidth: '90vw', textAlign: 'center' }}>
          {copiedMsg}
        </div>
      )}

      <Footer />
    </>
  )
}
