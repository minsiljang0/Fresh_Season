-- ============================================================
-- 제철밥상 Supabase 스키마
-- Supabase SQL 에디터에서 전체 실행
-- ============================================================

-- 1. 블로그 글
create table if not exists blog_posts (
  id text primary key,
  title text not null,
  slug text not null unique,
  content text not null,
  category text default '',
  status text not null default 'published',  -- published | draft | scheduled
  post_type text not null default 'blog',
  published_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

-- 2. 발행 기록
create table if not exists publish_log (
  id text primary key,
  title text not null,
  slug text not null,
  category text default '',
  memo text default '',
  published_at timestamptz not null default now()
);

-- 3. 키워드 찜
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

-- 4. 키워드 검색량 통계
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

-- 5. 제철 식재료
create table if not exists seasonal_foods (
  id text primary key,
  ingredient text not null,
  region text not null,   -- gangwon | jeju | jeonla | gyeongsan | chungcheong | gyeonggi
  months integer[] not null,
  health text not null,
  created_at timestamptz default now()
);

-- 6. TV 레시피
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

-- 7. 레시피↔재료 매핑
create table if not exists recipe_ingredient_map (
  id text primary key,
  recipe_id text references tv_recipes(id) on delete cascade,
  ingredient text not null,
  region text,
  created_at timestamptz default now()
);

-- ============================================================
-- 제철 식재료 시드 데이터
-- ============================================================
insert into seasonal_foods (id, ingredient, region, months, health) values
  (gen_random_uuid()::text, '오징어',  'gangwon',     '{7,8,9,10}',                   '타우린·DHA 풍부, 눈건강·피로회복'),
  (gen_random_uuid()::text, '도루묵',  'gangwon',     '{11,12}',                      'EPA·불포화지방산, 혈행개선'),
  (gen_random_uuid()::text, '곰취',    'gangwon',     '{4,5}',                        '쿠마린 성분, 항산화·혈압조절'),
  (gen_random_uuid()::text, '감자',    'gangwon',     '{6,7}',                        '비타민C·칼륨, 포만감·혈압안정'),
  (gen_random_uuid()::text, '황태',    'gangwon',     '{1,2,3}',                      '메티오닌 풍부, 간 해독·숙취해소'),
  (gen_random_uuid()::text, '감귤',    'jeju',        '{10,11,12,1}',                 '비타민C·헤스페리딘, 면역·피부미용'),
  (gen_random_uuid()::text, '흑돼지',  'jeju',        '{1,2,3,4,5,6,7,8,9,10,11,12}','올레산·비타민B1, 피부탄력·근육생성'),
  (gen_random_uuid()::text, '전복',    'jeju',        '{9,10,11,12,1}',               '아르기닌·글리신, 간기능·원기회복'),
  (gen_random_uuid()::text, '옥돔',    'jeju',        '{10,11,12,1,2}',               '고단백·저지방, 소화흡수 우수'),
  (gen_random_uuid()::text, '한라봉',  'jeju',        '{1,2,3}',                      '비타민C·식이섬유, 변비예방·피로회복'),
  (gen_random_uuid()::text, '낙지',    'jeonla',      '{9,10,11}',                    '타우린·철분, 빈혈예방·스태미나'),
  (gen_random_uuid()::text, '김',      'jeonla',      '{11,12,1,2}',                  '철분·요오드·칼슘, 빈혈예방·갑상선'),
  (gen_random_uuid()::text, '굴비',    'jeonla',      '{3,4,5,6}',                    '단백질·칼슘 풍부, 뼈건강·성장발육'),
  (gen_random_uuid()::text, '홍어',    'jeonla',      '{11,12,1,2}',                  '콜라겐·타우린, 피부·간기능'),
  (gen_random_uuid()::text, '딸기',    'jeonla',      '{3,4,5}',                      '비타민C·안토시아닌, 항산화·피부'),
  (gen_random_uuid()::text, '과메기',  'gyeongsan',   '{11,12,1,2}',                  '오메가3·EPA·DHA, 혈행개선·뇌건강'),
  (gen_random_uuid()::text, '대구',    'gyeongsan',   '{12,1,2,3}',                   '고단백·저지방, 다이어트·근육유지'),
  (gen_random_uuid()::text, '사과',    'gyeongsan',   '{9,10,11}',                    '폴리페놀·펙틴, 장건강·항산화'),
  (gen_random_uuid()::text, '한우',    'gyeongsan',   '{1,2,3,4,5,6,7,8,9,10,11,12}','헴철·아연·단백질, 근육·면역강화'),
  (gen_random_uuid()::text, '전어',    'gyeongsan',   '{9,10}',                       '칼슘·불포화지방산, 뼈건강·혈행'),
  (gen_random_uuid()::text, '인삼',    'chungcheong', '{9,10,11}',                    '사포닌·진세노사이드, 면역·항피로'),
  (gen_random_uuid()::text, '게장',    'chungcheong', '{3,4,5}',                      '타우린·키토산, 간기능·콜레스테롤'),
  (gen_random_uuid()::text, '복숭아',  'chungcheong', '{7,8}',                        '베타카로틴·비타민C, 피부미용·항산화'),
  (gen_random_uuid()::text, '오리',    'chungcheong', '{1,2,3,4,5,6,7,8,9,10,11,12}','불포화지방산·비타민B, 피부·혈관건강'),
  (gen_random_uuid()::text, '쌀',      'gyeonggi',    '{10,11}',                      '비타민B군·식이섬유, 에너지·장건강'),
  (gen_random_uuid()::text, '배',      'gyeonggi',    '{9,10,11}',                    '루테올린·식이섬유, 기침완화·소화'),
  (gen_random_uuid()::text, '포도',    'gyeonggi',    '{8,9,10}',                     '레스베라트롤·안토시아닌, 항산화·심장')
on conflict do nothing;
