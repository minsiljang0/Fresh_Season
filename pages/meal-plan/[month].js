import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { SkeletonGrid } from '../../components/SkeletonCard'
import { MONTH_NAMES, getMonthTheme, buildMonthlyMealPlan } from '../../lib/mealPlans'

export async function getStaticPaths() {
  return {
    paths: Array.from({ length: 12 }, (_, i) => ({ params: { month: String(i + 1) } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const month = Number(params.month)
  if (!month || month < 1 || month > 12) return { notFound: true }
  return { props: { month } }
}

export default function MealPlanMonthPage({ month }) {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const monthTheme = getMonthTheme(month)
  const currentMonth = new Date().getMonth() + 1

  useEffect(() => {
    setLoading(true)
    fetch('/api/map/seasonal-foods')
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        const list = Array.isArray(data) ? data : (data.foods || [])
        setFoods(list)
      })
      .catch(() => setFoods([]))
      .finally(() => setLoading(false))
  }, [])

  const plan = useMemo(() => buildMonthlyMealPlan(month, foods), [month, foods])

  const prevMonth = month === 1 ? 12 : month - 1
  const nextMonth = month === 12 ? 1 : month + 1

  return (
    <>
      <Head>
        <title>{MONTH_NAMES[month - 1]} 제철 식단 (4주 식단) — Fresh Season</title>
        <meta name="description" content={`${MONTH_NAMES[month - 1]}에 나오는 제철 식재료로 짜는 4주 식단. ${monthTheme.theme}`} />
      </Head>
      <Header />
      <main className="wrap" style={{ paddingTop: 20, paddingBottom: 60 }}>

        <section style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 24, fontWeight: 900 }}>
              {monthTheme.icon} {MONTH_NAMES[month - 1]} 제철 식단
              {month === currentMonth && (
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--accent)', color: '#fff', verticalAlign: 'middle' }}>이번 달</span>
              )}
            </h1>
            <div style={{ display: 'flex', gap: 6 }}>
              <Link href={`/meal-plan/${prevMonth}`} className="tag" style={{ textDecoration: 'none' }}>← {MONTH_NAMES[prevMonth - 1]}</Link>
              <Link href={`/meal-plan/${nextMonth}`} className="tag" style={{ textDecoration: 'none' }}>{MONTH_NAMES[nextMonth - 1]} →</Link>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8, lineHeight: 1.6 }}>
            {monthTheme.theme} · 이번 달 제철재료 <b>{plan.totalCount}가지</b>로 짠 4주(한 달) 식단이에요.
            수산물 → 채소·나물 → 과일·곡물 → 육류·버섯 순으로 한 주씩 챙겨보세요.
          </p>
        </section>

        {loading ? (
          <SkeletonGrid count={4} />
        ) : plan.totalCount === 0 ? (
          <div className="empty-state">
            <p>이 달의 제철재료 데이터를 아직 준비 중이에요.</p>
            <small>다른 달을 확인해보시거나 잠시 후 다시 시도해주세요.</small>
          </div>
        ) : (
          <>
            {plan.weeks.map(w => (
              <section key={w.week} className="detail-box" style={{ marginBottom: 18, padding: '20px 22px', borderLeft: `4px solid ${w.color}` }}>
                <h2 style={{ fontSize: 17, fontWeight: 900, marginBottom: 4, color: w.color }}>
                  {w.week}주차 · {w.icon} {w.label}
                </h2>

                {w.ingredients.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>
                    이번 달은 이 테마의 제철재료가 적어요. 다른 주간을 참고해보세요.
                  </p>
                ) : (
                  <>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text2)', marginTop: 12, marginBottom: 8 }}>🗓️ 하루 식단 예시</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 14 }}>
                      {w.menu.map((it, i) => (
                        <div key={i} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: w.color }}>{it.mealType}</span>
                          <p style={{ fontSize: 14, fontWeight: 800, margin: '4px 0 2px' }}>{it.dish}</p>
                          {it.health && <p style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>💚 {it.health}</p>}
                        </div>
                      ))}
                    </div>

                    <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>🧺 이 주간 제철재료</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {w.ingredients.map(f => (
                        <Link key={f.ingredient} href={`/ingredient/${encodeURIComponent(f.ingredient)}`} className="tag" style={{ textDecoration: 'none' }}>
                          {f.ingredient}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </section>
            ))}

            <section className="detail-box" style={{ marginBottom: 24, padding: '18px 20px' }}>
              <p className="detail-label">이 달의 제철재료 전체 목록 ({plan.totalCount}가지)</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {plan.allIngredients.map(f => (
                  <Link key={f.ingredient} href={`/ingredient/${encodeURIComponent(f.ingredient)}`} className="tag" style={{ textDecoration: 'none' }}>
                    {f.ingredient}
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}

        <Link href="/meal-plan" className="back-link">← 월별 제철 식단 전체보기</Link>
      </main>
      <Footer />
    </>
  )
}
