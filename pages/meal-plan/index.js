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
        <meta name="description" content="매달 나오는 제철 식재료로 짜는 달력형 식단표(월간·주간 보기). 대략적인 칼로리와 연령대별 참고치까지 한눈에 확인하세요." />
      </Head>
      <Header />
      <main className="wrap" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <section style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>🍽️ 월별 제철 식단</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            그 달에 가장 많이 나오는 제철 식재료로 <b>달력형 식단표</b>를 짜봤어요.
            📅 월간보기·📋 주간보기를 오가며 확인할 수 있고, 끼니마다 대략적인 <b>칼로리 참고치</b>도 함께 보여드려요.
            <br />👶🧒🧑🧑‍💼🧑‍🦳👴 <b>연령대별 탭</b>으로 하루 권장 칼로리와 참고 식단이 달라지고, 영유아·어린이는 관련 공공기관 참고자료도 함께 안내해요.
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
                <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 10, fontWeight: 700 }}>달력형 식단 보기 →</p>
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
