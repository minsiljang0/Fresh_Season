import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'

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
const AGE_HEALTH_CATEGORY = {
  infant:null, child:'어린이성장', teen:'수험생·집중력', adult:null, middle:null, senior:'노인·골감소증',
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

  // 공유된 링크(?by=&g=&h=&w=&c=&m=)로 들어온 경우 입력값 복원, 아니면 이번 달로 기본 설정
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('by')) setBirthYear(params.get('by'))
    if (params.get('g'))  setGender(params.get('g'))
    if (params.get('h'))  setHeightCm(params.get('h'))
    if (params.get('w'))  setWeightKg(params.get('w'))
    if (params.get('c'))  setConditions(params.get('c').split(',').filter(Boolean))
    const m = Number(params.get('m'))
    setMonth(m >= 1 && m <= 12 ? m : new Date().getMonth() + 1)
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share)
    setOrigin(window.location.origin)
  }, [])

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

  // 지역과 무관하게 재료명 기준으로 합치고, 월은 지역별 월의 합집합으로 계산
  const allFoods = useMemo(() => {
    const map = {}
    rawFoods.forEach(f => {
      if (!map[f.ingredient]) map[f.ingredient] = { ...f, months: [...(f.months || [])] }
      else (f.months || []).forEach(m => { if (!map[f.ingredient].months.includes(m)) map[f.ingredient].months.push(m) })
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
      const ageCat = userAgeGroup ? AGE_HEALTH_CATEGORY[userAgeGroup] : null
      if (ageCat && (f.healthBenefits || []).some(hb => hb.category === ageCat)) reasons.push(`${ageCat} 관련 효능`)

      const dietFriendly = wantsWeightCare && isDietFriendly(f)
      if (dietFriendly) reasons.push('체중관리에 참고하기 좋음')

      recommend.push({ ...f, reasons })

      // 체중관리 참고 — 다이어트 친화 재료로 이미 분류된 건 제외하고, 카테고리상 조절이 필요할 수 있는 것만 별도 안내
      if (wantsWeightCare && !dietFriendly && MODERATION_HINTS[f.category]) {
        moderation.push({ ...f, hint: MODERATION_HINTS[f.category] })
      }
    })

    recommend.sort((a, b) => {
      if (a.reasons.length !== b.reasons.length) return b.reasons.length - a.reasons.length
      if (!!a.is_superfood !== !!b.is_superfood) return a.is_superfood ? -1 : 1
      return a.ingredient.localeCompare(b.ingredient, 'ko')
    })
    return { avoidList: avoid, recommendList: recommend, moderationList: moderation }
  }, [monthFoods, selectedConditions, userAgeGroup, gender, wantsWeightCare])

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
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 18, fontWeight: 900 }}>{food.ingredient}</span>
                        {food.is_superfood && <span className="tag">🌟 슈퍼푸드</span>}
                      </div>
                      {food.reasons.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                          {food.reasons.map((r, j) => (
                            <span key={j} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 700, background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac' }}>✅ {r}</span>
                          ))}
                        </div>
                      )}
                      <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>💚 {food.health}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* 주의 */}
            <section style={{ marginBottom: 40 }}>
              <h2 className="section-title">
                ⚠️ {month}월 주의가 필요한 식재료 <span>{avoidList.length}가지</span>
              </h2>
              {selectedConditions.length === 0 ? (
                <p style={{ color: 'var(--text3)', fontSize: 14, padding: '10px 0' }}>위에서 지병·주의사항을 선택하면 알려드려요.</p>
              ) : avoidList.length === 0 ? (
                <p style={{ color: 'var(--text3)', fontSize: 14, padding: '10px 0' }}>선택하신 조건에서 특별히 주의할 재료는 없어요.</p>
              ) : (
                <div className="grid-auto">
                  {avoidList.map((food, i) => (
                    <Link key={i} href={`/ingredient/${encodeURIComponent(food.ingredient)}`} className="card"
                      style={{ borderColor: '#fca5a5', background: '#fff8f8' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 18, fontWeight: 900 }}>{food.ingredient}</span>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {food.matched.map(c => <span key={c.id} className="tag" style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}>{c.label}</span>)}
                        </div>
                      </div>
                      <p style={{ fontSize: 12, color: '#b91c1c', lineHeight: 1.6, fontWeight: 600 }}>{food.caution}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* 체중관리 참고 (BMI 과체중 이상일 때만 노출) */}
            {wantsWeightCare && (
              <section style={{ marginBottom: 40 }}>
                <h2 className="section-title">
                  🍽️ {month}월, 체중관리 중이면 적당히 <span>{moderationList.length}가지</span>
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
                  못 먹는 게 아니라 <b>양 조절을 참고</b>해보시라는 의미예요. 위 추천 목록의 "체중관리에 참고하기 좋음" 재료와 함께 균형 있게 구성해보세요.
                </p>
                {moderationList.length === 0 ? (
                  <p style={{ color: 'var(--text3)', fontSize: 14, padding: '10px 0' }}>이번 달엔 특별히 더 챙겨볼 재료가 없어요.</p>
                ) : (
                  <div className="grid-auto">
                    {moderationList.map((food, i) => (
                      <Link key={i} href={`/ingredient/${encodeURIComponent(food.ingredient)}`} className="card"
                        style={{ borderColor: '#fde68a', background: '#fffbeb' }}>
                        <span style={{ fontSize: 18, fontWeight: 900, display: 'block', marginBottom: 4 }}>{food.ingredient}</span>
                        <p style={{ fontSize: 12, color: '#92400e', lineHeight: 1.6, fontWeight: 600 }}>💡 {food.hint}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 내 결과 공유하기 */}
            <section style={{ marginBottom: 28, padding: '16px 20px', borderRadius: 12, background: 'var(--surface2)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📤 내 결과 공유하기</p>
              <ShareRow title="내 맞춤 제철 추천 결과" text={buildResultShareText()} url={buildResultUrl()} />
            </section>
          </>
        )}

        <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: -20, marginBottom: 30 }}>
          ※ 이 페이지의 추천·주의·체중관리 정보는 일반적인 영양 정보를 바탕으로 한 참고용 안내이며, 의학적 진단·처방이나 개인 맞춤 식단을 대신하지 않아요. BMI 역시 참고 지표일 뿐이니, 정확한 체중·식이 관리는 담당 의료진이나 영양 전문가와 상담해주세요.
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
