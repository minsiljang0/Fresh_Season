# 제철밥상

지역별 제철 식재료 × 건강 효능 × TV 방영 레시피 블로그

Next.js + Supabase + Vercel MCP 자동화

---

## 시작하기

```bash
npm install
cp .env.example .env.local
# .env.local 값 채우기
npm run dev
```

## Supabase 초기 세팅

Supabase SQL 에디터에서 `SUPABASE_SCHEMA.sql` 전체 실행

## Claude MCP 자동화 연결

Vercel 배포 후 Claude.ai 커넥터에 MCP URL 등록:
```
https://your-domain.vercel.app/api/mcp
```

### 자동화 프롬프트 (매일 실행)
```
1. get_publish_log() 호출 → 이미 발행된 글 확인
2. get_seasonal_foods(month: 현재월) 호출 → 이달 제철 재료
3. 미발행 재료 선택
4. get_tv_recipes(ingredient) 호출 → TV 레시피 확인
5. 없으면 웹검색 후 link_recipe_to_ingredient() 등록
6. create_food_post() → 블로그 글 자동 발행
7. naver_keyword_volume() → 검색량 확인 후 pick_keyword()
```

## 환경변수

| 변수 | 설명 |
|------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 롤 키 |
| `ADMIN_SECRET_TOKEN` | 관리자 비밀번호 |
| `NAVER_ACCESS_KEY` | 네이버 검색광고 API 키 |
| `NAVER_SECRET_KEY` | 네이버 검색광고 시크릿 |
| `NAVER_CUSTOMER_ID` | 네이버 고객 ID |

## 페이지 구조

| URL | 설명 |
|-----|------|
| `/` | 메인: 월별 제철 재료 + 지역 카드 |
| `/region/[slug]` | 지역별 제철 재료 목록 |
| `/ingredient/[name]` | 재료 상세: 효능 + TV 레시피 |
| `/blog` | 블로그 글 목록 |
| `/blog/[slug]` | 블로그 글 상세 |
| `/admin` | 관리자 패널 |

## 지역 코드

| ID | 이름 |
|----|------|
| `gangwon` | 강원도 |
| `jeju` | 제주도 |
| `jeonla` | 전라도 |
| `gyeongsan` | 경상도 |
| `chungcheong` | 충청도 |
| `gyeonggi` | 경기·수도권 |
