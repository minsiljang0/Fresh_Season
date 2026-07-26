
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { SkeletonBlogList } from '../../components/SkeletonCard'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { AdSlot } from '../../components/AdSlot'
import { useAdSlot } from '../../lib/AdSlotsContext'
import { REGIONS } from '../../lib/regions'

function formatTime(hhmm) {
  if (!hhmm || hhmm.length !== 4) return null
  return `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`
}

export default function HolidayPharmacy() {
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [sido, setSido] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const middleSlot = useAdSlot('home_middle')

  const runSearch = () => setSearch(searchInput.trim())

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (sido) params.set('sido', sido)
    if (search) params.set('q', search)
    fetch(`/api/holiday-pharmacy?${params.toString()}`).then(r => r.json()).then(d => setPharmacies(Array.isArray(d) ? d : []))
      .catch(() => setPharmacies([])).finally(() => setLoading(false))
  }, [sido, search])

  return (
    <>
      <Head>
        <title>휴일약국 — Fresh Season</title>
        <meta name="description" content="공휴일에도 문 여는 약국을 지역별로 확인하세요. 국립중앙의료원 공공데이터 기반으로 매일 자동 갱신됩니다." />
      </Head>
      <Header />
      <main className="wrap">
        <section style={{ padding: '40px 0 28px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>💊 휴일약국</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>공휴일에도 문 여는 약국을 지역별로 확인하세요 (국립중앙의료원 공공데이터, 매일 자동 갱신)</p>
        </section>

        {/* 전체 페이지 중단 배너 */}
        <div className="ad-banner-slot" style={{ padding: 0, margin: '0 0 24px' }}>
          <AdSlot slot="home_middle" label="중단 배너 광고" slotData={middleSlot} />
        </div>

        <section style={{ marginBottom: 20, display: 'flex', gap: 6, flexWrap: 'wrap', overflowX: 'auto' }}>
          <button
            onClick={() => setSido('')}
            className="month-pill"
            style={{ fontWeight: 700, flexShrink: 0, background: sido === '' ? 'var(--accent)' : undefined, color: sido === '' ? '#fff' : undefined, borderColor: sido === '' ? 'var(--accent)' : undefined }}
          >
            전체
          </button>
          {REGIONS.map(r => (
            <button
              key={r.id}
              onClick={() => setSido(r.name)}
              className="month-pill"
              style={{ fontWeight: 700, flexShrink: 0, background: sido === r.name ? 'var(--accent)' : undefined, color: sido === r.name ? '#fff' : undefined, borderColor: sido === r.name ? 'var(--accent)' : undefined }}
            >
              {r.icon} {r.name}
            </button>
          ))}
        </section>

        <section style={{ marginBottom: 28 }}>
          <form onSubmit={e => { e.preventDefault(); runSearch() }} style={{ display: 'flex', gap: 6, maxWidth: 360 }}>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="🔍 약국명·주소로 검색"
              className="month-pill"
              style={{ fontWeight: 500, flex: 1, minWidth: 0 }}
            />
            <button type="submit" className="month-pill" style={{ fontWeight: 700, flexShrink: 0, background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}>
              검색
            </button>
          </form>
        </section>

        <section style={{ marginBottom: 64 }}>
          {loading && <SkeletonBlogList count={5} />}
          {!loading && pharmacies.length === 0 && (
            <div className="empty-state">
              <p>{search || sido ? '조건에 맞는 약국을 찾지 못했어요.' : '아직 수집된 약국 정보가 없어요. 매일 자동 수집이 곧 채워줄 거예요.'}</p>
            </div>
          )}
          <div className="grid-auto">
            {pharmacies.map(ph => {
              const openTime = formatTime(ph.duty_time8_s)
              const closeTime = formatTime(ph.duty_time8_c)
              return (
                <div key={ph.id} className="card" style={{ padding: 20 }}>
                  <span className="badge" style={{ marginBottom: 10, display: 'inline-block', background: '#0ea5e922', color: '#0ea5e9', border: '1px solid #0ea5e944' }}>
                    💊 {ph.sido}
                  </span>
                  <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{ph.name}</h2>
                  <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{ph.addr}</p>
                  {openTime && closeTime && (
                    <p style={{ fontSize: 12, color: '#0ea5e9', fontWeight: 700, marginTop: 8 }}>
                      공휴일 진료 {openTime} ~ {closeTime}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {ph.tel && (
                      <a href={`tel:${ph.tel}`} className="month-pill" style={{ fontSize: 12, fontWeight: 700 }}>
                        📞 {ph.tel}
                      </a>
                    )}
                    <a
                      href={`https://map.kakao.com/?q=${encodeURIComponent(ph.addr || ph.name)}`}
                      target="_blank" rel="noreferrer"
                      className="month-pill" style={{ fontSize: 12, fontWeight: 700 }}
                    >
                      🗺 길찾기
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
