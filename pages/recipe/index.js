import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { SkeletonGrid } from '../../components/SkeletonCard'

const CATEGORIES = ['밥', '죽', '면', '국', '탕', '찌개', '전골', '찜', '구이', '숙채', '생채', '회', '전', '장', '김치', '장아찌', '조림', '볶음', '한과', '떡', '음청류']

export default function RecipeIndex() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [category, setCategory] = useState('')
  const [counts, setCounts] = useState({ total: 0, byCategory: {} })

  useEffect(() => {
    fetch('/api/recipes?counts=1').then(r => r.json()).then(setCounts).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (category) params.set('category', category)
    params.set('limit', '200')
    fetch(`/api/recipes?${params.toString()}`).then(r => r.json()).then(d => setRecipes(Array.isArray(d) ? d : []))
      .catch(() => setRecipes([])).finally(() => setLoading(false))
  }, [search, category])

  return (
    <>
      <Head>
        <title>레시피 — Fresh Season</title>
        <meta name="description" content="제철 식재료로 만드는 기본 레시피 모음" />
      </Head>
      <Header />
      <main className="wrap">
        <section style={{ padding: '40px 0 28px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>🍳 레시피</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>제철 식재료로 만드는 조리법별 기본 레시피 모음 · 총 {counts.total}개</p>
        </section>

        <section style={{ marginBottom: 16 }}>
          <form onSubmit={e => { e.preventDefault(); setSearch(searchInput.trim()) }} style={{ display: 'flex', gap: 6, maxWidth: 360 }}>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="🔍 레시피 제목 검색"
              className="month-pill"
              style={{ fontWeight: 500, flex: 1, minWidth: 0 }}
            />
            <button type="submit" className="month-pill" style={{ fontWeight: 700, flexShrink: 0, background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}>
              검색
            </button>
          </form>
        </section>

        <section style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button onClick={() => setCategory('')} className="month-pill"
            style={{ fontWeight: category === '' ? 800 : 500, background: category === '' ? 'var(--accent)' : undefined, color: category === '' ? '#fff' : undefined, borderColor: category === '' ? 'var(--accent)' : undefined }}>
            전체 ({counts.total})
          </button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className="month-pill"
              style={{ fontWeight: category === c ? 800 : 500, background: category === c ? 'var(--accent)' : undefined, color: category === c ? '#fff' : undefined, borderColor: category === c ? 'var(--accent)' : undefined }}>
              {c} ({counts.byCategory?.[c] || 0})
            </button>
          ))}
        </section>

        <section style={{ marginBottom: 64 }}>
          {loading && <SkeletonGrid count={6} />}
          {!loading && recipes.length === 0 && (
            <div className="empty-state">
              <p>{search ? `"${search}"에 대한 검색 결과가 없어요.` : '아직 등록된 레시피가 없어요.'}</p>
            </div>
          )}
          <div className="grid-auto">
            {recipes.map(r => (
              <Link key={r.id} href={`/recipe/${r.id}`} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {r.thumbnail ? (
                  <img src={r.thumbnail} alt={r.title} referrerPolicy="no-referrer"
                    style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, background: 'var(--card, #f3f4f6)' }}>
                    🍳
                  </div>
                )}
                <div style={{ padding: 20 }}>
                  {(r.category || r.dishes?.name) && (
                    <span className="badge" style={{ marginBottom: 10, display: 'inline-block' }}>{r.category || r.dishes.name}</span>
                  )}
                  <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{r.title}</h2>
                  {r.summary && (
                    <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{r.summary.slice(0, 80)}</p>
                  )}
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
