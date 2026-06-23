import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { REGIONS, getRegion } from '../../lib/regions'
import { SEASONS } from '../../lib/seasons'
import { getFoodsByRegion } from '../../lib/seasonalFoods'

export async function getStaticPaths() {
  return { paths: REGIONS.map(r => ({ params: { slug: r.id } })), fallback: false }
}
export async function getStaticProps({ params }) {
  return { props: { regionId: params.slug } }
}

export default function RegionPage({ regionId }) {
  const region = getRegion(regionId)
  const allFoods = getFoodsByRegion(regionId)
  const [activeSeason, setActiveSeason] = useState(null)
  const [showCities, setShowCities] = useState(false)

  if (!region) return null

  const filtered = activeSeason
    ? allFoods.filter(f => {
        const s = SEASONS.find(s => s.id === activeSeason)
        return s && f.months.some(m => s.months.includes(m))
      })
    : allFoods

  return (
    <>
      <Head>
        <title>{region.name} 제철 먹거리 — Fresh Season</title>
        <meta name="description" content={`${region.name} 지역의 제철 식재료와 건강 효능, TV 방영 레시피를 확인하세요. 지역 특산물로 차리는 건강한 제철 밥상을 만나보세요.`} />
        <meta property="og:title" content={`${region.name} 제철 먹거리 — Fresh Season`} />
        <meta property="og:description" content={`${region.name} 지역의 제철 식재료와 건강 효능, TV 방영 레시피를 확인하세요. 지역 특산물로 차리는 건강한 제철 밥상을 만나보세요.`} />
        <meta property="og:image" content="https://www.fsfood.kr/og-image.png" />
        <meta property="og:url" content={`https://www.fsfood.kr/region/${regionId}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Fresh Season" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${region.name} 제철 먹거리 — Fresh Season`} />
        <meta name="twitter:description" content={`${region.name} 지역의 제철 식재료와 건강 효능, TV 방영 레시피를 확인하세요. 지역 특산물로 차리는 건강한 제철 밥상을 만나보세요.`} />
        <meta name="twitter:image" content="https://www.fsfood.kr/og-image.png" />
        <link rel="canonical" href={`https://www.fsfood.kr/region/${regionId}`} />
      </Head>
      <Header />
      <main className="wrap">
        <section className="detail-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 58, height: 58, borderRadius: 16, fontSize: 26,
              background: `${region.color}22`, border: `2px solid ${region.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{region.icon}</div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>{region.name}</h1>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>{region.desc}</p>
            </div>
          </div>

          <button onClick={() => setShowCities(!showCities)}
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit' }}>
            {showCities ? '▲' : '▼'} 포함 시군구 ({region.districts.length}개)
          </button>
          {showCities && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
              {region.districts.map(c => <span key={c} className="tag" style={{ fontSize: 11 }}>{c}</span>)}
            </div>
          )}
        </section>

        {/* 계절 필터 */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[{ id: null, name: '전체', icon: '' }, ...SEASONS].map(s => {
              const on = activeSeason === s.id
              const color = s.id ? SEASONS.find(x => x.id === s.id)?.color : region.color
              return (
                <button key={String(s.id)} onClick={() => setActiveSeason(on && s.id ? null : s.id)} className="month-pill"
                  style={{ borderColor: on ? color : undefined, background: on ? `${color}22` : undefined, color: on ? color : undefined, fontWeight: 600 }}>
                  {s.icon} {s.name}
                </button>
              )
            })}
          </div>
        </section>

        {/* 식재료 카드 */}
        <section style={{ marginBottom: 52 }}>
          <h2 className="section-title">제철 식재료 <span>{filtered.length}가지</span></h2>
          <div className="grid-auto">
            {filtered.map((food, i) => (
              <Link key={i} href={`/ingredient/${encodeURIComponent(food.ingredient)}`} className="card"
                onMouseEnter={e => e.currentTarget.style.borderColor = region.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 19, fontWeight: 900 }}>{food.ingredient}</span>
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {food.months.slice(0, 5).map(m => (
                      <span key={m} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--text3)' }}>{m}월</span>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 10 }}>💚 {food.health}</p>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {food.tvPrograms.map(tv => <span key={tv} className="tag">📺 {tv}</span>)}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <Link href="/" className="back-link">← 전체 지역 보기</Link>
      </main>
      <Footer />
    </>
  )
}
