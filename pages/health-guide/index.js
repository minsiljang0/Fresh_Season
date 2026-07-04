import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { TaggedItem, FoodLink } from '../../components/HealthGuideBits'

export default function HealthGuideIndex() {
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
        <title>연령별 건강 가이드 — Fresh Season</title>
        <meta name="description" content="보건복지부 한국인 영양소 섭취기준, 국민건강보험공단 국가건강검진 기준, 교육부 학교급식법을 바탕으로 정리한 연령별 영양소·질환·급식 가이드." />
      </Head>
      <Header />
      <main className="wrap" style={{ paddingTop: 20, paddingBottom: 60 }}>

        <section style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>📖 연령별 건강 가이드</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            보건복지부 「한국인 영양소 섭취기준」, 국민건강보험공단 국가건강검진·국가암검진, 교육부 학교급식법을 서로 교차 확인해서 연령대별로 하나로 정리했어요.
            <br />🧬 <Link href="/for-me" style={{ color: 'var(--accent, #16a34a)', fontWeight: 700 }}>나에게 맞는 제철 먹거리</Link> 페이지의 연령별 추천도 이 기준을 참고해서 만들어져요. 뱃지 아래 <b>🍽️ 링크</b>가 있으면, 그 이슈에 도움되는 식재료를 바로 볼 수 있어요.
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

            {/* 연령대별 통합 카드 — 영양소 + 질환·검진 + 학교급식 */}
            {(data.order || []).map(id => {
              const g = data.groups[id]
              const nutrients = data.nutrients[id] || []
              const issues = data.issues[id] || []
              const highlights = data.checkupHighlights[id] || []
              const schoolMeal = data.schoolMeal[id] || []
              if (!g) return null
              return (
                <section key={id} id={id} className="detail-box" style={{ marginBottom: 20, padding: '20px 22px' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>
                    {g.emoji} {g.label} <span style={{ color: 'var(--text2)', fontWeight: 700, fontSize: 14 }}>({g.range})</span>
                  </h2>
                  <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>{g.kdriRange}</p>

                  {nutrients.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>🥗 챙기면 좋은 영양소</p>
                      <ul style={{ fontSize: 14, lineHeight: 1.7, paddingLeft: 20 }}>
                        {nutrients.map((n, i) => (
                          <TaggedItem key={i} item={n} tagBg="#dcfce7" tagBorder="#86efac" tagColor="#166534" />
                        ))}
                      </ul>
                    </div>
                  )}

                  {issues.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>🩺 관심 가져야 할 질환·검진 이슈</p>
                      <ul style={{ fontSize: 14, lineHeight: 1.7, paddingLeft: 20 }}>
                        {issues.map((n, i) => (
                          <TaggedItem key={i} item={n} tagBg="#fee2e2" tagBorder="#fca5a5" tagColor="#b91c1c" />
                        ))}
                      </ul>
                    </div>
                  )}

                  {highlights.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: '#9a3412', marginBottom: 6 }}>🎗️ 이 연령대에 추가되는 국가검진</p>
                      <ul style={{ fontSize: 13, lineHeight: 1.6, paddingLeft: 20, color: '#7c2d12' }}>
                        {highlights.map((n, i) => (
                          <TaggedItem key={i} item={n} tagBg="#ffedd5" tagBorder="#fdba74" tagColor="#9a3412" />
                        ))}
                      </ul>
                    </div>
                  )}

                  {schoolMeal.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>🍱 학교급식 기준 (학교급식법)</p>
                      <ul style={{ fontSize: 14, lineHeight: 1.7, paddingLeft: 20 }}>
                        {schoolMeal.map((n, i) => (
                          <TaggedItem key={i} item={n} tagBg="#ede9fe" tagBorder="#c4b5fd" tagColor="#5b21b6" />
                        ))}
                      </ul>
                    </div>
                  )}

                  <p style={{ fontSize: 12, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', marginTop: 4 }}>
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
                📅 최종 확인: {data.lastVerified} · 이 페이지는 위 공공기관 자료를 요약·정리한 참고용 안내이며, 의학적 진단이나 개인별 처방·검진 계획을 대신하지 않아요. 개인의 건강 상태에 따라 필요한 검사·영양·급식 관리는 다를 수 있으니 정확한 내용은 담당 의료진·영양사와 상담해주세요.
              </p>
            </section>
          </>
        )}

        <Link href="/" className="back-link">← 홈으로</Link>
      </main>
      <Footer />
    </>
  )
}
