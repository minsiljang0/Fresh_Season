
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { SkeletonBlogList } from '../../components/SkeletonCard'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { AdSlot } from '../../components/AdSlot'
import { useAdSlot } from '../../lib/AdSlotsContext'
import { REGIONS } from '../../lib/regions'
import { KOREA_PATHS } from '../../lib/koreaPaths'

function formatTime(hhmm) {
  if (!hhmm || hhmm.length !== 4) return null
  return `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// 2026년 법정공휴일·대체공휴일·명절연휴 전체 — 자동발행 크론(holiday-pharmacy-sync.yml)의
// SINGLE_DAY_HOLIDAYS_2026 및 설날(2/16~18)·추석(9/24~26) 연휴와 동일 기준. 매년 1월 갱신 필요.
const HOLIDAYS_2026 = new Set([
  '2026-01-01',
  '2026-02-16', '2026-02-17', '2026-02-18', // 설날 연휴
  '2026-03-01', '2026-03-02',
  '2026-05-05', '2026-05-24', '2026-05-25',
  '2026-06-06',
  '2026-08-15', '2026-08-17',
  '2026-09-24', '2026-09-25', '2026-09-26', // 추석 연휴
  '2026-10-03', '2026-10-05', '2026-10-09',
  '2026-12-25',
])
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function buildWeekStrip() {
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const dow = d.getDay()
    const isSunday = dow === 0
    const isHoliday = HOLIDAYS_2026.has(dateStr)
    days.push({
      dateStr, dow,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      dayLabel: DAY_LABELS[dow],
      isToday: i === 0,
      isSpecial: isSunday || isHoliday,
    })
  }
  return days
}

// 실제 렌더링된 각 시도 path의 getBBox() 중심좌표를 브라우저에서 직접 측정해서 반영한 값
// (map.js에서 가져온 원래 좌표가 이 페이지의 viewBox 기준으로는 안 맞아서 재측정함)
const REGION_LABEL_POS = {
  seoul: [165, 140], gyeonggi: [179, 136], incheon: [80, 128], gangwon: [249, 109],
  sejong: [185, 262], daejeon: [194, 290], chungnam: [158, 268], chungbuk: [231, 254],
  jeonbuk: [178, 365], jeonnam: [157, 469], gwangju: [156, 436], gyeongbuk: [324, 264],
  gyeongnam: [260, 417], daegu: [271, 355], ulsan: [315, 390], busan: [303, 432], jeju: [137, 654],
}
const REGION_SHORT = {
  seoul: '서울', busan: '부산', daegu: '대구', incheon: '인천', gwangju: '광주', daejeon: '대전',
  ulsan: '울산', sejong: '세종', gyeonggi: '경기', gangwon: '강원', chungbuk: '충북', chungnam: '충남',
  jeonbuk: '전북', jeonnam: '전남', gyeongbuk: '경북', gyeongnam: '경남', jeju: '제주',
}

function KoreaClickMap({ sidoId, onSelect, district, onSelectDistrict }) {
  const selectedRegion = REGIONS.find(r => r.id === sidoId)
  return (
    <svg viewBox="90 100 400 580" style={{ width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto', overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
      {REGIONS.map(r => {
        const pathD = KOREA_PATHS[r.id]
        if (!pathD) return null
        const isSelected = sidoId === r.id
        const [lx, ly] = REGION_LABEL_POS[r.id] || [0, 0]
        return (
          <g key={r.id} onClick={() => onSelect(isSelected ? '' : r.id)} style={{ cursor: 'pointer' }}>
            <path d={pathD} fill={isSelected ? 'var(--accent)' : '#0ea5e922'} stroke={isSelected ? '#0ea5e9' : '#0ea5e966'} strokeWidth={isSelected ? 1.5 : 0.6} style={{ transition: 'fill 0.15s' }} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 9, fontWeight: isSelected ? 700 : 600, fill: isSelected ? '#fff' : 'var(--text2)', pointerEvents: 'none', userSelect: 'none' }}>
              {REGION_SHORT[r.id]}
            </text>
          </g>
        )
      })}
      {selectedRegion && selectedRegion.districts?.length > 0 && (() => {
        const [px, py] = REGION_LABEL_POS[selectedRegion.id] || [200, 300]
        const boxW = 116, boxH = 150
        const bx = Math.min(Math.max(px - boxW / 2, 92), 480 - boxW)
        const by = Math.min(py + 12, 680 - boxH)
        return (
          <foreignObject x={bx} y={by} width={boxW} height={boxH}>
            <div xmlns="http://www.w3.org/1999/xhtml" style={{
              background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 8,
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)', fontSize: 11, height: boxH, overflowY: 'auto', padding: 4, boxSizing: 'border-box',
            }}>
              <div
                onClick={() => onSelectDistrict('')}
                style={{ padding: '4px 6px', fontWeight: 700, cursor: 'pointer', color: !district ? 'var(--accent)' : 'var(--text)', borderBottom: '1px solid var(--border)', marginBottom: 2 }}
              >
                전체 {selectedRegion.name}
              </div>
              {selectedRegion.districts.map(d => (
                <div
                  key={d}
                  onClick={() => onSelectDistrict(d)}
                  style={{ padding: '4px 6px', cursor: 'pointer', color: district === d ? 'var(--accent)' : 'var(--text2)', fontWeight: district === d ? 700 : 400 }}
                >
                  {selectedRegion.name} {d}
                </div>
              ))}
            </div>
          </foreignObject>
        )
      })()}
    </svg>
  )
}

function isOpenNow(ph, holidaySet) {
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const jsDay = now.getDay() // 0=일 ~ 6=토
  const idx = (holidaySet.has(dateStr) || jsDay === 0) ? 8 : jsDay
  const openStr = ph[`duty_time${idx}_s`]
  const closeStr = ph[`duty_time${idx}_c`]
  if (!openStr || !closeStr) return false
  const nowHM = now.getHours() * 100 + now.getMinutes()
  const openHM = Number(openStr), closeHM = Number(closeStr)
  if (closeHM < openHM) return nowHM >= openHM || nowHM <= closeHM // 자정 넘어가는 영업시간
  return nowHM >= openHM && nowHM <= closeHM
}

function WeekStrip() {
  const days = buildWeekStrip()
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 10 }}>
      {days.map(d => (
        <div key={d.dateStr} style={{
          flex: '1 0 auto', minWidth: 68, textAlign: 'center', padding: '10px 6px', borderRadius: 12,
          border: d.isToday ? '2px solid var(--accent)' : '1px solid var(--border)',
          background: d.isSpecial ? '#0ea5e922' : 'var(--surface)',
        }}>
          <div style={{ fontSize: 11, color: d.dow === 0 ? '#ef4444' : 'var(--text2)', fontWeight: 700 }}>{d.dayLabel}</div>
          <div style={{ fontSize: 14, fontWeight: 800, margin: '2px 0' }}>{d.label}</div>
          {d.isToday && <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700 }}>오늘</div>}
          {d.isSpecial ? (
            <div style={{ fontSize: 10, color: '#0ea5e9', fontWeight: 700 }}>💊 휴일약국</div>
          ) : (
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>평일</div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function HolidayPharmacy() {
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [sido, setSido] = useState('')
  const [district, setDistrict] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [onlyOpenNow, setOnlyOpenNow] = useState(false)
  const [myLocation, setMyLocation] = useState(null)
  const [locationError, setLocationError] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const middleSlot = useAdSlot('home_middle')

  const selectedRegion = REGIONS.find(r => r.name === sido)

  const selectSidoById = (id) => {
    setDistrict('')
    const region = REGIONS.find(r => r.id === id)
    setSido(region ? region.name : '')
  }

  const runSearch = () => { setMyLocation(null); setSearch(searchInput.trim()) }

  const findNearby = () => {
    setLocationLoading(true)
    setLocationError(false)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationLoading(false)
      },
      () => { setLocationError(true); setLocationLoading(false) }
    )
  }

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (sido) params.set('sido', sido)
    const q = district || search
    if (q) params.set('q', q)
    fetch(`/api/holiday-pharmacy?${params.toString()}`).then(r => r.json()).then(d => setPharmacies(Array.isArray(d) ? d : []))
      .catch(() => setPharmacies([])).finally(() => setLoading(false))
  }, [sido, district, search])

  let displayPharmacies = myLocation
    ? pharmacies
        .filter(p => p.lat && p.lng)
        .map(p => ({ ...p, dist: distanceKm(myLocation.lat, myLocation.lng, p.lat, p.lng) }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 30)
    : pharmacies
  if (onlyOpenNow) displayPharmacies = displayPharmacies.filter(p => isOpenNow(p, HOLIDAYS_2026))

  return (
    <>
      <Head>
        <title>일요일 약국 찾기 — 오늘 문 여는 휴일약국 | Fresh Season</title>
        <meta name="description" content="일요일·공휴일에 가까운 곳에서 지금 문 여는 약국을 바로 찾아보세요. 국립중앙의료원 공공데이터 기반, 매일 자동 갱신됩니다." />
      </Head>
      <Header />
      <main className="wrap">
        <section style={{ padding: '40px 0 20px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>💊 일요일 약국 찾기</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
            매주 일요일 + 신정·삼일절·어린이날 등 법정공휴일 + 설날·추석 연휴까지, 1년 내내 문 여는 약국을 국립중앙의료원 공공데이터로 매일 자동 갱신해서 보여드려요.
          </p>
          <WeekStrip />
        </section>

        {/* 전체 페이지 중단 배너 */}
        <div className="ad-banner-slot" style={{ padding: 0, margin: '0 0 24px' }}>
          <AdSlot slot="home_middle" label="중단 배너 광고" slotData={middleSlot} />
        </div>

        <section style={{ marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 300px', minWidth: 280 }}>
            <form onSubmit={e => { e.preventDefault(); runSearch() }} style={{ display: 'flex', gap: 6, maxWidth: 360, marginBottom: 10 }}>
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
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={findNearby}
                disabled={locationLoading}
                className="month-pill"
                style={{ fontWeight: 700, background: myLocation ? 'var(--accent)' : undefined, color: myLocation ? '#fff' : undefined, borderColor: myLocation ? 'var(--accent)' : undefined }}
              >
                {locationLoading ? '위치 확인 중...' : '📍 내 위치에서 가까운 순으로 찾기'}
              </button>
              <button
                onClick={() => setOnlyOpenNow(v => !v)}
                className="month-pill"
                style={{ fontWeight: 700, background: onlyOpenNow ? '#10b981' : undefined, color: onlyOpenNow ? '#fff' : undefined, borderColor: onlyOpenNow ? '#10b981' : undefined }}
              >
                ✅ 지금 영업중만
              </button>
            </div>

            {locationError && (
              <div style={{
                marginTop: 12, padding: 16, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', maxWidth: 420,
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📍 내 위치 확인을 허용하면 주변 약국을 더 빨리 찾을 수 있어요!</p>
                <ol style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8, paddingLeft: 18, marginBottom: 8 }}>
                  <li>주소창 왼쪽의 🔒(또는 위치) 아이콘을 클릭해주세요.</li>
                  <li>이 사이트의 위치 접근을 "허용"으로 바꾼 뒤, 아래 버튼을 다시 눌러주세요.</li>
                </ol>
                <button onClick={findNearby} className="month-pill" style={{ fontSize: 12, fontWeight: 700, background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}>
                  완료, 다시 찾기
                </button>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
                  * 위치를 허용하시면 지금 계신 곳에서 가까운 약국 순으로 보여드려요.<br />
                  * PC 환경에서는 위치 정확도가 다소 떨어질 수 있어요.
                </p>
              </div>
            )}
            {myLocation && (
              <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginTop: 8 }}>✅ 내 위치 기준 가까운 순으로 정렬했어요</p>
            )}
          </div>

          <div style={{ flex: '1 1 320px', minWidth: 280 }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
              🗺 지역을 클릭해서 검색하세요{selectedRegion ? ` — ${selectedRegion.icon} ${selectedRegion.name}${district ? ' ' + district : ''} 선택됨` : ''}
            </p>
            <KoreaClickMap
              sidoId={selectedRegion?.id || ''}
              onSelect={selectSidoById}
              district={district}
              onSelectDistrict={setDistrict}
            />
            {sido && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
                <button onClick={() => { setSido(''); setDistrict('') }} className="month-pill" style={{ fontSize: 12, fontWeight: 700 }}>
                  {selectedRegion?.icon} {sido}{district ? ` ${district}` : ''} ✕ 해제
                </button>
              </div>
            )}
          </div>
        </section>

        <section style={{ marginBottom: 64 }}>
          {loading && <SkeletonBlogList count={5} />}
          {!loading && displayPharmacies.length === 0 && (
            <div className="empty-state">
              <p>{search || sido ? '조건에 맞는 약국을 찾지 못했어요.' : '아직 수집된 약국 정보가 없어요. 매일 자동 수집이 곧 채워줄 거예요.'}</p>
            </div>
          )}
          <div className="grid-auto">
            {displayPharmacies.map(ph => {
              const openTime = formatTime(ph.duty_time8_s)
              const closeTime = formatTime(ph.duty_time8_c)
              return (
                <div key={ph.id} className="card" style={{ padding: 20 }}>
                  <span className="badge" style={{ marginBottom: 10, marginRight: 6, display: 'inline-block', background: '#0ea5e922', color: '#0ea5e9', border: '1px solid #0ea5e944' }}>
                    💊 {ph.sido}{ph.dist !== undefined ? ` · ${ph.dist.toFixed(1)}km` : ''}
                  </span>
                  {isOpenNow(ph, HOLIDAYS_2026) && (
                    <span className="badge" style={{ marginBottom: 10, display: 'inline-block', background: '#10b98122', color: '#10b981', border: '1px solid #10b98144' }}>
                      ✅ 지금 영업중
                    </span>
                  )}
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
