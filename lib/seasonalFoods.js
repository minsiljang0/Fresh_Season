// ============================================================
// Fresh Season — 제철 식재료 마스터 데이터
// 17개 시도 × 12개월 × 전체 식재료
// category: 'fish'(수산) | 'veg'(채소·나물) | 'fruit'(과일) | 'grain'(곡물·가공) | 'meat'(육류) | 'mushroom'(버섯·산채)
// ============================================================

export const SEASONAL_FOODS_SEED = [

  // ── 강원 ──────────────────────────────────────────────────
  { ingredient:'오징어',    category:'fish',     region:'gangwon',   district:'속초시·강릉시', months:[7,8,9,10],           health:'타우린·DHA 풍부, 눈건강·피로회복',         tvPrograms:['생활의달인','수요미식회'] },
  { ingredient:'도루묵',    category:'fish',     region:'gangwon',   district:'속초시',        months:[11,12,1],            health:'EPA·불포화지방산, 혈행개선',               tvPrograms:['한국인의밥상'] },
  { ingredient:'곰취',      category:'veg',      region:'gangwon',   district:'평창군·정선군', months:[3,4,5],              health:'쿠마린 성분, 항산화·혈압조절',             tvPrograms:['6시내고향','한국인의밥상'] },
  { ingredient:'취나물',    category:'veg',      region:'gangwon',   district:'강원도 전역',   months:[4,5,6],              health:'베타카로틴·식이섬유, 항산화·장건강',       tvPrograms:['한국인의밥상'] },
  { ingredient:'두릅',      category:'veg',      region:'gangwon',   district:'강원도 전역',   months:[4,5],                health:'사포닌·비타민C, 혈당조절·피로회복',        tvPrograms:['6시내고향'] },
  { ingredient:'감자',      category:'grain',    region:'gangwon',   district:'강원도 전역',   months:[6,7],                health:'비타민C·칼륨, 포만감·혈압안정',            tvPrograms:['생활의달인'] },
  { ingredient:'옥수수',    category:'grain',    region:'gangwon',   district:'강원도 전역',   months:[7,8],                health:'루테인·제아잔틴, 눈건강·항산화',           tvPrograms:['VJ특공대'] },
  { ingredient:'황태',      category:'fish',     region:'gangwon',   district:'인제군·평창군', months:[1,2,3,11,12],        health:'메티오닌 풍부, 간 해독·숙취해소',          tvPrograms:['수요미식회','한국인의밥상'] },
  { ingredient:'더덕',      category:'veg',      region:'gangwon',   district:'강원도 전역',   months:[3,4,10,11],          health:'사포닌·이눌린, 기관지·면역강화',           tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'송이버섯',  category:'mushroom', region:'gangwon',   district:'양양군·인제군', months:[9,10],               health:'에르고스테롤·항산화, 면역·항암',           tvPrograms:['한국인의밥상'] },
  { ingredient:'사과',      category:'fruit',    region:'gangwon',   district:'양구군·춘천시', months:[9,10,11],            health:'폴리페놀·펙틴, 장건강·항산화',             tvPrograms:['생활의달인'] },

  // ── 제주 ──────────────────────────────────────────────────
  { ingredient:'감귤',      category:'fruit',    region:'jeju',      district:'서귀포시',      months:[10,11,12,1],         health:'비타민C·헤스페리딘, 면역·피부미용',        tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'한라봉',    category:'fruit',    region:'jeju',      district:'서귀포시',      months:[1,2,3],              health:'비타민C·식이섬유, 변비예방·피로회복',      tvPrograms:['생활의달인'] },
  { ingredient:'흑돼지',    category:'meat',     region:'jeju',      district:'제주시·서귀포시',months:[1,2,3,4,5,6,7,8,9,10,11,12], health:'올레산·비타민B1, 피부탄력·근육생성', tvPrograms:['수요미식회','백종원의골목식당'] },
  { ingredient:'전복',      category:'fish',     region:'jeju',      district:'서귀포시',      months:[9,10,11,12,1],       health:'아르기닌·글리신, 간기능·원기회복',         tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'옥돔',      category:'fish',     region:'jeju',      district:'제주시',        months:[10,11,12,1,2],       health:'고단백·저지방, 소화흡수 우수',             tvPrograms:['한국인의밥상'] },
  { ingredient:'자리돔',    category:'fish',     region:'jeju',      district:'제주 연안',     months:[6,7,8],              health:'DHA·칼슘, 두뇌발달·뼈건강',               tvPrograms:['한국인의밥상'] },
  { ingredient:'한치',      category:'fish',     region:'jeju',      district:'제주 연안',     months:[7,8,9,2,3],          health:'타우린·아연, 피로회복·면역강화',           tvPrograms:['생활의달인'] },
  { ingredient:'방어',      category:'fish',     region:'jeju',      district:'모슬포항',      months:[11,12,1,2],          health:'오메가3·DHA, 혈행개선·뇌건강',            tvPrograms:['수요미식회','한국인의밥상'] },
  { ingredient:'톳',        category:'veg',      region:'jeju',      district:'제주 해안',     months:[3,4,5],              health:'철분·칼슘·요오드, 빈혈예방·골다공증',     tvPrograms:['한국인의밥상'] },

  // ── 전남 ──────────────────────────────────────────────────
  { ingredient:'낙지',      category:'fish',     region:'jeonnam',   district:'무안군·목포시', months:[7,8,9,10,11],        health:'타우린·철분, 빈혈예방·스태미나',           tvPrograms:['수요미식회','생활의달인','한국인의밥상'] },
  { ingredient:'굴',        category:'fish',     region:'jeonnam',   district:'고흥군·여수시', months:[10,11,12,1,2],       health:'아연·철분·타우린, 면역·빈혈예방',          tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'꼬막',      category:'fish',     region:'jeonnam',   district:'벌교읍·보성군', months:[10,11,12,1,2],       health:'헤모글로빈·철분, 빈혈예방·피로회복',      tvPrograms:['한국인의밥상','수요미식회'] },
  { ingredient:'김',        category:'veg',      region:'jeonnam',   district:'완도군·신안군', months:[11,12,1,2],          health:'철분·요오드·칼슘, 빈혈예방·갑상선',       tvPrograms:['생활의달인','6시내고향'] },
  { ingredient:'굴비',      category:'fish',     region:'jeonnam',   district:'영광군',        months:[3,4,5,6],            health:'단백질·칼슘 풍부, 뼈건강·성장발육',       tvPrograms:['한국인의밥상','수요미식회'] },
  { ingredient:'홍어',      category:'fish',     region:'jeonnam',   district:'흑산도·목포시', months:[11,12,1,2],          health:'콜라겐·타우린, 피부·간기능',               tvPrograms:['한국인의밥상'] },
  { ingredient:'미역',      category:'veg',      region:'jeonnam',   district:'완도군',        months:[3,4,5],              health:'요오드·알긴산, 갑상선·혈압조절',           tvPrograms:['한국인의밥상'] },
  { ingredient:'주꾸미',    category:'fish',     region:'jeonnam',   district:'신안군·목포시', months:[3,4,5],              health:'타우린·DHA, 피로회복·두뇌건강',            tvPrograms:['생활의달인','수요미식회'] },
  { ingredient:'매실',      category:'fruit',    region:'jeonnam',   district:'광양시·순천시', months:[5,6],                health:'구연산·피크린산, 소화촉진·피로해소',       tvPrograms:['생활의달인'] },
  { ingredient:'전어',      category:'fish',     region:'jeonnam',   district:'여수시·광양시', months:[9,10],               health:'칼슘·불포화지방산, 뼈건강·혈행',           tvPrograms:['한국인의밥상','수요미식회'] },
  { ingredient:'참깨',      category:'grain',    region:'jeonnam',   district:'고흥군',        months:[7,8],                health:'세사민·리그난, 항산화·콜레스테롤',         tvPrograms:['생활의달인'] },
  { ingredient:'전복',      category:'fish',     region:'jeonnam',   district:'완도군',        months:[9,10,11,12,1],       health:'아르기닌·글리신, 간기능·원기회복',         tvPrograms:['생활의달인','한국인의밥상'] },

  // ── 경남 ──────────────────────────────────────────────────
  { ingredient:'멸치',      category:'fish',     region:'gyeongnam', district:'남해군·통영시', months:[4,5,6],              health:'칼슘·DHA, 뼈건강·두뇌발달',               tvPrograms:['한국인의밥상','6시내고향'] },
  { ingredient:'굴',        category:'fish',     region:'gyeongnam', district:'통영시',        months:[10,11,12,1,2],       health:'아연·철분·타우린, 면역·빈혈예방',          tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'전어',      category:'fish',     region:'gyeongnam', district:'통영시·사천시', months:[9,10],               health:'칼슘·불포화지방산, 뼈건강·혈행',           tvPrograms:['한국인의밥상','수요미식회'] },
  { ingredient:'민어',      category:'fish',     region:'gyeongnam', district:'통영시',        months:[7,8,9],              health:'고단백·콜라겐, 피부건강·노화방지',         tvPrograms:['수요미식회'] },
  { ingredient:'대하',      category:'fish',     region:'gyeongnam', district:'고성군·사천시', months:[9,10],               health:'타우린·아스타잔틴, 간기능·항산화',         tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'단감',      category:'fruit',    region:'gyeongnam', district:'창원시·진주시', months:[10,11],              health:'비타민C·탄닌, 감기예방·항산화',            tvPrograms:['생활의달인'] },
  { ingredient:'대구(생선)',category:'fish',     region:'gyeongnam', district:'거제시·통영시', months:[12,1,2],             health:'고단백·저지방, 다이어트·근육유지',         tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'미더덕',    category:'fish',     region:'gyeongnam', district:'창원시·마산',   months:[2,3,4],              health:'바나듐·항산화, 혈당조절·면역',             tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'도다리',    category:'fish',     region:'gyeongnam', district:'통영시·거제시', months:[3,4,5],              health:'고단백·저지방·콜라겐, 피부·다이어트',     tvPrograms:['수요미식회'] },

  // ── 충남 ──────────────────────────────────────────────────
  { ingredient:'굴',        category:'fish',     region:'chungnam',  district:'서산시·보령시', months:[10,11,12,1,2],       health:'아연·철분·타우린, 면역·빈혈예방',          tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'대하',      category:'fish',     region:'chungnam',  district:'태안군·보령시', months:[9,10],               health:'타우린·아스타잔틴, 간기능·항산화',         tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'주꾸미',    category:'fish',     region:'chungnam',  district:'서천군·보령시', months:[3,4,5],              health:'타우린·DHA, 피로회복·두뇌건강',            tvPrograms:['생활의달인','수요미식회'] },
  { ingredient:'냉이',      category:'veg',      region:'chungnam',  district:'충남 전역',     months:[3,4],                health:'비타민K·철분, 지혈·조혈기능',              tvPrograms:['6시내고향','한국인의밥상'] },
  { ingredient:'달래',      category:'veg',      region:'chungnam',  district:'충남 전역',     months:[3,4,5],              health:'알리신·칼슘, 살균·면역강화',               tvPrograms:['한국인의밥상'] },
  { ingredient:'키조개',    category:'fish',     region:'chungnam',  district:'태안군',        months:[4,5,6],              health:'타우린·철분, 빈혈예방·피로회복',           tvPrograms:['한국인의밥상'] },
  { ingredient:'복숭아',    category:'fruit',    region:'chungnam',  district:'천안시·아산시', months:[7,8,9],              health:'카테킨·베타카로틴, 항산화·피부미용',       tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'인삼',      category:'grain',    region:'chungnam',  district:'금산군',        months:[9,10,11,8],          health:'사포닌·진세노사이드, 면역·항피로',         tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'게장',      category:'fish',     region:'chungnam',  district:'보령시·서천군', months:[10,11],              health:'타우린·키토산, 간기능·콜레스테롤',         tvPrograms:['수요미식회','생활의달인'] },

  // ── 경기 ──────────────────────────────────────────────────
  { ingredient:'쌀',        category:'grain',    region:'gyeonggi',  district:'이천시·여주시', months:[10,11],              health:'비타민B군·식이섬유, 에너지·장건강',        tvPrograms:['6시내고향','한국인의밥상'] },
  { ingredient:'배',        category:'fruit',    region:'gyeonggi',  district:'안성시·화성시', months:[9,10,11],            health:'루테올린·식이섬유, 기침완화·소화',         tvPrograms:['VJ특공대','생활의달인'] },
  { ingredient:'포도',      category:'fruit',    region:'gyeonggi',  district:'안성시',        months:[8,9,10],             health:'레스베라트롤·안토시아닌, 항산화·심장',     tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'딸기',      category:'fruit',    region:'gyeonggi',  district:'수원시·화성시', months:[3,4,5],              health:'비타민C·안토시아닌, 항산화·피부',          tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'연근',      category:'veg',      region:'gyeonggi',  district:'이천시',        months:[1,2,11,12],          health:'뮤신·탄닌, 지혈·소화촉진',                tvPrograms:['생활의달인'] },
  { ingredient:'봄나물',    category:'veg',      region:'gyeonggi',  district:'경기도 전역',   months:[3,4,5],              health:'베타카로틴·엽산, 항산화·조혈기능',        tvPrograms:['한국인의밥상','6시내고향'] },
  { ingredient:'사과',      category:'fruit',    region:'gyeonggi',  district:'연천군·가평군', months:[10,11],              health:'폴리페놀·펙틴, 장건강·항산화',             tvPrograms:['생활의달인'] },

  // ── 전북 ──────────────────────────────────────────────────
  { ingredient:'쌀',        category:'grain',    region:'jeonbuk',   district:'김제시·익산시', months:[10,11],              health:'비타민B군·식이섬유, 에너지·장건강',        tvPrograms:['6시내고향','한국인의밥상'] },
  { ingredient:'홍삼',      category:'grain',    region:'jeonbuk',   district:'진안군·무주군', months:[1,2,11,12],          health:'진세노사이드·항산화, 면역강화·항피로',     tvPrograms:['생활의달인'] },
  { ingredient:'딸기',      category:'fruit',    region:'jeonbuk',   district:'논산시·익산시', months:[3,4,5],              health:'비타민C·안토시아닌, 항산화·피부',          tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'죽순',      category:'veg',      region:'jeonbuk',   district:'담양군·순창군', months:[4,5,6],              health:'식이섬유·티로신, 다이어트·혈압조절',       tvPrograms:['한국인의밥상'] },
  { ingredient:'복분자',    category:'fruit',    region:'jeonbuk',   district:'고창군',        months:[6,7,8],              health:'안토시아닌·비타민C, 항산화·시력보호',      tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'사과',      category:'fruit',    region:'jeonbuk',   district:'장수군',        months:[9,10,11],            health:'폴리페놀·펙틴, 장건강·항산화',             tvPrograms:['생활의달인'] },
  { ingredient:'한우',      category:'meat',     region:'jeonbuk',   district:'남원시·장수군', months:[1,2,3,4,5,6,7,8,9,10,11,12], health:'헴철·아연·단백질, 근육·면역강화', tvPrograms:['수요미식회','백종원의골목식당'] },
  { ingredient:'전어',      category:'fish',     region:'jeonbuk',   district:'군산시',        months:[9,10],               health:'칼슘·불포화지방산, 뼈건강·혈행',           tvPrograms:['한국인의밥상'] },
  { ingredient:'감자',      category:'grain',    region:'jeonbuk',   district:'전북 전역',     months:[6,7],                health:'비타민C·칼륨, 포만감·혈압안정',            tvPrograms:['생활의달인'] },

  // ── 경북 ──────────────────────────────────────────────────
  { ingredient:'과메기',    category:'fish',     region:'gyeongbuk', district:'포항시',        months:[11,12,1,2],          health:'오메가3·EPA·DHA, 혈행개선·뇌건강',        tvPrograms:['한국인의밥상','수요미식회'] },
  { ingredient:'대게',      category:'fish',     region:'gyeongbuk', district:'영덕군·울진군', months:[11,12,1,2,3],        health:'단백질·아연·칼슘, 뼈건강·면역',           tvPrograms:['생활의달인','수요미식회'] },
  { ingredient:'사과',      category:'fruit',    region:'gyeongbuk', district:'청송군·안동시', months:[9,10,11],            health:'폴리페놀·펙틴, 장건강·항산화',             tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'한우',      category:'meat',     region:'gyeongbuk', district:'안동시·영주시', months:[1,2,3,4,5,6,7,8,9,10,11,12], health:'헴철·아연·단백질, 근육·면역강화', tvPrograms:['수요미식회','백종원의골목식당'] },
  { ingredient:'복숭아',    category:'fruit',    region:'gyeongbuk', district:'경산시·청도군', months:[7,8,9],              health:'카테킨·베타카로틴, 항산화·피부미용',       tvPrograms:['생활의달인'] },
  { ingredient:'고등어',    category:'fish',     region:'gyeongbuk', district:'포항시',        months:[9,10,11,12],         health:'오메가3·EPA·DHA, 혈행·뇌건강',            tvPrograms:['수요미식회','한국인의밥상'] },
  { ingredient:'대구(생선)',category:'fish',     region:'gyeongbuk', district:'포항시·영덕군', months:[12,1,2,3],           health:'고단백·저지방, 다이어트·근육유지',         tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'봄나물',    category:'veg',      region:'gyeongbuk', district:'경북 전역',     months:[3,4,5],              health:'베타카로틴·엽산, 항산화·조혈기능',        tvPrograms:['한국인의밥상','6시내고향'] },
  { ingredient:'두릅',      category:'veg',      region:'gyeongbuk', district:'경북 전역',     months:[4,5],                health:'사포닌·비타민C, 혈당조절·피로회복',        tvPrograms:['6시내고향'] },

  // ── 충북 ──────────────────────────────────────────────────
  { ingredient:'사과',      category:'fruit',    region:'chungbuk',  district:'충주시·제천시', months:[9,10,11],            health:'폴리페놀·펙틴, 장건강·항산화',             tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'더덕',      category:'veg',      region:'chungbuk',  district:'제천시·단양군', months:[3,4,10,11],          health:'사포닌·이눌린, 기관지·면역강화',           tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'포도',      category:'fruit',    region:'chungbuk',  district:'영동군',        months:[8,9,10],             health:'레스베라트롤·안토시아닌, 항산화·심장',     tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'복숭아',    category:'fruit',    region:'chungbuk',  district:'음성군·충주시', months:[7,8,9],              health:'카테킨·베타카로틴, 항산화·피부미용',       tvPrograms:['VJ특공대'] },
  { ingredient:'오이',      category:'veg',      region:'chungbuk',  district:'음성군',        months:[5,6,7],              health:'쿠쿠르비타신·수분, 해열·피부미용',         tvPrograms:['생활의달인'] },
  { ingredient:'봄나물',    category:'veg',      region:'chungbuk',  district:'충북 전역',     months:[3,4,5],              health:'베타카로틴·엽산, 항산화·조혈기능',        tvPrograms:['한국인의밥상'] },

  // ── 부산 ──────────────────────────────────────────────────
  { ingredient:'고등어',    category:'fish',     region:'busan',     district:'부산공동어시장',months:[9,10,11,12],         health:'오메가3·EPA·DHA, 혈행·뇌건강',            tvPrograms:['수요미식회','한국인의밥상'] },
  { ingredient:'대구(생선)',category:'fish',     region:'busan',     district:'부산공동어시장',months:[12,1,2],             health:'고단백·저지방, 다이어트·근육유지',         tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'굴',        category:'fish',     region:'busan',     district:'기장군',        months:[11,12,1,2],          health:'아연·철분·타우린, 면역·빈혈예방',          tvPrograms:['생활의달인'] },
  { ingredient:'멸치',      category:'fish',     region:'busan',     district:'부산공동어시장',months:[3,4,5,6],            health:'칼슘·DHA, 뼈건강·두뇌발달',               tvPrograms:['한국인의밥상','6시내고향'] },
  { ingredient:'도다리',    category:'fish',     region:'busan',     district:'부산 연안',     months:[3,4,5],              health:'고단백·저지방·콜라겐, 피부·다이어트',     tvPrograms:['수요미식회'] },
  { ingredient:'전어',      category:'fish',     region:'busan',     district:'낙동강 하구',   months:[9,10],               health:'칼슘·불포화지방산, 뼈건강·혈행',           tvPrograms:['한국인의밥상'] },
  { ingredient:'미역',      category:'veg',      region:'busan',     district:'기장군',        months:[2,3,4],              health:'요오드·알긴산, 갑상선·혈압조절',           tvPrograms:['한국인의밥상'] },
  { ingredient:'민어',      category:'fish',     region:'busan',     district:'부산 연안',     months:[7,8,9],              health:'고단백·콜라겐, 피부건강·노화방지',         tvPrograms:['수요미식회'] },
  { ingredient:'낙지',      category:'fish',     region:'busan',     district:'부산 연안',     months:[9,10,11],            health:'타우린·철분, 빈혈예방·스태미나',           tvPrograms:['생활의달인'] },
  { ingredient:'참치',      category:'fish',     region:'busan',     district:'부산공동어시장',months:[5,6,7,8],            health:'오메가3·셀레늄, 항산화·심장건강',          tvPrograms:['수요미식회'] },

  // ── 대구 ──────────────────────────────────────────────────
  { ingredient:'사과',      category:'fruit',    region:'daegu',     district:'군위군',        months:[9,10,11],            health:'폴리페놀·펙틴, 장건강·항산화',             tvPrograms:['생활의달인'] },
  { ingredient:'복숭아',    category:'fruit',    region:'daegu',     district:'달성군',        months:[7,8,9],              health:'카테킨·베타카로틴, 항산화·피부미용',       tvPrograms:['VJ특공대'] },
  { ingredient:'더덕',      category:'veg',      region:'daegu',     district:'달성군',        months:[3,4,10,11],          health:'사포닌·이눌린, 기관지·면역강화',           tvPrograms:['생활의달인'] },
  { ingredient:'봄나물',    category:'veg',      region:'daegu',     district:'대구 근교',     months:[3,4,5],              health:'베타카로틴·엽산, 항산화·조혈기능',        tvPrograms:['한국인의밥상'] },
  { ingredient:'두릅',      category:'veg',      region:'daegu',     district:'달성군',        months:[4,5],                health:'사포닌·비타민C, 혈당조절·피로회복',        tvPrograms:['6시내고향'] },
  { ingredient:'포도',      category:'fruit',    region:'daegu',     district:'달성군',        months:[8,9,10],             health:'레스베라트롤·안토시아닌, 항산화·심장',     tvPrograms:['생활의달인'] },
  { ingredient:'한우',      category:'meat',     region:'daegu',     district:'대구 전역',     months:[1,2,3,4,5,6,7,8,9,10,11,12], health:'헴철·아연·단백질, 근육·면역강화', tvPrograms:['수요미식회','백종원의골목식당'] },

  // ── 인천 ──────────────────────────────────────────────────
  { ingredient:'꽃게',      category:'fish',     region:'incheon',   district:'강화군·옹진군', months:[4,5,9,10],           health:'키토산·타우린, 콜레스테롤·간기능',         tvPrograms:['생활의달인','수요미식회'] },
  { ingredient:'굴',        category:'fish',     region:'incheon',   district:'강화군',        months:[11,12,1,2],          health:'아연·철분·타우린, 면역·빈혈예방',          tvPrograms:['생활의달인'] },
  { ingredient:'새우',      category:'fish',     region:'incheon',   district:'옹진군',        months:[5,6,7,8,9],          health:'아스타잔틴·타우린, 항산화·간기능',         tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'민어',      category:'fish',     region:'incheon',   district:'연평도',        months:[7,8,9],              health:'고단백·콜라겐, 피부건강·노화방지',         tvPrograms:['수요미식회'] },
  { ingredient:'쌀',        category:'grain',    region:'incheon',   district:'강화군',        months:[10,11],              health:'비타민B군·식이섬유, 에너지·장건강',        tvPrograms:['6시내고향'] },
  { ingredient:'주꾸미',    category:'fish',     region:'incheon',   district:'옹진군',        months:[3,4,5],              health:'타우린·DHA, 피로회복·두뇌건강',            tvPrograms:['생활의달인'] },

  // ── 광주 ──────────────────────────────────────────────────
  { ingredient:'보리',      category:'grain',    region:'gwangju',   district:'광주 전역',     months:[1,2,3,4,5,11,12],    health:'베타글루칸·식이섬유, 혈당조절·장건강',     tvPrograms:['한국인의밥상','6시내고향'] },
  { ingredient:'무',        category:'veg',      region:'gwangju',   district:'광주 전역',     months:[1,2,10,11,12],       health:'디아스타제·비타민C, 소화촉진·감기예방',    tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'봄동',      category:'veg',      region:'gwangju',   district:'광주 근교',     months:[2,3,4],              health:'비타민C·칼슘, 면역강화·뼈건강',            tvPrograms:['한국인의밥상'] },
  { ingredient:'봄나물',    category:'veg',      region:'gwangju',   district:'광주 근교',     months:[3,4,5],              health:'베타카로틴·엽산, 항산화·조혈기능',        tvPrograms:['한국인의밥상'] },
  { ingredient:'수박',      category:'fruit',    region:'gwangju',   district:'광주 근교',     months:[5,6,7,8,9],          health:'리코펜·시트룰린, 항산화·이뇨작용',         tvPrograms:['VJ특공대'] },
  { ingredient:'참외',      category:'fruit',    region:'gwangju',   district:'광주 근교',     months:[6,7,8,9],            health:'엽산·비타민C, 항산화·임산부건강',          tvPrograms:['생활의달인'] },
  { ingredient:'포도',      category:'fruit',    region:'gwangju',   district:'광주 근교',     months:[8,9,10],             health:'레스베라트롤·안토시아닌, 항산화·심장',     tvPrograms:['생활의달인'] },
  { ingredient:'배추',      category:'veg',      region:'gwangju',   district:'광주 전역',     months:[10,11,12],           health:'비타민C·식이섬유, 면역강화·소화',          tvPrograms:['한국인의밥상'] },

  // ── 대전 ──────────────────────────────────────────────────
  { ingredient:'두부',      category:'grain',    region:'daejeon',   district:'대전 전역',     months:[1,2,3,4,5,6,7,8,9,10,11,12], health:'이소플라본·식물성단백, 갱년기·심장건강', tvPrograms:['한국인의밥상'] },
  { ingredient:'무',        category:'veg',      region:'daejeon',   district:'대전 전역',     months:[1,2,10,11,12],       health:'디아스타제·비타민C, 소화촉진·감기예방',    tvPrograms:['생활의달인'] },
  { ingredient:'봄동',      category:'veg',      region:'daejeon',   district:'대전 근교',     months:[2,3,4],              health:'비타민C·칼슘, 면역강화·뼈건강',            tvPrograms:['한국인의밥상'] },
  { ingredient:'봄나물',    category:'veg',      region:'daejeon',   district:'계룡산 일대',   months:[3,4,5],              health:'베타카로틴·엽산, 항산화·조혈기능',        tvPrograms:['한국인의밥상'] },
  { ingredient:'딸기',      category:'fruit',    region:'daejeon',   district:'대전 근교',     months:[3,4,5],              health:'비타민C·안토시아닌, 항산화·피부',          tvPrograms:['생활의달인'] },
  { ingredient:'복숭아',    category:'fruit',    region:'daejeon',   district:'대전 근교',     months:[7,8,9],              health:'카테킨·베타카로틴, 항산화·피부미용',       tvPrograms:['VJ특공대'] },
  { ingredient:'밤',        category:'grain',    region:'daejeon',   district:'대전 근교',     months:[9,10],               health:'비타민C·불포화지방산, 피부·에너지',        tvPrograms:['생활의달인'] },
  { ingredient:'사과',      category:'fruit',    region:'daejeon',   district:'대전 근교',     months:[10,11],              health:'폴리페놀·펙틴, 장건강·항산화',             tvPrograms:['생활의달인'] },

  // ── 울산 ──────────────────────────────────────────────────
  { ingredient:'미역',      category:'veg',      region:'ulsan',     district:'울주군',        months:[1,2,3,4,5,11,12],    health:'요오드·알긴산, 갑상선·혈압조절',           tvPrograms:['한국인의밥상'] },
  { ingredient:'대구(생선)',category:'fish',     region:'ulsan',     district:'울산 연안',     months:[12,1,2],             health:'고단백·저지방, 다이어트·근육유지',         tvPrograms:['생활의달인','한국인의밥상'] },
  { ingredient:'멸치',      category:'fish',     region:'ulsan',     district:'울산 연안',     months:[3,4,5],              health:'칼슘·DHA, 뼈건강·두뇌발달',               tvPrograms:['한국인의밥상'] },
  { ingredient:'고등어',    category:'fish',     region:'ulsan',     district:'울산 연안',     months:[5,6,9,10,11,12],     health:'오메가3·EPA·DHA, 혈행·뇌건강',            tvPrograms:['수요미식회','한국인의밥상'] },
  { ingredient:'한우',      category:'meat',     region:'ulsan',     district:'울주군',        months:[1,2,3,4,5,6,7,8,9,10,11,12], health:'헴철·아연·단백질, 근육·면역강화', tvPrograms:['수요미식회'] },
  { ingredient:'전어',      category:'fish',     region:'ulsan',     district:'태화강 하구',   months:[8,9,10],             health:'칼슘·불포화지방산, 뼈건강·혈행',           tvPrograms:['한국인의밥상'] },
  { ingredient:'굴',        category:'fish',     region:'ulsan',     district:'울산 연안',     months:[11,12],              health:'아연·철분·타우린, 면역·빈혈예방',          tvPrograms:['생활의달인'] },
  { ingredient:'사과',      category:'fruit',    region:'ulsan',     district:'울주군',        months:[10,11],              health:'폴리페놀·펙틴, 장건강·항산화',             tvPrograms:['생활의달인'] },

  // ── 세종 ──────────────────────────────────────────────────
  { ingredient:'쌀',        category:'grain',    region:'sejong',    district:'세종시',        months:[10,11],              health:'비타민B군·식이섬유, 에너지·장건강',        tvPrograms:['6시내고향','한국인의밥상'] },
  { ingredient:'복숭아',    category:'fruit',    region:'sejong',    district:'세종시',        months:[7,8,9],              health:'카테킨·베타카로틴, 항산화·피부미용',       tvPrograms:['VJ특공대'] },
  { ingredient:'더덕',      category:'veg',      region:'sejong',    district:'세종시 인근',   months:[3,4,10,11],          health:'사포닌·이눌린, 기관지·면역강화',           tvPrograms:['생활의달인'] },
  { ingredient:'봄나물',    category:'veg',      region:'sejong',    district:'세종시 인근',   months:[3,4,5],              health:'베타카로틴·엽산, 항산화·조혈기능',        tvPrograms:['한국인의밥상'] },
  { ingredient:'참외',      category:'fruit',    region:'sejong',    district:'세종시 인근',   months:[6,7,8],              health:'엽산·비타민C, 항산화·임산부건강',          tvPrograms:['생활의달인'] },
  { ingredient:'무',        category:'veg',      region:'sejong',    district:'세종시',        months:[10,11,12],          health:'디아스타제·비타민C, 소화촉진·감기예방',    tvPrograms:['한국인의밥상'] },

  // ── 서울 ──────────────────────────────────────────────────
  { ingredient:'굴',        category:'fish',     region:'seoul',     district:'노량진·가락시장',months:[11,12,1,2],         health:'아연·철분·타우린, 면역·빈혈예방',          tvPrograms:['생활의달인','수요미식회'] },
  { ingredient:'방어',      category:'fish',     region:'seoul',     district:'노량진',        months:[11,12,1,2],          health:'오메가3·DHA, 혈행개선·뇌건강',            tvPrograms:['수요미식회'] },
  { ingredient:'딸기',      category:'fruit',    region:'seoul',     district:'가락시장',      months:[2,3,4,5],            health:'비타민C·안토시아닌, 항산화·피부',          tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'한라봉',    category:'fruit',    region:'seoul',     district:'가락시장',      months:[1,2,3],              health:'비타민C·식이섬유, 변비예방·피로회복',      tvPrograms:['생활의달인'] },
  { ingredient:'봄나물',    category:'veg',      region:'seoul',     district:'경동시장',      months:[3,4,5],              health:'베타카로틴·엽산, 항산화·조혈기능',        tvPrograms:['한국인의밥상'] },
  { ingredient:'주꾸미',    category:'fish',     region:'seoul',     district:'노량진',        months:[3,4,5],              health:'타우린·DHA, 피로회복·두뇌건강',            tvPrograms:['생활의달인','수요미식회'] },
  { ingredient:'수박',      category:'fruit',    region:'seoul',     district:'가락시장',      months:[6,7,8],              health:'리코펜·시트룰린, 항산화·이뇨작용',         tvPrograms:['VJ특공대'] },
  { ingredient:'참외',      category:'fruit',    region:'seoul',     district:'가락시장',      months:[5,6,7,8],            health:'엽산·비타민C, 항산화·임산부건강',          tvPrograms:['생활의달인'] },
  { ingredient:'복숭아',    category:'fruit',    region:'seoul',     district:'가락시장',      months:[7,8,9],              health:'카테킨·베타카로틴, 항산화·피부미용',       tvPrograms:['VJ특공대'] },
  { ingredient:'전어',      category:'fish',     region:'seoul',     district:'노량진',        months:[9,10],               health:'칼슘·불포화지방산, 뼈건강·혈행',           tvPrograms:['한국인의밥상'] },
  { ingredient:'고등어',    category:'fish',     region:'seoul',     district:'노량진',        months:[9,10,11,12],         health:'오메가3·EPA·DHA, 혈행·뇌건강',            tvPrograms:['수요미식회'] },
  { ingredient:'사과',      category:'fruit',    region:'seoul',     district:'가락시장',      months:[10,11],              health:'폴리페놀·펙틴, 장건강·항산화',             tvPrograms:['생활의달인'] },
  { ingredient:'배',        category:'fruit',    region:'seoul',     district:'가락시장',      months:[9,10,11],            health:'루테올린·식이섬유, 기침완화·소화',         tvPrograms:['VJ특공대'] },
  { ingredient:'대구(생선)',category:'fish',     region:'seoul',     district:'노량진',        months:[12,1,2],             health:'고단백·저지방, 다이어트·근육유지',         tvPrograms:['생활의달인'] },
  { ingredient:'초당옥수수',category:'grain',    region:'seoul',     district:'가락시장',      months:[5,6,7,8],            health:'루테인·식이섬유, 눈건강·장건강',           tvPrograms:['생활의달인','VJ특공대'] },
  { ingredient:'감자',      category:'grain',    region:'seoul',     district:'경동시장',      months:[6,7],                health:'비타민C·칼륨, 포만감·혈압안정',            tvPrograms:['생활의달인'] },
  { ingredient:'오이',      category:'veg',      region:'seoul',     district:'가락시장',      months:[5,6,7,8],            health:'쿠쿠르비타신·수분, 해열·피부미용',         tvPrograms:['생활의달인'] },
  { ingredient:'포도',      category:'fruit',    region:'seoul',     district:'가락시장',      months:[8,9,10],             health:'레스베라트롤·안토시아닌, 항산화·심장',     tvPrograms:['생활의달인'] },
]

// ── 유틸 함수 ─────────────────────────────────────────────

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

export function getFoodsByCategory(category) {
  return SEASONAL_FOODS_SEED.filter(f => f.category === category)
}

export function searchFoods(query) {
  const q = query.toLowerCase()
  return SEASONAL_FOODS_SEED.filter(f =>
    f.ingredient.includes(q) ||
    f.district.includes(q) ||
    f.health.includes(q) ||
    (f.tvPrograms && f.tvPrograms.some(t => t.includes(q)))
  )
}

// 중복 제거 식재료 목록
export function getAllIngredients() {
  return [...new Set(SEASONAL_FOODS_SEED.map(f => f.ingredient))].sort()
}

export const TV_PROGRAMS = [...new Set(SEASONAL_FOODS_SEED.flatMap(f => f.tvPrograms || []))]

export const CATEGORIES = [
  { id: 'fish',           label: '생선',       emoji: '🐟', color: '#0ea5e9', group: '수산물' },
  { id: 'crustacean',     label: '갑각류',     emoji: '🦞', color: '#0284c7', group: '수산물' },
  { id: 'shellfish',      label: '조개·패류',  emoji: '🦪', color: '#0369a1', group: '수산물' },
  { id: 'seaweed',        label: '해조류',     emoji: '🌿', color: '#0891b2', group: '수산물' },
  { id: 'other_seafood',  label: '기타수산',   emoji: '🐙', color: '#06b6d4', group: '수산물' },
  { id: 'veg',            label: '잎채소',     emoji: '🥬', color: '#22c55e', group: '채소·나물' },
  { id: 'root_veg',       label: '뿌리채소',   emoji: '🥕', color: '#16a34a', group: '채소·나물' },
  { id: 'fruit_veg',      label: '열매채소',   emoji: '🍆', color: '#15803d', group: '채소·나물' },
  { id: 'herb_veg',       label: '나물·산채',  emoji: '🌱', color: '#166534', group: '채소·나물' },
  { id: 'fruit',          label: '국내과일',   emoji: '🍎', color: '#f97316', group: '과일' },
  { id: 'tropical_fruit', label: '열대과일',   emoji: '🍌', color: '#ea580c', group: '과일' },
  { id: 'berry',          label: '베리류',     emoji: '🍓', color: '#dc2626', group: '과일' },
  { id: 'grain',          label: '곡물·잡곡',  emoji: '🌾', color: '#eab308', group: '곡물·가공' },
  { id: 'processed',      label: '가공식품',   emoji: '🏭', color: '#ca8a04', group: '곡물·가공' },
  { id: 'beef',           label: '소고기',     emoji: '🥩', color: '#ef4444', group: '육류' },
  { id: 'pork',           label: '돼지고기',   emoji: '🐷', color: '#f43f5e', group: '육류' },
  { id: 'chicken',        label: '닭고기',     emoji: '🐔', color: '#fb7185', group: '육류' },
  { id: 'egg',            label: '달걀',       emoji: '🥚', color: '#fbbf24', group: '육류' },
  { id: 'processed_meat', label: '가공육',     emoji: '🌭', color: '#e11d48', group: '육류' },
  { id: 'meat',           label: '기타육류',   emoji: '🍖', color: '#be185d', group: '육류' },
  { id: 'mushroom',       label: '버섯',       emoji: '🍄', color: '#a855f7', group: '버섯·산채' },
  { id: 'wild_herb',      label: '산채·약초',  emoji: '🌿', color: '#7c3aed', group: '버섯·산채' },
]

// 그룹별 CATEGORIES 묶음 (탭 UI에서 그룹 헤더 표시용)
export const CATEGORY_GROUPS = [
  { label: '수산물',    ids: ['fish','crustacean','shellfish','seaweed','other_seafood'] },
  { label: '채소·나물', ids: ['veg','root_veg','fruit_veg','herb_veg'] },
  { label: '과일',      ids: ['fruit','tropical_fruit','berry'] },
  { label: '곡물·가공', ids: ['grain','processed'] },
  { label: '육류',      ids: ['beef','pork','chicken','egg','processed_meat','meat'] },
  { label: '버섯·산채', ids: ['mushroom','wild_herb'] },
]

// 구 category 값(fish/veg/fruit/grain/meat/mushroom)을 새 세분화 값으로 폴백 매핑
// DB 업데이트 전 레거시 시드 데이터와 호환성 유지용
export const CATEGORY_LEGACY_MAP = {
  fish: 'fish',
  veg: 'veg',
  fruit: 'fruit',
  grain: 'grain',
  meat: 'meat',
  mushroom: 'mushroom',
}
