// Fresh Season 블로그 기본 카테고리 — 17개 시도 + 글로벌
// BlogAdminPanel(글쓰기), BlogMenuPanel(메뉴관리), pages/blog/index.js 세 곳에서 공유
export const DEFAULT_CATEGORIES = [
  'seoul','busan','daegu','incheon','gwangju','daejeon','ulsan','sejong',
  'gyeonggi','gangwon','chungbuk','chungnam','jeonbuk','jeonnam','gyeongbuk','gyeongnam','jeju'
]

// 글로벌 포함 전체 카테고리
export const ALL_CATEGORIES = [...DEFAULT_CATEGORIES, 'global']

const CATEGORY_LABELS = {
  seoul:     '🏙 서울특별시',
  busan:     '🌊 부산광역시',
  daegu:     '🍎 대구광역시',
  incheon:   '🦀 인천광역시',
  gwangju:   '🌿 광주광역시',
  daejeon:   '🍢 대전광역시',
  ulsan:     '🐟 울산광역시',
  sejong:    '🌾 세종특별자치시',
  gyeonggi:  '🏡 경기도',
  gangwon:   '🏔 강원특별자치도',
  chungbuk:  '🍇 충청북도',
  chungnam:  '🦪 충청남도',
  jeonbuk:   '🍚 전북특별자치도',
  jeonnam:   '🌊 전라남도',
  gyeongbuk: '🍎 경상북도',
  gyeongnam: '🦐 경상남도',
  jeju:      '🍊 제주특별자치도',
  global:    '🌍 글로벌 푸드',
}

export function categoryLabel(id) {
  return CATEGORY_LABELS[id] || id
}

// 왼쪽 설명 + 오른쪽 사진, 위→아래 타임라인 형태로 보여줄 카테고리 (커스텀 카테고리 라벨 그대로 비교)
export const STEP_CATEGORIES = ['레시피', '식재료손질']

export function isStepCategory(category) {
  return STEP_CATEGORIES.includes((category || '').trim())
}

// 건강효능(MapAdminPanel의 health_benefits) 큐레이션 카테고리 — 블로그 "건강효능" 드롭다운에서 재사용
export const HEALTH_CATEGORIES = [
  '면역·항산화','활력·피로회복','뼈·관절','혈관·심장',
  '혈당·당뇨','간·해독','신장·비뇨','소화·장',
  '피부·미용','혈액·빈혈','두뇌·눈','체중·다이어트',
  '호흡기·폐','항암','갱년기·호르몬','수면·신경',
  '치아·구강','체력·근육','임산부·태아',
  '탈모·모발','아토피·피부염','통풍·요산','콜레스테롤',
  '전립선·남성건강','신장·저칼륨','알레르기완화',
  '수험생·집중력','어린이성장','노인·골감소증','기타',
]
