import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { TaggedItem, FoodLink } from '../../components/HealthGuideBits'

export default function HealthGuideIssues() {
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
        <title>연령별 질환·검진 가이드 — Fresh Season</title>
        <meta name="description" content="국민건강보험공단의 국가건강검진·국가암검진 기준을 바탕으로 정리한 연령별 질환·검진 이슈 가이드." />
      </Head>
      <Header />
      <main className="wrap" style={{ paddingTop: 20, paddingBottom: 60 }}>

        <Link href="/health-guide" className="back-link" style={{ marginBottom: 16, display: 'inline-block' }}>← 연령별 건강 가이드 홈</Link>

        <section style={{ margin: '12px 0 24px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>🩺 연령별 질환·검진 가이드</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            국민건강보험공단의 국가건강검진·국가암검진 기준을 바탕으로, 연령대별로 관심 가져야 할 질환과 검진 이슈를 정리했어요. 뱃지 아래 <b>🍽️ 링크</b>가 있으면, 그 건강 이슈에 도움되는 식재료를 바로 볼 수 있어요.
          </p>
          {data?.lastVerified && <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>📅 최종 확인: {data.lastVerified} (아래 출처 기준)</p>}
        </section>

        {loading ? (
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>불러오는 중...</p>
        ) : !data ? (
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
        ) : (
          <>
            {/* 국가건강검진 공통 필수 항목 */}
            <section style={{ marginBottom: 20, padding: '18px 20px', borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 4, color: '#1e40af' }}>📋 {data.checkupCommon.title}</h2>
              <p style={{ fontSize: 12, color: '#1e40af', marginBottom: 10 }}>{data.checkupCommon.subtitle}</p>
              <ul style={{ fontSize: 13.5, lineHeight: 1.7, paddingLeft: 20, color: '#1e3a5f' }}>
                {data.checkupCommon.items.map((it, i) => (
                  <TaggedItem key={i} item={it} tagBg="#dbeafe" tagBorder="#93c5fd" tagColor="#1e40af" />
                ))}
              </ul>
              <p style={{ fontSize: 12.5, color: '#1e40af', marginTop: 10, lineHeight: 1.7, fontWeight: 600 }}>
                💡 {data.checkupCommon.note}
              </p>
            </section>

            {/* 국가암검진 6대암 표 */}
            <section style={{ marginBottom: 28, padding: '18px 20px', borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 10, color: '#9a3412' }}>🎗️ {data.cancerScreening.title}</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 480 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #fed7aa' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px' }}>암종</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px' }}>대상</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px' }}>주기</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px' }}>검진 방법</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cancerScreening.items.map(c => (
                      <tr key={c.name} style={{ borderBottom: '1px solid #fed7aa' }}>
                        <td style={{ padding: '8px', fontWeight: 700, color: '#9a3412' }}>{c.name}</td>
                        <td style={{ padding: '8px', color: '#7c2d12' }}>{c.target}</td>
                        <td style={{ padding: '8px', color: '#7c2d12' }}>{c.cycle}</td>
                        <td style={{ padding: '8px', color: '#7c2d12' }}>
                          {c.method}
                          <FoodLink category={c.foodCategory} label={c.foodLinkLabel} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {(data.order || []).map(id => {
              const g = data.groups[id]
              const issues = data.issues[id] || []
              const highlights = data.checkupHighlights[id] || []
              if (!g) return null
              return (
                <section key={id} id={id} className="detail-box" style={{ marginBottom: 18, padding: '18px 20px' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>
                    {g.emoji} {g.label} <span style={{ color: 'var(--text2)', fontWeight: 700, fontSize: 13 }}>({g.range})</span>
                  </h2>
                  <ul style={{ fontSize: 14, lineHeight: 1.7, paddingLeft: 20 }}>
                    {issues.map((n, i) => (
                      <TaggedItem key={i} item={n} tagBg="#fee2e2" tagBorder="#fca5a5" tagColor="#b91c1c" />
                    ))}
                  </ul>
                  {highlights.length > 0 && (
                    <>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: '#9a3412', marginTop: 10, marginBottom: 4 }}>🎗️ 이 연령대에 추가되는 국가검진</p>
                      <ul style={{ fontSize: 13, lineHeight: 1.6, paddingLeft: 20, color: '#7c2d12' }}>
                        {highlights.map((n, i) => (
                          <TaggedItem key={i} item={n} tagBg="#ffedd5" tagBorder="#fdba74" tagColor="#9a3412" />
                        ))}
                      </ul>
                    </>
                  )}
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
                📅 최종 확인: {data.lastVerified} · 이 페이지는 위 공공기관 자료를 요약·정리한 참고용 안내이며, 의학적 진단이나 개인별 검진 계획을 대신하지 않아요. 실제 대상 여부·주기는 개인 건강상태·가족력에 따라 다를 수 있으니 국민건강보험공단 홈페이지에서 본인 대상 여부를 꼭 확인하고, 담당 의료진과 상담해주세요.
              </p>
            </section>

            <Link href="/health-guide/nutrients" className="back-link">🥗 연령별 영양소 가이드도 보기 →</Link>
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
