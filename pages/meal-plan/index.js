import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { MONTH_NAMES, MONTH_THEMES } from '../../lib/mealPlans'

export default function MealPlanIndex() {
  const currentMonth = new Date().getMonth() + 1

  return (
    <>
      <Head>
        <title>월별 제철 식단 — Fresh Season</title>
        <meta name="description" content="매달 나오는 제철 식재료로 짜는 4주 식단(한 달 식단). 수산물·채소·과일·육류 주간별로 무엇을 먹으면 좋은지 한눈에 확인하세요." />
      </Head>
      <Header />
      <main className="wrap" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <section style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>🍽️ 월별 제철 식단</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            그 달에 가장 많이 나오는 제철 식재료로 <b>4주(한 달) 식단</b>을 짜봤어요.
            1주차 수산물 → 2주차 채소·나물 → 3주차 과일·곡물 → 4주차 육류·버섯 순으로,
            제철재료를 골고루 챙길 수 있도록 구성했어요.
          </p>
        </section>

        <div className="grid-auto">
          {MONTH_THEMES.map(mt => {
            const isCurrent = mt.month === currentMonth
            return (
              <Link key={mt.month} href={`/meal-plan/${mt.month}`} className="card"
                style={isCurrent ? { borderColor: 'var(--accent)', background: 'var(--surface2)' } : {}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 900 }}>{mt.icon} {MONTH_NAMES[mt.month - 1]}</span>
                  {isCurrent && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--accent)', color: '#fff' }}>이번 달</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{mt.theme}</p>
                <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 10, fontWeight: 700 }}>4주 식단 보기 →</p>
              </Link>
            )
          })}
        </div>

        <Link href="/" className="back-link" style={{ display: 'inline-block', marginTop: 24 }}>← 홈으로</Link>
      </main>
      <Footer />
    </>
  )
}
