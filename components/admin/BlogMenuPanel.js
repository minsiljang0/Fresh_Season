import { useState, useEffect } from 'react'
import { S } from './AdminUI'
import { DEFAULT_CATEGORIES, categoryLabel } from '../../lib/blogCategories'

const DEFAULT_CATS = DEFAULT_CATEGORIES

export default function BlogMenuPanel({ adminToken }) {
  const [categories, setCategories] = useState([])
  const [newCat, setNewCat] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadCategories() }, [])

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/blog/categories', { headers: { 'x-admin-token': adminToken } })
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch {}
  }

  const addCategory = async () => {
    const label = newCat.trim()
    if (!label) return
    if (DEFAULT_CATS.includes(label) || categories.find(c => c.label === label)) {
      setMsg('❌ 이미 있는 카테고리예요'); setTimeout(() => setMsg(''), 2500); return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ label }),
      })
      if (!res.ok) throw new Error()
      setNewCat('')
      setMsg('✅ 추가되었습니다')
      setTimeout(() => setMsg(''), 2500)
      loadCategories()
    } catch { setMsg('❌ 추가 실패'); setTimeout(() => setMsg(''), 2500) }
    setLoading(false)
  }

  const deleteCategory = async (id, label) => {
    if (!confirm(`"${label}" 카테고리를 삭제할까요?`)) return
    try {
      await fetch(`/api/blog/categories?id=${id}`, { method: 'DELETE', headers: { 'x-admin-token': adminToken } })
      setMsg('✅ 삭제되었습니다')
      setTimeout(() => setMsg(''), 2500)
      loadCategories()
    } catch { setMsg('❌ 삭제 실패'); setTimeout(() => setMsg(''), 2500) }
  }

  return (
    <div>
      <div style={{ ...S.card, borderColor: '#1e3a2a' }}>
        <div style={S.cardTitle}>📌 기본 카테고리 (삭제 불가)</div>
        <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>한국 17개 시도 기반 기본 카테고리예요. (삭제 불가)</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DEFAULT_CATS.map(cat => (
            <span key={cat} style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a',
            }}>{categoryLabel ? categoryLabel(cat) : cat}</span>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>📂 커스텀 카테고리</div>
        <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>블로그 글에서 사용할 카테고리를 추가/삭제할 수 있어요.</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCategory()}
            placeholder="새 카테고리 이름 (예: 튜토리얼)"
            style={{ ...S.input, flex: 1 }}
          />
          <button onClick={addCategory} disabled={loading || !newCat.trim()} style={{ ...S.btn(), opacity: !newCat.trim() ? 0.4 : 1 }}>
            + 추가
          </button>
        </div>

        {msg && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13,
            background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
            color: msg.startsWith('✅') ? '#16a34a' : '#dc2626',
          }}>{msg}</div>
        )}

        {categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#555' }}>
            추가된 커스텀 카테고리가 없습니다
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <div key={cat.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px 7px 16px', borderRadius: 999,
                background: '#f5f9f5', border: '1.5px solid #d1e8d1',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f1f0f' }}>{cat.label}</span>
                <button onClick={() => deleteCategory(cat.id, cat.label)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#666', fontSize: 16, lineHeight: 1, padding: '0 2px',
                  display: 'flex', alignItems: 'center',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = '#22c55e'}
                  onMouseLeave={e => e.currentTarget.style.color = '#666'}
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
