import { useState, useEffect } from 'react'
import Head from 'next/head'
import { SkeletonBlogList } from '../../components/SkeletonCard'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { REGIONS } from '../../lib/regions'

export default function BlogIndex() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')

  useEffect(() => {
    const url = category ? `/api/blog/posts?category=${category}` : '/api/blog/posts?limit=30'
    fetch(url).then(r => r.json()).then(d => setPosts(Array.isArray(d) ? d : []))
      .catch(() => setPosts([])).finally(() => setLoading(false))
  }, [category])

  return (
    <>
      <Head>
        <title>블로그 — Fresh Season</title>
        <meta name="description" content="신선한 제철 식재료와 TV 레시피 블로그" />
      </Head>
      <Header />
      <main className="wrap">
        <section style={{ padding: '40px 0 28px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>블로그</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>제철 식재료 × 건강 정보 × TV 레시피</p>
        </section>

        {/* 지역 필터 */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setCategory('')} className="month-pill"
              style={{ borderColor: !category ? '#888' : undefined, color: !category ? 'var(--text)' : undefined, fontWeight: 600 }}>
              전체
            </button>
            {REGIONS.map(r => (
              <button key={r.id} onClick={() => setCategory(r.id === category ? '' : r.id)} className="month-pill"
                style={{ borderColor: category === r.id ? r.color : undefined, background: category === r.id ? `${r.color}22` : undefined, color: category === r.id ? r.color : undefined, fontWeight: 600 }}>
                {r.icon} {r.name}
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 64 }}>
          {loading && <SkeletonBlogList count={5} />}
          {!loading && posts.length === 0 && (
            <div className="empty-state">
              <p>아직 발행된 글이 없어요.</p>
            </div>
          )}
          <div className="grid-auto">
            {posts.map(post => {
              const region = REGIONS.find(r => r.id === post.category)
              return (
                <Link key={post.id} href={`/blog/${post.slug}`} className="card"
                  onMouseEnter={e => e.currentTarget.style.borderColor = region?.color || 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  {region && (
                    <span className="badge" style={{ marginBottom: 10, display: 'inline-block', background: `${region.color}22`, color: region.color, border: `1px solid ${region.color}44` }}>
                      {region.icon} {region.name}
                    </span>
                  )}
                  <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{post.title}</h2>
                  <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                    {post.content?.replace(/<[^>]+>/g, '').slice(0, 80)}...
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
                    {new Date(new Date(post.published_at).getTime() + 9*60*60*1000).toISOString().slice(0,10).replace(/-/g,'. ') + '.'}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
