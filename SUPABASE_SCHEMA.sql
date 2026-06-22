-- ============================================================
-- Fresh Season Supabase 스키마
-- ============================================================

create table if not exists blog_posts (
  id text primary key,
  title text not null,
  slug text not null unique,
  content text not null,
  category text default '',   -- 17개 시도 id
  status text not null default 'published',
  post_type text not null default 'blog',
  published_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists publish_log (
  id text primary key,
  title text not null,
  slug text not null,
  category text default '',
  memo text default '',
  published_at timestamptz not null default now()
);

create table if not exists keyword_picks (
  id text primary key,
  keyword text not null,
  hint text default '',
  memo text default '',
  used_at timestamptz,
  used_in_title text,
  used_in_slug text,
  created_at timestamptz not null default now()
);

create table if not exists keyword_stats (
  id text primary key,
  hint text not null,
  keyword text not null,
  pc integer default 0,
  mobile integer default 0,
  total integer default 0,
  competition text default '',
  created_at timestamptz not null default now(),
  unique(hint, keyword)
);

-- 제철 식재료 (17개 시도 기준)
create table if not exists seasonal_foods (
  id text primary key,
  ingredient text not null,
  region text not null,   -- 17개 시도 id
  district text default '', -- 세부 시군구 (선택)
  months integer[] not null,
  health text not null,
  created_at timestamptz default now()
);

create table if not exists tv_recipes (
  id text primary key,
  ingredient text not null,
  program text not null,
  episode text default '',
  title text not null,
  summary text default '',
  source_url text,
  created_at timestamptz default now()
);

create table if not exists recipe_ingredient_map (
  id text primary key,
  recipe_id text references tv_recipes(id) on delete cascade,
  ingredient text not null,
  region text,
  created_at timestamptz default now()
);

-- ============================================================
-- 시드 데이터 (17개 시도 기준)
-- ============================================================
insert into seasonal_foods (id, ingredient, region, district, months, health) values
  -- 강원
  (gen_random_uuid()::text, '오징어',  'gangwon', '속초시·강릉시', '{7,8,9,10}',  '타우린·DHA 풍부, 눈건강·피로회복'),
  (gen_random_uuid()::text, '도루묵',  'gangwon', '속초시',        '{11,12}',     'EPA·불포화지방산, 혈행개선'),
  (gen_random_uuid()::text, '곰취',    'gangwon', '평창군·정선군', '{4,5}',       '쿠마린 성분, 항산화·혈압조절'),
  (gen_random_uuid()::text, '감자',    'gangwon', '강원도 전역',   '{6,7}',       '비타민C·칼륨, 포만감·혈압안정'),
  (gen_random_uuid()::text, '황태',    'gangwon', '인제군·평창군', '{1,2,3}',     '메티오닌 풍부, 간 해독·숙취해소'),
  -- 제주
  (gen_random_uuid()::text, '감귤',    'jeju',    '서귀포시',      '{10,11,12,1}','비타민C·헤스페리딘, 면역·피부미용'),
  (gen_random_uuid()::text, '흑돼지',  'jeju',    '제주시·서귀포시','{1,2,3,4,5,6,7,8,9,10,11,12}','올레산·비타민B1, 피부탄력·근육생성'),
  (gen_random_uuid()::text, '전복',    'jeju',    '서귀포시',      '{9,10,11,12,1}','아르기닌·글리신, 간기능·원기회복'),
  (gen_random_uuid()::text, '옥돔',    'jeju',    '제주시',        '{10,11,12,1,2}','고단백·저지방, 소화흡수 우수'),
  (gen_random_uuid()::text, '한라봉',  'jeju',    '서귀포시',      '{1,2,3}',     '비타민C·식이섬유, 변비예방·피로회복'),
  -- 전남
  (gen_random_uuid()::text, '낙지',    'jeonnam', '무안군·목포시', '{9,10,11}',   '타우린·철분, 빈혈예방·스태미나'),
  (gen_random_uuid()::text, '김',      'jeonnam', '완도군·신안군', '{11,12,1,2}', '철분·요오드·칼슘, 빈혈예방·갑상선'),
  (gen_random_uuid()::text, '굴비',    'jeonnam', '영광군',        '{3,4,5,6}',   '단백질·칼슘 풍부, 뼈건강·성장발육'),
  (gen_random_uuid()::text, '홍어',    'jeonnam', '흑산도·목포시', '{11,12,1,2}', '콜라겐·타우린, 피부·간기능'),
  (gen_random_uuid()::text, '전복',    'jeonnam', '완도군',        '{9,10,11,12,1}','아르기닌·글리신, 간기능·원기회복'),
  -- 전북
  (gen_random_uuid()::text, '딸기',    'jeonbuk', '논산시·익산시', '{3,4,5}',     '비타민C·안토시아닌, 항산화·피부'),
  (gen_random_uuid()::text, '게장',    'jeonbuk', '부안군·고창군', '{3,4,5}',     '타우린·키토산, 간기능·콜레스테롤'),
  -- 경북
  (gen_random_uuid()::text, '과메기',  'gyeongbuk','포항시',       '{11,12,1,2}', '오메가3·EPA·DHA, 혈행개선·뇌건강'),
  (gen_random_uuid()::text, '대구(생선)','gyeongbuk','포항시·영덕군','{12,1,2,3}','고단백·저지방, 다이어트·근육유지'),
  (gen_random_uuid()::text, '사과',    'gyeongbuk','청송군·안동시','{9,10,11}',   '폴리페놀·펙틴, 장건강·항산화'),
  (gen_random_uuid()::text, '한우',    'gyeongbuk','안동시·영주시','{1,2,3,4,5,6,7,8,9,10,11,12}','헴철·아연·단백질, 근육·면역강화'),
  -- 경남
  (gen_random_uuid()::text, '전어',    'gyeongnam','통영시·여수시','{9,10}',      '칼슘·불포화지방산, 뼈건강·혈행'),
  (gen_random_uuid()::text, '굴',      'gyeongnam','통영시',        '{10,11,12,1,2}','아연·철분·타우린, 면역·빈혈예방'),
  (gen_random_uuid()::text, '멸치',    'gyeongnam','남해군·통영시','{4,5,6}',     '칼슘·DHA, 뼈건강·두뇌발달'),
  -- 충남
  (gen_random_uuid()::text, '대하',    'chungnam','태안군·보령시', '{9,10}',      '타우린·아스타잔틴, 간기능·항산화'),
  (gen_random_uuid()::text, '인삼',    'chungnam','금산군',         '{9,10,11}',   '사포닌·진세노사이드, 면역·항피로'),
  -- 경기
  (gen_random_uuid()::text, '쌀',      'gyeonggi','이천시·여주시', '{10,11}',     '비타민B군·식이섬유, 에너지·장건강'),
  (gen_random_uuid()::text, '배',      'gyeonggi','나주시·안성시', '{9,10,11}',   '루테올린·식이섬유, 기침완화·소화'),
  (gen_random_uuid()::text, '포도',    'gyeonggi','안성시·화성시', '{8,9,10}',    '레스베라트롤·안토시아닌, 항산화·심장'),
  -- 인천
  (gen_random_uuid()::text, '꽃게',    'incheon', '강화군·옹진군', '{4,5,9,10}',  '키토산·타우린, 콜레스테롤·간기능'),
  -- 부산
  (gen_random_uuid()::text, '고등어',  'busan',   '부산공동어시장','{9,10,11,12}','오메가3·EPA·DHA, 혈행·뇌건강'),
  (gen_random_uuid()::text, '대게',    'busan',   '기장군',         '{11,12,1,2,3}','단백질·아연·칼슘, 뼈건강·면역')
on conflict do nothing;
