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

// ── 연령대 구분 ─────────────────────────────────────────
// kcal 값은 보건복지부 「한국인 영양소 섭취기준(KDRI)」·교육부 학교급식 영양관리기준에 공개된
// 연령대별 에너지필요추정량을 성별 평균 낸 대략적인 참고 범위이며, 개인 활동량·체격에 따라 크게 달라질 수 있다.
// 학교급식 기준은 중학생(12~14세)과 고등학생(15~18세)을 별도 구간으로 관리하고 있어 그 구분을 그대로 따랐다.
export const AGE_GROUPS = [
  { id: 'infant',     label: '유아',     icon: '👶',   range: '0~6세',   kcalMin: 900,  kcalMax: 1700,
    note: '만 0~6세는 성장 속도와 이유식·유아식 단계 차이가 커서, 일반 식단표보다 소아과·영유아 건강검진에서 받는 개별 지도를 따르는 게 가장 정확해요.' },
  { id: 'child',      label: '초등학생', icon: '🧒',   range: '7~12세',  kcalMin: 1500, kcalMax: 2000,
    note: '학교급식(교육부 학교급식 영양관리기준)과 겹치지 않도록, 가정에서는 채소·과일 위주로 보완하는 걸 추천해요. 자세한 기준은 어린이급식관리지원센터 자료를 참고해보세요.' },
  { id: 'middleTeen', label: '중학생',   icon: '🧑‍🎓', range: '12~14세', kcalMin: 2000, kcalMax: 2500,
    note: '중학교 시기는 성장 속도가 빨라지는 때라 단백질·칼슘 섭취가 특히 중요해요. (교육부 학교급식 영양관리기준 12~14세 구간 참고)' },
  { id: 'highTeen',   label: '고등학생', icon: '🎓',   range: '15~18세', kcalMin: 2000, kcalMax: 2700,
    note: '고등학생은 성장기가 이어지고 활동량도 많아, 19~39세 성인보다도 권장 칼로리가 더 높게 잡히는 경우가 많아요. (교육부 학교급식 영양관리기준 15~18세 구간 참고) 대학 진학 후에는 성인 탭을 참고하면 돼요.' },
  { id: 'adult',      label: '성인',     icon: '🧑‍💼', range: '19~39세', kcalMin: 1900, kcalMax: 2600,
    note: null },
  { id: 'middle',     label: '중장년',   icon: '🧑‍🦳', range: '40~64세', kcalMin: 1800, kcalMax: 2400,
    note: null },
  { id: 'senior',     label: '노년',     icon: '👴',   range: '65세+',   kcalMin: 1600, kcalMax: 2000,
    note: '소화가 편한 조리법(찜·조림 등) 위주로 구성하고, 씹기 어려운 재료는 잘게 썰거나 무르게 조리하는 걸 추천해요.' },
]

export function getAgeGroup(id) {
  return AGE_GROUPS.find(g => g.id === id) || AGE_GROUPS.find(g => g.id === 'adult')
}

// ── 식단 유형 (일반식 / 다이어트식 / 건강식 / 채식) ─────────────
export const DIET_TYPES = [
  { id: 'normal',     label: '일반식',    icon: '🍚', kcalFactor: 1,
    note: null },
  { id: 'diet',       label: '다이어트식', icon: '🥗', kcalFactor: 0.85,
    note: '가공식품·가공육은 빼고 밥량은 살짝 줄인 대신, 채소·저지방 단백질 위주로 구성했어요.' },
  { id: 'healthy',    label: '건강식',    icon: '🌿', kcalFactor: 1,
    note: '튀김·가공식품은 배제하고, 슈퍼푸드로 등록된 제철재료를 우선 배치했어요.' },
  { id: 'vegetarian', label: '채식',      icon: '🥦', kcalFactor: 1,
    note: '고기·해산물·달걀을 뺀 채식 위주 구성이에요. 페스코·락토오보 등 채식 유형에 맞게 재료를 자유롭게 더해보세요.' },
]

export function getDietType(id) {
  return DIET_TYPES.find(d => d.id === id) || DIET_TYPES[0]
}

// 식단 유형별로 배제할 카테고리
const EXCLUDE_CATS_BY_DIET = {
  normal: [],
  diet: ['processed', 'processed_meat'],
  healthy: ['processed', 'processed_meat'],
  vegetarian: ['fish','crustacean','shellfish','other_seafood','beef','pork','chicken','processed_meat','meat','egg'],
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

// ── 국·탕류 전용 조리법 템플릿 (학교급식 상차림처럼 "국"을 별도 구성요소로 분리) ──
const SOUP_TEMPLATES = {
  fish: '{n} 맑은탕', crustacean: '{n} 탕', shellfish: '{n} 탕', seaweed: '{n} 국', other_seafood: '{n} 탕',
  veg: '{n} 된장국', root_veg: '{n} 된장국', fruit_veg: '{n} 된장국', herb_veg: '{n} 된장국', wild_herb: '{n} 된장국',
  mushroom: '{n} 전골',
  beef: '{n} 뭇국', pork: '{n} 찌개', chicken: '{n} 백숙국', egg: '{n} 국', processed_meat: '{n} 찌개', meat: '{n} 찌개',
}
function soupDishFor(ingredientName, category) {
  const t = SOUP_TEMPLATES[category] || SOUP_TEMPLATES[LEGACY_FALLBACK[category]]
  return t ? t.replace('{n}', ingredientName) : `${ingredientName} 국`
}
const SOUP_ELIGIBLE_CATS = Object.keys(SOUP_TEMPLATES)

// ── 김치류 (학교급식 상차림에 고정적으로 포함되는 반찬 — 제철재료와 무관하게 로테이션) ──
const KIMCHI_TYPES = [
  { name: '배추김치', kcal: 15 },
  { name: '깍두기',   kcal: 20 },
  { name: '열무김치', kcal: 12 },
  { name: '총각김치', kcal: 18 },
  { name: '나박김치', kcal: 10 },
  { name: '파김치',   kcal: 15 },
]

// 끼니 구성요소 표시용 메타 (학교급식 상차림 구조: 주식·국·주찬·부찬·김치)
export const MEAL_ROLE_META = {
  staple:   { label: '주식', icon: '🍚' },
  soup:     { label: '국',   icon: '🍲' },
  mainDish: { label: '주찬', icon: '🍖' },
  sideDish: { label: '부찬', icon: '🥗' },
  kimchi:   { label: '김치', icon: '🥬' },
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
// 우선순위 조건(isPriority)에 맞는 재료를 앞쪽으로 모아, 요일 순환 시 더 자주 뽑히게 한다
function prioritizedShuffle(arr, isPriority) {
  const priority = arr.filter(isPriority)
  const rest = arr.filter(f => !isPriority(f))
  return [...shuffle(priority), ...shuffle(rest)]
}
function cyclic(arr, i) { return arr.length ? arr[i % arr.length] : null }

const round10 = (n) => Math.round(n / 10) * 10

// 학교급식 상차림 구조(주식+국+주찬+부찬(1~2)+김치)를 본떠 끼니 하나를 구성한다.
// slots: { staple, soup, mainDish, sideDish } — sideDish는 단일 객체 또는 배열(부찬 2개) 가능. kimchi는 항상 포함.
// stapleFactor: 끼니별 밥량 차등(아침은 적게, 점심·저녁은 좀 더 든든하게)
function buildStructuredMeal(slots, dayIndex, scaleFactor = 1, stapleFactor = 1) {
  const items = []

  if (slots.staple) {
    const { food } = slots.staple
    items.push({ role: 'staple', ingredient: food.ingredient, dish: `${food.ingredient} 밥`, kcal: round10(kcalFor(food.category) * stapleFactor * scaleFactor) })
  }
  if (slots.soup) {
    const { food } = slots.soup
    // 국물 요리는 건더기보다 국물 자체의 열량 비중도 있어 기본 국물 베이스를 더 반영
    items.push({ role: 'soup', ingredient: food.ingredient, dish: soupDishFor(food.ingredient, food.category), kcal: round10((80 + kcalFor(food.category) * 0.8) * scaleFactor) })
  }
  if (slots.mainDish) {
    const { food, dishIdx = 0 } = slots.mainDish
    items.push({ role: 'mainDish', ingredient: food.ingredient, dish: getDishSuggestions(food.ingredient, food.category)[dishIdx % 3], kcal: round10(kcalFor(food.category) * scaleFactor) })
  }
  const sideDishes = Array.isArray(slots.sideDish) ? slots.sideDish : (slots.sideDish ? [slots.sideDish] : [])
  sideDishes.filter(Boolean).forEach(({ food, dishIdx = 0 }) => {
    items.push({ role: 'sideDish', ingredient: food.ingredient, dish: getDishSuggestions(food.ingredient, food.category)[dishIdx % 3], kcal: round10(kcalFor(food.category) * scaleFactor) })
  })
  // 김치는 제철재료와 무관하게 항상 로테이션으로 포함 (학교급식 상차림 기본 구성)
  const kimchi = KIMCHI_TYPES[dayIndex % KIMCHI_TYPES.length]
  items.push({ role: 'kimchi', ingredient: kimchi.name, dish: kimchi.name, kcal: round10(kimchi.kcal * scaleFactor) })

  const kcal = items.reduce((s, it) => s + it.kcal, 0)
  return { items, kcal, dishes: items } // dishes: 이전 버전과의 호환용 별칭
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
export function getServingSize(ageGroupId, dietTypeId = 'normal') {
  const diet = getDietType(dietTypeId)
  const factor = ageScaleFactor(ageGroupId) * diet.kcalFactor
  const round10 = (n) => Math.round(n / 10) * 10
  return {
    riceG:   round10(BASE_SERVING.riceG * factor),
    soupMl:  round10(BASE_SERVING.soupMl * factor),
    factor,
  }
}

// foods: '/api/map/seasonal-foods' 응답의 foods 배열
// dietTypeId: DIET_TYPES의 id (다이어트식/건강식/채식에 맞지 않는 카테고리 배제)
// ⚠️ 여기서는 연령대(ageGroupId)를 반영하지 않는다 — "이 달 제철재료 몇 가지"는 계절에 따른 것이지
//    나이에 따라 달라지는 값이 아니기 때문에, 연령 필터는 식단 생성용 재료 풀에만 별도로 적용한다.
export function getMonthIngredients(month, foods, dietTypeId = 'normal') {
  const m = Number(month)
  const monthFoods = (foods || []).filter(f => Array.isArray(f.months) && f.months.includes(m))

  const seen = new Set()
  let dedup = monthFoods
    .filter(f => { if (seen.has(f.ingredient)) return false; seen.add(f.ingredient); return true })
    .sort((a, b) => a.ingredient.localeCompare(b.ingredient, 'ko'))

  const excludeCats = EXCLUDE_CATS_BY_DIET[dietTypeId] || []
  if (excludeCats.length) {
    const legacySafe = f => !excludeCats.includes(f.category) && !excludeCats.includes(LEGACY_FALLBACK[f.category])
    const dietFiltered = dedup.filter(legacySafe)
    // 채식/건강식 필터링 후에도 재료가 거의 남지 않으면(카테고리 데이터가 아직 세분화되지 않은 경우) 안전하게 폴백
    if (dietFiltered.length >= 4 || dietTypeId === 'vegetarian') dedup = dietFiltered
  }
  return dedup
}

// 연령대 맞춤 재료 풀 — 식단 "생성"에만 쓰이고, 화면에 보여주는 전체 재료 개수에는 영향을 주지 않는다.
// 데이터에 age_groups 태그가 충분히 등록돼 있을 때만 필터링하고, 부족하면 전체 목록을 그대로 사용한다.
function applyAgeFilter(dedup, ageGroupId) {
  if (!ageGroupId) return dedup
  const ageFiltered = dedup.filter(f => !(f.age_groups || []).length || f.age_groups.includes('all') || f.age_groups.includes(ageGroupId))
  return ageFiltered.length >= 6 ? ageFiltered : dedup
}

// 실제 달력(월/주 단위)에 얹을 한 달치 식단 생성
export function buildCalendarMonthPlan(year, month, foods, ageGroupId = 'adult', dietTypeId = 'normal') {
  // dedup: 이 달의 제철재료 전체(계절+식단유형만 반영) — 화면에 "○○가지"로 표시되는 값
  const dedup = getMonthIngredients(month, foods, dietTypeId)
  // pool: 실제 식단 생성에 쓰는 재료 — 연령대 맞춤 필터는 여기에만 적용(데이터가 충분할 때만)
  const pool = applyAgeFilter(dedup, ageGroupId)
  const dietType = getDietType(dietTypeId)
  const scaleFactor = ageScaleFactor(ageGroupId) * dietType.kcalFactor

  const isSuperfood = f => !!f.is_superfood
  const isDietBadge = f => (Array.isArray(f.special_badge) ? f.special_badge : [f.special_badge]).filter(Boolean).includes('diet')
  const priorityFn = dietTypeId === 'healthy' ? isSuperfood : dietTypeId === 'diet' ? isDietBadge : null

  const rawProtein = pool.filter(f => PROTEIN_CATS.includes(f.category))
  const veg   = priorityFn ? prioritizedShuffle(pool.filter(f => VEG_CATS.includes(f.category)), priorityFn) : shuffle(pool.filter(f => VEG_CATS.includes(f.category)))
  const grain = shuffle(pool.filter(f => GRAIN_CATS.includes(f.category)))
  const fruit = priorityFn ? prioritizedShuffle(pool.filter(f => FRUIT_CATS.includes(f.category)), priorityFn) : shuffle(pool.filter(f => FRUIT_CATS.includes(f.category)))
  // 채식 등으로 단백질 재료 풀이 비면, 채소 재료를 한 번 더 활용해 끼니가 허전해지지 않도록 한다
  const protein = rawProtein.length
    ? (priorityFn ? prioritizedShuffle(rawProtein, priorityFn) : shuffle(rawProtein))
    : shuffle(pool.filter(f => VEG_CATS.includes(f.category)))
  // 국 재료 풀 — 국물 요리에 어울리는 카테고리만 사용, 부족하면 채소로 폴백
  const rawSoup = pool.filter(f => SOUP_ELIGIBLE_CATS.includes(f.category))
  const soupPool = shuffle(rawSoup.length ? rawSoup : pool.filter(f => VEG_CATS.includes(f.category)))

  const daysInMonth = new Date(year, month, 0).getDate()
  const jsStartDay = new Date(year, month - 1, 1).getDay() // 0=일 ~ 6=토
  const mondayStartIdx = (jsStartDay + 6) % 7 // 0=월 ~ 6=일

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = i + 1
    const staple = cyclic(grain, i)
    const soupB  = cyclic(soupPool, i)
    const soupL  = cyclic(soupPool, i + 1)
    const soupD  = cyclic(soupPool, i + 2)
    const mainL  = cyclic(protein, i)
    const mainD  = cyclic(protein, i + 1)
    const sideL1 = cyclic(veg, i)
    const sideL2 = cyclic(veg, i + 2)
    const sideD1 = cyclic(veg, i + 1)
    const sideD2 = cyclic(veg, i + 3)
    const sideB  = cyclic(fruit, i) || cyclic(veg, i + 4)

    const breakfast = buildStructuredMeal({
      staple: staple && { food: staple },
      soup: soupB && { food: soupB },
      sideDish: sideB && { food: sideB, dishIdx: i },
    }, i, scaleFactor, 0.8 /* 아침은 밥을 조금 적게 */)
    const lunch = buildStructuredMeal({
      staple: staple && { food: staple },
      soup: soupL && { food: soupL },
      mainDish: mainL && { food: mainL, dishIdx: i },
      sideDish: [sideL1 && { food: sideL1, dishIdx: i }, sideL2 && { food: sideL2, dishIdx: i + 1 }],
    }, i, scaleFactor, 1.1 /* 점심은 밥을 좀 더 든든하게 */)
    const dinner = buildStructuredMeal({
      staple: staple && { food: staple },
      soup: soupD && { food: soupD },
      mainDish: mainD && { food: mainD, dishIdx: i + 1 },
      sideDish: [sideD1 && { food: sideD1, dishIdx: i }, sideD2 && { food: sideD2, dishIdx: i + 1 }],
    }, i, scaleFactor, 1.1 /* 저녁도 든든하게 */)

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
