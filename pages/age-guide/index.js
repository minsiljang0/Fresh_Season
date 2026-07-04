import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { AGE_GUIDE_SOURCES, AGE_GUIDE_LAST_VERIFIED } from '../../lib/ageGuide'

export default function AgeGuideIndex() {
  return (
    <>
      <Head>
        <title>연령대별 영양·건강 가이드 — Fresh Season</title>
        <meta name="description" content="보건복지부 한국인 영양소 섭취기준과 국민건강보험공단 국가건강검진 기준을 바탕으로 정리한 연령대별 영양소·질환 가이드." />
      </Head>
      <Header />
      <main className="wrap" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <section style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>📖 연령대별 영양·건강 가이드</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            공신력 있는 공공기관 자료를 바탕으로 <b>영양소</b>와 <b>질환·검진 이슈</b>를 주제별로 나눠서 정리했어요.
            <br />🧬 <Link href="/for-me" style={{ color: 'var(--accent, #16a34a)', fontWeight: 700 }}>나에게 맞는 제철 먹거리</Link> 페이지의 연령대별 추천도 이 기준을 참고해서 만들어져요.
          </p>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
          <Link href="/age-guide/nutrients" className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🥗</div>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>연령대별 영양소 가이드</div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              2025 한국인 영양소 섭취기준(KDRI) 기준으로, 연령대별로 챙기면 좋은 영양소를 정리했어요.
            </p>
          </Link>
          <Link href="/age-guide/health-issues" className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🩺</div>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>연령대별 질환·검진 가이드</div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              국가건강검진·국가암검진 필수 항목 기준으로, 연령대별로 관심 가져야 할 질환·검진 이슈를 정리했어요.
            </p>
          </Link>
        </div>

        <section className="detail-box" style={{ padding: '18px 20px' }}>
          <p className="detail-label">출처</p>
          <ul style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8, paddingLeft: 18 }}>
            {AGE_GUIDE_SOURCES.map(s => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent, #16a34a)' }}>{s.label}</a></li>
            ))}
          </ul>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
            ※ 📅 최종 확인: {AGE_GUIDE_LAST_VERIFIED} · 이 페이지는 위 공공기관 자료를 요약·정리한 참고용 안내이며, 의학적 진단이나 개인별 처방을 대신하지 않아요. 개인의 건강 상태에 따라 필요한 검사·영양 관리는 다를 수 있으니 정확한 내용은 담당 의료진과 상담해주세요.
          </p>
        </section>

        <div style={{ marginTop: 20 }}>
          <Link href="/" className="back-link">← 홈으로</Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
