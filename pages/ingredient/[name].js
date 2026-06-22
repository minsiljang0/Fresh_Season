import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { REGIONS } from '../../lib/regions'
import { SEASONAL_FOODS_SEED } from '../../lib/seasonalFoods'

export async function getStaticPaths() {
  const names = [...new Set(SEASONAL_FOODS_SEED.map(f => f.ingredient))]
  return { paths: names.map(n => ({ params: { name: encodeURIComponent(n) } })), fallback: false }
}
export async function getStaticProps({ params }) {
  return { props: { ingredientName: decodeURIComponent(params.name) } }
}

export default function IngredientPage({ ingredientName }) {
  const food = SEASONAL_FOODS_SEED.find(f => f.ingredient === ingredientName)
  const region = food ? REGIONS.find(r => r.id === food.region) : null
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!food) { setLoading(false); return }
    fetch(`/api/blog/posts?category=${food.region}&limit=6`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        setPosts(arr.filter(p => p.title?.includes(ingredientName) || p.content?.includes(ingredientName)))
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [ingredientName])

  if (!food) return <p style={{ padding: 40 }}>재료를 찾을 수 없어요.</p>

  const MONTHS = ['','1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

  return (
    <>
      <Head>
        <title>{ingredientName} 제철 레시피 & 효능 — Fresh Season</title>
        <meta name="description" content={`${ingredientName}의 제철 시기, 건강 효능, TV 방영 레시피를 확인하세요.`} />
      </Head>
      <Header />
      <main className="wrap" style={{ maxWidth: 860 }}>
        <section className="detail-header">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 24 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900 }}>{ingredientName}</h1>
            {region && (
              <span className="badge" style={{ fontSize: 12, padding: '4px 12px', background: `${region.color}22`, color: region.color, border: `1px solid ${region.color}44` }}>
                {region.icon} {region.name} 대표 식재료
              </span>
            )}
          </div>

          {/* 제철 시기 */}
          <div className="detail-box">
            <p className="detail-label">📅 제철 시기</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                const on = food.months.includes(m)
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

          {/* TV 프로그램 */}
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
        </section>

        {/* 관련 블로그 글 */}
        <section style={{ marginBottom: 52 }}>
          <h2 className="section-title">관련 레시피 글</h2>
          {loading && <p style={{ color: 'var(--text2)', fontSize: 14 }}>불러오는 중...</p>}
          {!loading && posts.length === 0 && (
            <div className="empty-state">
              <p>아직 관련 레시피 글이 없어요.</p>
              <small>Claude MCP 자동화로 곧 발행될 예정이에요 🤖</small>
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
