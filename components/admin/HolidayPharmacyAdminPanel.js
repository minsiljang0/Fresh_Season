import { useState, useEffect, useMemo } from 'react'
import { REGIONS } from '../../lib/regions'

// 2026년 법정공휴일·대체공휴일·명절연휴 — 공개페이지(pages/holiday-pharmacy)와 동일 기준. 매년 1월 갱신 필요.
const HOLIDAYS_2026 = new Set([
  '2026-01-01',
  '2026-02-16', '2026-02-17', '2026-02-18',
  '2026-03-01', '2026-03-02',
  '2026-05-05', '2026-05-24', '2026-05-25',
  '2026-06-06',
  '2026-08-15', '2026-08-17',
  '2026-09-24', '2026-09-25', '2026-09-26',
  '2026-10-03', '2026-10-05', '2026-10-09',
  '2026-12-25',
])

function fmtTime(hhmm) {
  if (!hhmm || hhmm.length !== 4) return null
  return `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`
}

function todayFieldIdx() {
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const jsDay = now.getDay()
  return HOLIDAYS_2026.has(dateStr) ? 8 : (jsDay === 0 ? 7 : jsDay)
}

function isOpenNow(ph) {
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const jsDay = now.getDay() // 0=일 ~ 6=토
  // 일요일(dutyTime7)과 실제 지정 공휴일(dutyTime8)은 서로 다른 필드 — 혼동 금지
  const idx = HOLIDAYS_2026.has(dateStr) ? 8 : (jsDay === 0 ? 7 : jsDay)
  const openStr = ph[`duty_time${idx}_s`]
  const closeStr = ph[`duty_time${idx}_c`]
  if (!openStr || !closeStr) return false
  const nowHM = now.getHours() * 100 + now.getMinutes()
  const openHM = Number(openStr), closeHM = Number(closeStr)
  if (closeHM < openHM) return nowHM >= openHM || nowHM <= closeHM
  return nowHM >= openHM && nowHM <= closeHM
}

// 주소 문자열에서 시군구를 찾아 매칭 (일치하는 게 없으면 "기타"로 묶음)
function extractDistrict(addr, districts) {
  if (!addr) return '기타'
  return districts.find(d => addr.includes(d)) || '기타'
}

export default function HolidayPharmacyAdminPanel() {
  const [sido, setSido] = useState('')
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(false)
  const [onlyOpenNow, setOnlyOpenNow] = useState(true)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000) // 30초마다 "지금" 갱신
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!sido) { setPharmacies([]); return }
    setLoading(true)
    fetch(`/api/holiday-pharmacy?sido=${encodeURIComponent(sido)}`)
      .then(r => r.json())
      .then(d => setPharmacies(Array.isArray(d) ? d : []))
      .catch(() => setPharmacies([]))
      .finally(() => setLoading(false))
  }, [sido])

  const selectedRegion = REGIONS.find(r => r.name === sido)

  const filtered = useMemo(() => {
    return onlyOpenNow ? pharmacies.filter(p => isOpenNow(p)) : pharmacies
  }, [pharmacies, onlyOpenNow, now])

  const grouped = useMemo(() => {
    if (!selectedRegion) return []
    const map = {}
    filtered.forEach(p => {
      const d = extractDistrict(p.addr, selectedRegion.districts)
      if (!map[d]) map[d] = []
      map[d].push(p)
    })
    Object.values(map).forEach(list => list.sort((a, b) => a.name.localeCompare(b.name, 'ko')))
    return Object.keys(map)
      .sort((a, b) => a.localeCompare(b, 'ko'))
      .map(d => ({ district: d, list: map[d] }))
  }, [filtered, selectedRegion])

  const nowLabel = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>💊 휴일약국</h2>
      <p style={{ fontSize: 12, color: '#8aaa8a', marginBottom: 16 }}>
        긴급 상황용 — 지금 이 순간({nowLabel}) 실제로 문 연 약국만 우선 보여줍니다.
      </p>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <select
          value={sido}
          onChange={e => setSido(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1e8d1', fontSize: 14 }}
        >
          <option value="">시도 선택</option>
          {REGIONS.map(r => (
            <option key={r.id} value={r.name}>{r.icon} {r.name}</option>
          ))}
        </select>

        <button
          onClick={() => setOnlyOpenNow(v => !v)}
          style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            borderColor: onlyOpenNow ? '#16a34a' : '#d1e8d1',
            background: onlyOpenNow ? '#16a34a' : '#fff',
            color: onlyOpenNow ? '#fff' : '#4b6e4b',
          }}
        >
          ✅ 지금 영업중만 {onlyOpenNow ? '켜짐' : '꺼짐'}
        </button>
      </div>

      {loading && <p style={{ color: '#8aaa8a' }}>불러오는 중...</p>}

      {!loading && sido && (
        <p style={{ color: '#4b6e4b', fontSize: 13, marginBottom: 16 }}>
          {sido} {onlyOpenNow ? '지금 영업중' : '전체'} {filtered.length}곳 · {grouped.length}개 구/시/군
        </p>
      )}

      {!loading && grouped.map(({ district, list }) => (
        <div key={district} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#15803d', marginBottom: 8, borderBottom: '2px solid #dcfce7', paddingBottom: 4 }}>
            {district} <span style={{ fontWeight: 400, color: '#8aaa8a', fontSize: 12 }}>({list.length}곳)</span>
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {list.map(p => {
              const idx = todayFieldIdx()
              const openTime = fmtTime(p[`duty_time${idx}_s`])
              const closeTime = fmtTime(p[`duty_time${idx}_c`])
              const fieldLabel = idx === 8 ? '공휴일' : idx === 7 ? '일요일' : '오늘'
              const openNow = isOpenNow(p)
              return (
                <li key={p.id} style={{ padding: '6px 0', borderBottom: '1px solid #f0f4f0', fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
                  {openNow && <span style={{ color: '#fff', background: '#16a34a', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>영업중</span>}
                  <strong style={{ minWidth: 140 }}>{p.name}</strong>
                  <span style={{ color: '#666' }}>{p.addr}</span>
                  <span style={{ color: '#666' }}>{p.tel}</span>
                  {openTime && closeTime && (
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>{fieldLabel} {openTime}~{closeTime}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      {!loading && sido && grouped.length === 0 && (
        <p style={{ color: '#8aaa8a' }}>
          {onlyOpenNow ? '지금 이 시간엔 영업중인 약국이 없어요. "영업중만" 필터를 꺼보세요.' : '데이터가 없어요.'}
        </p>
      )}
    </div>
  )
}
