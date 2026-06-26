import { useState, useEffect } from 'react'
import { S, Toast } from './AdminUI'
import { DEFAULT_CATEGORIES, categoryLabel } from '../../lib/blogCategories'

const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12]

export default function SeasonalFoodPanel({ adminToken }) {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [form, setForm] = useState({ ingredient: '', region: 'seoul', district: '', months: [], health: '' })
  const [saving, setSaving] = useState(false)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200) }

  const load = async () => {
    setLoading(true)
    try {
      let url = '/api/admin/seasonal-foods'
      const params = []
      if (filterRegion) params.push(`region=${filterRegion}`)
      if (filterMonth) params.push(`month=${filterMonth}`)
      if (params.length) url += '?' + params.join('&')
      const res = await fetch(url, { headers: { 'x-admin-token': adminToken } })
      const data = await res.json()
      setFoods(Array.isArray(data) ? data : [])
    } catch { showToast('❌ 불러오기 실패') }
    setLoading(false)
  }

  useEffect(() => { load() }, [filterRegion, filterMonth])

  const toggleMonth = (m) => {
    setForm(f => ({
      ...f, months: f.months.includes(m) ? f.months.filter(x => x !== m) : [...f.months, m].sort((a,b)=>a-b)
    }))
  }

  const submit = async () => {
    if (!form.ingredient.trim() || !form.region || !form.months.length || !form.health.trim()) {
      showToast('⚠️ 재료명·시도·제철월·건강효능은 필수입니다'); return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/seasonal-foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setForm({ ingredient: '', region: 'seoul', district: '', months: [], health: '' })
      showToast('✅ 식재료 등록 완료'); load()
    } catch { showToast('❌ 등록 실패') }
    setSaving(false)
  }

  const deleteFood = async (id) => {
    if (!confirm('삭제할까요?')) return
    try {
      await fetch(`/api/admin/seasonal-foods?id=${id}`, { method: 'DELETE', headers: { 'x-admin-token': adminToken } })
      showToast('🗑 삭제됨'); load()
    } catch { showToast('❌ 삭제 실패') }
  }

  return (
    <div>
      <Toast msg={toast} />

      <div style={S.card}>
        <div style={S.cardTitle}>🌿 제철 식재료 등록</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={S.label}>재료명 *</label>
            <input value={form.ingredient} onChange={e => setForm(f => ({ ...f, ingredient: e.target.value }))} placeholder="예: 오징어" style={S.input} />
          </div>
          <div>
            <label style={S.label}>시도 *</label>
            <select value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} style={S.input}>
              {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>시군구 (선택)</label>
            <input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} placeholder="예: 속초시·강릉시" style={S.input} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>제철 월 * (복수 선택)</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {MONTHS.map(m => (
                <button key={m} onClick={() => toggleMonth(m)} style={{
                  width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${form.months.includes(m) ? '#16a34a' : '#d1e8d1'}`,
                  background: form.months.includes(m) ? '#0a2a0a' : '#f5f9f5',
                  color: form.months.includes(m) ? '#16a34a' : '#4b6e4b',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                }}>{m}</button>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>건강 효능 *</label>
            <textarea value={form.health} onChange={e => setForm(f => ({ ...f, health: e.target.value }))}
              placeholder="예: 타우린·DHA 풍부, 눈건강·피로회복" rows={2}
              style={{ ...S.textarea, fontFamily: "'Outfit', sans-serif" }} />
          </div>
        </div>
        <button onClick={submit} disabled={saving} style={{ ...S.btn(), opacity: saving ? 0.6 : 1 }}>
          {saving ? '등록 중...' : '+ 식재료 등록'}
        </button>
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={S.cardTitle}>📋 등록된 식재료 ({foods.length})</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} style={{ ...S.input, width: 160 }}>
              <option value="">전체 시도</option>
              {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
            </select>
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ ...S.input, width: 100 }}>
              <option value="">전체 월</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}월</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#8aaa8a' }}>불러오는 중...</div>
        ) : !foods.length ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#8aaa8a' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🌿</div>
            <div>등록된 식재료가 없습니다</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {foods.map(f => (
              <div key={f.id} style={{ ...S.row, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#0f1f0f' }}>{f.ingredient}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, background: '#0a2a0a', border: '1px solid #166534', borderRadius: 4, padding: '2px 8px', color: '#4ade80' }}>
                      {categoryLabel(f.region)}
                    </span>
                    {f.district && <span style={{ fontSize: 11, color: '#8aaa8a' }}>{f.district}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                    {(f.months || []).map(m => (
                      <span key={m} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f5f9f5', border: '1px solid #333', color: '#4b6e4b' }}>{m}월</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: '#4b6e4b' }}>💚 {f.health}</div>
                </div>
                <button onClick={() => deleteFood(f.id)}
                  style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #166534', background: '#052e16', color: '#4ade80', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", flexShrink: 0 }}>
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
