// 제철 식재료 시드 데이터
// Supabase seasonal_foods 테이블과 연동 (SUPABASE_SCHEMA.sql 참고)
export const SEASONAL_FOODS_SEED = [
  // 강원
  { ingredient:'오징어',  region:'gangwon',     months:[7,8,9,10],              health:'타우린·DHA 풍부, 눈건강·피로회복',              tvPrograms:['생활의달인','수요미식회'] },
  { ingredient:'도루묵',  region:'gangwon',     months:[11,12],                 health:'EPA·불포화지방산, 혈행개선',                     tvPrograms:['한국인의밥상'] },
  { ingredient:'곰취',    region:'gangwon',     months:[4,5],                   health:'쿠마린 성분, 항산화·혈압조절',                   tvPrograms:['6시내고향','한국인의밥상'] },
  { ingredient:'감자',    region:'gangwon',     months:[6,7],                   health:'비타민C·칼륨, 포만감·혈압안정',                  tvPrograms:['생활의달인'] },
  { ingredient:'황태',    region:'gangwon',     months:[1,2,3],                 health:'메티오닌 풍부, 간 해독·숙취해소',                tvPrograms:['수요미식회','한국인의밥상'] },
  // 제주
  { ingredient:'감귤',    region:'jeju',        months:[10,11,12,1],            health:'비타민C·헤스페리딘, 면역·피부미용',              tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'흑돼지',  region:'jeju',        months:[1,2,3,4,5,6,7,8,9,10,11,12], health:'올레산·비타민B1, 피부탄력·근육생성',       tvPrograms:['수요미식회','백종원의골목식당'] },
  { ingredient:'전복',    region:'jeju',        months:[9,10,11,12,1],          health:'아르기닌·글리신, 간기능·원기회복',               tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'옥돔',    region:'jeju',        months:[10,11,12,1,2],          health:'고단백·저지방, 소화흡수 우수',                   tvPrograms:['한국인의밥상'] },
  { ingredient:'한라봉',  region:'jeju',        months:[1,2,3],                 health:'비타민C·식이섬유, 변비예방·피로회복',            tvPrograms:['생활의달인'] },
  // 전라
  { ingredient:'낙지',    region:'jeonla',      months:[9,10,11],               health:'타우린·철분, 빈혈예방·스태미나',                 tvPrograms:['수요미식회','생활의달인','한국인의밥상'] },
  { ingredient:'김',      region:'jeonla',      months:[11,12,1,2],             health:'철분·요오드·칼슘, 빈혈예방·갑상선',             tvPrograms:['생활의달인','6시내고향'] },
  { ingredient:'굴비',    region:'jeonla',      months:[3,4,5,6],               health:'단백질·칼슘 풍부, 뼈건강·성장발육',             tvPrograms:['한국인의밥상','수요미식회'] },
  { ingredient:'홍어',    region:'jeonla',      months:[11,12,1,2],             health:'콜라겐·타우린, 피부·간기능',                     tvPrograms:['한국인의밥상'] },
  { ingredient:'딸기',    region:'jeonla',      months:[3,4,5],                 health:'비타민C·안토시아닌, 항산화·피부',                tvPrograms:['생활의달인','VJ특공대'] },
  // 경상
  { ingredient:'과메기',  region:'gyeongsan',   months:[11,12,1,2],             health:'오메가3·EPA·DHA, 혈행개선·뇌건강',              tvPrograms:['한국인의밥상','수요미식회'] },
  { ingredient:'대구',    region:'gyeongsan',   months:[12,1,2,3],              health:'고단백·저지방, 다이어트·근육유지',               tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'사과',    region:'gyeongsan',   months:[9,10,11],               health:'폴리페놀·펙틴, 장건강·항산화',                   tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'한우',    region:'gyeongsan',   months:[1,2,3,4,5,6,7,8,9,10,11,12], health:'헴철·아연·단백질, 근육·면역강화',           tvPrograms:['수요미식회','백종원의골목식당'] },
  { ingredient:'전어',    region:'gyeongsan',   months:[9,10],                  health:'칼슘·불포화지방산, 뼈건강·혈행',                 tvPrograms:['한국인의밥상','수요미식회'] },
  // 충청
  { ingredient:'인삼',    region:'chungcheong', months:[9,10,11],               health:'사포닌·진세노사이드, 면역·항피로',               tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'게장',    region:'chungcheong', months:[3,4,5],                 health:'타우린·키토산, 간기능·콜레스테롤',               tvPrograms:['수요미식회','생활의달인'] },
  { ingredient:'복숭아',  region:'chungcheong', months:[7,8],                   health:'베타카로틴·비타민C, 피부미용·항산화',            tvPrograms:['VJ특공대','생활의달인'] },
  { ingredient:'오리',    region:'chungcheong', months:[1,2,3,4,5,6,7,8,9,10,11,12], health:'불포화지방산·비타민B, 피부·혈관건강',       tvPrograms:['생활의달인','6시내고향'] },
  // 경기·수도권
  { ingredient:'쌀',      region:'gyeonggi',    months:[10,11],                 health:'비타민B군·식이섬유, 에너지·장건강',              tvPrograms:['6시내고향','한국인의밥상'] },
  { ingredient:'배',      region:'gyeonggi',    months:[9,10,11],               health:'루테올린·식이섬유, 기침완화·소화',               tvPrograms:['VJ특공대','생활의달인'] },
  { ingredient:'포도',    region:'gyeonggi',    months:[8,9,10],                health:'레스베라트롤·안토시아닌, 항산화·심장',           tvPrograms:['생활의달인','VJ특공대'] },
]

export function getFoodsByMonth(month) {
  return SEASONAL_FOODS_SEED.filter(f => f.months.includes(Number(month)))
}

export function getFoodsByRegion(regionId) {
  return SEASONAL_FOODS_SEED.filter(f => f.region === regionId)
}

export function getFoodsByRegionAndMonth(regionId, month) {
  return SEASONAL_FOODS_SEED.filter(f =>
    f.region === regionId && f.months.includes(Number(month))
  )
}

export const TV_PROGRAMS = [...new Set(SEASONAL_FOODS_SEED.flatMap(f => f.tvPrograms))]
