import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { TaggedItem } from '../../components/HealthGuideBits'

export default function HealthGuideNutrients() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/health-guide')
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Head>
        <title>연령별 영양소 가이드 — Fresh Season</title>
        <meta name="description" content="보건복지부·한국영양학회의 2025 한국인 영양소 섭취기준을 바탕으로 정리한 연령대별로 챙기면 좋은 영양소 가이드." />
      </Head>
      <Header />
      <main className="wrap" style={{ paddingTop: 20, paddingBottom: 60 }}>

        <Link href="/health-guide" className="back-link" style={{ marginBottom: 16, display: 'inline-block' }}>← 연령별 건강 가이드 홈</Link>

        <section style={{ margin: '12px 0 24px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>🥗 연령별 영양소 가이드</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            보건복지부·한국영양학회의 「2025 한국인 영양소 섭취기준(KDRI)」을 바탕으로, 연령대별로 특히 챙기면 좋은 영양소를 정리했어요. 뱃지만 봐도 어떤 영양소가 필요한지 한눈에 알 수 있게 정리했어요.
            <br />🧬 <Link href="/for-me" style={{ color: 'var(--accent, #16a34a)', fontWeight: 700 }}>나에게 맞는 제철 먹거리</Link> 페이지의 연령별 추천도 이 기준을 참고해서 만들어져요.
          </p>
          {data?.lastVerified && <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>📅 최종 확인: {data.lastVerified} (아래 출처 기준)</p>}
        </section>

        {loading ? (
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>불러오는 중...</p>
        ) : !data ? (
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
        ) : (
          <>
            {(data.order || []).map(id => {
              const g = data.groups[id]
              const items = data.nutrients[id] || []
              if (!g) return null
              return (
                <section key={id} id={id} className="detail-box" style={{ marginBottom: 18, padding: '18px 20px' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
                    {g.emoji} {g.label} <span style={{ color: 'var(--text2)', fontWeight: 700, fontSize: 13 }}>({g.range})</span>
                  </h2>
                  <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10 }}>{g.kdriRange}</p>
                  <ul style={{ fontSize: 14, lineHeight: 1.7, paddingLeft: 20 }}>
                    {items.map((n, i) => (
                      <TaggedItem key={i} item={n} tagBg="#dcfce7" tagBorder="#86efac" tagColor="#166534" />
                    ))}
                  </ul>
                  <p style={{ fontSize: 12, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', marginTop: 10 }}>
                    🧬 {g.forMeNote}
                  </p>
                </section>
              )
            })}

            <section className="detail-box" style={{ marginBottom: 24, padding: '18px 20px' }}>
              <p className="detail-label">출처</p>
              <ul style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8, paddingLeft: 18 }}>
                {(data.sources || []).map(s => (
                  <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent, #16a34a)' }}>{s.label}</a></li>
                ))}
              </ul>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
                📅 최종 확인: {data.lastVerified} · 이 페이지는 위 공공기관 자료를 요약·정리한 참고용 안내이며, 의학적 진단이나 개인별 처방을 대신하지 않아요. 정확한 영양 관리는 담당 의료진·영양 전문가와 상담해주세요.
              </p>
            </section>

            <Link href="/health-guide/health-issues" className="back-link">🩺 연령별 질환·검진 가이드도 보기 →</Link>
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
