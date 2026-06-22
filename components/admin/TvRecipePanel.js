import { useState, useEffect } from 'react'
import { S, Toast } from './AdminUI'

const PROGRAMS = ['생활의달인', '수요미식회', '한국인의밥상', '6시내고향', 'VJ특공대', '백종원의골목식당']

export default function TvRecipePanel({ adminToken }) {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ ingredient: '', program: '', episode: '', title: '', summary: '', source_url: '' })
  const [saving, setSaving] = useState(false)
  const [filterIngredient, setFilterIngredient] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200) }

  const load = async () => {
    setLoading(true)
    try {
      const url = filterIngredient ? `/api/admin/tv-recipes?ingredient=${encodeURIComponent(filterIngredient)}` : '/api/admin/tv-recipes'
      const res = await fetch(url, { headers: { 'x-admin-token': adminToken } })
      const data = await res.json()
      setRecipes(Array.isArray(data) ? data : [])
    } catch { showToast('❌ 불러오기 실패') }
    setLoading(false)
  }

  useEffect(() => { load() }, [filterIngredient])

  const submit = async () => {
    if (!form.ingredient.trim() || !form.program || !form.title.trim()) {
      showToast('⚠️ 재료명·프로그램·제목은 필수입니다'); return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/tv-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setForm({ ingredient: '', program: '', episode: '', title: '', summary: '', source_url: '' })
      showToast('✅ 레시피 등록 완료'); load()
    } catch { showToast('❌ 등록 실패') }
    setSaving(false)
  }

  const deleteRecipe = async (id) => {
    if (!confirm('삭제할까요?')) return
    try {
      await fetch(`/api/admin/tv-recipes?id=${id}`, { method: 'DELETE', headers: { 'x-admin-token': adminToken } })
      showToast('🗑 삭제됨'); load()
    } catch { showToast('❌ 삭제 실패') }
  }

  return (
    <div>
      <Toast msg={toast} />

      <div style={S.card}>
        <div style={S.cardTitle}>📺 TV 레시피 등록</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={S.label}>재료명 *</label>
            <input value={form.ingredient} onChange={e => setForm(f => ({ ...f, ingredient: e.target.value }))} placeholder="예: 오징어" style={S.input} />
          </div>
          <div>
            <label style={S.label}>TV 프로그램 *</label>
            <select value={form.program} onChange={e => setForm(f => ({ ...f, program: e.target.value }))} style={S.input}>
              <option value="">선택</option>
              {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>방영 회차/날짜 (선택)</label>
            <input value={form.episode} onChange={e => setForm(f => ({ ...f, episode: e.target.value }))} placeholder="예: 2026-06-22" style={S.input} />
          </div>
          <div>
            <label style={S.label}>레시피 제목 *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="예: 오징어볶음 황금 레시피" style={S.input} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>레시피 요약</label>
            <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              placeholder="레시피 내용 요약" rows={3} style={{ ...S.textarea, fontFamily: "'Outfit', sans-serif" }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>출처 URL (선택)</label>
            <input value={form.source_url} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))} placeholder="https://..." style={S.input} />
          </div>
        </div>
        <button onClick={submit} disabled={saving} style={{ ...S.btn(), opacity: saving ? 0.6 : 1 }}>
          {saving ? '등록 중...' : '+ 레시피 등록'}
        </button>
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={S.cardTitle}>📋 등록된 레시피 ({recipes.length})</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={filterIngredient} onChange={e => setFilterIngredient(e.target.value)}
              placeholder="재료명 검색" style={{ ...S.input, width: 160 }} />
            <button onClick={load} style={{ ...S.btn('#333'), padding: '8px 14px' }}>🔄</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>불러오는 중...</div>
        ) : !recipes.length ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#555' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📺</div>
            <div>등록된 레시피가 없습니다</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recipes.map(r => (
              <div key={r.id} style={{ ...S.row, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: '#0a2a0a', border: '1px solid #166534', borderRadius: 4, padding: '2px 8px', color: '#4ade80' }}>
                      📺 {r.program}
                    </span>
                    <span style={{ fontSize: 11, color: '#888' }}>재료: {r.ingredient}</span>
                    {r.episode && <span style={{ fontSize: 11, color: '#555' }}>{r.episode}</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0', marginBottom: 2 }}>{r.title}</div>
                  {r.summary && <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>{r.summary.slice(0, 80)}...</div>}
                  {r.source_url && <a href={r.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#60a5fa' }}>출처 →</a>}
                </div>
                <button onClick={() => deleteRecipe(r.id)}
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
