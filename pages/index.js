import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { REGIONS } from '../lib/regions'
import { SEASONS, getCurrentSeason, getSeasonByMonth } from '../lib/seasons'
import { getFoodsByMonth } from '../lib/seasonalFoods'

export default function Home() {
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth() + 1)
  const [activeRegion, setActiveRegion] = useState(null)

  const currentSeason = getCurrentSeason()
  const monthFoods = getFoodsByMonth(activeMonth)
  const filteredFoods = activeRegion ? monthFoods.filter(f => f.region === activeRegion) : monthFoods

  return (
    <>
      <Head>
        <title>Fresh Season — 지역별 제철 먹거리 &amp; TV 레시피</title>
        <meta name="description" content="전국 17개 지역별 제철 식재료, 건강 효능, TV 방영 레시피를 한 곳에서 만나보세요. 지금 제철인 식재료를 확인하고 건강한 밥상을 차려보세요." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Fresh Season — 지역별 제철 먹거리 &amp; TV 레시피" />
        <meta property="og:description" content="전국 17개 지역별 제철 식재료, 건강 효능, TV 방영 레시피를 한 곳에서 만나보세요. 지금 제철인 식재료를 확인하고 건강한 밥상을 차려보세요." />
        <meta property="og:image" content="https://www.fsfood.kr/og-image.png" />
        <meta property="og:url" content="https://www.fsfood.kr/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Fresh Season" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Fresh Season — 지역별 제철 먹거리 &amp; TV 레시피" />
        <meta name="twitter:description" content="전국 17개 지역별 제철 식재료, 건강 효능, TV 방영 레시피를 한 곳에서 만나보세요. 지금 제철인 식재료를 확인하고 건강한 밥상을 차려보세요." />
        <meta name="twitter:image" content="https://www.fsfood.kr/og-image.png" />
        <link rel="canonical" href="https://www.fsfood.kr/" />
      </Head>
      <Header />
      <main className="wrap">

        {/* 히어로 */}
        <section className="hero">
          <div className="hero-badge">
            {currentSeason.icon} 지금은 {currentSeason.name}철 — {currentSeason.desc}
          </div>
          <h1 className="hero-title">
            지역에서 나고<br />
            <span style={{ color: 'var(--accent)' }}>제철에 먹는</span> 건강한 밥상
          </h1>
          <p className="hero-sub">전국 제철 식재료 × 건강 효능 × TV 방영 레시피</p>
        </section>

        {/* 월 선택 */}
        <section style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10, fontWeight: 700 }}>📅 월별 제철 보기</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
              const s = getSeasonByMonth(m)
              const on = m === activeMonth
              return (
                <button key={m} onClick={() => setActiveMonth(m)} className="month-pill"
                  style={{
                    borderColor: on ? s.color : undefined,
                    background: on ? `${s.color}22` : undefined,
                    color: on ? s.color : undefined,
                    fontWeight: on ? 700 : undefined,
                  }}>
                  {m}월
                </button>
              )
            })}
          </div>
        </section>

        {/* 지역 필터 */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10, fontWeight: 700 }}>🗺 지역 필터</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setActiveRegion(null)} className="month-pill"
              style={{ borderColor: !activeRegion ? '#888' : undefined, color: !activeRegion ? 'var(--text)' : undefined, fontWeight: 600 }}>
              전체
            </button>
            {REGIONS.map(r => {
              const on = activeRegion === r.id
              return (
                <button key={r.id} onClick={() => setActiveRegion(on ? null : r.id)} className="month-pill"
                  style={{ borderColor: on ? r.color : undefined, background: on ? `${r.color}22` : undefined, color: on ? r.color : undefined, fontWeight: 600 }}>
                  {r.icon} {r.name}
                </button>
              )
            })}
          </div>
        </section>

        {/* 이달의 제철 재료 */}
        <section style={{ marginBottom: 52 }}>
          <h2 className="section-title">
            {activeMonth}월 제철 재료
            <span>{filteredFoods.length}가지</span>
          </h2>
          {filteredFoods.length === 0
            ? <p style={{ color: 'var(--text2)', fontSize: 14 }}>해당 조건의 제철 재료가 없어요.</p>
            : (
              <div className="grid-auto">
                {filteredFoods.map((food, i) => {
                  const region = REGIONS.find(r => r.id === food.region)
                  return (
                    <Link key={i} href={`/ingredient/${encodeURIComponent(food.ingredient)}`} className="card"
                      onMouseEnter={e => e.currentTarget.style.borderColor = region?.color}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <span style={{ fontSize: 20, fontWeight: 900 }}>{food.ingredient}</span>
                        {region && (
                          <span className="badge" style={{ background: `${region.color}22`, color: region.color, border: `1px solid ${region.color}44` }}>
                            {region.icon} {region.name}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 10 }}>
                        💚 {food.health}
                      </p>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {food.tvPrograms.map(tv => (
                          <span key={tv} className="tag">📺 {tv}</span>
                        ))}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
        </section>

        {/* 지역 카드 */}
        <section style={{ marginBottom: 64 }}>
          <h2 className="section-title">지역별 제철 탐색</h2>
          <div className="grid-regions">
            {REGIONS.map(r => (
              <Link key={r.id} href={`/region/${r.id}`} className="card"
                onMouseEnter={e => e.currentTarget.style.borderColor = r.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 14,
                  background: `${r.color}22`, border: `1.5px solid ${r.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>{r.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{r.name}</div>
                <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{r.desc}</p>
              </Link>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
