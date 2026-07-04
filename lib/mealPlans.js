// ============================================================
// Fresh Season — 월별 제철 식단(달력형 식단표) 생성 로직
// 실제 제철 데이터(seasonalFoods)를 기반으로 진짜 달력(월/주 단위)에
// 하루 식단 + 대략적인 칼로리 + 연령대별 참고치를 얹어 구성한다.
// ============================================================

export const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

// 월별 대표 테마 문구 (상단 소개용)
export const MONTH_THEMES = [
  { month: 1,  theme: '추위를 이기는 보양 밥상',   icon: '🍲' },
  { month: 2,  theme: '입춘 맞이 가벼운 밥상',     icon: '🌱' },
  { month: 3,  theme: '봄나물 새순 밥상',          icon: '🌸' },
  { month: 4,  theme: '싱그러운 봄철 밥상',        icon: '🌿' },
  { month: 5,  theme: '딸기·멸치 초여름 밥상',      icon: '🍓' },
  { month: 6,  theme: '장마 대비 제철 밥상',        icon: '☔' },
  { month: 7,  theme: '무더위 이기는 여름 밥상',    icon: '☀️' },
  { month: 8,  theme: '복달임 보양 밥상',          icon: '🍑' },
  { month: 9,  theme: '전어·햇곡식 가을 밥상',      icon: '🍂' },
  { month: 10, theme: '수확의 계절 풍성한 밥상',    icon: '🌾' },
  { month: 11, theme: '김장철 저장 밥상',          icon: '🥬' },
  { month: 12, theme: '한 해 마무리 보양 밥상',     icon: '❄️' },
]

export function getMonthTheme(month) {
  return MONTH_THEMES.find(m => m.month === Number(month)) || MONTH_THEMES[0]
}

// ── 연령대 구분 (for-me.js 맞춤추천 페이지와 동일한 기준) ─────────────
// kcal 값은 보건복지부 「한국인 영양소 섭취기준」에 공개된 연령대별 에너지필요추정량을
// 성별 평균 낸 아주 대략적인 참고 범위이며, 개인 활동량·체격에 따라 크게 달라질 수 있다.
export const AGE_GROUPS = [
  { id: 'infant', label: '유아',   icon: '👶', range: '0~6세',   kcalMin: 900,  kcalMax: 1700,
    note: '만 0~6세는 성장 속도와 이유식·유아식 단계 차이가 커서, 일반 식단표보다 소아과·영유아 건강검진에서 받는 개별 지도를 따르는 게 가장 정확해요.' },
  { id: 'child',  label: '어린이', icon: '🧒', range: '7~12세',  kcalMin: 1700, kcalMax: 2000,
    note: '학교급식(교육부 학교급식법 기준)과 겹치지 않도록 가정에서는 채소·과일 위주로 보완하는 걸 추천해요. 자세한 영양 기준은 어린이급식관리지원센터 자료를 참고해보세요.' },
  { id: 'teen',   label: '청소년', icon: '🧑', range: '13~18세', kcalMin: 2000, kcalMax: 2700,
    note: '성장기라 단백질·칼슘 섭취가 특히 중요한 시기예요.' },
  { id: 'adult',  label: '성인',   icon: '🧑‍💼', range: '19~39세', kcalMin: 1900, kcalMax: 2600,
    note: null },
  { id: 'middle', label: '중장년', icon: '🧑‍🦳', range: '40~64세', kcalMin: 1800, kcalMax: 2400,
    note: null },
  { id: 'senior', label: '노년',   icon: '👴', range: '65세+',   kcalMin: 1600, kcalMax: 2000,
    note: '소화가 편한 조리법(찜·조림 등) 위주로 구성하고, 씹기 어려운 재료는 잘게 썰거나 무르게 조리하는 걸 추천해요.' },
]

export function getAgeGroup(id) {
  return AGE_GROUPS.find(g => g.id === id) || AGE_GROUPS[3] // 기본값: 성인
}

// ── 카테고리 → 조리법 템플릿 ──────────────────────────────
const DISH_TEMPLATES = {
  fish:           ['{n} 구이', '{n} 조림', '{n} 맑은탕'],
  crustacean:     ['{n} 찜', '{n} 볶음', '{n} 튀김'],
  shellfish:      ['{n} 탕', '{n} 무침', '{n} 전'],
  seaweed:        ['{n} 무침', '{n} 국', '{n} 쌈'],
  other_seafood:  ['{n} 볶음', '{n} 조림', '{n} 젓갈'],
  veg:            ['{n} 나물무침', '{n} 된장국', '{n} 겉절이'],
  root_veg:       ['{n} 조림', '{n} 나물볶음', '{n} 전'],
  fruit_veg:      ['{n} 볶음', '{n} 무침', '{n} 찜'],
  herb_veg:       ['{n} 나물무침', '{n} 전', '{n} 튀김'],
  wild_herb:      ['{n} 나물무침', '{n} 전', '{n} 장아찌'],
  fruit:          ['{n} 생과일', '{n} 샐러드', '{n} 화채'],
  tropical_fruit: ['{n} 생과일', '{n} 스무디', '{n} 샐러드'],
  berry:          ['{n} 요거트볼', '{n} 생과일', '{n} 잼'],
  grain:          ['{n} 밥', '{n} 죽', '{n} 전'],
  processed:      ['{n} 부침', '{n} 무침', '{n} 볶음'],
  beef:           ['{n} 구이', '{n} 불고기', '{n} 전골'],
  pork:           ['{n} 수육', '{n} 볶음', '{n} 구이'],
  chicken:        ['{n} 백숙', '{n} 볶음탕', '{n} 구이'],
  egg:            ['{n} 찜', '{n} 말이', '{n} 장조림'],
  processed_meat: ['{n} 구이', '{n} 볶음', '{n} 전골'],
  meat:           ['{n} 구이', '{n} 찜', '{n} 볶음'],
  mushroom:       ['{n} 전골', '{n} 볶음', '{n} 구이'],
}
const LEGACY_FALLBACK = { fish: 'fish', veg: 'veg', fruit: 'fruit', grain: 'grain', meat: 'meat', mushroom: 'mushroom' }

export function getDishSuggestions(ingredientName, category) {
  const templates = DISH_TEMPLATES[category] || DISH_TEMPLATES[LEGACY_FALLBACK[category]] || ['{n} 요리']
  return templates.map(t => t.replace('{n}', ingredientName))
}

// ── 카테고리별 "1인분 대략" 칼로리 참고치 (매우 대략적인 추정, 실제와 다를 수 있음) ──
const CATEGORY_KCAL = {
  fish: 150, crustacean: 120, shellfish: 90, seaweed: 25, other_seafood: 110,
  veg: 35, root_veg: 70, fruit_veg: 45, herb_veg: 35, wild_herb: 35,
  fruit: 60, tropical_fruit: 70, berry: 50,
  grain: 300, processed: 250,
  beef: 260, pork: 230, chicken: 200, egg: 90, processed_meat: 200, meat: 220,
  mushroom: 30,
}
function kcalFor(category) {
  return CATEGORY_KCAL[category] || CATEGORY_KCAL[LEGACY_FALLBACK[category]] || 150
}

const PROTEIN_CATS = ['fish','crustacean','shellfish','other_seafood','beef','pork','chicken','egg','processed_meat','meat']
const VEG_CATS      = ['veg','root_veg','fruit_veg','herb_veg','wild_herb','seaweed','mushroom']
const GRAIN_CATS    = ['grain','processed']
const FRUIT_CATS    = ['fruit','tropical_fruit','berry']
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function cyclic(arr, i) { return arr.length ? arr[i % arr.length] : null }

function buildMeal(items, scaleFactor = 1) {
  // items: [{food, dishIdx}] 중 존재하는 것만
  // scaleFactor: 연령대별 1일 권장 칼로리에 맞춰 분량(칼로리)을 함께 줄이거나 늘리는 배수
  const round10 = (n) => Math.round(n / 10) * 10
  const valid = items.filter(Boolean)
  const dishes = valid.map(({ food, dishIdx }) => ({
    ingredient: food.ingredient,
    dish: getDishSuggestions(food.ingredient, food.category)[dishIdx % 3],
    kcal: round10(kcalFor(food.category) * scaleFactor),
  }))
  const riceKcal = round10(300 /* 기본 밥 한공기(성인 기준) */ * scaleFactor)
  const kcal = riceKcal + dishes.reduce((s, d) => s + d.kcal, 0)
  return { dishes, kcal }
}

// 연령대 하루 권장 칼로리(구간 중앙값)를 성인 기준과 비교해 끼니 분량을 스케일링하는 배수
function ageScaleFactor(ageGroupId) {
  const group = getAgeGroup(ageGroupId)
  const adult = getAgeGroup('adult')
  const groupMid = (group.kcalMin + group.kcalMax) / 2
  const adultMid = (adult.kcalMin + adult.kcalMax) / 2
  return groupMid / adultMid
}

// 성인 1인분 기준량 (일반적으로 안내되는 대략적인 가정용 기준)
const BASE_SERVING = { riceG: 210, riceBowlMl: 330, soupMl: 300 }

// 연령대별 1인분 기준량 참고치 — 성인 기준량에 칼로리 스케일 배수를 적용한 대략적인 추정
export function getServingSize(ageGroupId) {
  const factor = ageScaleFactor(ageGroupId)
  const round10 = (n) => Math.round(n / 10) * 10
  return {
    riceG:   round10(BASE_SERVING.riceG * factor),
    soupMl:  round10(BASE_SERVING.soupMl * factor),
    factor,
  }
}

// foods: '/api/map/seasonal-foods' 응답의 foods 배열
// ageGroupId: AGE_GROUPS의 id (연령대 맞춤 필터링 — 데이터에 age_groups가 있는 재료만 우선 반영)
export function getMonthIngredients(month, foods, ageGroupId) {
  const m = Number(month)
  const monthFoods = (foods || []).filter(f => Array.isArray(f.months) && f.months.includes(m))

  const seen = new Set()
  let dedup = monthFoods
    .filter(f => { if (seen.has(f.ingredient)) return false; seen.add(f.ingredient); return true })
    .sort((a, b) => a.ingredient.localeCompare(b.ingredient, 'ko'))

  if (ageGroupId) {
    const ageFiltered = dedup.filter(f => !(f.age_groups || []).length || f.age_groups.includes('all') || f.age_groups.includes(ageGroupId))
    // 연령 태그가 등록된 재료가 충분할 때만 필터를 적용하고, 데이터가 부족하면 전체 목록으로 폴백
    if (ageFiltered.length >= 6) dedup = ageFiltered
  }
  return dedup
}

// 실제 달력(월/주 단위)에 얹을 한 달치 식단 생성
export function buildCalendarMonthPlan(year, month, foods, ageGroupId = 'adult') {
  const dedup = getMonthIngredients(month, foods, ageGroupId)
  const scaleFactor = ageScaleFactor(ageGroupId)

  const protein = shuffle(dedup.filter(f => PROTEIN_CATS.includes(f.category)))
  const veg     = shuffle(dedup.filter(f => VEG_CATS.includes(f.category)))
  const grain   = shuffle(dedup.filter(f => GRAIN_CATS.includes(f.category)))
  const fruit   = shuffle(dedup.filter(f => FRUIT_CATS.includes(f.category)))

  const daysInMonth = new Date(year, month, 0).getDate()
  const jsStartDay = new Date(year, month - 1, 1).getDay() // 0=일 ~ 6=토
  const mondayStartIdx = (jsStartDay + 6) % 7 // 0=월 ~ 6=일

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = i + 1
    const p1 = cyclic(protein, i * 2)
    const p2 = cyclic(protein, i * 2 + 1)
    const v1 = cyclic(veg, i * 2)
    const v2 = cyclic(veg, i * 2 + 1)
    const g  = cyclic(grain, i)
    const fr = cyclic(fruit, i)

    const breakfast = buildMeal([g && { food: g, dishIdx: 0 }, fr && { food: fr, dishIdx: i }], scaleFactor)
    const lunch     = buildMeal([g && { food: g, dishIdx: 1 }, v1 && { food: v1, dishIdx: i }, p1 && { food: p1, dishIdx: i }], scaleFactor)
    const dinner    = buildMeal([g && { food: g, dishIdx: 2 }, v2 && { food: v2, dishIdx: i + 1 }, p2 && { food: p2, dishIdx: i + 1 }], scaleFactor)

    const weekdayIdx = (mondayStartIdx + i) % 7
    return {
      date,
      weekday: DAY_LABELS[weekdayIdx],
      weekdayIdx,
      breakfast, lunch, dinner,
      kcal: breakfast.kcal + lunch.kcal + dinner.kcal,
    }
  })

  // 달력 그리드 — 월요일 시작, 앞뒤 빈 칸 padding
  const weeks = []
  let week = new Array(mondayStartIdx).fill(null)
  days.forEach(d => {
    week.push(d)
    if (week.length === 7) { weeks.push(week); week = [] }
  })
  if (week.length) { weeks.push([...week, ...new Array(7 - week.length).fill(null)]) }

  const monthlyAvgKcal = days.length ? Math.round(days.reduce((s, d) => s + d.kcal, 0) / days.length) : 0

  return {
    year, month: Number(month),
    days, weeks, daysInMonth,
    monthlyAvgKcal,
    totalCount: dedup.length,
    allIngredients: dedup,
  }
}

export { DAY_LABELS }
