import { useState, useEffect } from 'react'
import Head from 'next/head'
import { SkeletonBlogList } from '../../components/SkeletonCard'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { AdSlot } from '../../components/AdSlot'
import { useAdSlot } from '../../lib/AdSlotsContext'

const CATEGORY = '휴일약국'

export default function HolidayPharmacy() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const middleSlot = useAdSlot('home_middle')

  const runSearch = () => setSearch(searchInput.trim())

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('category', CATEGORY)
    if (search) params.set('q', search)
    fetch(`/api/blog/posts?${params.toString()}`).then(r => r.json()).then(d => setPosts(Array.isArray(d) ? d : []))
      .catch(() => setPosts([])).finally(() => setLoading(false))
  }, [search])

  return (
    <>
      <Head>
        <title>휴일약국 — Fresh Season</title>
        <meta name="description" content="설날·추석·공휴일마다 문 여는 휴일지킴이약국 리스트를 지역별로 확인하세요." />
      </Head>
      <Header />
      <main className="wrap">
        <section style={{ padding: '40px 0 28px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>💊 휴일약국</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>명절·공휴일마다 문 여는 약국 리스트를 모아뒀어요</p>
        </section>

        {/* 전체 페이지 중단 배너 */}
        <div className="ad-banner-slot" style={{ padding: 0, margin: '0 0 24px' }}>
          <AdSlot slot="home_middle" label="중단 배너 광고" slotData={middleSlot} />
        </div>

        <section style={{ marginBottom: 28 }}>
          <form onSubmit={e => { e.preventDefault(); runSearch() }} style={{ display: 'flex', gap: 6, maxWidth: 360 }}>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="🔍 지역·명절로 검색 (예: 서울, 추석)"
              className="month-pill"
              style={{ fontWeight: 500, flex: 1, minWidth: 0 }}
            />
            <button type="submit" className="month-pill" style={{ fontWeight: 700, flexShrink: 0, background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}>
              검색
            </button>
          </form>
        </section>

        <section style={{ marginBottom: 64 }}>
          {loading && <SkeletonBlogList count={5} />}
          {!loading && posts.length === 0 && (
            <div className="empty-state">
              <p>{search ? `"${search}"에 대한 검색 결과가 없어요.` : '아직 등록된 휴일약국 리스트가 없어요.'}</p>
            </div>
          )}
          <div className="grid-auto">
            {posts.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="card"
                style={{ padding: 0, overflow: 'hidden' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#0ea5e9'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                {post.cover_image ? (
                  <img src={post.cover_image} alt={post.title} referrerPolicy="no-referrer"
                    style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{
                    width: '100%', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, background: '#0ea5e914',
                  }}>
                    💊
                  </div>
                )}
                <div style={{ padding: 20 }}>
                  <span className="badge" style={{ marginBottom: 10, display: 'inline-block', background: '#0ea5e922', color: '#0ea5e9', border: '1px solid #0ea5e944' }}>
                    💊 휴일약국
                  </span>
                  <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{post.title}</h2>
                  <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                    {(post.summary || post.content?.replace(/<[^>]+>/g, ''))?.slice(0, 80)}...
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
                    {new Date(new Date(post.published_at).getTime() + 9*60*60*1000).toISOString().slice(0,10).replace(/-/g,'. ') + '.'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
