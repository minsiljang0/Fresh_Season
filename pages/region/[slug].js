// (상단 import 및 데이터 패칭 생략 - 기존 유지)
export default function RegionPage({ regionId }) {
  const region = getRegion(regionId)
  const allFoods = getFoodsByRegion(regionId)
  // ... 생략 ...

  if (!region) return null

  return (
    <>
      <Head>
        <title>{region.name} 제철 먹거리 — Fresh Season</title>
        <meta name="description" content={`${region.name}의 제철 식재료, 건강 효능, TV 레시피를 확인하세요.`} />
        <meta property="og:title" content={`${region.name} 제철 먹거리 — Fresh Season`} />
        <meta property="og:description" content={`${region.name}의 제철 식재료, 건강 효능, TV 레시피를 확인하세요.`} />
        
        <meta property="og:image" content="https://www.fsfood.kr/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        <meta property="og:url" content={`https://www.fsfood.kr/region/${regionId}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Fresh Season" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${region.name} 제철 먹거리 — Fresh Season`} />
        <meta name="twitter:description" content={`${region.name}의 제철 식재료, 건강 효능, TV 레시피를 확인하세요.`} />
        <meta name="twitter:image" content="https://www.fsfood.kr/og-image.png" />
      </Head>
      <Header />
      {/* (이하 렌더링 코드 본문 생략 - 기존 코드 유지) */}