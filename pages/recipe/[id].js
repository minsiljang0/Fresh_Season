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
  const [modalName, setModalName] = useState(null)
  const [modalList, setModalList] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  const openIngredientModal = (name) => {
    setModalName(name)
    setModalList(null)
    setModalLoading(true)
    fetch(`/api/ingredient?name=${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then(list => setModalList(Array.isArray(list) ? list : []))
      .catch(() => setModalList([]))
      .finally(() => setModalLoading(false))
  }
  const closeModal = () => { setModalName(null); setModalList(null) }

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
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              <p className="detail-label" style={{ margin: 0 }}>🥕 재료</p>
              {recipe.servings && (
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent, #16a34a)' }}>{recipe.servings}인분 기준</span>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {recipe.ingredients.map(ri => (
                <span key={ri.id} className="tag"
                  onClick={() => ri.ingredients?.name && openIngredientModal(ri.ingredients.name)}
                  style={{ cursor: ri.ingredients ? 'pointer' : 'default' }}>
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

      {modalName && (
        <div onClick={closeModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} className="detail-box"
            style={{ maxWidth: 420, width: '100%', padding: '22px 24px', position: 'relative' }}>
            <button onClick={closeModal}
              style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', color: 'var(--text3)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 12 }}>🥕 {modalName} 관련 식재료</h3>

            {modalLoading ? (
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>불러오는 중...</p>
            ) : !modalList?.length ? (
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                ⚠️ 아직 식재료 등록이 안 되었으면 식재료 등록이 필요합니다.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {modalList.map(ing => (
                  <Link key={ing.id} href={`/ingredient/${encodeURIComponent(ing.name)}`}
                    style={{ display: 'block', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border, #333)', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{ing.name}</span>
                      {ing.category && <span className="badge" style={{ fontSize: 10 }}>{ing.category}</span>}
                    </div>
                    {ing.hasRegion ? (
                      <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0 }}>
                        {ing.season_start && ing.season_end ? `📅 ${ing.season_start}~${ing.season_end}월 · ` : ''}
                        {ing.description ? ing.description.slice(0, 40) : ''}
                      </p>
                    ) : (
                      <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0 }}>⚠️ 아직 식재료 등록이 안 되었으면 식재료 등록이 필요합니다</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
