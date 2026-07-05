import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

export default function RecipeDetail() {
  const router = useRouter()
  const { id } = router.query
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/recipes?id=${encodeURIComponent(id)}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setRecipe)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (<><Header /><main className="wrap" style={{ paddingTop: 40, paddingBottom: 60 }} /><Footer /></>)
  if (notFound || !recipe) {
    return (
      <>
        <Header />
        <main className="wrap" style={{ paddingTop: 40, paddingBottom: 60 }}>
          <div className="empty-state">
            <p>레시피를 찾을 수 없어요.</p>
          </div>
          <Link href="/recipe" className="back-link">← 레시피 전체보기</Link>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{recipe.title} — Fresh Season 레시피</title>
        <meta name="description" content={recipe.summary || `${recipe.title} 레시피`} />
      </Head>
      <Header />
      <main className="wrap" style={{ paddingTop: 20, paddingBottom: 60 }}>

        <section style={{ marginBottom: 20 }}>
          {recipe.dishes?.name && (
            <span className="badge" style={{ marginBottom: 10, display: 'inline-block' }}>{recipe.dishes.name}</span>
          )}
          {recipe.servings && (
            <span className="badge" style={{ marginBottom: 10, marginLeft: 6, display: 'inline-block' }}>{recipe.servings}인분</span>
          )}
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>🍳 {recipe.title}</h1>
          {recipe.summary && <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>{recipe.summary}</p>}
          {(recipe.tv_shows?.name || recipe.chefs?.name) && (
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>
              {recipe.tv_shows?.name && `📺 ${recipe.tv_shows.name}${recipe.episode ? ` · ${recipe.episode}` : ''}`}
              {recipe.tv_shows?.name && recipe.chefs?.name && ' · '}
              {recipe.chefs?.name && `👨‍🍳 ${recipe.chefs.name}`}
            </p>
          )}
        </section>

        {recipe.thumbnail && (
          <section style={{ marginBottom: 24 }}>
            <img src={recipe.thumbnail} alt={recipe.title} referrerPolicy="no-referrer"
              style={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 14, display: 'block' }} />
          </section>
        )}

        {recipe.ingredients?.length > 0 && (
          <section className="detail-box" style={{ marginBottom: 20, padding: '18px 20px' }}>
            <p className="detail-label">🥕 재료</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {recipe.ingredients.map(ri => (
                <span key={ri.id} className="tag">
                  {ri.ingredients?.name || '재료'}{ri.amount ? ` ${ri.amount}` : ''}
                </span>
              ))}
            </div>
          </section>
        )}

        {recipe.tools?.length > 0 && (
          <section className="detail-box" style={{ marginBottom: 20, padding: '18px 20px' }}>
            <p className="detail-label">🍳 조리도구</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {recipe.tools.map(t => <span key={t.id} className="tag">{t.name}</span>)}
            </div>
          </section>
        )}

        {recipe.steps?.length > 0 && (
          <section className="detail-box" style={{ marginBottom: 24, padding: '18px 20px' }}>
            <p className="detail-label">📖 조리 순서</p>
            {['준비하기', '조리하기'].map(phase => {
              const phaseSteps = recipe.steps.filter(s => (s.phase || '조리하기') === phase)
              if (!phaseSteps.length) return null
              return (
                <div key={phase} style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: phase === '준비하기' ? '#0369a1' : '#c2410c', marginBottom: 8 }}>
                    {phase === '준비하기' ? '🥣 준비하기' : '🔥 조리하기'}
                  </p>
                  <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {phaseSteps.map(s => (
                      <li key={s.id} style={{ fontSize: 14, lineHeight: 1.7 }}>
                        {s.description}
                        {s.photo_url && (
                          <img src={s.photo_url} alt="" referrerPolicy="no-referrer"
                            style={{ display: 'block', marginTop: 8, maxWidth: '100%', borderRadius: 10 }} />
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )
            })}
          </section>
        )}

        {recipe.source_url && (
          <p style={{ fontSize: 12, marginBottom: 24 }}>
            <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>출처 보기 →</a>
          </p>
        )}

        <Link href="/recipe" className="back-link">← 레시피 전체보기</Link>
      </main>
      <Footer />
    </>
  )
}
