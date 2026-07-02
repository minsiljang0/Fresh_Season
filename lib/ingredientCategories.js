// 식재료 카테고리 공용 정의
// MapAdminPanel(식재료 등록)과 CoupangPanel(쿠팡 대체링크 카테고리 매칭)에서 함께 사용합니다.

export const ING_CATEGORIES = [
  { id: 'fish',           emoji: '🐟', label: '생선',       group: '수산물' },
  { id: 'crustacean',     emoji: '🦞', label: '갑각류',     group: '수산물' },
  { id: 'shellfish',      emoji: '🦪', label: '조개·패류',  group: '수산물' },
  { id: 'seaweed',        emoji: '🌿', label: '해조류',     group: '수산물' },
  { id: 'other_seafood',  emoji: '🐙', label: '기타수산',   group: '수산물' },
  { id: 'veg',            emoji: '🥬', label: '잎채소',     group: '채소·나물' },
  { id: 'root_veg',       emoji: '🥕', label: '뿌리채소',   group: '채소·나물' },
  { id: 'fruit_veg',      emoji: '🍆', label: '열매채소',   group: '채소·나물' },
  { id: 'herb_veg',       emoji: '🌱', label: '나물·산채',  group: '채소·나물' },
  { id: 'fruit',          emoji: '🍎', label: '국내과일',   group: '과일' },
  { id: 'tropical_fruit', emoji: '🍌', label: '열대과일',   group: '과일' },
  { id: 'berry',          emoji: '🍓', label: '베리류',     group: '과일' },
  { id: 'grain',          emoji: '🌾', label: '곡물·잡곡',  group: '곡물·가공' },
  { id: 'processed',      emoji: '🏭', label: '가공식품',   group: '곡물·가공' },
  { id: 'beef',           emoji: '🥩', label: '소고기',     group: '육류' },
  { id: 'pork',           emoji: '🐷', label: '돼지고기',   group: '육류' },
  { id: 'chicken',        emoji: '🐔', label: '닭고기',     group: '육류' },
  { id: 'egg',            emoji: '🥚', label: '달걀',       group: '육류' },
  { id: 'processed_meat', emoji: '🌭', label: '가공육',     group: '육류' },
  { id: 'meat',           emoji: '🍖', label: '기타육류',   group: '육류' },
  { id: 'mushroom',       emoji: '🍄', label: '버섯',       group: '버섯·산채' },
  { id: 'wild_herb',      emoji: '🌿', label: '산채·약초',  group: '버섯·산채' },
]

export const ING_GROUPS = ['수산물', '채소·나물', '과일', '곡물·가공', '육류', '버섯·산채']

export const ING_CAT_MAP = Object.fromEntries(ING_CATEGORIES.map(c => [c.id, c]))

// 쿠팡 대체링크 등에서 "식재료 카테고리"가 아닌 다른 대상(조리기구 등)을 함께 고를 수 있도록
// 하는 확장 카테고리 목록 (식재료 카테고리 + 조리기구)
export const COUPANG_TARGET_GROUPS = [...ING_GROUPS, '조리기구']
export const COUPANG_TARGET_CATEGORIES = [
  ...ING_CATEGORIES,
  { id: 'utensil', emoji: '🍳', label: '조리기구 전체', group: '조리기구' },
]
