// 제철 식재료 시드 데이터 — 17개 시도 기준
export const SEASONAL_FOODS_SEED = [
  // 강원
  { ingredient:'오징어',    region:'gangwon',  district:'속초시·강릉시', months:[7,8,9,10],              health:'타우린·DHA 풍부, 눈건강·피로회복',       tvPrograms:['생활의달인','수요미식회'] },
  { ingredient:'도루묵',    region:'gangwon',  district:'속초시',        months:[11,12],                 health:'EPA·불포화지방산, 혈행개선',              tvPrograms:['한국인의밥상'] },
  { ingredient:'곰취',      region:'gangwon',  district:'평창군·정선군', months:[4,5],                   health:'쿠마린 성분, 항산화·혈압조절',            tvPrograms:['6시내고향','한국인의밥상'] },
  { ingredient:'감자',      region:'gangwon',  district:'강원도 전역',   months:[6,7],                   health:'비타민C·칼륨, 포만감·혈압안정',           tvPrograms:['생활의달인'] },
  { ingredient:'황태',      region:'gangwon',  district:'인제군·평창군', months:[1,2,3],                 health:'메티오닌 풍부, 간 해독·숙취해소',         tvPrograms:['수요미식회','한국인의밥상'] },
  // 제주
  { ingredient:'감귤',      region:'jeju',     district:'서귀포시',      months:[10,11,12,1],            health:'비타민C·헤스페리딘, 면역·피부미용',       tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'흑돼지',    region:'jeju',     district:'제주시·서귀포시',months:[1,2,3,4,5,6,7,8,9,10,11,12],health:'올레산·비타민B1, 피부탄력·근육생성',tvPrograms:['수요미식회','백종원의골목식당'] },
  { ingredient:'전복',      region:'jeju',     district:'서귀포시',      months:[9,10,11,12,1],          health:'아르기닌·글리신, 간기능·원기회복',        tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'옥돔',      region:'jeju',     district:'제주시',        months:[10,11,12,1,2],          health:'고단백·저지방, 소화흡수 우수',            tvPrograms:['한국인의밥상'] },
  { ingredient:'한라봉',    region:'jeju',     district:'서귀포시',      months:[1,2,3],                 health:'비타민C·식이섬유, 변비예방·피로회복',     tvPrograms:['생활의달인'] },
  // 전남
  { ingredient:'낙지',      region:'jeonnam',  district:'무안군·목포시', months:[9,10,11],               health:'타우린·철분, 빈혈예방·스태미나',          tvPrograms:['수요미식회','생활의달인','한국인의밥상'] },
  { ingredient:'김',        region:'jeonnam',  district:'완도군·신안군', months:[11,12,1,2],             health:'철분·요오드·칼슘, 빈혈예방·갑상선',      tvPrograms:['생활의달인','6시내고향'] },
  { ingredient:'굴비',      region:'jeonnam',  district:'영광군',        months:[3,4,5,6],               health:'단백질·칼슘 풍부, 뼈건강·성장발육',      tvPrograms:['한국인의밥상','수요미식회'] },
  { ingredient:'홍어',      region:'jeonnam',  district:'흑산도·목포시', months:[11,12,1,2],             health:'콜라겐·타우린, 피부·간기능',              tvPrograms:['한국인의밥상'] },
  // 전북
  { ingredient:'딸기',      region:'jeonbuk',  district:'논산시·익산시', months:[3,4,5],                 health:'비타민C·안토시아닌, 항산화·피부',         tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'게장',      region:'jeonbuk',  district:'부안군·고창군', months:[3,4,5],                 health:'타우린·키토산, 간기능·콜레스테롤',        tvPrograms:['수요미식회','생활의달인'] },
  // 경북
  { ingredient:'과메기',    region:'gyeongbuk',district:'포항시',        months:[11,12,1,2],             health:'오메가3·EPA·DHA, 혈행개선·뇌건강',       tvPrograms:['한국인의밥상','수요미식회'] },
  { ingredient:'대구(생선)',region:'gyeongbuk',district:'포항시·영덕군', months:[12,1,2,3],              health:'고단백·저지방, 다이어트·근육유지',        tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'사과',      region:'gyeongbuk',district:'청송군·안동시', months:[9,10,11],               health:'폴리페놀·펙틴, 장건강·항산화',            tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'한우',      region:'gyeongbuk',district:'안동시·영주시', months:[1,2,3,4,5,6,7,8,9,10,11,12],health:'헴철·아연·단백질, 근육·면역강화',   tvPrograms:['수요미식회','백종원의골목식당'] },
  // 경남
  { ingredient:'전어',      region:'gyeongnam',district:'통영시·사천시', months:[9,10],                  health:'칼슘·불포화지방산, 뼈건강·혈행',          tvPrograms:['한국인의밥상','수요미식회'] },
  { ingredient:'굴',        region:'gyeongnam',district:'통영시',        months:[10,11,12,1,2],          health:'아연·철분·타우린, 면역·빈혈예방',         tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'멸치',      region:'gyeongnam',district:'남해군·통영시', months:[4,5,6],                 health:'칼슘·DHA, 뼈건강·두뇌발달',              tvPrograms:['한국인의밥상','6시내고향'] },
  // 충남
  { ingredient:'대하',      region:'chungnam', district:'태안군·보령시', months:[9,10],                  health:'타우린·아스타잔틴, 간기능·항산화',        tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'인삼',      region:'chungnam', district:'금산군',        months:[9,10,11],               health:'사포닌·진세노사이드, 면역·항피로',        tvPrograms:['생활의달인','한국인의밥상'] },
  // 경기
  { ingredient:'쌀',        region:'gyeonggi', district:'이천시·여주시', months:[10,11],                 health:'비타민B군·식이섬유, 에너지·장건강',       tvPrograms:['6시내고향','한국인의밥상'] },
  { ingredient:'배',        region:'gyeonggi', district:'안성시·화성시', months:[9,10,11],               health:'루테올린·식이섬유, 기침완화·소화',        tvPrograms:['VJ특공대','생활의달인'] },
  { ingredient:'포도',      region:'gyeonggi', district:'안성시',        months:[8,9,10],                health:'레스베라트롤·안토시아닌, 항산화·심장',    tvPrograms:['생활의달인','VJ특공대'] },
  // 인천
  { ingredient:'꽃게',      region:'incheon',  district:'강화군·옹진군', months:[4,5,9,10],              health:'키토산·타우린, 콜레스테롤·간기능',        tvPrograms:['생활의달인','수요미식회'] },
  // 부산
  { ingredient:'고등어',    region:'busan',    district:'부산공동어시장',months:[9,10,11,12],            health:'오메가3·EPA·DHA, 혈행·뇌건강',           tvPrograms:['수요미식회','한국인의밥상'] },
  { ingredient:'대게',      region:'busan',    district:'기장군',        months:[11,12,1,2,3],           health:'단백질·아연·칼슘, 뼈건강·면역',          tvPrograms:['생활의달인','수요미식회'] },
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
