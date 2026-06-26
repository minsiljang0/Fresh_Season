import { useState, useEffect, useMemo } from 'react'
import { S, Toast } from './AdminUI'
import { DEFAULT_CATEGORIES, categoryLabel } from '../../lib/blogCategories'

const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12]

const TV_LIST = ['생활의달인','한국인의밥상','수요미식회','6시내고향','VJ특공대','백종원의골목식당']

const CATEGORIES = [
  { id:'fish',     emoji:'🐟', label:'수산물' },
  { id:'veg',      emoji:'🥬', label:'채소·나물' },
  { id:'fruit',    emoji:'🍎', label:'과일' },
  { id:'grain',    emoji:'🌾', label:'곡물·가공' },
  { id:'meat',     emoji:'🥩', label:'육류' },
  { id:'mushroom', emoji:'🍄', label:'버섯·산채' },
]

const EMPTY_FORM = {
  ingredient: '', region: 'gangwon', district: '',
  months: [], health: '', category: 'fish', tv_programs: [],
}

function MonthPills({ value, onChange }) {
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
      {MONTHS.map(m => {
        const on = value.includes(m)
        return (
          <button key={m} type="button" onClick={() => onChange(
            on ? value.filter(x=>x!==m) : [...value, m].sort((a,b)=>a-b)
          )} style={{
            width:36, height:36, borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:700,
            fontFamily:"'Outfit',sans-serif",
            border:`1.5px solid ${on?'#22c55e':'#333'}`,
            background: on?'#0a2a0a':'#1f1f1f',
            color: on?'#22c55e':'#888',
          }}>{m}</button>
        )
      })}
    </div>
  )
}

function TVPills({ value, onChange }) {
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
      {TV_LIST.map(tv => {
        const on = value.includes(tv)
        return (
          <button key={tv} type="button" onClick={() => onChange(
            on ? value.filter(x=>x!==tv) : [...value, tv]
          )} style={{
            padding:'5px 12px', borderRadius:20, cursor:'pointer', fontSize:12, fontWeight: on?700:400,
            fontFamily:"'Outfit',sans-serif",
            border:`1.5px solid ${on?'#f59e0b':'#333'}`,
            background: on?'#2a1f00':'#1f1f1f',
            color: on?'#f59e0b':'#888',
          }}>📺 {tv}</button>
        )
      })}
    </div>
  )
}

function CategoryPills({ value, onChange }) {
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
      {CATEGORIES.map(c => {
        const on = value === c.id
        return (
          <button key={c.id} type="button" onClick={() => onChange(c.id)} style={{
            padding:'5px 12px', borderRadius:20, cursor:'pointer', fontSize:12, fontWeight: on?700:400,
            fontFamily:"'Outfit',sans-serif",
            border:`1.5px solid ${on?'#a855f7':'#333'}`,
            background: on?'#1a0a2a':'#1f1f1f',
            color: on?'#a855f7':'#888',
          }}>{c.emoji} {c.label}</button>
        )
      })}
    </div>
  )
}

// ── 인라인 편집 행 ─────────────────────────────────────────
function FoodRow({ food, onSave, onDelete, adminToken }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  const startEdit = () => setForm({
    ingredient: food.ingredient,
    region: food.region,
    district: food.district || '',
    months: food.months || [],
    health: food.health || '',
    category: food.category || 'fish',
    tv_programs: food.tv_programs || [],
  })

  const cancel = () => { setEditing(false); setForm(null) }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/seasonal-foods?id=${food.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      onSave()
      setEditing(false); setForm(null)
    } catch { alert('저장 실패') }
    setSaving(false)
  }

  if (editing && form) {
    return (
      <div style={{ background:'#1a1a1a', border:'1.5px solid #22c55e44', borderRadius:12, padding:18, marginBottom:10 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <label style={S.label}>재료명</label>
            <input value={form.ingredient} onChange={e=>setForm(f=>({...f,ingredient:e.target.value}))} style={S.input} />
          </div>
          <div>
            <label style={S.label}>시도</label>
            <select value={form.region} onChange={e=>setForm(f=>({...f,region:e.target.value}))} style={S.input}>
              {DEFAULT_CATEGORIES.map(c=><option key={c} value={c}>{categoryLabel(c)}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>시군구</label>
            <input value={form.district} onChange={e=>setForm(f=>({...f,district:e.target.value}))} placeholder="예: 속초시·강릉시" style={S.input} />
          </div>
        </div>

        <div style={{ marginBottom:10 }}>
          <label style={S.label}>카테고리</label>
          <CategoryPills value={form.category} onChange={v=>setForm(f=>({...f,category:v}))} />
        </div>

        <div style={{ marginBottom:10 }}>
          <label style={S.label}>제철 월</label>
          <MonthPills value={form.months} onChange={v=>setForm(f=>({...f,months:v}))} />
        </div>

        <div style={{ marginBottom:10 }}>
          <label style={S.label}>건강 효능</label>
          <textarea value={form.health} onChange={e=>setForm(f=>({...f,health:e.target.value}))}
            rows={2} style={{ ...S.textarea, fontFamily:"'Outfit',sans-serif" }} />
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={S.label}>TV 방송</label>
          <TVPills value={form.tv_programs} onChange={v=>setForm(f=>({...f,tv_programs:v}))} />
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={save} disabled={saving} style={{ ...S.btn(), opacity:saving?.6:1 }}>
            {saving?'저장 중...':'✅ 저장'}
          </button>
          <button onClick={cancel} style={S.btnGhost}>취소</button>
        </div>
      </div>
    )
  }

  const cat = CATEGORIES.find(c=>c.id===food.category)
  return (
    <div style={{ ...S.row, display:'flex', alignItems:'flex-start', gap:12 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
          <span style={{ fontSize:14, fontWeight:900, color:'#f0f0f0' }}>{food.ingredient}</span>
          {cat && (
            <span style={{ fontSize:11, padding:'2px 7px', borderRadius:20, background:'#1a0a2a', border:'1px solid #a855f744', color:'#a855f7', fontWeight:700 }}>
              {cat.emoji} {cat.label}
            </span>
          )}
          <span style={{ fontSize:11, padding:'2px 7px', borderRadius:20, background:'#0a2a0a', border:'1px solid #22c55e44', color:'#4ade80', fontWeight:700 }}>
            {categoryLabel(food.region)}
          </span>
          {food.district && <span style={{ fontSize:11, color:'#555' }}>📍 {food.district}</span>}
        </div>

        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:5 }}>
          {(food.months||[]).map(m=>(
            <span key={m} style={{ fontSize:10, padding:'1px 6px', borderRadius:4, background:'#1f1f1f', border:'1px solid #333', color:'#888' }}>{m}월</span>
          ))}
        </div>

        {food.health && (
          <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>💊 {food.health}</div>
        )}

        {(food.tv_programs||[]).length > 0 && (
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {(food.tv_programs||[]).map(tv=>(
              <span key={tv} style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background:'#2a1f00', border:'1px solid #f59e0b44', color:'#f59e0b' }}>
                📺 {tv}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
        <button onClick={() => { startEdit(); setEditing(true) }} style={{
          padding:'6px 12px', borderRadius:7, border:'1px solid #333', background:'#1f1f1f',
          color:'#aaa', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
        }}>✏️ 편집</button>
        <button onClick={()=>onDelete(food.id)} style={{
          padding:'6px 12px', borderRadius:7, border:'1px solid #7f1d1d', background:'#1a0a0a',
          color:'#f87171', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
        }}>삭제</button>
      </div>
    </div>
  )
}

// ── 메인 패널 ─────────────────────────────────────────────
export default function MapAdminPanel({ adminToken }) {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  // 필터
  const [filterRegion, setFilterRegion] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterTV, setFilterTV] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [searchQ, setSearchQ] = useState('')

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(''), 2500) }

  const load = async () => {
    setLoading(true)
    try {
      const params = []
      if (filterRegion) params.push(`region=${filterRegion}`)
      if (filterMonth) params.push(`month=${filterMonth}`)
      const url = '/api/admin/seasonal-foods' + (params.length ? '?'+params.join('&') : '')
      const res = await fetch(url, { headers:{'x-admin-token':adminToken} })
      const data = await res.json()
      setFoods(Array.isArray(data) ? data : [])
    } catch { showToast('❌ 불러오기 실패') }
    setLoading(false)
  }

  useEffect(() => { load() }, [filterRegion, filterMonth])

  const filtered = useMemo(() => {
    let d = foods
    if (filterTV) d = d.filter(f => (f.tv_programs||[]).includes(filterTV))
    if (filterCat) d = d.filter(f => f.category === filterCat)
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase()
      d = d.filter(f =>
        f.ingredient?.includes(q) || f.district?.includes(q) || f.health?.includes(q)
      )
    }
    return d
  }, [foods, filterTV, filterCat, searchQ])

  const submit = async () => {
    if (!form.ingredient.trim() || !form.months.length || !form.health.trim()) {
      showToast('⚠️ 재료명·제철월·건강효능은 필수입니다'); return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/seasonal-foods', {
        method:'POST',
        headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setForm({ ...EMPTY_FORM })
      showToast('✅ 식재료 등록 완료'); load()
    } catch { showToast('❌ 등록 실패') }
    setSaving(false)
  }

  const deleteFood = async (id) => {
    if (!confirm('삭제할까요?')) return
    try {
      await fetch(`/api/admin/seasonal-foods?id=${id}`, {
        method:'DELETE', headers:{'x-admin-token':adminToken}
      })
      showToast('🗑 삭제됨'); load()
    } catch { showToast('❌ 삭제 실패') }
  }

  const resetFilters = () => {
    setFilterRegion(''); setFilterMonth(''); setFilterTV(''); setFilterCat(''); setSearchQ('')
  }

  return (
    <div>
      <Toast msg={toast} />

      {/* ── 등록 폼 ── */}
      <div style={S.card}>
        <div style={S.cardTitle}>🗺 식재료 등록</div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
          <div>
            <label style={S.label}>재료명 *</label>
            <input value={form.ingredient} onChange={e=>setForm(f=>({...f,ingredient:e.target.value}))}
              placeholder="예: 오징어" style={S.input} />
          </div>
          <div>
            <label style={S.label}>시도 *</label>
            <select value={form.region} onChange={e=>setForm(f=>({...f,region:e.target.value}))} style={S.input}>
              {DEFAULT_CATEGORIES.map(c=><option key={c} value={c}>{categoryLabel(c)}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>시군구 (선택)</label>
            <input value={form.district} onChange={e=>setForm(f=>({...f,district:e.target.value}))}
              placeholder="예: 속초시·강릉시" style={S.input} />
          </div>
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={S.label}>카테고리</label>
          <CategoryPills value={form.category} onChange={v=>setForm(f=>({...f,category:v}))} />
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={S.label}>제철 월 * (복수 선택)</label>
          <MonthPills value={form.months} onChange={v=>setForm(f=>({...f,months:v}))} />
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={S.label}>건강 효능 *</label>
          <textarea value={form.health} onChange={e=>setForm(f=>({...f,health:e.target.value}))}
            placeholder="예: 타우린·DHA 풍부, 눈건강·피로회복" rows={2}
            style={{ ...S.textarea, fontFamily:"'Outfit',sans-serif" }} />
        </div>

        <div style={{ marginBottom:18 }}>
          <label style={S.label}>TV 방송 (방영된 프로그램)</label>
          <TVPills value={form.tv_programs} onChange={v=>setForm(f=>({...f,tv_programs:v}))} />
        </div>

        <button onClick={submit} disabled={saving} style={{ ...S.btn(), opacity:saving?.6:1 }}>
          {saving?'등록 중...':'+ 식재료 등록'}
        </button>
      </div>

      {/* ── 목록 + 필터 ── */}
      <div style={S.card}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <div style={S.cardTitle}>📋 등록된 식재료 ({filtered.length}/{foods.length})</div>
          <button onClick={resetFilters} style={{ ...S.btnGhost, padding:'6px 14px', fontSize:12 }}>🔄 필터 초기화</button>
        </div>

        {/* 검색 */}
        <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
          placeholder="🔍 재료명·산지·효능 검색"
          style={{ ...S.input, marginBottom:12 }} />

        {/* 필터 행 */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
          <select value={filterRegion} onChange={e=>setFilterRegion(e.target.value)}
            style={{ ...S.input, width:160, flex:'none' }}>
            <option value="">전체 시도</option>
            {DEFAULT_CATEGORIES.map(c=><option key={c} value={c}>{categoryLabel(c)}</option>)}
          </select>

          <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}
            style={{ ...S.input, width:90, flex:'none' }}>
            <option value="">전체 월</option>
            {MONTHS.map(m=><option key={m} value={m}>{m}월</option>)}
          </select>

          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)}
            style={{ ...S.input, width:130, flex:'none' }}>
            <option value="">전체 카테고리</option>
            {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>

          <select value={filterTV} onChange={e=>setFilterTV(e.target.value)}
            style={{ ...S.input, width:160, flex:'none' }}>
            <option value="">전체 TV</option>
            {TV_LIST.map(tv=><option key={tv} value={tv}>📺 {tv}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'#555' }}>불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'50px 20px', color:'#555' }}>
            <div style={{ fontSize:36, marginBottom:10 }}>🌿</div>
            <div>조건에 맞는 식재료가 없습니다</div>
          </div>
        ) : (
          <div>
            {filtered.map(f => (
              <FoodRow key={f.id} food={f} adminToken={adminToken}
                onSave={() => { showToast('✅ 저장됨'); load() }}
                onDelete={deleteFood} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
