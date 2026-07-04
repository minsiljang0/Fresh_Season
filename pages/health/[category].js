import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

export default function HealthCategoryPage() {
  const router = useRouter()
  const category = router.query.category ? decodeURIComponent(router.query.category) : ''

  const [rawFoods, setRawFoods] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/map/seasonal-foods')
      .then(r => r.ok ? r.json() : {})
      .then(data => setRawFoods(Array.isArray(data) ? data : (data.foods || [])))
      .catch(() => setRawFoods([]))
      .finally(() => setLoading(false))
  }, [])

  // 지역 무관하게 재료명 기준으로 합치기 (월은 합집합)
  const allFoods = useMemo(() => {
    const map = {}
    rawFoods.forEach(f => {
      if (!map[f.ingredient]) map[f.ingredient] = { ...f, months: [...(f.months || [])] }
      else (f.months || []).forEach(m => { if (!map[f.ingredient].months.includes(m)) map[f.ingredient].months.push(m) })
    })
    return Object.values(map)
  }, [rawFoods])

  const matched = useMemo(() => {
    if (!category) return []
    return allFoods
      .filter(f => (f.healthBenefits || []).some(hb => hb.category === category))
      .sort((a, b) => a.ingredient.localeCompare(b.ingredient, 'ko'))
  }, [allFoods, category])

  return (
    <>
      <Head>
        <title>{category ? `${category} 식재료` : '식재료'} — Fresh Season</title>
        <meta name="description" content={`${category} 효능이 있는 것으로 등록된 제철 식재료 목록`} />
      </Head>
      <Header />
      <main className="wrap" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <Link href="/health-guide/health-issues" className="back-link" style={{ marginBottom: 16, display: 'inline-block' }}>← 연령별 질환·검진 가이드로</Link>

        <section style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>🍽️ {category || '...'} 에 도움되는 식재료</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            관리자 페이지에서 "{category}" 효능으로 등록된 식재료들이에요. 여기 없다고 도움이 안 되는 건 아니고, 아직 이 효능이 등록되지 않은 재료일 수 있어요.
          </p>
        </section>

        {loading ? (
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>불러오는 중...</p>
        ) : matched.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>아직 "{category}" 효능으로 등록된 식재료가 없어요.</p>
        ) : (
          <div className="grid-auto">
            {matched.map((food, i) => (
              <Link key={i} href={`/ingredient/${encodeURIComponent(food.ingredient)}`} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 900 }}>{food.ingredient}</span>
                  {food.is_superfood && <span className="tag">🌟 슈퍼푸드</span>}
                </div>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 8 }}>
                  {[...food.months].sort((a, b) => a - b).map(m => (
                    <span key={m} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--text3)' }}>{m}월</span>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>💚 {food.health}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
