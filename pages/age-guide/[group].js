import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { AGE_GUIDE, AGE_GUIDE_ORDER, AGE_GUIDE_SOURCES } from '../../lib/ageGuide'

export async function getStaticPaths() {
  return {
    paths: AGE_GUIDE_ORDER.map(id => ({ params: { group: id } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  return { props: { groupId: params.group } }
}

export default function AgeGuideDetail({ groupId }) {
  const router = useRouter()
  const g = AGE_GUIDE[groupId]
  if (!g) return null

  const idx = AGE_GUIDE_ORDER.indexOf(groupId)
  const prevId = AGE_GUIDE_ORDER[idx - 1]
  const nextId = AGE_GUIDE_ORDER[idx + 1]

  return (
    <>
      <Head>
        <title>{g.label}({g.range}) 영양·건강 가이드 — Fresh Season</title>
        <meta name="description" content={`${g.label}(${g.range}) 연령대가 챙기면 좋은 영양소와 질환·검진 이슈를 보건복지부·국민건강보험공단 자료 기준으로 정리했어요.`} />
      </Head>
      <Header />
      <main className="wrap" style={{ paddingTop: 20, paddingBottom: 60 }}>

        <Link href="/age-guide" className="back-link" style={{ marginBottom: 16, display: 'inline-block' }}>← 연령대별 가이드 전체 보기</Link>

        <section style={{ margin: '12px 0 24px' }}>
          <div style={{ fontSize: 44, marginBottom: 6 }}>{g.emoji}</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>{g.label} <span style={{ color: 'var(--text2)', fontWeight: 700, fontSize: 18 }}>({g.range})</span></h1>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>{g.kdriRange}</p>
        </section>

        <section className="detail-box" style={{ marginBottom: 20, padding: '20px 22px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>🥗 챙기면 좋은 영양소</h2>
          <ul style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, color: 'var(--text1, #111)' }}>
            {g.nutrients.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </section>

        <section className="detail-box" style={{ marginBottom: 20, padding: '20px 22px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>🩺 관심 가져야 할 질환·검진 이슈</h2>
          <ul style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, color: 'var(--text1, #111)' }}>
            {g.issues.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </section>

        <section style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 6 }}>🧬 Fresh Season 추천에 이렇게 반영돼요</p>
          <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.7 }}>{g.forMeNote}</p>
          <Link href="/for-me" style={{ display: 'inline-block', marginTop: 10, fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
            🍽️ 나에게 맞는 제철 먹거리 보러 가기 →
          </Link>
        </section>

        <section className="detail-box" style={{ marginBottom: 24, padding: '18px 20px' }}>
          <p className="detail-label">출처</p>
          <ul style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8, paddingLeft: 18 }}>
            {AGE_GUIDE_SOURCES.map(s => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent, #16a34a)' }}>{s.label}</a></li>
            ))}
          </ul>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
            ※ 이 페이지는 위 공공기관 자료를 요약·정리한 참고용 안내이며, 의학적 진단이나 개인별 처방을 대신하지 않아요. 개인의 건강 상태에 따라 필요한 검사·영양 관리는 다를 수 있으니 정확한 내용은 담당 의료진과 상담해주세요.
          </p>
        </section>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          {prevId ? (
            <Link href={`/age-guide/${prevId}`} style={{ color: 'var(--text2)' }}>← {AGE_GUIDE[prevId].label}</Link>
          ) : <span />}
          {nextId ? (
            <Link href={`/age-guide/${nextId}`} style={{ color: 'var(--text2)' }}>{AGE_GUIDE[nextId].label} →</Link>
          ) : <span />}
        </div>
      </main>
      <Footer />
    </>
  )
}
