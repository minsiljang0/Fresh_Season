import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { ZONES, DEFAULT_NUTRIENTS } from '../../lib/healthMapZones'

export default function HealthMapPage() {
  const [rawFoods, setRawFoods] = useState([])
  const [healthBenefits, setHealthBenefits] = useState([])
  const [nutrientsByZone, setNutrientsByZone] = useState({})
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(ZONES[0].id)

  useEffect(() => {
    Promise.all([
      fetch('/api/map/seasonal-foods').then(r => r.ok ? r.json() : {}).catch(() => ({})),
      fetch('/api/health-map').then(r => r.ok ? r.json() : {}).catch(() => ({})),
    ]).then(([mapData, healthMapData]) => {
      setRawFoods(Array.isArray(mapData) ? mapData : (mapData.foods || []))
      setHealthBenefits(mapData.healthBenefits || [])
      // 관리자 페이지에서 아직 등록 전인 부위는 기본값으로 보여줘요.
      setNutrientsByZone({ ...DEFAULT_NUTRIENTS, ...(healthMapData.nutrients || {}) })
    }).finally(() => setLoading(false))
  }, [])

  // 지역 무관, 재료명 기준으로 합치기 (health/[category].js와 동일한 방식)
  const allFoods = useMemo(() => {
    const map = {}
    rawFoods.forEach(f => {
      if (!map[f.ingredient]) map[f.ingredient] = { ...f, months: [...(f.months || [])] }
      else (f.months || []).forEach(m => { if (!map[f.ingredient].months.includes(m)) map[f.ingredient].months.push(m) })
    })
    return Object.values(map)
  }, [rawFoods])

  // 실제 등록된 효능 카테고리(health_benefits.category)와 정확히 일치하는 것만 매칭
  const zoneData = useMemo(() => {
    const out = {}
    ZONES.forEach(z => {
      const hasCategory = healthBenefits.some(b => b.category === z.id)
      const matchedFoods = allFoods
        .filter(f => (f.healthBenefits || []).some(hb => hb.category === z.id))
        .sort((a, b) => a.ingredient.localeCompare(b.ingredient, 'ko'))
      out[z.id] = { hasCategory, matchedFoods }
    })
    return out
  }, [allFoods, healthBenefits])

  const zone = ZONES.find(z => z.id === active) || ZONES[0]
  const data = zoneData[zone.id] || { hasCategory: false, matchedFoods: [] }
  const nutrients = nutrientsByZone[zone.id] || []
  const bodyZones = ZONES.filter(z => z.pos)
  const lifeZones = ZONES.filter(z => !z.pos)

  return (
    <>
      <Head>
        <title>건강지도 — 부위별 좋은 성분 | Fresh Season</title>
        <meta name="description" content="사람 전신 그림에서 부위를 클릭하면 그 부위에 좋다고 알려진 성분과 제철 식재료를 바로 확인할 수 있는 건강지도예요." />
      </Head>
      <Header />
      <main className="wrap" style={{ paddingTop: 20, paddingBottom: 60 }}>

        <section style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>🧍 건강지도</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            신체 그림의 번호나, 아래 목록을 눌러보세요. 그 부위에 좋다고 알려진 대표 성분과, Fresh Season에 등록된 제철 식재료를 함께 보여드려요.
          </p>
        </section>

        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* 신체 그림 */}
          <div style={{ flex: '0 0 280px', margin: '0 auto' }}>
            <svg viewBox="0 0 300 460" style={{ width: '100%', maxWidth: 280, display: 'block', margin: '0 auto' }}>
              {/* 몸 실루엣 (플랫 일러스트 스타일) */}
              {/* 다리(바지) — 이중 스트로크로 아웃라인 느낌 */}
              <path d="M122,232 C114,270 110,320 108,370 C107,400 108,425 111,445" fill="none" stroke="var(--border)" strokeWidth="26" strokeLinecap="round" />
              <path d="M122,232 C114,270 110,320 108,370 C107,400 108,425 111,445" fill="none" stroke="var(--surface2)" strokeWidth="21" strokeLinecap="round" />
              <path d="M178,232 C186,270 190,320 192,370 C193,400 192,425 189,445" fill="none" stroke="var(--border)" strokeWidth="26" strokeLinecap="round" />
              <path d="M178,232 C186,270 190,320 192,370 C193,400 192,425 189,445" fill="none" stroke="var(--surface2)" strokeWidth="21" strokeLinecap="round" />
              {/* 신발 */}
              <ellipse cx="109" cy="449" rx="15" ry="8" fill="var(--text2)" />
              <ellipse cx="191" cy="449" rx="15" ry="8" fill="var(--text2)" />

              {/* 팔(소매) — 이중 스트로크 */}
              <path d="M120,102 C98,120 84,150 82,182 C81,194 84,205 90,212" fill="none" stroke="var(--accent)" strokeWidth="24" strokeLinecap="round" />
              <path d="M120,102 C98,120 84,150 82,182 C81,194 84,205 90,212" fill="none" stroke="var(--surface3)" strokeWidth="19" strokeLinecap="round" />
              <path d="M180,102 C202,120 216,150 218,182 C219,194 216,205 210,212" fill="none" stroke="var(--accent)" strokeWidth="24" strokeLinecap="round" />
              <path d="M180,102 C202,120 216,150 218,182 C219,194 216,205 210,212" fill="none" stroke="var(--surface3)" strokeWidth="19" strokeLinecap="round" />
              {/* 손 */}
              <circle cx="90" cy="212" r="9.5" fill="var(--surface2)" stroke="var(--border)" strokeWidth="1.5" />
              <circle cx="210" cy="212" r="9.5" fill="var(--surface2)" stroke="var(--border)" strokeWidth="1.5" />

              {/* 몸통(셔츠) */}
              <path d="M118,96 Q150,87 182,96 L194,150 Q198,182 191,211 Q186,230 150,233 Q114,230 109,211 Q102,182 106,150 Z"
                fill="var(--surface3)" stroke="var(--accent)" strokeWidth="2" />

              {/* 목 */}
              <rect x="139" y="76" width="22" height="18" rx="4" fill="var(--surface2)" stroke="var(--border)" strokeWidth="1.5" />

              {/* 머리 + 얼굴 */}
              <circle cx="150" cy="52" r="30" fill="var(--surface2)" stroke="var(--border)" strokeWidth="2" />
              <circle cx="140" cy="48" r="2.4" fill="var(--text2)" />
              <circle cx="160" cy="48" r="2.4" fill="var(--text2)" />
              <path d="M141,60 Q150,66 159,60" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round" />

              {/* 전신 아우라(면역) 점선 */}
              <ellipse cx="150" cy="180" rx="128" ry="200" fill="none" stroke="#16a34a" strokeWidth="1.5" strokeDasharray="5 5" opacity={active === '면역·항산화' ? 0.55 : 0.15} />

              {/* 존 마커들 (번호) — 신체 부위에 해당하는 것만 표시 */}
              {bodyZones.map(z => {
                const isActive = z.id === active
                return (
                  <g key={z.id} style={{ cursor: 'pointer' }} onClick={() => setActive(z.id)}>
                    <circle cx={z.pos.x} cy={z.pos.y} r={isActive ? 12 : 9.5} fill={z.color} opacity={isActive ? 1 : 0.8} stroke="#fff" strokeWidth="2" />
                    <text x={z.pos.x} y={z.pos.y + (isActive ? 4 : 3.5)} fontSize={isActive ? 12 : 10} fontWeight="800"
                      textAnchor="middle" fill="#fff">{z.num}</text>
                  </g>
                )
              })}
            </svg>
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
              👆 번호를 눌러보세요 · 정확한 해부학적 위치가 아니라 이해를 돕기 위한 표시예요
            </p>
          </div>

          {/* 상세 패널 */}
          <div style={{ flex: '1 1 340px', minWidth: 280 }}>
            <div className="detail-box" style={{ borderColor: zone.color, background: zone.bg }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6, color: zone.color }}>
                {zone.num}. {zone.emoji} {zone.label}
              </h2>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text)', marginBottom: 10 }}>{zone.blurb}</p>
              {nutrients.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--text3)' }}>아직 등록된 성분이 없어요. (관리자 페이지 &gt; 🧍 건강지도 관리)</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {nutrients.map(n => (
                    <span key={n} style={{
                      fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                      background: '#fff', color: zone.color, border: `1.5px solid ${zone.color}`,
                    }}>💊 {n}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="detail-box">
              <p className="detail-label">🍽️ 이 부위에 도움되는 제철 식재료</p>
              {loading ? (
                <p style={{ fontSize: 13, color: 'var(--text3)' }}>불러오는 중...</p>
              ) : data.matchedFoods.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text3)' }}>아직 "{zone.label}" 효능으로 등록된 식재료가 없어요.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {data.matchedFoods.map((f, i) => (
                    <Link key={i} href={`/ingredient/${encodeURIComponent(f.ingredient)}`}
                      style={{
                        fontSize: 13, fontWeight: 700, padding: '6px 12px', borderRadius: 999,
                        background: zone.bg, color: zone.color, border: `1.5px solid ${zone.color}55`,
                        textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                      {f.is_superfood && '🌟'} {f.ingredient}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {data.hasCategory && (
              <div className="detail-box">
                <p className="detail-label">🏷️ 이 효능 카테고리 전체보기</p>
                <Link href={`/health/${encodeURIComponent(zone.id)}`}
                  style={{
                    fontSize: 12.5, fontWeight: 600, padding: '5px 10px', borderRadius: 8,
                    background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)',
                    textDecoration: 'none', display: 'inline-block',
                  }}>
                  {zone.id} 전체 식재료 보기 →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 신체 부위 목록 */}
        <section style={{ marginTop: 28 }}>
          <p className="detail-label" style={{ marginBottom: 10 }}>부위별 바로가기</p>
          <div className="grid-auto">
            {bodyZones.map(z => (
              <button key={z.id} onClick={() => setActive(z.id)} className="card"
                style={{
                  textAlign: 'left', border: `1.5px solid ${z.id === active ? z.color : 'var(--border)'}`,
                  background: z.id === active ? z.bg : 'var(--surface)', cursor: 'pointer', font: 'inherit',
                }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: z.color, marginBottom: 4 }}>
                  {z.num}. {z.emoji} {z.label}
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 6 }}>
                  {(nutrientsByZone[z.id] || []).join(' · ') || '성분 미등록'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text3)' }}>
                  🍽️ {(zoneData[z.id]?.matchedFoods || []).length}개 식재료
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* 생활습관·연령별 관심사 목록 (특정 부위는 아니지만 등록된 나머지 효능 카테고리 전부) */}
        <section style={{ marginTop: 28 }}>
          <p className="detail-label" style={{ marginBottom: 10 }}>생활·연령별 관심사</p>
          <div className="grid-auto">
            {lifeZones.map(z => (
              <button key={z.id} onClick={() => setActive(z.id)} className="card"
                style={{
                  textAlign: 'left', border: `1.5px solid ${z.id === active ? z.color : 'var(--border)'}`,
                  background: z.id === active ? z.bg : 'var(--surface)', cursor: 'pointer', font: 'inherit',
                }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: z.color, marginBottom: 4 }}>
                  {z.num}. {z.emoji} {z.label}
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 6 }}>
                  {(nutrientsByZone[z.id] || []).join(' · ') || '성분 미등록'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text3)' }}>
                  🍽️ {(zoneData[z.id]?.matchedFoods || []).length}개 식재료
                </p>
              </button>
            ))}
          </div>
        </section>

        <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 20, lineHeight: 1.7 }}>
          💡 이 건강지도는 일반적으로 알려진 영양 정보를 부위별로 재미있게 정리한 참고용 콘텐츠예요. 의학적 진단이나 치료를 대신하지 않으니, 건강 상태에 따른 정확한 안내는 의료진·영양사와 상담해주세요.
        </p>

        <Link href="/" className="back-link" style={{ marginTop: 20, display: 'inline-block' }}>← 홈으로</Link>
      </main>
      <Footer />
    </>
  )
}
