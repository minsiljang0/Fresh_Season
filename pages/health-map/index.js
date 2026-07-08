import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

// 신체 부위별 존 정의
// - keywords: DB의 health_benefits.category 문자열에 포함되는지(includes)로 매칭 (map.js의 BENEFIT_COLOR 방식과 동일)
// - nutrients: 그 부위에 일반적으로 좋다고 알려진 대표 성분 (교육용 참고 정보, 의학적 처방 아님)
// - pos: SVG 위 마커 좌표 (viewBox 0 0 300 480 기준, 해부학적으로 정확한 위치가 아니라 이해를 돕기 위한 대략적 표시)
const ZONES = [
  { id: 'brain', num: 1, emoji: '🧠', label: '뇌·집중력', keywords: ['두뇌', '기억력', '치매', '집중'],
    nutrients: ['DHA', '오메가3', '레시틴', '비타민B군'],
    blurb: '기억력과 집중력엔 DHA, 오메가3 같은 필수지방산이 대표적으로 알려져 있어요.',
    color: '#6366f1', bg: '#ede9fe', pos: { x: 150, y: 8 } },
  { id: 'eye', num: 2, emoji: '👁️', label: '눈', keywords: ['눈', '시력', '안구'],
    nutrients: ['루테인', '지아잔틴', '비타민A', '안토시아닌'],
    blurb: '눈 건강엔 루테인·지아잔틴(당근·시금치 등 녹황색 채소), 안토시아닌(블루베리 등)이 좋다고 알려져 있어요.',
    color: '#f59e0b', bg: '#fef3c7', pos: { x: 181, y: 16 } },
  { id: 'skinTone', num: 3, emoji: '🌟', label: '피부색·미백', keywords: ['미백', '피부톤'],
    nutrients: ['비타민C', '글루타치온', '나이아신아마이드'],
    blurb: '피부 톤 관리엔 비타민C, 글루타치온이 도움이 된다고 알려져 있어요.',
    color: '#fb923c', bg: '#ffedd5', pos: { x: 204, y: 39 } },
  { id: 'sleep', num: 4, emoji: '😴', label: '잠(수면)', keywords: ['수면', '불면'],
    nutrients: ['멜라토닌', '트립토판', '글리신', '마그네슘'],
    blurb: '숙면엔 멜라토닌 생성을 돕는 트립토판(우유·바나나 등), 마그네슘이 도움이 된다고 알려져 있어요.',
    color: '#0ea5e9', bg: '#e0f2fe', pos: { x: 212, y: 70 } },
  { id: 'stress', num: 5, emoji: '😌', label: '스트레스·멘탈', keywords: ['스트레스', '신경'],
    nutrients: ['마그네슘', '테아닌', '비타민B군', '트립토판'],
    blurb: '스트레스 완화엔 마그네슘, 테아닌(녹차 등)이 도움이 된다고 알려져 있어요.',
    color: '#14b8a6', bg: '#ccfbf1', pos: { x: 119, y: 16 } },
  { id: 'scalp', num: 6, emoji: '💆', label: '두피', keywords: ['두피'],
    nutrients: ['비오틴', '아연', '판토텐산'],
    blurb: '두피 건강엔 비오틴, 아연이 도움이 된다고 알려져 있어요.',
    color: '#a855f7', bg: '#f3e8ff', pos: { x: 96, y: 39 } },
  { id: 'hair', num: 7, emoji: '💇', label: '머리카락', keywords: ['모발', '탈모'],
    nutrients: ['비오틴', '케라틴(단백질)', '철분', '아연'],
    blurb: '모발 건강엔 단백질(케라틴 구성 성분), 비오틴, 철분·아연이 도움이 된다고 알려져 있어요.',
    color: '#8b5cf6', bg: '#ede9fe', pos: { x: 88, y: 70 } },
  { id: 'heart', num: 8, emoji: '❤️', label: '심장·혈관', keywords: ['심장', '혈관', '혈압', '혈액', '콜레스테롤'],
    nutrients: ['오메가3', '칼륨', '코엔자임Q10', '식이섬유'],
    blurb: '혈관 건강과 혈압 관리엔 오메가3, 칼륨, 항산화 성분이 도움이 된다고 알려져 있어요.',
    color: '#ef4444', bg: '#fee2e2', pos: { x: 150, y: 122 } },
  { id: 'stomach', num: 9, emoji: '🍽️', label: '위', keywords: ['위', '위장'],
    nutrients: ['무기질', '식이섬유', '소화효소(브로멜라인 등)'],
    blurb: '위 건강엔 소화를 돕는 효소가 든 식재료(파인애플·무 등)와 자극이 적은 담백한 식이가 도움이 된다고 알려져 있어요.',
    color: '#22c55e', bg: '#dcfce7', pos: { x: 122, y: 158 } },
  { id: 'liver', num: 10, emoji: '🫀', label: '간', keywords: ['간', '해독'],
    nutrients: ['타우린', '실리마린', '항산화 성분'],
    blurb: '간 건강엔 타우린(문어·조개류 등), 항산화 성분이 도움이 된다고 알려져 있어요.',
    color: '#65a30d', bg: '#ecfccb', pos: { x: 185, y: 158 } },
  { id: 'gut', num: 11, emoji: '🌿', label: '장', keywords: ['장', '변비', '소화'],
    nutrients: ['식이섬유', '유산균(프로바이오틱스)'],
    blurb: '장 건강엔 식이섬유와 유산균이 대표적으로 알려져 있어요.',
    color: '#10b981', bg: '#d1fae5', pos: { x: 150, y: 200 } },
  { id: 'weight', num: 12, emoji: '⚖️', label: '체중·다이어트', keywords: ['체중', '다이어트', '비만'],
    nutrients: ['식이섬유', '단백질', '카테킨'],
    blurb: '체중 관리엔 포만감을 주는 식이섬유·단백질, 카테킨(녹차 등)이 도움이 된다고 알려져 있어요.',
    color: '#d946ef', bg: '#fae8ff', pos: { x: 150, y: 232 } },
  { id: 'skin', num: 13, emoji: '✨', label: '피부(탄력)', keywords: ['피부', '미용', '콜라겐'],
    nutrients: ['콜라겐', '비타민C', '코엔자임Q10'],
    blurb: '피부 탄력엔 콜라겐과 이를 돕는 비타민C가 대표적으로 알려져 있어요.',
    color: '#ec4899', bg: '#fce7f3', pos: { x: 232, y: 175 } },
  { id: 'joint', num: 14, emoji: '🦵', label: '관절', keywords: ['관절'],
    nutrients: ['글루코사민', '콘드로이친', '오메가3', 'MSM'],
    blurb: '관절 건강엔 글루코사민·콘드로이친, 오메가3가 대표적으로 알려져 있어요. (철분은 빈혈 쪽 성분이라 관절과는 거리가 있어요)',
    color: '#f59e0b', bg: '#fef3c7', pos: { x: 120, y: 390 } },
  { id: 'bone', num: 15, emoji: '🦴', label: '뼈', keywords: ['뼈', '골다공증'],
    nutrients: ['칼슘', '비타민D', '마그네슘', '비타민K'],
    blurb: '뼈 건강엔 칼슘과 흡수를 돕는 비타민D가 대표적으로 알려져 있어요.',
    color: '#eab308', bg: '#fef9c3', pos: { x: 180, y: 430 } },
  { id: 'immune', num: 16, emoji: '🛡️', label: '면역·항산화', keywords: ['면역', '항산화', '항암'],
    nutrients: ['비타민C', '폴리페놀', '베타카로틴', '아연'],
    blurb: '면역력과 항산화엔 비타민C, 폴리페놀, 베타카로틴이 도움이 된다고 알려져 있어요.',
    color: '#16a34a', bg: '#dcfce7', pos: { x: 40, y: 110 } },
]

export default function HealthMapPage() {
  const [rawFoods, setRawFoods] = useState([])
  const [healthBenefits, setHealthBenefits] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState('brain')

  useEffect(() => {
    fetch('/api/map/seasonal-foods')
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        setRawFoods(Array.isArray(data) ? data : (data.foods || []))
        setHealthBenefits(data.healthBenefits || [])
      })
      .catch(() => { setRawFoods([]); setHealthBenefits([]) })
      .finally(() => setLoading(false))
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

  const zoneMatch = (cat, keywords) => !!cat && keywords.some(k => cat.includes(k))

  const zoneData = useMemo(() => {
    const out = {}
    ZONES.forEach(z => {
      const matchedCategories = Array.from(new Set(
        healthBenefits.filter(b => zoneMatch(b.category, z.keywords)).map(b => b.category)
      ))
      const matchedFoods = allFoods
        .filter(f => (f.healthBenefits || []).some(hb => zoneMatch(hb.category, z.keywords)))
        .sort((a, b) => a.ingredient.localeCompare(b.ingredient, 'ko'))
      out[z.id] = { matchedCategories, matchedFoods }
    })
    return out
  }, [allFoods, healthBenefits])

  const zone = ZONES.find(z => z.id === active) || ZONES[0]
  const data = zoneData[zone.id] || { matchedCategories: [], matchedFoods: [] }

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
              {/* 몸 실루엣 */}
              <circle cx="150" cy="55" r="32" fill="var(--surface2)" stroke="var(--border)" strokeWidth="2" />
              <rect x="138" y="82" width="24" height="18" fill="var(--surface2)" stroke="var(--border)" strokeWidth="2" />
              <path d="M100,100 Q150,88 200,100 L212,235 Q150,252 88,235 Z" fill="var(--surface2)" stroke="var(--border)" strokeWidth="2" />
              {/* 팔 */}
              <path d="M100,105 Q78,150 82,195 Q84,210 92,208 Q98,165 112,112 Z" fill="var(--surface2)" stroke="var(--border)" strokeWidth="2" />
              <path d="M200,105 Q222,150 218,195 Q216,210 208,208 Q202,165 188,112 Z" fill="var(--surface2)" stroke="var(--border)" strokeWidth="2" />
              {/* 다리 */}
              <path d="M100,238 L92,440 Q92,450 104,450 Q112,450 114,440 L128,240 Z" fill="var(--surface2)" stroke="var(--border)" strokeWidth="2" />
              <path d="M200,238 L208,440 Q208,450 196,450 Q188,450 186,440 L172,240 Z" fill="var(--surface2)" stroke="var(--border)" strokeWidth="2" />

              {/* 전신 아우라(면역) 점선 */}
              <ellipse cx="150" cy="180" rx="128" ry="200" fill="none" stroke="#16a34a" strokeWidth="1.5" strokeDasharray="5 5" opacity={active === 'immune' ? 0.55 : 0.15} />

              {/* 존 마커들 (번호) */}
              {ZONES.map(z => {
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {zone.nutrients.map(n => (
                  <span key={n} style={{
                    fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                    background: '#fff', color: zone.color, border: `1.5px solid ${zone.color}`,
                  }}>💊 {n}</span>
                ))}
              </div>
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

            {data.matchedCategories.length > 0 && (
              <div className="detail-box">
                <p className="detail-label">🏷️ 관련 효능 카테고리 전체보기</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {data.matchedCategories.map(cat => (
                    <Link key={cat} href={`/health/${encodeURIComponent(cat)}`}
                      style={{
                        fontSize: 12.5, fontWeight: 600, padding: '5px 10px', borderRadius: 8,
                        background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)',
                        textDecoration: 'none',
                      }}>
                      {cat} →
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 전체 부위 목록 */}
        <section style={{ marginTop: 28 }}>
          <p className="detail-label" style={{ marginBottom: 10 }}>부위별 바로가기</p>
          <div className="grid-auto">
            {ZONES.map(z => (
              <button key={z.id} onClick={() => setActive(z.id)} className="card"
                style={{
                  textAlign: 'left', border: `1.5px solid ${z.id === active ? z.color : 'var(--border)'}`,
                  background: z.id === active ? z.bg : 'var(--surface)', cursor: 'pointer', font: 'inherit',
                }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: z.color, marginBottom: 4 }}>
                  {z.num}. {z.emoji} {z.label}
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 6 }}>{z.nutrients.join(' · ')}</p>
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
