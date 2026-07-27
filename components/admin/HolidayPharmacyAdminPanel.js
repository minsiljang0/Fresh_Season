import { useState, useEffect, useMemo } from 'react'
import { REGIONS } from '../../lib/regions'

function fmtTime(hhmm) {
  if (!hhmm || hhmm.length !== 4) return null
  return `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`
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

  const grouped = useMemo(() => {
    if (!selectedRegion) return []
    const map = {}
    pharmacies.forEach(p => {
      const d = extractDistrict(p.addr, selectedRegion.districts)
      if (!map[d]) map[d] = []
      map[d].push(p)
    })
    Object.values(map).forEach(list => list.sort((a, b) => a.name.localeCompare(b.name, 'ko')))
    return Object.keys(map)
      .sort((a, b) => a.localeCompare(b, 'ko'))
      .map(d => ({ district: d, list: map[d] }))
  }, [pharmacies, selectedRegion])

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>💊 휴일약국</h2>

      <select
        value={sido}
        onChange={e => setSido(e.target.value)}
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1e8d1', fontSize: 14, marginBottom: 20 }}
      >
        <option value="">시도 선택</option>
        {REGIONS.map(r => (
          <option key={r.id} value={r.name}>{r.icon} {r.name}</option>
        ))}
      </select>

      {loading && <p style={{ color: '#8aaa8a' }}>불러오는 중...</p>}

      {!loading && sido && (
        <p style={{ color: '#4b6e4b', fontSize: 13, marginBottom: 16 }}>
          {sido} 총 {pharmacies.length}곳 · {grouped.length}개 구/시/군
        </p>
      )}

      {!loading && grouped.map(({ district, list }) => (
        <div key={district} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#15803d', marginBottom: 8, borderBottom: '2px solid #dcfce7', paddingBottom: 4 }}>
            {district} <span style={{ fontWeight: 400, color: '#8aaa8a', fontSize: 12 }}>({list.length}곳)</span>
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {list.map(p => {
              const openTime = fmtTime(p.duty_time8_s)
              const closeTime = fmtTime(p.duty_time8_c)
              return (
                <li key={p.id} style={{ padding: '6px 0', borderBottom: '1px solid #f0f4f0', fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
                  <strong style={{ minWidth: 140 }}>{p.name}</strong>
                  <span style={{ color: '#666' }}>{p.addr}</span>
                  <span style={{ color: '#666' }}>{p.tel}</span>
                  {openTime && closeTime && (
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>공휴일 {openTime}~{closeTime}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      {!loading && sido && grouped.length === 0 && (
        <p style={{ color: '#8aaa8a' }}>데이터가 없어요.</p>
      )}
    </div>
  )
}
