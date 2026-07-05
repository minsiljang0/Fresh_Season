import { useState, useEffect, useCallback } from 'react'
import { S, Toast, DeleteModal } from './AdminUI'

const api = (type) => `/api/admin/map-data?type=${type}`

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || '요청 실패')
  }
  return res.json()
}

const RECIPE_CATEGORIES = ['밥', '죽', '면', '국', '탕', '찌개', '전골', '찜', '구이', '숙채', '생채', '회', '전', '장', '김치', '장아찌', '조림', '볶음', '한과', '떡', '음청류']

// ══════════════════════════════════════════════════════════
// RecipeAdminPanel — 레시피 전용 관리 페이지 (맵 관리에서 분리)
// 블로그 글로 작성된 레시피 / DB에만 있는 레시피를 함께 모아 관리한다.
// ══════════════════════════════════════════════════════════
export default function RecipeAdminPanel({ adminToken, onBlogWrite }) {
  const [formOpen, setFormOpen] = useState(false)
  const EMPTY = { title: '', summary: '', source_url: '', category: '밥', servings: 4 }
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [searchQ, setSearchQ] = useState('')
  const [catFilter, setCatFilter] = useState('전체')
  const [blogFilter, setBlogFilter] = useState('전체') // 전체 / 블로그 있음 / DB 전용

  const [toast, setToast] = useState('')
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const [deleteItem, setDeleteItem] = useState(null)
  const confirmDelete = (name, onConfirm) => setDeleteItem({ name, onConfirm })

  const [allIngredients, setAllIngredients] = useState([])
  useEffect(() => {
    apiFetch(api('ingredients')).then(setAllIngredients).catch(() => {})
  }, [])

  const [expandedId, setExpandedId] = useState(null)
  const [stepsMap, setStepsMap] = useState({})
  const [ingredientsMap, setIngredientsMap] = useState({})
  const [toolsMap, setToolsMap] = useState({})
  const [stepForm, setStepForm] = useState({ '준비하기': '', '조리하기': '' })
  const [ingForm, setIngForm] = useState({ ingredient_id: '', amount: '' })
  const [toolForm, setToolForm] = useState({ name: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try { setList(await apiFetch(api('recipes'))) } catch (e) { showToast('❌ ' + e.message) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const submit = async () => {
    if (!form.title.trim()) { showToast('⚠️ 제목 필수'); return }
    setSaving(true)
    try {
      await apiFetch(api('recipes'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify(form) })
      setForm(EMPTY); showToast('✅ 레시피 등록 완료'); load()
    } catch (e) { showToast('❌ ' + e.message) }
    setSaving(false)
  }

  const saveEdit = async (id) => {
    try {
      await apiFetch(`${api('recipes')}&id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify(editForm) })
      setEditId(null); showToast('✅ 저장됨'); load()
    } catch (e) { showToast('❌ ' + e.message) }
  }

  const del = (id, title) => {
    confirmDelete(title, async () => {
      try {
        await apiFetch(`${api('recipes')}&id=${id}`, { method: 'DELETE', headers: { 'x-admin-token': adminToken } })
        setList(p => p.filter(r => r.id !== id)); showToast('🗑 삭제됨 (연동된 블로그 글도 함께 삭제)')
      } catch (e) { showToast('❌ ' + e.message) }
    })
  }

  const loadDetail = useCallback(async (recipeId) => {
    try {
      const [steps, ings, tools] = await Promise.all([
        apiFetch(`${api('recipe_steps')}&recipe_id=${recipeId}`),
        apiFetch(`${api('recipe_ingredients')}&recipe_id=${recipeId}`),
        apiFetch(`${api('recipe_tools')}&recipe_id=${recipeId}`),
      ])
      setStepsMap(p => ({ ...p, [recipeId]: steps }))
      setIngredientsMap(p => ({ ...p, [recipeId]: ings }))
      setToolsMap(p => ({ ...p, [recipeId]: tools }))
    } catch (e) { showToast('❌ ' + e.message) }
  }, [])

  const toggleExpand = (recipeId) => {
    if (expandedId === recipeId) { setExpandedId(null); return }
    setExpandedId(recipeId)
    setStepForm({ '준비하기': '', '조리하기': '' })
    setIngForm({ ingredient_id: '', amount: '' })
    setToolForm({ name: '' })
    if (!stepsMap[recipeId]) loadDetail(recipeId)
  }

  const addStep = async (recipeId, phase) => {
    const description = (stepForm[phase] || '').trim()
    if (!description) { showToast('⚠️ 조리 순서 내용을 입력하세요'); return }
    const orderNum = ((stepsMap[recipeId] || []).filter(s => (s.phase || '조리하기') === phase).length) + 1
    try {
      await apiFetch(api('recipe_steps'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ recipe_id: recipeId, order_num: orderNum, phase, description, photo_url: '' }) })
      setStepForm(p => ({ ...p, [phase]: '' })); loadDetail(recipeId)
    } catch (e) { showToast('❌ ' + e.message) }
  }
  const delStep = async (recipeId, stepId) => {
    try {
      await apiFetch(`${api('recipe_steps')}&id=${stepId}`, { method: 'DELETE', headers: { 'x-admin-token': adminToken } })
      loadDetail(recipeId)
    } catch (e) { showToast('❌ ' + e.message) }
  }

  const addIngredient = async (recipeId) => {
    if (!ingForm.ingredient_id) { showToast('⚠️ 재료를 선택하세요'); return }
    try {
      await apiFetch(api('recipe_ingredients'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ recipe_id: recipeId, ...ingForm }) })
      setIngForm({ ingredient_id: '', amount: '' }); loadDetail(recipeId)
    } catch (e) { showToast('❌ ' + e.message) }
  }
  const delIngredient = async (recipeId, rowId) => {
    try {
      await apiFetch(`${api('recipe_ingredients')}&id=${rowId}`, { method: 'DELETE', headers: { 'x-admin-token': adminToken } })
      loadDetail(recipeId)
    } catch (e) { showToast('❌ ' + e.message) }
  }

  const addTool = async (recipeId) => {
    if (!toolForm.name.trim()) { showToast('⚠️ 도구명을 입력하세요'); return }
    try {
      await apiFetch(api('recipe_tools'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ recipe_id: recipeId, ...toolForm }) })
      setToolForm({ name: '' }); loadDetail(recipeId)
    } catch (e) { showToast('❌ ' + e.message) }
  }
  const delTool = async (recipeId, toolId) => {
    try {
      await apiFetch(`${api('recipe_tools')}&id=${toolId}`, { method: 'DELETE', headers: { 'x-admin-token': adminToken } })
      loadDetail(recipeId)
    } catch (e) { showToast('❌ ' + e.message) }
  }

  const RecipeFields = ({ f, setF }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <div style={{ gridColumn: '1/-1' }}>
        <label style={S.label}>레시피 제목 *</label>
        <input value={f.title || ''} onChange={e => setF(p => ({ ...p, title: e.target.value }))} placeholder="예: 고등어 구이" style={S.input} />
      </div>
      <div>
        <label style={S.label}>카테고리</label>
        <select value={f.category || '밥'} onChange={e => setF(p => ({ ...p, category: e.target.value }))} style={S.input}>
          {RECIPE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label style={S.label}>인분수</label>
        <input type="number" min="1" value={f.servings ?? ''}
          onChange={e => setF(p => ({ ...p, servings: e.target.value === '' ? null : parseInt(e.target.value, 10) }))}
          placeholder="예: 4" style={S.input} />
      </div>
      <div style={{ gridColumn: '1/-1' }}>
        <label style={S.label}>요약</label>
        <textarea value={f.summary || ''} onChange={e => setF(p => ({ ...p, summary: e.target.value }))}
          placeholder="레시피 소개·요약" rows={3} style={{ ...S.textarea, fontFamily: "'Outfit', sans-serif" }} />
      </div>
      <div style={{ gridColumn: '1/-1' }}>
        <label style={S.label}>출처 URL (선택)</label>
        <input value={f.source_url || ''} onChange={e => setF(p => ({ ...p, source_url: e.target.value }))} placeholder="https://..." style={S.input} />
      </div>
    </div>
  )

  const filtered = list.filter(r => {
    if (searchQ && !r.title.includes(searchQ)) return false
    if (catFilter !== '전체' && r.category !== catFilter) return false
    if (blogFilter === '블로그 있음' && !r.has_blog) return false
    if (blogFilter === 'DB 전용' && r.has_blog) return false
    return true
  })

  const catCounts = RECIPE_CATEGORIES.reduce((acc, c) => {
    acc[c] = list.filter(r => r.category === c).length
    return acc
  }, {})
  const blogCount = list.filter(r => r.has_blog).length
  const dbOnlyCount = list.length - blogCount

  return (
    <div>
      <Toast msg={toast} />
      <DeleteModal item={deleteItem} onConfirm={() => deleteItem?.onConfirm()} onCancel={() => setDeleteItem(null)} />

      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setFormOpen(p => !p)}>
          <div style={S.cardTitle}>🍳 레시피 등록</div>
          <span style={{ fontSize: 16, color: '#f97316', lineHeight: 1 }}>{formOpen ? '▲' : '▼'}</span>
        </div>
        {formOpen && (
          <>
            <RecipeFields f={form} setF={setForm} />
            <button onClick={submit} disabled={saving} style={{ ...S.btn(), marginTop: 14, opacity: saving ? .6 : 1 }}>+ 레시피 등록</button>
          </>
        )}
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
          <div style={S.cardTitle}>
            📋 전체 레시피 ({list.length})
            <span style={{ fontSize: 12, fontWeight: 500, color: '#8aaa8a', marginLeft: 8 }}>
              📝 블로그 글 있음 {blogCount} · DB 전용 {dbOnlyCount}
            </span>
          </div>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="제목 검색..." style={{ ...S.input, width: 160, fontSize: 12 }} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {['전체', ...RECIPE_CATEGORIES].map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid ' + (catFilter === c ? '#16a34a' : '#d1e8d1'),
                background: catFilter === c ? '#16a34a' : '#fff', color: catFilter === c ? '#fff' : '#4b6e4b',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              {c}{c !== '전체' ? ` (${catCounts[c] || 0})` : ` (${list.length})`}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {['전체', '블로그 있음', 'DB 전용'].map(b => (
            <button key={b} onClick={() => setBlogFilter(b)}
              style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid ' + (blogFilter === b ? '#0ea5e9' : '#e5e7eb'),
                background: blogFilter === b ? '#e0f2fe' : '#fff', color: blogFilter === b ? '#0369a1' : '#8aaa8a',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              {b}
            </button>
          ))}
        </div>

        {loading ? <p style={{ textAlign: 'center', color: '#aaa', padding: 30 }}>불러오는 중...</p> : !filtered.length ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#8aaa8a' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🍳</div>
            <div>조건에 맞는 레시피가 없습니다</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(r => (
              <div key={r.id} style={{ ...S.row, background: '#f5f9f5' }}>
                {editId === r.id ? (
                  <>
                    <RecipeFields f={editForm} setF={setEditForm} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button onClick={() => saveEdit(r.id)} style={S.btn()}>저장</button>
                      <button onClick={() => setEditId(null)} style={S.btnGhost}>취소</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: '#111' }}>🍳 {r.title}</span>
                          {r.category && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#dcfce7', color: '#15803d' }}>{r.category}</span>
                          )}
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                            background: r.has_blog ? '#e0f2fe' : '#f3f4f6', color: r.has_blog ? '#0369a1' : '#9ca3af' }}>
                            {r.has_blog ? '📝 블로그 있음' : 'DB 전용'}
                          </span>
                        </div>
                        {r.summary && <p style={{ fontSize: 11, color: '#666', margin: 0 }}>{r.summary.slice(0, 100)}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button onClick={() => toggleExpand(r.id)} style={{ ...S.btnGhost, padding: '4px 10px', fontSize: 12 }}>
                          {expandedId === r.id ? '접기 ▲' : '재료·순서 관리 ▼'}
                        </button>
                        {onBlogWrite && (
                          <button onClick={() => onBlogWrite(r.id, '레시피')} style={{ ...S.btnGhost, padding: '4px 10px', fontSize: 12 }}>📝 블로그 편집</button>
                        )}
                        <button onClick={() => { setEditId(r.id); setEditForm({ title: r.title, summary: r.summary || '', source_url: r.source_url || '', category: r.category || '밥', servings: r.servings ?? null }) }}
                          style={{ ...S.btnGhost, padding: '4px 10px', fontSize: 12 }}>✏️</button>
                        <button onClick={() => del(r.id, r.title)}
                          style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid #fca5a5', background: '#fff1f2', color: '#dc2626', fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>삭제</button>
                      </div>
                    </div>

                    {expandedId === r.id && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed #d1e8d1', display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* 조리 순서 — 준비하기/조리하기 항상 분리 표시 */}
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f1f0f', marginBottom: 8 }}>📖 조리 순서</div>
                          {['준비하기', '조리하기'].map(phase => {
                            const phaseSteps = (stepsMap[r.id] || []).filter(s => (s.phase || '조리하기') === phase)
                            return (
                              <div key={phase} style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: phase === '준비하기' ? '#0369a1' : '#c2410c', marginBottom: 6 }}>
                                  {phase === '준비하기' ? '🥣 준비하기' : '🔥 조리하기'}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                                  {phaseSteps.length === 0 ? (
                                    <div style={{ fontSize: 11, color: '#aaa', padding: '2px 2px' }}>등록된 단계 없음</div>
                                  ) : phaseSteps.map((s, i) => (
                                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, fontSize: 12, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px' }}>
                                      <span><b>{i + 1}.</b> {s.description}</span>
                                      <button onClick={() => delStep(r.id, s.id)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 11, flexShrink: 0 }}>삭제</button>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <input value={stepForm[phase] || ''} onChange={e => setStepForm(p => ({ ...p, [phase]: e.target.value }))}
                                    placeholder={`${phase} 설명`} style={{ ...S.input, flex: 1, fontSize: 12 }} />
                                  <button onClick={() => addStep(r.id, phase)} style={{ ...S.btn(), padding: '6px 14px', fontSize: 12 }}>+ 추가</button>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* 재료 */}
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f1f0f', marginBottom: 8 }}>🥕 재료</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                            {(ingredientsMap[r.id] || []).map(ing => (
                              <span key={ing.id} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: '#fff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {ing.ingredients?.name || '재료'}{ing.amount ? ` ${ing.amount}` : ''}
                                <button onClick={() => delIngredient(r.id, ing.id)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 11, padding: 0 }}>✕</button>
                              </span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <select value={ingForm.ingredient_id} onChange={e => setIngForm(p => ({ ...p, ingredient_id: e.target.value }))} style={{ ...S.input, flex: 1, fontSize: 12 }}>
                              <option value="">재료 선택</option>
                              {(allIngredients || []).map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                            </select>
                            <input value={ingForm.amount} onChange={e => setIngForm(p => ({ ...p, amount: e.target.value }))}
                              placeholder="분량 (예: 1마리)" style={{ ...S.input, width: 120, fontSize: 12 }} />
                            <button onClick={() => addIngredient(r.id)} style={{ ...S.btn(), padding: '6px 14px', fontSize: 12 }}>+ 추가</button>
                          </div>
                        </div>

                        {/* 조리도구 */}
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f1f0f', marginBottom: 8 }}>🍳 조리도구</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                            {(toolsMap[r.id] || []).map(t => (
                              <span key={t.id} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: '#fff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {t.name}
                                <button onClick={() => delTool(r.id, t.id)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 11, padding: 0 }}>✕</button>
                              </span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <input value={toolForm.name} onChange={e => setToolForm(p => ({ ...p, name: e.target.value }))}
                              placeholder="도구명 (예: 팬, 냄비)" style={{ ...S.input, flex: 1, fontSize: 12 }} />
                            <button onClick={() => addTool(r.id)} style={{ ...S.btn(), padding: '6px 14px', fontSize: 12 }}>+ 추가</button>
                          </div>
                        </div>

                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
