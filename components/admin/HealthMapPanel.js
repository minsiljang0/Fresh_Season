import { useState, useEffect, useCallback, useMemo } from 'react'
import { ZONES } from '../../lib/healthMapZones'

const api = (extra = '') => `/api/admin/health-map${extra}`

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, opts)
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `요청 실패 (${res.status})`) }
  return res.json()
}

const btnStyle = (bg, color = '#fff') => ({ padding: '6px 12px', borderRadius: 6, border: 'none', background: bg, color, fontSize: 12, fontWeight: 700, cursor: 'pointer' })
const chipStyle = { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, background: '#f3f4f6', border: '1px solid #e5e7eb', fontSize: 13 }

export default function HealthMapPanel({ adminToken }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedZone, setSelectedZone] = useState(ZONES[0].id)
  const [newNutrient, setNewNutrient] = useState('')
  const [toast, setToast] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    apiFetch(api(), { headers: { 'x-admin-token': adminToken } })
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [adminToken])

  useEffect(() => { load() }, [load])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const byZone = useMemo(() => {
    const map = {}
    rows.forEach(r => { if (!map[r.zone_id]) map[r.zone_id] = []; map[r.zone_id].push(r) })
    Object.values(map).forEach(list => list.sort((a, b) => a.sort_order - b.sort_order))
    return map
  }, [rows])

  const zone = ZONES.find(z => z.id === selectedZone)
  const zoneRows = byZone[selectedZone] || []

  const addNutrient = async () => {
    const name = newNutrient.trim()
    if (!name) return
    try {
      const nextOrder = zoneRows.length > 0 ? Math.max(...zoneRows.map(r => r.sort_order)) + 1 : 1
      await apiFetch(api(), {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ zone_id: selectedZone, nutrient: name, sort_order: nextOrder }),
      })
      setNewNutrient('')
      showToast('✅ 추가했어요')
      load()
    } catch (e) {
      alert('추가 실패: ' + e.message)
    }
  }

  const removeNutrient = async (row) => {
    if (!confirm(`"${row.nutrient}" 를 삭제할까요?`)) return
    try {
      await apiFetch(api(`&id=${row.id}`), { method: 'DELETE', headers: { 'x-admin-token': adminToken } })
      showToast('🗑️ 삭제했어요')
      load()
    } catch (e) {
      alert('삭제 실패: ' + e.message)
    }
  }

  const move = async (row, dir) => {
    const list = zoneRows
    const idx = list.findIndex(r => r.id === row.id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= list.length) return
    const other = list[swapIdx]
    try {
      await Promise.all([
        apiFetch(api(`&id=${row.id}`), { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ sort_order: other.sort_order }) }),
        apiFetch(api(`&id=${other.id}`), { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ sort_order: row.sort_order }) }),
      ])
      load()
    } catch (e) {
      alert('순서 변경 실패: ' + e.message)
    }
  }

  const seedDefaults = async () => {
    if (!confirm('아직 영양소가 하나도 등록되지 않은 부위에 한해 기본값을 채워넣을까요? (이미 등록된 부위는 건드리지 않아요)')) return
    try {
      const result = await apiFetch(api('&action=seed_defaults'), { method: 'PUT', headers: { 'x-admin-token': adminToken } })
      showToast(`✅ ${result.inserted}개 채워넣었어요`)
      load()
    } catch (e) {
      alert('실패: ' + e.message)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>🧍 건강지도 관리</h2>
          <p style={{ fontSize: 12, color: '#888' }}>
            /health-map 페이지의 신체 부위별 "좋은 성분" 목록을 관리해요. 부위를 고르고 성분을 추가·삭제·순서변경하면 바로 반영돼요.
          </p>
        </div>
        <button onClick={seedDefaults} style={btnStyle('#f59e0b')}>🌱 기본값 채우기</button>
      </div>

      <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
        {/* 부위 목록 */}
        <div style={{ flex: '0 0 220px', display: 'grid', gap: 6, alignContent: 'start' }}>
          {ZONES.map(z => (
            <button key={z.id} onClick={() => setSelectedZone(z.id)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                border: `1.5px solid ${selectedZone === z.id ? z.color : '#e5e7eb'}`,
                background: selectedZone === z.id ? z.bg : '#fff',
                color: selectedZone === z.id ? z.color : '#374151',
                fontSize: 13, fontWeight: 700,
              }}>
              <span>{z.num}. {z.emoji} {z.label}</span>
              <span style={{ fontSize: 11, opacity: 0.7 }}>{(byZone[z.id] || []).length}</span>
            </button>
          ))}
        </div>

        {/* 선택된 부위의 영양소 관리 */}
        <div style={{ flex: '1 1 320px', minWidth: 280 }}>
          {loading ? (
            <p style={{ fontSize: 13, color: '#999' }}>불러오는 중...</p>
          ) : (
            <>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: zone.bg, marginBottom: 14 }}>
                <div style={{ fontWeight: 800, color: zone.color, marginBottom: 4 }}>{zone.num}. {zone.emoji} {zone.label}</div>
                <p style={{ fontSize: 12, color: '#555' }}>{zone.blurb}</p>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input value={newNutrient} onChange={e => setNewNutrient(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addNutrient() }}
                  placeholder="새 성분 이름 (예: 콘드로이친)"
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }} />
                <button onClick={addNutrient} style={btnStyle('#16a34a')}>+ 추가</button>
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                {zoneRows.length === 0 && <p style={{ fontSize: 13, color: '#999' }}>아직 등록된 성분이 없어요.</p>}
                {zoneRows.map((row, i) => (
                  <div key={row.id} style={chipStyle}>
                    <span style={{ flex: 1, fontWeight: 600 }}>💊 {row.nutrient}</span>
                    <button onClick={() => move(row, -1)} disabled={i === 0} style={{ ...btnStyle('#e5e7eb', '#374151'), opacity: i === 0 ? 0.4 : 1, padding: '3px 8px' }}>↑</button>
                    <button onClick={() => move(row, 1)} disabled={i === zoneRows.length - 1} style={{ ...btnStyle('#e5e7eb', '#374151'), opacity: i === zoneRows.length - 1 ? 0.4 : 1, padding: '3px 8px' }}>↓</button>
                    <button onClick={() => removeNutrient(row)} style={btnStyle('#dc2626')}>삭제</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#111', color: '#fff', padding: '10px 20px', borderRadius: 999, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
