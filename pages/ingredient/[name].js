// (상단 import 및 getStaticPaths, getStaticProps 생략 - 기존 유지)
export default function IngredientPage({ ingredientName }) {
  const food = SEASONAL_FOODS_SEED.find(f => f.ingredient === ingredientName)
  const region = food ? REGIONS.find(r => r.id === food.region) : null
  // ... 생략 ...

  if (!food) return <p style={{ padding: 40 }}>재료를 찾을 수 없어요.</p>

  return (
    <>
      <Head>
        <title>{ingredientName} 제철 레시피 & 효능 — Fresh Season</title>
        <meta name="description" content={`${ingredientName}의 제철 시기, 건강 효능, TV 방영 레시피를 확인하세요.`} />
        <meta property="og:title" content={`${ingredientName} 제철 레시피 & 효능 — Fresh Season`} />
        <meta property="og:description" content={`${ingredientName}의 제철 시기, 건강 효능, TV 방영 레시피를 확인하세요.`} />
        
        <meta property="og:image" content="https://www.fsfood.kr/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        <meta property="og:url" content={`https://www.fsfood.kr/ingredient/${encodeURIComponent(ingredientName)}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Fresh Season" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${ingredientName} 제철 레시피 & 효능 — Fresh Season`} />
        <meta name="twitter:description" content={`${ingredientName}의 제철 시기, 건강 효능, TV 방영 레시피를 확인하세요.`} />
        <meta name="twitter:image" content="https://www.fsfood.kr/og-image.png" />
      </Head>
      <Header />
      {/* (이하 렌더링 코드 본문 생략 - 기존 코드 유지) */}