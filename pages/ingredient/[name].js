import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { REGIONS } from '../../lib/regions'
import { SEASONAL_FOODS_SEED } from '../../lib/seasonalFoods'
import { AdSlot } from '../../components/AdSlot'
import { useAdSlot } from '../../lib/AdSlotsContext'
import { resolveCoupangDisplay } from '../../lib/coupang'

// getStaticPaths — 빌드 시 DB에서 전체 식재료 이름 가져와 정적 경로 생성
export async function getStaticPaths() {
  let names = []
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data } = await sb.from('ingredients').select('name')
    if (data) names = [...new Set(data.map(r => r.name))]
  } catch {
    // DB 실패 시 SEED 폴백
    names = [...new Set(SEASONAL_FOODS_SEED.map(f => f.ingredient))]
  }
  return {
    paths: names.map(n => ({ params: { name: encodeURIComponent(n) } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  return {
    props: { ingredientName: decodeURIComponent(params.name) },
  }
}

export default function IngredientPage({ ingredientName }) {
  const [food, setFood] = useState(null)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])
  const middleSlot = useAdSlot('home_middle')
  const [coupangLinks, setCoupangLinks] = useState([])
  const [coupangWidgets, setCoupangWidgets] = useState([])

  // 쿠팡 파트너스 링크/위젯 목록 로드 — 재료별 개별 링크가 없을 때 대체 노출용
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/coupang-links').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/admin/coupang-widgets').then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([links, widgets]) => {
      setCoupangLinks(Array.isArray(links) ? links : [])
      setCoupangWidgets(Array.isArray(widgets) ? widgets : [])
    })
  }, [])

  // DB에서만 데이터 로드 — SEED 폴백 없음
  useEffect(() => {
    fetch('/api/map/seasonal-foods')
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        const foods = Array.isArray(data) ? data : (data.foods || [])
        const found = foods.find(f => f.ingredient === ingredientName)
        setFood(found || null)
      })
      .catch(() => setFood(null))
      .finally(() => setLoading(false))
  }, [ingredientName])

  // 블로그 글 로드
  useEffect(() => {
    if (!food) return
    fetch(`/api/blog/posts?category=${food.region}&limit=6`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        setPosts(arr.filter(p => p.title?.includes(ingredientName) || p.content?.includes(ingredientName)))
      })
      .catch(() => setPosts([]))
  }, [food, ingredientName])

  const region = food ? REGIONS.find(r => r.id === food.region) : null
  const MONTHS = ['','1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

  if (loading) return (
    <>
      <Header />
      <main className="wrap" style={{ maxWidth: 860, padding: '32px 16px' }}>
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'linear-gradient(90deg,var(--border) 25%,var(--surface2) 50%,var(--border) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', borderRadius:8, height:36, width:'40%' }} />
          <div style={{ background:'linear-gradient(90deg,var(--border) 25%,var(--surface2) 50%,var(--border) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', borderRadius:8, height:14, width:'60%' }} />
          <div style={{ display:'flex', gap:8 }}>
            {[80,60,70,50].map((w,i) => <div key={i} style={{ background:'linear-gradient(90deg,var(--border) 25%,var(--surface2) 50%,var(--border) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', borderRadius:999, height:28, width:w }} />)}
          </div>
          <div style={{ background:'linear-gradient(90deg,var(--border) 25%,var(--surface2) 50%,var(--border) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite', borderRadius:12, height:120 }} />
        </div>
      </main>
      <Footer />
    </>
  )

  if (!food) return (
    <>
      <Header />
      <main className="wrap" style={{ maxWidth: 860 }}>
        <p style={{ padding: 40 }}>재료를 찾을 수 없어요.</p>
        <Link href="/" className="back-link">← 홈으로</Link>
      </main>
      <Footer />
    </>
  )

  return (
    <>
      <Head>
        <title>{ingredientName} 제철 레시피 & 효능 — Fresh Season</title>
        <meta name="description" content={`${ingredientName}의 제철 시기와 건강 효능, TV 방영 레시피를 확인하세요. 신선한 제철 식재료로 만드는 건강한 요리법을 알아보세요.`} />
        <meta property="og:title" content={`${ingredientName} 제철 레시피 & 효능 — Fresh Season`} />
        <meta property="og:description" content={`${ingredientName}의 제철 시기와 건강 효능, TV 방영 레시피를 확인하세요. 신선한 제철 식재료로 만드는 건강한 요리법을 알아보세요.`} />
        <meta property="og:image" content="https://www.fsfood.kr/og-image.png" />
        <meta property="og:url" content={`https://www.fsfood.kr/ingredient/${encodeURIComponent(ingredientName)}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Fresh Season" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${ingredientName} 제철 레시피 & 효능 — Fresh Season`} />
        <meta name="twitter:description" content={`${ingredientName}의 제철 시기와 건강 효능, TV 방영 레시피를 확인하세요. 신선한 제철 식재료로 만드는 건강한 요리법을 알아보세요.`} />
        <meta name="twitter:image" content="https://www.fsfood.kr/og-image.png" />
        <link rel="canonical" href={`https://www.fsfood.kr/ingredient/${encodeURIComponent(ingredientName)}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Fresh Season', item: 'https://www.fsfood.kr/' },
                { '@type': 'ListItem', position: 2, name: '제철지도', item: 'https://www.fsfood.kr/map' },
                { '@type': 'ListItem', position: 3, name: ingredientName, item: `https://www.fsfood.kr/ingredient/${encodeURIComponent(ingredientName)}` },
              ],
            }),
          }}
        />
      </Head>
      <Header />
      <main className="wrap" style={{ maxWidth: 860 }}>
        {/* 전체 페이지 중단 배너 */}
        <div className="ad-banner-slot" style={{ maxWidth: 860, padding: 0, margin: '20px auto' }}>
          <AdSlot slot="home_middle" label="중단 배너 광고" slotData={middleSlot} />
        </div>

        <section className="detail-header">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 24 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900 }}>{ingredientName}</h1>
            {region && (
              <span className="badge" style={{ fontSize: 12, padding: '4px 12px', background: `${region.color}22`, color: region.color, border: `1px solid ${region.color}44` }}>
                {region.icon} {region.name} 대표 식재료
              </span>
            )}
            {food.is_special && (
              <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: '#fef3c7', border: '1px solid #f59e0b', color: '#b45309', fontWeight: 700 }}>
                🏆 특산품
              </span>
            )}
            {food.is_limited && food.limited_days && (
              <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: '#d1fae5', border: '1px solid #10b981', color: '#059669', fontWeight: 700 }}>
                ⏰ {food.limited_days}간 한정
              </span>
            )}
          </div>

          {/* 제철 시기 */}
          <div className="detail-box">
            <p className="detail-label">📅 제철 시기</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                const on = (food.months || []).includes(m)
                return (
                  <span key={m} style={{
                    padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: on ? `${region?.color || '#888'}22` : 'var(--surface2)',
                    color: on ? (region?.color || '#888') : 'var(--text3)',
                    border: `1.5px solid ${on ? (region?.color || '#888') + '66' : 'var(--border)'}`,
                  }}>{MONTHS[m]}</span>
                )
              })}
            </div>
          </div>

          {/* 건강 효능 */}
          <div style={{ background: '#22c55e0d', border: '1px solid #22c55e33', borderRadius: 12, padding: 20, marginBottom: 14 }}>
            <p className="detail-label" style={{ color: '#16a34a' }}>💚 건강 효능</p>
            <p style={{ fontSize: 14, lineHeight: 1.7 }}>{food.health}</p>
          </div>

          {/* 쿠팡에서 구매하기 */}
          {(() => {
            const cp = resolveCoupangDisplay(coupangLinks, coupangWidgets, food)
            if (cp.links.length === 0 && cp.widgets.length === 0) return null
            return (
              <div className="detail-box">
                <p className="detail-label">🛒 {ingredientName} 구매하기</p>
                {cp.links.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {cp.links.map((l, i) => (
                      <a key={i} href={l.url} target="_blank" rel="noopener noreferrer sponsored"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontSize: 13, fontWeight: 700, color: '#fff',
                          background: '#ea580c', borderRadius: 10, padding: '9px 16px',
                          textDecoration: 'none',
                        }}>
                        🛒 {l.label}
                      </a>
                    ))}
                  </div>
                )}
                {cp.widgets.map((html, i) => (
                  <div key={i} style={{ marginTop: 8 }} dangerouslySetInnerHTML={{ __html: html }} />
                ))}
                <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 8 }}>
                  이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.
                </p>
              </div>
            )
          })()}

          {/* 주의사항 */}
          {food.caution && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: 20, marginBottom: 14 }}>
              <p className="detail-label" style={{ color: '#c2410c' }}>⚠️ 주의사항</p>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#9a3412' }}>{food.caution}</p>
            </div>
          )}

          {/* TV 프로그램 */}
          {(food.tvPrograms || []).length > 0 && (
            <div className="detail-box">
              <p className="detail-label">📺 방영 TV 프로그램</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {food.tvPrograms.map(tv => (
                  <Link key={tv} href={`/blog?q=${encodeURIComponent(tv)}`}
                    style={{
                      padding: '8px 16px', borderRadius: 10,
                      background: 'var(--surface2)', color: 'var(--text2)',
                      border: '1.5px solid var(--border)',
                      fontSize: 13, fontWeight: 600, textDecoration: 'none',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = region?.color || '#888'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    {tv} 레시피 →
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 관련 블로그 글 */}
        <section style={{ marginBottom: 52 }}>
          <h2 className="section-title">관련 레시피 글</h2>
          {posts.length === 0 && (
            <div className="empty-state">
              <p>아직 관련 레시피 글이 없어요.</p>
            </div>
          )}
          {posts.length > 0 && (
            <div style={{ display: 'grid', gap: 10 }}>
              {posts.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="card"
                  onMouseEnter={e => e.currentTarget.style.borderColor = region?.color || '#888'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{post.title}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                    {post.content?.replace(/<[^>]+>/g, '').slice(0, 80)}...
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <Link href="/" className="back-link">← 홈으로</Link>
      </main>
      <Footer />
    </>
  )
}
