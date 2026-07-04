// ============================================================
// Fresh Season — 월별 제철 식단(4주 식단) 생성 로직
// 실제 제철 데이터(seasonalFoods)를 기반으로 "이번 달 한 달 식단"을
// 4개 주간 테마(수산물 / 채소·나물 / 과일·곡물 / 육류·버섯)로 나누어 구성한다.
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

// 4주 구성 — 카테고리 그룹 기반 주간 테마
// groupIds: DB(관리자) 세분화 category 값 / legacy: 구 시드 데이터 category 값
export const WEEK_THEMES = [
  { week: 1, label: '수산물 주간',    icon: '🐟', color: '#0ea5e9',
    groupIds: ['fish','crustacean','shellfish','seaweed','other_seafood'], legacy: ['fish'] },
  { week: 2, label: '채소·나물 주간', icon: '🥬', color: '#22c55e',
    groupIds: ['veg','root_veg','fruit_veg','herb_veg'], legacy: ['veg'] },
  { week: 3, label: '과일·곡물 주간', icon: '🍎', color: '#f97316',
    groupIds: ['fruit','tropical_fruit','berry','grain','processed'], legacy: ['fruit','grain'] },
  { week: 4, label: '육류·버섯 주간', icon: '🍖', color: '#a855f7',
    groupIds: ['beef','pork','chicken','egg','processed_meat','meat','mushroom','wild_herb'], legacy: ['meat','mushroom'] },
]

// 카테고리별 추천 조리법 템플릿 (재료명 {n} 치환)
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
  wild_herb:      ['{n} 나물무침', '{n} 전', '{n} 장아찌'],
}

// 구 category 값 폴백 (DB에 세분화 category 없을 때)
const LEGACY_FALLBACK = { fish: 'fish', veg: 'veg', fruit: 'fruit', grain: 'grain', meat: 'meat', mushroom: 'mushroom' }

export function getDishSuggestions(ingredientName, category) {
  const templates = DISH_TEMPLATES[category] || DISH_TEMPLATES[LEGACY_FALLBACK[category]] || ['{n} 요리']
  return templates.map(t => t.replace('{n}', ingredientName))
}

const MEAL_LABELS = ['아침', '점심', '저녁']

// foods: '/api/map/seasonal-foods' 응답의 foods 배열 (또는 SEASONAL_FOODS_SEED)
// 반환: 해당 월의 4주 식단 구조
export function buildMonthlyMealPlan(month, foods) {
  const m = Number(month)
  const monthFoods = (foods || []).filter(f => Array.isArray(f.months) && f.months.includes(m))

  // 재료명 기준 중복 제거 + 가나다 정렬
  const seen = new Set()
  const dedup = monthFoods
    .filter(f => { if (seen.has(f.ingredient)) return false; seen.add(f.ingredient); return true })
    .sort((a, b) => a.ingredient.localeCompare(b.ingredient, 'ko'))

  const weeks = WEEK_THEMES.map(wt => {
    const matched = dedup.filter(f => wt.groupIds.includes(f.category) || wt.legacy.includes(f.category))
    const ingredients = matched.slice(0, 6)
    const menu = ingredients.slice(0, 3).map((f, i) => ({
      ingredient: f.ingredient,
      health: f.health,
      dish: getDishSuggestions(f.ingredient, f.category)[i % 3],
      mealType: MEAL_LABELS[i % 3],
    }))
    return { ...wt, ingredients, menu }
  })

  return { month: m, weeks, totalCount: dedup.length, allIngredients: dedup }
}
