import { useState, useEffect } from 'react'
import Head from 'next/head'
import { SkeletonBlogList } from '../../components/SkeletonCard'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { REGIONS } from '../../lib/regions'
import { HEALTH_CATEGORIES } from '../../lib/blogCategories'
import { AdSlot } from '../../components/AdSlot'
import { useAdSlot } from '../../lib/AdSlotsContext'

export default function BlogIndex() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [customCategories, setCustomCategories] = useState([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [healthCat, setHealthCat] = useState('') // 건강효능 드롭다운은 검색어로 매핑된다
  const middleSlot = useAdSlot('home_middle')

  useEffect(() => {
    fetch('/api/blog/categories').then(r => r.json())
      .then(d => setCustomCategories(Array.isArray(d) ? d : []))
      .catch(() => setCustomCategories([]))
  }, [])

  const runSearch = () => setSearch(searchInput.trim())

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (search) params.set('q', search)
    if (!category && !search) params.set('limit', '30')
    fetch(`/api/blog/posts?${params.toString()}`).then(r => r.json()).then(d => setPosts(Array.isArray(d) ? d : []))
      .catch(() => setPosts([])).finally(() => setLoading(false))
  }, [category, search])

  const isRegionSelected = REGIONS.some(r => r.id === category)

  const selectHealthCat = (val) => {
    setHealthCat(val)
    setCategory('')
    setSearchInput(val) // 건강효능은 카테고리로 저장되는 값이 아니라 제목·본문 검색으로 매칭한다
    setSearch(val)
  }

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

        {/* 전체 페이지 중단 배너 */}
        <div className="ad-banner-slot" style={{ padding: 0, margin: '0 0 24px' }}>
          <AdSlot slot="home_middle" label="중단 배너 광고" slotData={middleSlot} />
        </div>

        {/* 필터: 전체 / 지역 드롭다운 / 건강효능 드롭다운 / 검색 / 커스텀 카테고리 칩 */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
            <button onClick={() => { setCategory(''); setSearchInput(''); setSearch(''); setHealthCat('') }} className="month-pill"
              style={{ borderColor: !category && !search ? '#888' : undefined, color: !category && !search ? 'var(--text)' : undefined, fontWeight: 600 }}>
              전체
            </button>

            <select value={isRegionSelected ? category : ''} onChange={e => { setCategory(e.target.value); setSearchInput(''); setSearch(''); setHealthCat('') }}
              className="month-pill" style={{ fontWeight: 600, cursor: 'pointer', paddingRight: 8 }}>
              <option value="">📍 지역 선택</option>
              {REGIONS.map(r => (
                <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
              ))}
            </select>

            <select value={HEALTH_CATEGORIES.includes(searchInput) ? searchInput : ''} onChange={e => selectHealthCat(e.target.value)}
              className="month-pill" style={{ fontWeight: 600, cursor: 'pointer', paddingRight: 8 }}>
              <option value="">💊 건강효능 선택</option>
              {HEALTH_CATEGORIES.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>

            <form onSubmit={e => { e.preventDefault(); setCategory(''); runSearch() }} style={{ display: 'flex', gap: 6, flex: '1 1 260px', maxWidth: 360 }}>
              <input
                value={searchInput}
                onChange={e => { setSearchInput(e.target.value); setHealthCat('') }}
                placeholder="🔍 제목·본문 검색"
                className="month-pill"
                style={{ fontWeight: 500, flex: 1, minWidth: 0 }}
              />
              <button type="submit" className="month-pill" style={{ fontWeight: 700, flexShrink: 0, background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}>
                검색
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {customCategories.map(c => (
              <button key={c.id} onClick={() => { setCategory(c.label === category ? '' : c.label); setSearchInput(''); setSearch(''); setHealthCat('') }} className="month-pill"
                style={{ borderColor: category === c.label ? '#16a34a' : undefined, background: category === c.label ? '#16a34a22' : undefined, color: category === c.label ? '#16a34a' : undefined, fontWeight: 600 }}>
                {c.icon || '📁'} {c.label}
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 64 }}>
          {loading && <SkeletonBlogList count={5} />}
          {!loading && posts.length === 0 && (
            <div className="empty-state">
              <p>{search ? `"${search}"에 대한 검색 결과가 없어요.` : '아직 발행된 글이 없어요.'}</p>
            </div>
          )}
          <div className="grid-auto">
            {posts.map(post => {
              const region = REGIONS.find(r => r.id === post.category)
              const customCat = !region ? customCategories.find(c => c.label === post.category) : null
              const isCustom = !region && post.category
              return (
                <Link key={post.id} href={`/blog/${post.slug}`} className="card"
                  style={{ padding: 0, overflow: 'hidden' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = region?.color || 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  {post.cover_image ? (
                    <img src={post.cover_image} alt={post.title} referrerPolicy="no-referrer"
                      style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 36, background: region ? `${region.color}14` : 'var(--card, #f3f4f6)',
                    }}>
                      {region?.icon || (isCustom ? (customCat?.icon || '📁') : '🥬')}
                    </div>
                  )}
                  <div style={{ padding: 20 }}>
                    {region && (
                      <span className="badge" style={{ marginBottom: 10, display: 'inline-block', background: `${region.color}22`, color: region.color, border: `1px solid ${region.color}44` }}>
                        {region.icon} {region.name}
                      </span>
                    )}
                    {isCustom && (
                      <span className="badge" style={{ marginBottom: 10, display: 'inline-block', background: '#16a34a22', color: '#16a34a', border: '1px solid #16a34a44' }}>
                        {customCat?.icon || '📁'} {post.category}
                      </span>
                    )}
                    <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{post.title}</h2>
                    <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                      {(post.summary || post.content?.replace(/<[^>]+>/g, ''))?.slice(0, 80)}...
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
                      {new Date(new Date(post.published_at).getTime() + 9*60*60*1000).toISOString().slice(0,10).replace(/-/g,'. ') + '.'}
                    </p>
                  </div>
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
