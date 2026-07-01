import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { S, Toast } from './AdminUI'
import { DEFAULT_CATEGORIES, categoryLabel } from '../../lib/blogCategories'
import { extractStepImages, injectStepImages } from '../../lib/stepContent'

// ══════════════════════════════════════════════════════════
// 상수
// ══════════════════════════════════════════════════════════
const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12]

const ING_CATEGORIES = [
  { id:'fish',           emoji:'🐟', label:'생선',       group:'수산물' },
  { id:'crustacean',     emoji:'🦞', label:'갑각류',     group:'수산물' },
  { id:'shellfish',      emoji:'🦪', label:'조개·패류',  group:'수산물' },
  { id:'seaweed',        emoji:'🌿', label:'해조류',     group:'수산물' },
  { id:'other_seafood',  emoji:'🐙', label:'기타수산',   group:'수산물' },
  { id:'veg',            emoji:'🥬', label:'잎채소',     group:'채소·나물' },
  { id:'root_veg',       emoji:'🥕', label:'뿌리채소',   group:'채소·나물' },
  { id:'fruit_veg',      emoji:'🍆', label:'열매채소',   group:'채소·나물' },
  { id:'herb_veg',       emoji:'🌱', label:'나물·산채',  group:'채소·나물' },
  { id:'fruit',          emoji:'🍎', label:'국내과일',   group:'과일' },
  { id:'tropical_fruit', emoji:'🍌', label:'열대과일',   group:'과일' },
  { id:'berry',          emoji:'🍓', label:'베리류',     group:'과일' },
  { id:'grain',          emoji:'🌾', label:'곡물·잡곡',  group:'곡물·가공' },
  { id:'processed',      emoji:'🏭', label:'가공식품',   group:'곡물·가공' },
  { id:'beef',           emoji:'🥩', label:'소고기',     group:'육류' },
  { id:'pork',           emoji:'🐷', label:'돼지고기',   group:'육류' },
  { id:'chicken',        emoji:'🐔', label:'닭고기',     group:'육류' },
  { id:'egg',            emoji:'🥚', label:'달걀',       group:'육류' },
  { id:'processed_meat', emoji:'🌭', label:'가공육',     group:'육류' },
  { id:'meat',           emoji:'🍖', label:'기타육류',   group:'육류' },
  { id:'mushroom',       emoji:'🍄', label:'버섯',       group:'버섯·산채' },
  { id:'wild_herb',      emoji:'🌿', label:'산채·약초',  group:'버섯·산채' },
]
const ING_GROUPS = ['수산물','채소·나물','과일','곡물·가공','육류','버섯·산채']
const ING_CAT_MAP = Object.fromEntries(ING_CATEGORIES.map(c => [c.id, c]))

const HEALTH_CATEGORIES = [
  '면역·항산화','활력·피로회복','뼈·관절','혈관·심장',
  '혈당·당뇨','간·해독','신장·비뇨','소화·장',
  '피부·미용','혈액·빈혈','두뇌·눈','체중·다이어트',
  '호흡기·폐','항암','갱년기·호르몬','수면·신경',
  '치아·구강','체력·근육','임산부·태아',
  '탈모·모발','아토피·피부염','통풍·요산','콜레스테롤',
  '전립선·남성건강','신장·저칼륨','알레르기완화',
  '수험생·집중력','어린이성장','노인·골감소증','기타'
]

const AGE_GROUPS = [
  { id:'infant',  label:'👶 유아 (0-6세)',       color:'#f9a8d4' },
  { id:'child',   label:'🧒 어린이 (7-12세)',     color:'#fdba74' },
  { id:'teen',    label:'🧑 청소년 (13-18세)',     color:'#fde047' },
  { id:'adult',   label:'🧑‍💼 성인 (19-39세)',   color:'#86efac' },
  { id:'middle',  label:'🧑‍🦳 중장년 (40-64세)', color:'#67e8f9' },
  { id:'senior',  label:'👴 노년 (65세+)',         color:'#c4b5fd' },
  { id:'all',     label:'✅ 전 연령',              color:'#16a34a' },
]

const GENDER_OPTIONS = [
  { id:'all',    label:'⚥ 전체', color:'#6b7280' },
  { id:'male',   label:'♂ 남성', color:'#3b82f6' },
  { id:'female', label:'♀ 여성', color:'#ec4899' },
]

const CAUTION_PRESETS = [
  '⚠️ 견과류 알레르기 주의 (아나필락시스 위험)',
  '⚠️ 갑각류 알레르기 주의',
  '⚠️ 복어·자연독 위험 — 전문 조리 필요',
  '⚠️ 통풍 환자 주의 — 퓨린 함량 높음',
  '⚠️ 신장 질환자 주의 — 칼륨 함량 높음',
  '⚠️ 당뇨 환자 주의 — 당분 함량 높음',
  '⚠️ 임산부 과다섭취 주의',
  '⚠️ 영아(12개월 미만) 섭취 금지',
  '⚠️ 항응고제 복용자 주의 — 비타민K 함량 높음',
  '⚠️ 갑상선 질환자 주의 — 요오드 함량 높음',
  '⚠️ 고혈압약 복용자 주의 — 자몽과 상호작용',
  '⚠️ 밀 글루텐 알레르기 주의 (셀리악병)',
  '⚠️ 유당불내증 주의',
  '⚠️ 생식 금지 — 반드시 익혀서 섭취',
]

const LIMITED_PRESETS = [
  { label:'1주일', value:'7일' },
  { label:'10일',  value:'10일' },
  { label:'2주',   value:'14일' },
  { label:'3주',   value:'21일' },
  { label:'1개월', value:'30일' },
  { label:'2개월', value:'60일' },
  { label:'3개월', value:'90일' },
]

const AIR_DAYS = ['월','화','수','목','금','토','일']
const SHOW_CATEGORIES = ['요리경연','다큐','예능','생활정보','쿠킹쇼','기타']
const CHEF_ROLES = ['셰프','MC','심사위원','요리연구가','파티시에','참가자']
const DISH_CATEGORIES = ['한식','양식','중식','일식','분식','디저트','퓨전','이슈','기타']

// ══════════════════════════════════════════════════════════
// 공통 유틸
// ══════════════════════════════════════════════════════════
const api = (type) => `/api/admin/map-data?type=${type}`

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || '요청 실패')
  }
  return res.json()
}

function shortRegionLabel(regionId) {
  return categoryLabel(regionId)
    .replace(/특별자치(도|시)|특별시|광역시|자치시|도$|시$/, '')
    .replace(/[🏙🌊🍎🦀🌿🍢🐟🌾🏡🏔🍇🦪🍚🌊🦐🍊]/u, '')
    .trim()
}

// ══════════════════════════════════════════════════════════
// 공통 UI 컴포넌트
// ══════════════════════════════════════════════════════════

function MonthPills({ value = [], onChange }) {
  return (
    <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:6 }}>
      {MONTHS.map(m => {
        const on = value.includes(m)
        return (
          <button key={m} type="button"
            onClick={() => onChange(on ? value.filter(x => x !== m) : [...value, m].sort((a,b)=>a-b))}
            style={{ width:34, height:34, borderRadius:7, border:`1.5px solid ${on?'#16a34a':'#d1e8d1'}`,
              background: on?'#dcfce7':'#f5f9f5', color: on?'#15803d':'#4b6e4b',
              fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
            {m}
          </button>
        )
      })}
    </div>
  )
}

function SearchSelect({ label, items = [], value, onChange, placeholder, nameKey = 'name' }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const filtered = useMemo(() => {
    if (!q.trim()) return items.slice(0, 20)
    return items.filter(i => i[nameKey]?.includes(q)).slice(0, 20)
  }, [items, q, nameKey])
  const selected = items.find(i => i.id === value)

  return (
    <div style={{ position:'relative' }}>
      {label && <label style={S.label}>{label}</label>}
      <div style={{ display:'flex', gap:6 }}>
        <div style={{ flex:1, position:'relative' }}>
          <input
            value={open ? q : (selected?.[nameKey] || '')}
            onChange={e => { setQ(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={placeholder || '검색 또는 선택'}
            style={S.input}
          />
          {open && filtered.length > 0 && (
            <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:200,
              background:'#fff', border:'1px solid #d1e8d1', borderRadius:8, maxHeight:200, overflowY:'auto', marginTop:2,
              boxShadow:'0 8px 24px rgba(0,0,0,0.12)' }}>
              {filtered.map(item => (
                <div key={item.id} onMouseDown={() => { onChange(item.id); setQ(''); setOpen(false) }}
                  style={{ padding:'9px 14px', cursor:'pointer', fontSize:13, color:'#0f1f0f', borderBottom:'1px solid #f0f8f0' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {item[nameKey]}
                  {item.category && <span style={{ fontSize:11, color:'#8aaa8a', marginLeft:6 }}>{item.category}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        {value && (
          <button type="button" onClick={() => onChange('')}
            style={{ padding:'0 10px', background:'none', border:'1px solid #d1e8d1', borderRadius:7, color:'#6b7280', cursor:'pointer' }}>✕</button>
        )}
      </div>
    </div>
  )
}

// 연령대 선택 버튼 그룹
function AgeGroupPicker({ value = [], onChange }) {
  return (
    <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:4 }}>
      {AGE_GROUPS.map(ag => {
        const on = value.includes(ag.id)
        return (
          <button key={ag.id} type="button"
            onClick={() => onChange(on ? value.filter(x => x !== ag.id) : [...value, ag.id])}
            style={{ padding:'4px 11px', borderRadius:20, border:`1.5px solid ${on ? ag.color : '#d1e8d1'}`,
              background: on ? ag.color + '28' : '#f5f9f5', color: on ? '#1a1a1a' : '#4b6e4b',
              fontSize:11, fontWeight:on ? 700 : 400, cursor:'pointer', fontFamily:"'Outfit',sans-serif", whiteSpace:'nowrap' }}>
            {ag.label}
          </button>
        )
      })}
    </div>
  )
}

// 성별 선택 버튼 그룹
function GenderPicker({ value = 'all', onChange }) {
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
      {GENDER_OPTIONS.map(g => {
        const on = value === g.id
        return (
          <button key={g.id} type="button"
            onClick={() => onChange(g.id)}
            style={{ padding:'4px 14px', borderRadius:20, border:`1.5px solid ${on ? g.color : '#d1e8d1'}`,
              background: on ? g.color + '22' : '#f5f9f5', color: on ? g.color : '#4b6e4b',
              fontSize:12, fontWeight:on ? 700 : 400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
            {g.label}
          </button>
        )
      })}
    </div>
  )
}

// 토글 스위치
function Toggle({ value, onChange, color = '#10b981' }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width:40, height:22, borderRadius:11, cursor:'pointer', transition:'background 0.2s',
        background: value ? color : '#d1e8d1', position:'relative', flexShrink:0 }}>
      <div style={{ position:'absolute', top:3, left: value ? 20 : 3,
        width:16, height:16, borderRadius:8, background:'#fff', transition:'left 0.2s',
        boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  )
}

// 인라인 크로스링크 뱃지
function CrossBadge({ items = [], color = '#22c55e', onRemove }) {
  if (!items.length) return <p style={{ fontSize:12, color:'#aaa', margin:'4px 0' }}>없음</p>
  return (
    <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:4 }}>
      {items.map((item, i) => (
        <span key={item.id || i} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11,
          padding:'3px 9px', borderRadius:20, background: color + '18', border:`1px solid ${color}44`, color }}>
          {item.label}
          {onRemove && (
            <button type="button" onClick={() => onRemove(item.id)}
              style={{ background:'none', border:'none', color, cursor:'pointer', fontSize:13, lineHeight:1, padding:0 }}>×</button>
          )}
        </span>
      ))}
    </div>
  )
}

// 삭제 확인 모달
function DeleteModal({ item, onConfirm, onCancel }) {
  if (!item) return null
  return (
    <div style={{ position:'fixed', inset:0, zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(0,0,0,0.5)', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:380,
        boxShadow:'0 20px 60px rgba(0,0,0,0.25)', fontFamily:"'Outfit',sans-serif", overflow:'hidden' }}>
        <div style={{ padding:'28px 24px 20px', textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
          <div style={{ fontSize:16, fontWeight:800, color:'#111', marginBottom:8 }}>정말 삭제할까요?</div>
          <div style={{ fontSize:13, background:'#fff1f2', border:'1px solid #fca5a5', borderRadius:8,
            padding:'10px 16px', color:'#dc2626', fontWeight:700, marginBottom:6 }}>
            "{item.name}"
          </div>
          <div style={{ fontSize:11, color:'#aaa' }}>삭제하면 복구할 수 없어요</div>
        </div>
        <div style={{ display:'flex', borderTop:'1px solid #f0f0f0' }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:'15px 0', border:'none', background:'#f5f9f5', color:'#4b6e4b',
              fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
              borderRight:'1px solid #f0f0f0' }}>취소</button>
          <button onClick={() => { onConfirm(); onCancel() }}
            style={{ flex:1, padding:'15px 0', border:'none', background:'#fee2e2', color:'#dc2626',
              fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
        </div>
      </div>
    </div>
  )
}

// 섹션 탭 네비
function SubNav({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', gap:0, borderBottom:'2px solid #e8f5e8', marginBottom:16 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          style={{ padding:'9px 16px', border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif",
            fontSize:12, fontWeight:700, background:'transparent',
            color: active === t.id ? t.color || '#22c55e' : '#888',
            borderBottom: active === t.id ? `2.5px solid ${t.color || '#22c55e'}` : '2.5px solid transparent',
            whiteSpace:'nowrap' }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// 전역 데이터 컨텍스트 (모든 탭이 공유)
// ══════════════════════════════════════════════════════════
// 최상위에서 한 번 로드해 모든 서브탭에 props로 내려줌

// ══════════════════════════════════════════════════════════
// HealthTab — 건강효능 관리 (식재료 크로스 연결 완전 통합)
// ══════════════════════════════════════════════════════════
function HealthTab({ adminToken, showToast, confirmDelete, allIngredients, allTvShows, refreshIngredients }) {
  const EMPTY = { name:'', description:'', category:'', coupang_url:'', age_groups:[], gender:'all', caution:'', months:[], regions:[] }
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [filterCat, setFilterCat] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  // 선택된 건강효능의 연결 데이터
  const [selId, setSelId] = useState(null)
  const [linkedIngs, setLinkedIngs] = useState([])  // { id, ingredient_id, ingredients:{name,category} }
  const [linkedTvs, setLinkedTvs] = useState([])
  const [crossTab, setCrossTab] = useState('ingredient')
  const [linkIngId, setLinkIngId] = useState('')
  const [linkTvId, setLinkTvId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setList(await apiFetch(api('health_benefits'))) } catch(e) { showToast('❌ '+e.message) }
    setLoading(false)
  }, [])

  const loadCrossLinks = useCallback(async (hid) => {
    try {
      const [ings, tvs] = await Promise.all([
        apiFetch(`${api('ingredient_health')}&health_id=${hid}`),
        apiFetch(`${api('health_tv_shows')}&health_id=${hid}`),
      ])
      setLinkedIngs(ings); setLinkedTvs(tvs)
    } catch { setLinkedIngs([]); setLinkedTvs([]) }
  }, [])

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (selId) loadCrossLinks(selId)
    else { setLinkedIngs([]); setLinkedTvs([]) }
  }, [selId])

  const submit = async () => {
    if (!form.name.trim()) { showToast('⚠️ 이름 필수'); return }
    setSaving(true)
    try {
      await apiFetch(api('health_benefits'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify(form)
      })
      setForm(EMPTY); showToast('✅ 등록 완료'); load()
    } catch(e) { showToast('❌ '+e.message) }
    setSaving(false)
  }

  const saveEdit = async (id) => {
    try {
      await apiFetch(`${api('health_benefits')}&id=${id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify(editForm)
      })
      setEditId(null); showToast('✅ 저장됨'); load()
    } catch(e) { showToast('❌ '+e.message) }
  }

  const del = (id, name) => {
    confirmDelete(name, async () => {
      try {
        await apiFetch(`${api('health_benefits')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
        if (selId === id) setSelId(null)
        setList(p => p.filter(h => h.id !== id))
        showToast('🗑 삭제됨')
      } catch(e) { showToast('❌ '+e.message) }
    })
  }

  const linkIng = async () => {
    if (!selId || !linkIngId) { showToast('⚠️ 식재료 선택 필요'); return }
    try {
      await apiFetch(api('ingredient_health'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ ingredient_id: linkIngId, health_id: selId })
      })
      setLinkIngId(''); loadCrossLinks(selId); refreshIngredients()
    } catch(e) { showToast('❌ '+e.message) }
  }

  const unlinkIng = async (id) => {
    try {
      await apiFetch(`${api('ingredient_health')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      loadCrossLinks(selId); refreshIngredients(); showToast('🗑 연결 해제됨')
    } catch(e) { showToast('❌ '+e.message) }
  }

  const linkTv = async () => {
    if (!selId || !linkTvId) { showToast('⚠️ TV방송 선택 필요'); return }
    try {
      await apiFetch(api('health_tv_shows'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ health_id: selId, show_id: linkTvId })
      })
      setLinkTvId(''); loadCrossLinks(selId)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const unlinkTv = async (id) => {
    try {
      await apiFetch(`${api('health_tv_shows')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      loadCrossLinks(selId); showToast('🗑 연결 해제됨')
    } catch(e) { showToast('❌ '+e.message) }
  }

  const filtered = (filterCat ? list.filter(h => h.category === filterCat) : list)
    .filter(h => !searchQ || h.name.includes(searchQ) || h.description?.includes(searchQ))

  // 공통 폼 필드
  const HealthFormFields = ({ f, setF }) => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      <div>
        <label style={S.label}>효능명 *</label>
        <input value={f.name||''} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="예: 항산화" style={S.input} />
      </div>
      <div>
        <label style={S.label}>카테고리</label>
        <select value={f.category||''} onChange={e=>setF(p=>({...p,category:e.target.value}))} style={S.input}>
          <option value="">선택</option>
          {HEALTH_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>설명</label>
        <input value={f.description||''} onChange={e=>setF(p=>({...p,description:e.target.value}))} placeholder="예: 활성산소 제거, 노화 방지" style={S.input} />
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>🛒 쿠팡 URL</label>
        <input value={f.coupang_url||''} onChange={e=>setF(p=>({...p,coupang_url:e.target.value}))} placeholder="https://coupa.ng/..." style={S.input} />
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>📅 주요 제철 월 (선택)</label>
        <MonthPills value={f.months||[]} onChange={v=>setF(p=>({...p,months:v}))} />
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>👥 권장 연령대</label>
        <AgeGroupPicker value={f.age_groups||[]} onChange={v=>setF(p=>({...p,age_groups:v}))} />
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>👤 성별</label>
        <GenderPicker value={f.gender||'all'} onChange={v=>setF(p=>({...p,gender:v}))} />
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>⚠️ 주의사항</label>
        <input value={f.caution||''} onChange={e=>setF(p=>({...p,caution:e.target.value}))}
          placeholder="예: 임산부 과다섭취 주의" style={S.input} list="caution-presets" />
        <datalist id="caution-presets">{CAUTION_PRESETS.map(p=><option key={p} value={p}/>)}</datalist>
      </div>
    </div>
  )

  return (
    <div>
      {/* ── 등록 폼 (접기/펼치기) ── */}
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
          onClick={() => setFormOpen(p => !p)}>
          <div style={S.cardTitle}>💊 건강효능 등록</div>
          <span style={{ fontSize:16, color:'#22c55e', lineHeight:1 }}>{formOpen ? '▲' : '▼'}</span>
        </div>
        {formOpen && (
          <>
            <HealthFormFields f={form} setF={setForm} />
            <button onClick={submit} disabled={saving} style={{ ...S.btn(), marginTop:14, opacity:saving?.6:1 }}>+ 등록</button>
          </>
        )}
      </div>

      {/* ── 필터 ── */}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 이름·설명 검색" style={{ ...S.input, width:180 }} />
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{ ...S.input, width:180 }}>
          <option value="">전체 카테고리</option>
          {HEALTH_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ fontSize:12, color:'#8aaa8a', alignSelf:'center' }}>{filtered.length}개</span>
      </div>

      {/* ── 목록 ── */}
      {loading ? <p style={{ textAlign:'center', color:'#aaa', padding:30 }}>불러오는 중...</p> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:10 }}>
          {filtered.map(h => {
            const isSel = selId === h.id
            const isEdit = editId === h.id

            if (isEdit) return (
              <div key={h.id} style={{ ...S.row, border:'2px solid #22c55e', gridColumn:'1/-1', background:'#fff' }}>
                <div style={{ fontSize:14, fontWeight:800, color:'#22c55e', marginBottom:14 }}>✏️ 수정 중 — {h.name}</div>
                <HealthFormFields f={editForm} setF={setEditForm} />
                {/* 크로스 연결 (수정 모드에서도 바로 조작) */}
                <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #e8f5e8' }}>
                  <SubNav
                    tabs={[
                      { id:'ingredient', label:`🥕 식재료 (${linkedIngs.length})`, color:'#a855f7' },
                      { id:'tv',         label:`📺 TV방송 (${linkedTvs.length})`, color:'#f59e0b' },
                    ]}
                    active={crossTab} onChange={setCrossTab}
                  />
                  {crossTab === 'ingredient' && (
                    <div>
                      <CrossBadge
                        items={linkedIngs.map(ih => ({ id:ih.id, label:`${ING_CAT_MAP[ih.ingredients?.category]?.emoji||'🥕'} ${ih.ingredients?.name}` }))}
                        color="#a855f7" onRemove={unlinkIng}
                      />
                      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, marginTop:10 }}>
                        <SearchSelect items={allIngredients} value={linkIngId} onChange={setLinkIngId} placeholder="식재료 검색..." />
                        <button type="button" onClick={linkIng} style={{ ...S.btn('#a855f7'), padding:'10px 14px' }}>+ 연결</button>
                      </div>
                    </div>
                  )}
                  {crossTab === 'tv' && (
                    <div>
                      <CrossBadge
                        items={linkedTvs.map(ht => ({ id:ht.id, label:`📺 ${ht.tv_shows?.name}` }))}
                        color="#f59e0b" onRemove={unlinkTv}
                      />
                      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, marginTop:10 }}>
                        <SearchSelect items={allTvShows} value={linkTvId} onChange={setLinkTvId} placeholder="TV방송 검색..." />
                        <button type="button" onClick={linkTv} style={{ ...S.btn('#f59e0b'), padding:'10px 14px' }}>+ 연결</button>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:8, marginTop:14 }}>
                  <button onClick={() => saveEdit(h.id)} style={S.btn()}>저장</button>
                  <button onClick={() => { setEditId(null); setSelId(null) }} style={S.btnGhost}>취소</button>
                </div>
              </div>
            )

            return (
              <div key={h.id}
                onClick={() => { if(editId) return; setSelId(isSel ? null : h.id); if(!isSel) loadCrossLinks(h.id) }}
                style={{ ...S.row, cursor:'pointer', border:`1.5px solid ${isSel?'#a855f7':'#d1e8d1'}`,
                  background: isSel ? '#fdf4ff' : '#fff' }}>
                {/* 헤더 */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:4, flexWrap:'wrap' }}>
                      <span style={{ fontWeight:800, color:'#111', fontSize:14 }}>💊 {h.name}</span>
                      {h.category && (
                        <span style={{ fontSize:10, padding:'1px 7px', borderRadius:20,
                          background:'#22c55e18', color:'#16a34a', border:'1px solid #22c55e33' }}>{h.category}</span>
                      )}
                    </div>
                    {h.description && <p style={{ fontSize:12, color:'#555', margin:'0 0 5px' }}>{h.description}</p>}
                    {/* 연결 개수 뱃지 */}
                    <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20,
                        background:'#f0fdf4', border:'1px solid #86efac', color:'#16a34a', fontWeight:700 }}>
                        🥕 식재료 {(h.ingredients||[]).length}개
                      </span>
                    </div>
                    {/* 연령대 뱃지 */}
                    {(h.age_groups||[]).length > 0 && (
                      <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:4 }}>
                        {h.age_groups.map(ag => {
                          const info = AGE_GROUPS.find(a => a.id === ag)
                          return info ? (
                            <span key={ag} style={{ fontSize:10, padding:'1px 7px', borderRadius:20,
                              background:info.color+'28', border:`1px solid ${info.color}`, color:'#333' }}>{info.label}</span>
                          ) : null
                        })}
                      </div>
                    )}
                    {/* 성별 */}
                    {h.gender && h.gender !== 'all' && (() => {
                      const g = GENDER_OPTIONS.find(x => x.id === h.gender)
                      return g ? <span style={{ fontSize:10, padding:'1px 8px', borderRadius:20,
                        background:g.color+'22', color:g.color, border:`1px solid ${g.color}44`, display:'inline-block', marginBottom:4 }}>{g.label}</span> : null
                    })()}
                    {/* 제철 월 */}
                    {(h.months||[]).length > 0 && (
                      <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:4 }}>
                        {h.months.map(m => (
                          <span key={m} style={{ fontSize:10, padding:'1px 7px', borderRadius:20,
                            background:'#dcfce7', border:'1px solid #86efac', color:'#166534', fontWeight:700 }}>{m}월</span>
                        ))}
                      </div>
                    )}
                    {h.caution && (
                      <div style={{ padding:'4px 8px', borderRadius:6, background:'#fef2f2', border:'1px solid #fca5a5', fontSize:11, marginBottom:4 }}>
                        <span style={{ color:'#dc2626', fontWeight:700 }}>⚠️ </span>
                        <span style={{ color:'#dc2626' }}>{h.caution}</span>
                      </div>
                    )}
                    {h.coupang_url && (
                      <a href={h.coupang_url} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize:11, color:'#ea580c', textDecoration:'none', display:'inline-block' }}>🛒 쿠팡 링크 ↗</a>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:5, flexShrink:0, marginLeft:8 }}>
                    <button onClick={e => {
                      e.stopPropagation()
                      setEditId(h.id); setSelId(h.id)
                      setEditForm({ name:h.name, description:h.description||'', category:h.category||'',
                        coupang_url:h.coupang_url||'', age_groups:h.age_groups||[], gender:h.gender||'all',
                        caution:h.caution||'', months:h.months||[], regions:h.regions||[] })
                      loadCrossLinks(h.id)
                    }} style={{ ...S.btnGhost, padding:'4px 10px', fontSize:12 }}>✏️</button>
                    <button onClick={e => { e.stopPropagation(); del(h.id, h.name) }}
                      style={{ padding:'4px 10px', borderRadius:7, border:'1px solid #fca5a5',
                        background:'#fff1f2', color:'#dc2626', fontSize:12, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                  </div>
                </div>

                {/* 클릭 시 크로스 연결 패널 */}
                {isSel && !isEdit && (
                  <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #e9d5ff' }}
                    onClick={e => e.stopPropagation()}>
                    <SubNav
                      tabs={[
                        { id:'ingredient', label:`🥕 식재료 (${linkedIngs.length})`, color:'#a855f7' },
                        { id:'tv',         label:`📺 TV방송 (${linkedTvs.length})`, color:'#f59e0b' },
                      ]}
                      active={crossTab} onChange={setCrossTab}
                    />
                    {crossTab === 'ingredient' && (
                      <div>
                        <CrossBadge
                          items={linkedIngs.map(ih => ({ id:ih.id, label:`${ING_CAT_MAP[ih.ingredients?.category]?.emoji||'🥕'} ${ih.ingredients?.name}` }))}
                          color="#a855f7" onRemove={unlinkIng}
                        />
                        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, marginTop:10 }}>
                          <SearchSelect items={allIngredients} value={linkIngId} onChange={setLinkIngId} placeholder="식재료 검색..." />
                          <button type="button" onClick={linkIng} style={{ ...S.btn('#a855f7'), padding:'9px 13px', fontSize:13 }}>+ 연결</button>
                        </div>
                      </div>
                    )}
                    {crossTab === 'tv' && (
                      <div>
                        <CrossBadge
                          items={linkedTvs.map(ht => ({ id:ht.id, label:`📺 ${ht.tv_shows?.name}` }))}
                          color="#f59e0b" onRemove={unlinkTv}
                        />
                        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, marginTop:10 }}>
                          <SearchSelect items={allTvShows} value={linkTvId} onChange={setLinkTvId} placeholder="TV방송 검색..." />
                          <button type="button" onClick={linkTv} style={{ ...S.btn('#f59e0b'), padding:'9px 13px', fontSize:13 }}>+ 연결</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// IngredientTab — 식재료 관리 (건강효능 크로스 연결 완전 통합)
// ══════════════════════════════════════════════════════════
function IngredientTab({ adminToken, showToast, confirmDelete, allHealths, allTvShows, refreshHealths }) {
  const EMPTY_FORM = {
    name:'', display_name:'', region_id:'', category:'fish', description:'',
    coupang_url:'', caution:'', is_special:false, is_limited:false, limited_days:'', is_global:false, is_brand:false,
    season_badge:[], jeolgi_badge:[], special_badge:[], habitat_badge:[], farming_badge:[],
    age_groups:[], gender:'all', months:[]
  }
  const EMPTY_REGION = { region:'gangwon', district:'', months:[] }
  const [formOpen, setFormOpen] = useState(false)

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [catTab, setCatTab] = useState('all')
  const [filterMonth, setFilterMonth] = useState(0)
  const [filterRegion, setFilterRegion] = useState('')
  const [filterSuperfood, setFilterSuperfood] = useState(false)
  const [filterGlobal, setFilterGlobal] = useState(false)
  const [filterSpecial, setFilterSpecial] = useState(false)
  const [filterLimited, setFilterLimited] = useState(false)
  const [filterBrand, setFilterBrand] = useState(false)
  const [filterSeason, setFilterSeason] = useState('')
  const [filterJeolgi, setFilterJeolgi] = useState('')
  const [filterSpecialBadge, setFilterSpecialBadge] = useState('')
  const [filterHabitat, setFilterHabitat] = useState('')
  const [filterFarming, setFilterFarming] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [formRegions, setFormRegions] = useState([])
  const [formRegionForm, setFormRegionForm] = useState(EMPTY_REGION)

  // 수정 모드
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editRegions, setEditRegions] = useState([])
  const [editHealths, setEditHealths] = useState([])
  const [editRegionForm, setEditRegionForm] = useState(EMPTY_REGION)
  const [editLinkHealthId, setEditLinkHealthId] = useState('')

  // 보기 모드 클릭 패널
  const [selId, setSelId] = useState(null)
  const [panelHealths, setPanelHealths] = useState([])
  const [panelRegions, setPanelRegions] = useState([])
  const [panelHealthId, setPanelHealthId] = useState('')
  const [panelRegionForm, setPanelRegionForm] = useState(EMPTY_REGION)
  const [panelSection, setPanelSection] = useState('health')

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [ings, ir] = await Promise.all([
        apiFetch(api('ingredients')),
        apiFetch(api('ingredient_regions')),
      ])
      const regMap = {}
      ;(ir||[]).forEach(r => {
        if (!regMap[r.ingredient_id]) regMap[r.ingredient_id] = []
        if (r.label) regMap[r.ingredient_id].push(r.label)
      })
      setList((ings||[]).map(i => ({ ...i, regions_preview: regMap[i.id]||[] })))
    } catch(e) { showToast('❌ '+e.message) }
    setLoading(false)
  }, [])

  const loadPanelLinks = useCallback(async (id) => {
    try {
      const [ih, ir] = await Promise.all([
        apiFetch(`${api('ingredient_health')}&ingredient_id=${id}`),
        apiFetch(`${api('ingredient_regions')}&ingredient_id=${id}`),
      ])
      setPanelHealths(ih); setPanelRegions(ir)
    } catch {}
  }, [])

  const loadEditLinks = useCallback(async (id) => {
    try {
      const [ih, ir] = await Promise.all([
        apiFetch(`${api('ingredient_health')}&ingredient_id=${id}`),
        apiFetch(`${api('ingredient_regions')}&ingredient_id=${id}`),
      ])
      setEditHealths(ih); setEditRegions(ir)
    } catch {}
  }, [])

  useEffect(() => { loadAll() }, [])
  useEffect(() => {
    if (selId) loadPanelLinks(selId)
    else { setPanelHealths([]); setPanelRegions([]) }
  }, [selId])

  const autoLabel = (ingName, regionId, district) => {
    const rShort = district ? district.replace(/(시|군|구)$/, '') : shortRegionLabel(regionId)
    return ingName && rShort ? `${ingName}-${rShort}` : ''
  }

  const submit = async () => {
    if (!form.name.trim()) { showToast('⚠️ 이름 필수'); return }
    setSaving(true)
    try {
      const submitData = { ...form, name: form.display_name?.trim() || form.name.trim() }
      const created = await apiFetch(api('ingredients'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify(submitData)
      })
      for (const r of formRegions) {
        await apiFetch(api('ingredient_regions'), {
          method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
          body:JSON.stringify({ ingredient_id:created.id, region:r.region, district:r.district, months:r.months, label:r.label||'' })
        }).catch(() => {})
      }
      setForm(EMPTY_FORM); setFormRegions([]); setFormRegionForm(EMPTY_REGION)
      showToast('✅ 등록 완료'); loadAll()
    } catch(e) { showToast('❌ '+e.message) }
    setSaving(false)
  }

  const saveEdit = async (id) => {
    try {
      await apiFetch(`${api('ingredients')}&id=${id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ ...editForm, name: editForm.display_name?.trim() || editForm.name?.trim() })
      })
      setEditId(null); showToast('✅ 저장됨'); loadAll()
    } catch(e) { showToast('❌ '+e.message) }
  }

  const del = (id, name) => {
    confirmDelete(name, async () => {
      try {
        await apiFetch(`${api('ingredients')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
        if (editId === id) setEditId(null)
        if (selId === id) setSelId(null)
        setList(p => p.filter(i => i.id !== id))
        showToast('🗑 삭제됨')
      } catch(e) { showToast('❌ '+e.message) }
    })
  }

  // 건강효능 연결/해제 (패널)
  const panelLinkHealth = async () => {
    if (!selId || !panelHealthId) { showToast('⚠️ 효능 선택 필요'); return }
    try {
      await apiFetch(api('ingredient_health'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ ingredient_id:selId, health_id:panelHealthId })
      })
      setPanelHealthId(''); loadPanelLinks(selId); refreshHealths(); showToast('✅ 연결됨')
    } catch(e) { showToast('❌ '+e.message) }
  }

  const panelUnlinkHealth = async (id) => {
    try {
      await apiFetch(`${api('ingredient_health')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      loadPanelLinks(selId); refreshHealths(); showToast('🗑 해제됨')
    } catch(e) { showToast('❌ '+e.message) }
  }

  // 건강효능 연결/해제 (수정 모드)
  const editLinkHealth = async () => {
    if (!editId || !editLinkHealthId) { showToast('⚠️ 효능 선택 필요'); return }
    try {
      await apiFetch(api('ingredient_health'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ ingredient_id:editId, health_id:editLinkHealthId })
      })
      setEditLinkHealthId(''); loadEditLinks(editId); refreshHealths()
    } catch(e) { showToast('❌ '+e.message) }
  }

  const editUnlinkHealth = async (id) => {
    try {
      await apiFetch(`${api('ingredient_health')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      loadEditLinks(editId); refreshHealths()
    } catch(e) { showToast('❌ '+e.message) }
  }

  // 지역 추가/삭제
  const panelAddRegion = async () => {
    if (!selId || !panelRegionForm.region || !panelRegionForm.months.length) { showToast('⚠️ 지역·월 필수'); return }
    const sel = list.find(i => i.id === selId)
    try {
      await apiFetch(api('ingredient_regions'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({
          ingredient_id:selId, region:panelRegionForm.region, district:panelRegionForm.district,
          months:panelRegionForm.months, label:panelRegionForm.label || autoLabel(sel?.name||'', panelRegionForm.region, panelRegionForm.district)
        })
      })
      setPanelRegionForm(EMPTY_REGION); loadPanelLinks(selId); loadAll(); showToast('✅ 지역 추가됨')
    } catch(e) { showToast('❌ '+e.message) }
  }

  const panelDelRegion = async (id) => {
    try {
      await apiFetch(`${api('ingredient_regions')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      loadPanelLinks(selId); loadAll(); showToast('🗑 삭제됨')
    } catch(e) { showToast('❌ '+e.message) }
  }

  const editAddRegion = async () => {
    if (!editId || !editRegionForm.region || !editRegionForm.months.length) { showToast('⚠️ 지역·월 필수'); return }
    try {
      await apiFetch(api('ingredient_regions'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({
          ingredient_id:editId, region:editRegionForm.region, district:editRegionForm.district,
          months:editRegionForm.months, label:editRegionForm.label || autoLabel(editForm.name, editRegionForm.region, editRegionForm.district)
        })
      })
      setEditRegionForm(EMPTY_REGION); loadEditLinks(editId); loadAll()
    } catch(e) { showToast('❌ '+e.message) }
  }

  const editDelRegion = async (id) => {
    try {
      await apiFetch(`${api('ingredient_regions')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      loadEditLinks(editId); loadAll()
    } catch(e) { showToast('❌ '+e.message) }
  }

  const byTab = catTab === 'all' ? list : list.filter(i => i.category === catTab)
  const filtered = byTab.filter(i => {
    if (searchQ && !i.name.includes(searchQ)) return false
    if (filterMonth !== 0 && !(i.months||[]).includes(filterMonth)) return false
    if (filterRegion && !(i.regions_preview||[]).some(lbl => lbl.includes(filterRegion.slice(0,2)))) return false
    if (filterSuperfood && !i.is_superfood) return false
    if (filterGlobal && !i.is_global) return false
    if (filterSpecial && !i.is_special) return false
    if (filterLimited && !i.is_limited) return false
    if (filterBrand && !i.is_brand) return false
    if (filterSeason && !(Array.isArray(i.season_badge) ? i.season_badge.includes(filterSeason) : i.season_badge === filterSeason)) return false
    if (filterJeolgi && !(Array.isArray(i.jeolgi_badge)?i.jeolgi_badge.includes(filterJeolgi):i.jeolgi_badge===filterJeolgi)) return false
    if (filterSpecialBadge && !(Array.isArray(i.special_badge)?i.special_badge.includes(filterSpecialBadge):i.special_badge===filterSpecialBadge)) return false
    if (filterHabitat && !(Array.isArray(i.habitat_badge)?i.habitat_badge.includes(filterHabitat):i.habitat_badge===filterHabitat)) return false
    if (filterFarming && !(Array.isArray(i.farming_badge)?i.farming_badge.includes(filterFarming):i.farming_badge===filterFarming)) return false
    return true
  })
  // 지역 옵션: regions_preview 라벨에서 시도명 추출
  const allRegionLabels = useMemo(() => {
    const set = new Set()
    list.forEach(i => (i.regions_preview||[]).forEach(lbl => {
      // "가리비-전남" → "전남"
      const parts = lbl.split('-')
      if (parts.length >= 2) set.add(parts[parts.length-1])
    }))
    return [...set].sort()
  }, [list])

  // 공통 필드 컴포넌트
  const IngFormFields = ({ f, setF }) => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      <div>
        <label style={S.label}>식재료명 *</label>
        <input value={f.name||''} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="예: 감귤" style={S.input} />
      </div>
      <div>
        <label style={S.label}>지역</label>
        <select value={f.region_id||''} onChange={e=>setF(p=>({...p,region_id:e.target.value}))} style={S.input}>
          <option value="">선택 안 함</option>
          {DEFAULT_CATEGORIES.map(c=><option key={c} value={c}>{categoryLabel(c)}</option>)}
        </select>
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>📌 등록명 (식재료명-지역)</label>
        <input
          value={f.display_name !== undefined
            ? (f.display_name || (f.name && f.region_id ? `${f.name}-${shortRegionLabel(f.region_id)}` : f.name || ''))
            : f.name||''}
          onChange={e=>setF(p=>({...p,display_name:e.target.value}))}
          placeholder="예: 감귤-제주"
          style={{ ...S.input, fontWeight:700, color:'#1d4ed8', fontSize:14 }}
        />
        <p style={{ fontSize:11, color:'#8aaa8a', marginTop:2 }}>💡 자동완성 — 직접 수정 가능</p>
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>카테고리</label>
        {ING_GROUPS.map(group => (
          <div key={group} style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:5, alignItems:'center' }}>
            <span style={{ fontSize:10, color:'#8aaa8a', minWidth:55, fontWeight:600 }}>{group}</span>
            {ING_CATEGORIES.filter(c=>c.group===group).map(c => (
              <button key={c.id} type="button" onClick={()=>setF(p=>({...p,category:c.id}))}
                style={{ padding:'3px 9px', borderRadius:20, border:`1.5px solid ${f.category===c.id?'#a855f7':'#d1e8d1'}`,
                  background:f.category===c.id?'#f5f0ff':'#f5f9f5', color:f.category===c.id?'#a855f7':'#4b6e4b',
                  fontSize:11, fontWeight:f.category===c.id?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>설명</label>
        <input value={f.description||''} onChange={e=>setF(p=>({...p,description:e.target.value}))} placeholder="간단 설명" style={S.input} />
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>🛒 쿠팡 URL</label>
        <input value={f.coupang_url||''} onChange={e=>setF(p=>({...p,coupang_url:e.target.value}))} placeholder="https://coupa.ng/..." style={S.input} />
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>⚠️ 주의사항</label>
        <input value={f.caution||''} onChange={e=>setF(p=>({...p,caution:e.target.value}))}
          placeholder="예: 통풍 환자 주의" style={S.input} list="caution-presets2" />
        <datalist id="caution-presets2">{CAUTION_PRESETS.map(p=><option key={p} value={p}/>)}</datalist>
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>📅 주요 제철 월</label>
        <MonthPills value={f.months||[]} onChange={v=>setF(p=>({...p,months:v}))} />
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>👥 권장 연령대</label>
        <AgeGroupPicker value={f.age_groups||[]} onChange={v=>setF(p=>({...p,age_groups:v}))} />
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>👤 성별</label>
        <GenderPicker value={f.gender||'all'} onChange={v=>setF(p=>({...p,gender:v}))} />
      </div>
      {/* 토글 3종 */}
      <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:10, paddingTop:4 }}>
        <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
          <Toggle value={f.is_special||false} onChange={v=>setF(p=>({...p,is_special:v}))} color="#f59e0b" />
          <span style={{ fontSize:13, fontWeight:700, color:f.is_special?'#f59e0b':'#4b6e4b' }}>🏆 특산품</span>
          <span style={{ fontSize:11, color:'#aaa' }}>해당 지역 대표 특산물</span>
        </label>
        <div>
          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
            <Toggle value={f.is_limited||false} onChange={v=>setF(p=>({...p,is_limited:v,limited_days:''}))} color="#10b981" />
            <span style={{ fontSize:13, fontWeight:700, color:f.is_limited?'#10b981':'#4b6e4b' }}>⏰ 기간한정</span>
            <span style={{ fontSize:11, color:'#aaa' }}>특정 기간에만 출하</span>
          </label>
          {f.is_limited && (
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:6, marginLeft:50 }}>
              {LIMITED_PRESETS.map(p => (
                <button key={p.value} type="button" onClick={()=>setF(prev=>({...prev,limited_days:p.value}))}
                  style={{ padding:'4px 11px', borderRadius:20, border:'1.5px solid #10b981',
                    background:f.limited_days===p.value?'#10b981':'#d1fae5', color:f.limited_days===p.value?'#fff':'#059669',
                    fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
          <Toggle value={f.is_global||false} onChange={v=>setF(p=>({...p,is_global:v}))} color="#3b82f6" />
          <span style={{ fontSize:13, fontWeight:700, color:f.is_global?'#3b82f6':'#4b6e4b' }}>🌍 해외 식재료</span>
        </label>
        <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
          <Toggle value={f.is_brand||false} onChange={v=>setF(p=>({...p,is_brand:v}))} color="#e63946" />
          <span style={{ fontSize:13, fontWeight:700, color:f.is_brand?'#e63946':'#4b6e4b' }}>🏷️ 지역브랜드</span>
        </label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:4 }}>
          <div>
            <label style={S.label}>🌸 계절 뱃지 (복수 선택 가능)</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
              {[['spring','🌸 봄','#166534','#f0fdf4'],['summer','🌞 여름','#92400e','#fefce8'],
                ['fall','🍂 가을','#c2410c','#fff7ed'],['winter','❄️ 겨울','#1e40af','#eff6ff']
              ].map(([v,label,color,bg]) => {
                const arr = Array.isArray(f.season_badge) ? f.season_badge : (f.season_badge ? [f.season_badge] : [])
                const on = arr.includes(v)
                return (
                  <button key={v} type="button" onClick={()=>{
                    const cur = Array.isArray(f.season_badge)?f.season_badge:(f.season_badge?[f.season_badge]:[])
                    setF(p=>({...p, season_badge: on ? cur.filter(x=>x!==v) : [...cur,v]}))
                  }} style={{ padding:'4px 10px', borderRadius:20, fontSize:11, cursor:'pointer',
                    border:`1.5px solid ${on?color:'#d1e8d1'}`,
                    background:on?bg:'#fff', color:on?color:'#4b6e4b',
                    fontWeight:on?700:400, fontFamily:"'Outfit',sans-serif" }}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label style={S.label}>🎋 절기 뱃지 (복수 선택 가능)</label>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:4 }}>
              {[['seollal','🎍 설날','#7e22ce','#fdf4ff'],['ipchun','🌱 입춘','#166534','#f0fdf4'],
                ['daeboreum','🌕 정월대보름','#713f12','#fef9c3'],['dano','🌿 단오','#166534','#f0fdf4'],['hansik','🌸 한식','#7e22ce','#fdf4ff'],
                ['sambok','🔥 삼복','#be123c','#fff1f2'],
                ['chuseok','🌕 추석','#854d0e','#fefce8'],['gimjang','🥬 김장철','#166534','#f0fdf4'],
                ['dongji','☯️ 동지','#1e40af','#eff6ff']
              ].map(([v,label,color,bg])=>{
                const arr=Array.isArray(f.jeolgi_badge)?f.jeolgi_badge:(f.jeolgi_badge?[f.jeolgi_badge]:[])
                const on=arr.includes(v)
                return(
                  <button key={v} type="button" onClick={()=>{
                    const cur=Array.isArray(f.jeolgi_badge)?f.jeolgi_badge:(f.jeolgi_badge?[f.jeolgi_badge]:[])
                    setF(p=>({...p,jeolgi_badge:on?cur.filter(x=>x!==v):[...cur,v]}))
                  }} style={{padding:'4px 10px',borderRadius:20,fontSize:11,cursor:'pointer',
                    border:`1.5px solid ${on?color:'#d1e8d1'}`,
                    background:on?bg:'#fff',color:on?color:'#4b6e4b',
                    fontWeight:on?700:400,fontFamily:"'Outfit',sans-serif"}}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label style={S.label}>💪 특수 뱃지 (복수 선택 가능)</label>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:4 }}>
              {[['boyangshik','💪 보양식','#c2410c','#fff7ed'],['jeolgi_food','🎋 절기음식','#7e22ce','#fdf4ff'],
                ['hangover','🍶 해장','#854d0e','#fefce8'],['diet','🥗 다이어트','#166534','#f0fdf4']
              ].map(([v,label,color,bg])=>{
                const arr=Array.isArray(f.special_badge)?f.special_badge:(f.special_badge?[f.special_badge]:[])
                const on=arr.includes(v)
                return(
                  <button key={v} type="button" onClick={()=>{
                    const cur=Array.isArray(f.special_badge)?f.special_badge:(f.special_badge?[f.special_badge]:[])
                    setF(p=>({...p,special_badge:on?cur.filter(x=>x!==v):[...cur,v]}))
                  }} style={{padding:'4px 10px',borderRadius:20,fontSize:11,cursor:'pointer',
                    border:`1.5px solid ${on?color:'#d1e8d1'}`,
                    background:on?bg:'#fff',color:on?color:'#4b6e4b',
                    fontWeight:on?700:400,fontFamily:"'Outfit',sans-serif"}}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // 지역 추가 박스
  const RegionAddBox = ({ regionForm, setRegionForm, onAdd, ingName }) => (
    <div style={{ background:'#eff6ff', borderRadius:10, padding:12, border:'1px solid #bfdbfe', marginTop:10 }}>
      <div style={{ fontSize:12, fontWeight:700, color:'#1d4ed8', marginBottom:8 }}>+ 지역·제철월 추가</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <div>
          <label style={S.label}>시도 *</label>
          <select value={regionForm.region} onChange={e=>setRegionForm(p=>({...p,region:e.target.value}))} style={S.input}>
            {DEFAULT_CATEGORIES.map(c=><option key={c} value={c}>{categoryLabel(c)}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>시군구 (선택)</label>
          <input value={regionForm.district||''} onChange={e=>setRegionForm(p=>({...p,district:e.target.value}))} placeholder="예: 속초시" style={S.input} />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={S.label}>제철 월 *</label>
          <MonthPills value={regionForm.months||[]} onChange={v=>setRegionForm(p=>({...p,months:v}))} />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={S.label}>📌 조합명 (자동완성)</label>
          <input
            value={regionForm.label || autoLabel(ingName||'', regionForm.region, regionForm.district)}
            onChange={e=>setRegionForm(p=>({...p,label:e.target.value}))}
            placeholder={autoLabel(ingName||'', regionForm.region, regionForm.district)||'예: 감귤-제주'}
            style={{ ...S.input, fontWeight:700, color:'#1d4ed8' }}
          />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <button type="button" onClick={onAdd} style={{ ...S.btn('#0ea5e9'), padding:'7px 16px', fontSize:13 }}>+ 추가</button>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      {/* ── 등록 폼 (접기/펼치기) ── */}
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
          onClick={() => setFormOpen(p => !p)}>
          <div style={S.cardTitle}>🥕 식재료 등록</div>
          <span style={{ fontSize:16, color:'#a855f7', lineHeight:1 }}>{formOpen ? '▲' : '▼'}</span>
        </div>
        {formOpen && (
          <>
            <IngFormFields f={form} setF={setForm} />
            {/* 지역·제철 미리 추가 */}
            <div style={{ marginTop:14 }}>
              {formRegions.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:8 }}>
                  {formRegions.map(r => (
                    <div key={r._key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                      background:'#eff6ff', borderRadius:7, padding:'7px 12px', fontSize:12, border:'1px solid #bfdbfe' }}>
                      <span style={{ color:'#1e40af', fontWeight:700 }}>{r.label || `${categoryLabel(r.region)} ${r.months.join('·')}월`}</span>
                      <button type="button" onClick={()=>setFormRegions(p=>p.filter(x=>x._key!==r._key))}
                        style={{ padding:'1px 7px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <RegionAddBox
                regionForm={formRegionForm} setRegionForm={setFormRegionForm}
                ingName={form.display_name || form.name}
                onAdd={() => {
                  if (!formRegionForm.region || !formRegionForm.months.length) { showToast('⚠️ 지역·월 필수'); return }
                  const label = formRegionForm.label || autoLabel(form.display_name||form.name, formRegionForm.region, formRegionForm.district)
                  setFormRegions(p => [...p, { ...formRegionForm, label, _key:Date.now() }])
                  setFormRegionForm(EMPTY_REGION)
                }}
              />
            </div>
            <button onClick={submit} disabled={saving} style={{ ...S.btn(), marginTop:14, opacity:saving?.6:1 }}>
              {saving?'등록 중...':'+ 등록'}
            </button>
          </>
        )}
      </div>

      {/* ── 필터 바 ── */}
      <div style={{ background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:12, padding:14, marginBottom:12 }}>
        {/* 1줄: 검색 + 카운트 */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, gap:8, flexWrap:'wrap' }}>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 이름 검색" style={{ ...S.input, width:170, flex:'none' }} />
          <span style={{ fontSize:12, color:'#4b6e4b', fontWeight:700 }}>{filtered.length}개</span>
        </div>
        {/* 2줄: 월 필터 */}
        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#4b6e4b', marginBottom:5 }}>📅 월 필터</div>
          <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
            <button onClick={()=>setFilterMonth(0)}
              style={{ padding:'3px 8px', borderRadius:20, border:`1.5px solid ${filterMonth===0?'#16a34a':'#d1e8d1'}`,
                background:filterMonth===0?'#dcfce7':'#fff', color:filterMonth===0?'#15803d':'#4b6e4b',
                fontSize:11, fontWeight:filterMonth===0?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>전체</button>
            {MONTHS.map(m => (
              <button key={m} onClick={()=>setFilterMonth(filterMonth===m?0:m)}
                style={{ padding:'3px 8px', borderRadius:20, border:`1.5px solid ${filterMonth===m?'#16a34a':'#d1e8d1'}`,
                  background:filterMonth===m?'#dcfce7':'#fff', color:filterMonth===m?'#15803d':'#4b6e4b',
                  fontSize:11, fontWeight:filterMonth===m?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                {m}월 <span style={{ fontSize:10, opacity:.7 }}>({list.filter(i=>(i.months||[]).includes(m)).length})</span>
              </button>
            ))}
          </div>
        </div>
        {/* 3줄: 지역 필터 */}
        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#4b6e4b', marginBottom:5 }}>📍 지역 필터</div>
          <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
            <button onClick={()=>setFilterRegion('')}
              style={{ padding:'3px 8px', borderRadius:20, border:`1.5px solid ${filterRegion===''?'#16a34a':'#d1e8d1'}`,
                background:filterRegion===''?'#dcfce7':'#fff', color:filterRegion===''?'#15803d':'#4b6e4b',
                fontSize:11, fontWeight:filterRegion===''?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>전체</button>
            {allRegionLabels.map(region => {
              const cnt = list.filter(i=>(i.regions_preview||[]).some(lbl=>lbl.includes(region.slice(0,2)))).length
              const SITE_REGIONS = ['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주']
              const isSite = SITE_REGIONS.some(r => region.startsWith(r))
              const isActive = filterRegion === region
              return (
                <button key={region} onClick={()=>setFilterRegion(isActive?'':region)}
                  style={{ padding:'3px 8px', borderRadius:20,
                    border:`1.5px solid ${isActive?'#16a34a': isSite?'#0ea5e9':'#d1e8d1'}`,
                    background: isActive?'#dcfce7': isSite?'#e0f2fe':'#fff',
                    color: isActive?'#15803d': isSite?'#0369a1':'#4b6e4b',
                    fontSize:11, fontWeight: isActive||isSite?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                  {region} <span style={{ fontSize:10, opacity:.7 }}>({cnt})</span>
                </button>
              )
            })}
          </div>
        </div>
        {/* 4줄: 슈퍼푸드 · 해외 토글 */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={()=>setFilterSuperfood(v=>!v)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20,
              border:`1.5px solid ${filterSuperfood?'#f59e0b':'#d1e8d1'}`,
              background:filterSuperfood?'#fef3c7':'#fff', color:filterSuperfood?'#92400e':'#4b6e4b',
              fontSize:12, fontWeight:filterSuperfood?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
            🌟 슈퍼푸드만 <span style={{ fontSize:10, opacity:.7 }}>({list.filter(i=>i.is_superfood).length})</span>
          </button>
          <button onClick={()=>setFilterGlobal(v=>!v)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20,
              border:`1.5px solid ${filterGlobal?'#3b82f6':'#d1e8d1'}`,
              background:filterGlobal?'#dbeafe':'#fff', color:filterGlobal?'#1d4ed8':'#4b6e4b',
              fontSize:12, fontWeight:filterGlobal?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
            🌍 해외만 <span style={{ fontSize:10, opacity:.7 }}>({list.filter(i=>i.is_global).length})</span>
          </button>
          <button onClick={()=>setFilterSpecial(v=>!v)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20,
              border:`1.5px solid ${filterSpecial?'#f59e0b':'#d1e8d1'}`,
              background:filterSpecial?'#fef3c7':'#fff', color:filterSpecial?'#b45309':'#4b6e4b',
              fontSize:12, fontWeight:filterSpecial?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
            🏆 특산품만 <span style={{ fontSize:10, opacity:.7 }}>({list.filter(i=>i.is_special).length})</span>
          </button>
          <button onClick={()=>setFilterLimited(v=>!v)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20,
              border:`1.5px solid ${filterLimited?'#10b981':'#d1e8d1'}`,
              background:filterLimited?'#d1fae5':'#fff', color:filterLimited?'#059669':'#4b6e4b',
              fontSize:12, fontWeight:filterLimited?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
            ⏰ 기간한정만 <span style={{ fontSize:10, opacity:.7 }}>({list.filter(i=>i.is_limited).length})</span>
          </button>
          <button onClick={()=>setFilterBrand(v=>!v)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20,
              border:`1.5px solid ${filterBrand?'#e63946':'#d1e8d1'}`,
              background:filterBrand?'#ffe4e6':'#fff', color:filterBrand?'#e63946':'#4b6e4b',
              fontSize:12, fontWeight:filterBrand?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
            🏷️ 지역브랜드만 <span style={{ fontSize:10, opacity:.7 }}>({list.filter(i=>i.is_brand).length})</span>
          </button>
          {/* 계절 필터 */}
          <div style={{ width:'100%', display:'flex', gap:4, flexWrap:'wrap', marginTop:6, paddingTop:6, borderTop:'1px dashed #d1e8d1' }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#4b6e4b', alignSelf:'center', marginRight:2 }}>🌸 계절:</span>
            {[['spring','🌸 봄','#166534','#f0fdf4','#86efac'],
              ['summer','🌞 여름','#92400e','#fefce8','#fde68a'],
              ['fall','🍂 가을','#c2410c','#fff7ed','#fdba74'],
              ['winter','❄️ 겨울','#1e40af','#eff6ff','#bae6fd']
            ].map(([v,label,color,bg,border]) => (
              <button key={v} onClick={()=>setFilterSeason(filterSeason===v?'':v)}
                style={{ padding:'3px 10px', borderRadius:20, fontSize:11,
                  border:`1.5px solid ${filterSeason===v?border:'#d1e8d1'}`,
                  background:filterSeason===v?bg:'#fff', color:filterSeason===v?color:'#4b6e4b',
                  fontWeight:filterSeason===v?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                {label} <span style={{ fontSize:10, opacity:.7 }}>({list.filter(i=>Array.isArray(i.season_badge)?i.season_badge.includes(v):i.season_badge===v).length})</span>
              </button>
            ))}
          </div>
          {/* 절기 필터 */}
          <div style={{ width:'100%', display:'flex', gap:4, flexWrap:'wrap', marginTop:4 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#4b6e4b', alignSelf:'center', marginRight:2 }}>🎋 절기:</span>
            {[['sambok','🔥 삼복'],['chuseok','🌕 추석'],['dongji','☯️ 동지'],
              ['seollal','🎍 설날'],['gimjang','🥬 김장철'],['ipchun','🌱 입춘'],
              ['daeboreum','🌕 정월대보름'],['dano','🌿 단오'],['hansik','🌸 한식']
            ].map(([v,label]) => (
              <button key={v} onClick={()=>setFilterJeolgi(filterJeolgi===v?'':v)}
                style={{ padding:'3px 10px', borderRadius:20, fontSize:11,
                  border:`1.5px solid ${filterJeolgi===v?'#a855f7':'#d1e8d1'}`,
                  background:filterJeolgi===v?'#fdf4ff':'#fff', color:filterJeolgi===v?'#7e22ce':'#4b6e4b',
                  fontWeight:filterJeolgi===v?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                {label} <span style={{ fontSize:10, opacity:.7 }}>({list.filter(i=>Array.isArray(i.jeolgi_badge)?i.jeolgi_badge.includes(v):i.jeolgi_badge===v).length})</span>
              </button>
            ))}
          </div>
          {/* 특수 필터 */}
          <div style={{ width:'100%', display:'flex', gap:4, flexWrap:'wrap', marginTop:4 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#4b6e4b', alignSelf:'center', marginRight:2 }}>💪 특수:</span>
            {[['boyangshik','💪 보양식','#c2410c','#fff7ed','#fed7aa'],
              ['jeolgi_food','🎋 절기음식','#7e22ce','#fdf4ff','#e9d5ff'],
              ['hangover','🍶 해장','#854d0e','#fefce8','#fde68a'],
              ['diet','🥗 다이어트','#166534','#f0fdf4','#86efac']
            ].map(([v,label,color,bg,border]) => (
              <button key={v} onClick={()=>setFilterSpecialBadge(filterSpecialBadge===v?'':v)}
                style={{ padding:'3px 10px', borderRadius:20, fontSize:11,
                  border:`1.5px solid ${filterSpecialBadge===v?border:'#d1e8d1'}`,
                  background:filterSpecialBadge===v?bg:'#fff', color:filterSpecialBadge===v?color:'#4b6e4b',
                  fontWeight:filterSpecialBadge===v?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                {label} <span style={{ fontSize:10, opacity:.7 }}>({list.filter(i=>Array.isArray(i.special_badge)?i.special_badge.includes(v):i.special_badge===v).length})</span>
              </button>
            ))}
          </div>
          {/* 서식지 필터 */}
          <div style={{ width:'100%', display:'flex', gap:4, flexWrap:'wrap', marginTop:4 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#4b6e4b', alignSelf:'center', marginRight:2 }}>🏝️ 서식지:</span>
            {[['ocean','🌊 바다','#0c4a6e','#f0f9ff','#38bdf8'],
              ['island','🏝️ 섬','#0369a1','#f0f9ff','#7dd3fc'],
              ['freshwater','🐟 민물','#1d4ed8','#eff6ff','#93c5fd'],
              ['tidal','🌊 갯벌','#0f766e','#f0fdfa','#5eead4'],
              ['mountain','🏔️ 산','#3f6212','#f7fee7','#a3e635']
            ].map(([v,label,color,bg,border])=>(
              <button key={v} onClick={()=>setFilterHabitat(filterHabitat===v?'':v)}
                style={{ padding:'3px 10px', borderRadius:20, fontSize:11,
                  border:`1.5px solid ${filterHabitat===v?border:'#d1e8d1'}`,
                  background:filterHabitat===v?bg:'#fff', color:filterHabitat===v?color:'#4b6e4b',
                  fontWeight:filterHabitat===v?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                {label} <span style={{ fontSize:10, opacity:.7 }}>({list.filter(i=>Array.isArray(i.habitat_badge)?i.habitat_badge.includes(v):i.habitat_badge===v).length})</span>
              </button>
            ))}
          </div>
          {/* 생산방식 필터 */}
          <div style={{ width:'100%', display:'flex', gap:4, flexWrap:'wrap', marginTop:4 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#4b6e4b', alignSelf:'center', marginRight:2 }}>🤿 생산방식:</span>
            {[['aquaculture','🤿 양식','#7e22ce','#fdf4ff','#d8b4fe'],
              ['wild','🎣 자연산','#c2410c','#fff7ed','#fdba74'],
              ['fermented','🥟 발효','#713f12','#fef9c3','#fde68a']
            ].map(([v,label,color,bg,border])=>(
              <button key={v} onClick={()=>setFilterFarming(filterFarming===v?'':v)}
                style={{ padding:'3px 10px', borderRadius:20, fontSize:11,
                  border:`1.5px solid ${filterFarming===v?border:'#d1e8d1'}`,
                  background:filterFarming===v?bg:'#fff', color:filterFarming===v?color:'#4b6e4b',
                  fontWeight:filterFarming===v?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                {label} <span style={{ fontSize:10, opacity:.7 }}>({list.filter(i=>Array.isArray(i.farming_badge)?i.farming_badge.includes(v):i.farming_badge===v).length})</span>
              </button>
            ))}
          </div>
          {(filterMonth!==0||filterRegion||filterSuperfood||filterGlobal||filterSpecial||filterLimited||filterBrand||filterSeason||filterJeolgi||filterSpecialBadge||filterHabitat||filterFarming||searchQ) && (
            <button onClick={()=>{setFilterMonth(0);setFilterRegion('');setFilterSuperfood(false);setFilterGlobal(false);setFilterSpecial(false);setFilterLimited(false);setFilterBrand(false);setFilterSeason('');setFilterJeolgi('');setFilterSpecialBadge('');setFilterHabitat('');setFilterFarming('');setSearchQ('')}}
              style={{ padding:'5px 12px', borderRadius:20, border:'1.5px solid #d1e8d1', background:'#fff', color:'#6b7280',
                fontSize:12, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
              🔄 초기화
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom:14, borderBottom:'1px solid #d1e8d1', paddingBottom:10 }}>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:6 }}>
          <button onClick={()=>{setCatTab('all');setSelId(null)}}
            style={{ padding:'4px 11px', borderRadius:20, border:`1.5px solid ${catTab==='all'?'#a855f7':'#d1e8d1'}`,
              background:catTab==='all'?'#f5f0ff':'#f5f9f5', color:catTab==='all'?'#7c3aed':'#4b6e4b',
              fontSize:11, fontWeight:catTab==='all'?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
            🌿 전체 ({list.length})
          </button>
        </div>
        {ING_GROUPS.map(group => (
          <div key={group} style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:5, alignItems:'center' }}>
            <span style={{ fontSize:10, color:'#8aaa8a', minWidth:55, fontWeight:600 }}>{group}</span>
            {ING_CATEGORIES.filter(c=>c.group===group).map(c => {
              const on = catTab === c.id
              const cnt = list.filter(i=>i.category===c.id).length
              return (
                <button key={c.id} onClick={()=>{setCatTab(c.id);setSelId(null)}}
                  style={{ padding:'3px 9px', borderRadius:20, border:`1.5px solid ${on?'#a855f7':'#d1e8d1'}`,
                    background:on?'#f5f0ff':'#f5f9f5', color:on?'#7c3aed':'#4b6e4b',
                    fontSize:11, fontWeight:on?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif", whiteSpace:'nowrap' }}>
                  {c.emoji} {c.label} <span style={{ opacity:.7, fontSize:10 }}>({cnt})</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── 목록 ── */}
      {loading ? <p style={{ textAlign:'center', color:'#aaa', padding:30 }}>불러오는 중...</p> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8 }}>
          {filtered.map(i => {
            const ct = ING_CAT_MAP[i.category]
            const isSel = selId === i.id
            const isEdit = editId === i.id

            if (isEdit) return (
              <div key={i.id} style={{ ...S.row, border:'2px solid #a855f7', gridColumn:'1/-1', background:'#fff' }}>
                <div style={{ fontSize:14, fontWeight:800, color:'#a855f7', marginBottom:14 }}>✏️ 수정 중 — {i.name}</div>
                <IngFormFields f={editForm} setF={setEditForm} />

                {/* 건강효능 연결 (수정 모드) */}
                <div style={{ marginTop:14, background:'#f0fdf4', borderRadius:10, padding:12, border:'1px solid #bbf7d0' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#15803d', marginBottom:8 }}>💊 건강효능 연결</div>
                  <CrossBadge
                    items={editHealths.map(ih => ({ id:ih.id, label:ih.health_benefits?.name }))}
                    color="#22c55e" onRemove={editUnlinkHealth}
                  />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, marginTop:8 }}>
                    <SearchSelect items={allHealths} value={editLinkHealthId} onChange={setEditLinkHealthId} placeholder="효능 검색..." />
                    <button type="button" onClick={editLinkHealth} style={{ ...S.btn('#22c55e'), padding:'10px 14px' }}>+ 연결</button>
                  </div>
                </div>

                {/* 지역·제철월 (수정 모드) */}
                <div style={{ marginTop:10, background:'#eff6ff', borderRadius:10, padding:12, border:'1px solid #bfdbfe' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#1d4ed8', marginBottom:8 }}>🗺 지역·제철월 연결</div>
                  {editRegions.length > 0 && (
                    <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:8 }}>
                      {editRegions.map(r => (
                        <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                          background:'#fff', borderRadius:7, padding:'6px 10px', fontSize:12, border:'1px solid #bfdbfe' }}>
                          <span style={{ color:'#1e40af', fontWeight:600 }}>📍 {r.label || `${categoryLabel(r.region)} ${(r.months||[]).join('·')}월`}</span>
                          <button type="button" onClick={()=>editDelRegion(r.id)}
                            style={{ padding:'1px 7px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <RegionAddBox
                    regionForm={editRegionForm} setRegionForm={setEditRegionForm}
                    ingName={editForm.display_name||editForm.name}
                    onAdd={editAddRegion}
                  />
                </div>

                <div style={{ display:'flex', gap:8, marginTop:14 }}>
                  <button onClick={()=>saveEdit(i.id)} style={S.btn()}>저장</button>
                  <button onClick={()=>setEditId(null)} style={S.btnGhost}>취소</button>
                </div>
              </div>
            )

            return (
              <div key={i.id}
                onClick={() => { if(editId) return; setSelId(isSel?null:i.id) }}
                style={{ ...S.row, cursor:'pointer',
                  border:`1.5px solid ${isSel?'#a855f7':'#d1e8d1'}`,
                  background:isSel?'#fdf4ff':'#fff' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap', marginBottom:3 }}>
                      <span style={{ fontWeight:800, color:'#111', fontSize:13 }}>{ct?.emoji} {i.name}</span>
                      {i.is_special && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#fef3c7', border:'1px solid #f59e0b', color:'#b45309', fontWeight:700 }}>🏆 특산</span>}
                      {i.is_limited && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#d1fae5', border:'1px solid #10b981', color:'#059669', fontWeight:700 }}>⏰ {i.limited_days||'기간한정'}</span>}
                      {i.is_superfood && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#fef3c7', border:'1px solid #f59e0b', color:'#92400e', fontWeight:700 }}>🌟 슈퍼푸드</span>}
                      {i.is_global && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#dbeafe', border:'1px solid #3b82f6', color:'#1d4ed8', fontWeight:700 }}>🌍 해외</span>}
                      {i.is_brand && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#ffe4e6', border:'1px solid #e63946', color:'#e63946', fontWeight:700 }}>🏷️ 지역브랜드</span>}
                      {(Array.isArray(i.season_badge)?i.season_badge:[i.season_badge]).filter(Boolean).map(s=>(
                        s==='spring'?<span key="sp" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#f0fdf4',border:'1px solid #86efac',color:'#166534',fontWeight:700}}>🌸 봄</span>:
                        s==='summer'?<span key="su" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fefce8',border:'1px solid #fde68a',color:'#92400e',fontWeight:700}}>🌞 여름</span>:
                        s==='fall'  ?<span key="fa" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fff7ed',border:'1px solid #fdba74',color:'#c2410c',fontWeight:700}}>🍂 가을</span>:
                        s==='winter'?<span key="wi" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#eff6ff',border:'1px solid #bae6fd',color:'#1e40af',fontWeight:700}}>❄️ 겨울</span>:null
                      ))}
                      {(Array.isArray(i.jeolgi_badge)?i.jeolgi_badge:[i.jeolgi_badge]).filter(Boolean).map(j=>(
                        j==='seollal'?<span key="se" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fdf4ff',border:'1px solid #e9d5ff',color:'#7e22ce',fontWeight:700}}>🎍 설날</span>:
                        j==='sambok' ?<span key="sa" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fff1f2',border:'1px solid #fecdd3',color:'#be123c',fontWeight:700}}>🔥 삼복</span>:
                        j==='chopbok'?<span key="ch" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fff1f2',border:'1px solid #fecdd3',color:'#be123c',fontWeight:700}}>🔥 초복</span>:
                        j==='jungbok'?<span key="ju" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fff1f2',border:'1px solid #fecdd3',color:'#be123c',fontWeight:700}}>🔥 중복</span>:
                        j==='malbok' ?<span key="ma" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fff1f2',border:'1px solid #fecdd3',color:'#be123c',fontWeight:700}}>🔥 말복</span>:
                        j==='chuseok'?<span key="cu" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fefce8',border:'1px solid #fde68a',color:'#854d0e',fontWeight:700}}>🌕 추석</span>:
                        j==='gimjang'?<span key="gi" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#f0fdf4',border:'1px solid #86efac',color:'#166534',fontWeight:700}}>🥬 김장철</span>:
                        j==='dongji' ?<span key="do" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#eff6ff',border:'1px solid #bae6fd',color:'#1e40af',fontWeight:700}}>☯️ 동지</span>:
                        j==='ipchun' ?<span key="ip" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#f0fdf4',border:'1px solid #86efac',color:'#166534',fontWeight:700}}>🌱 입춘</span>:
                        j==='daeboreum'?<span key="db" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fef9c3',border:'1px solid #fde68a',color:'#713f12',fontWeight:700}}>🌕 정월대보름</span>:
                        j==='dano'   ?<span key="dn" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#f0fdf4',border:'1px solid #86efac',color:'#166534',fontWeight:700}}>🌿 단오</span>:
                        j==='hansik' ?<span key="hs" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fdf4ff',border:'1px solid #e9d5ff',color:'#7e22ce',fontWeight:700}}>🌸 한식</span>:null
                      ))}
                      {(Array.isArray(i.special_badge)?i.special_badge:[i.special_badge]).filter(Boolean).map(s=>(
                        s==='boyangshik' ?<span key="bo" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fff7ed',border:'1px solid #fed7aa',color:'#c2410c',fontWeight:700}}>💪 보양식</span>:
                        s==='jeolgi_food'?<span key="je" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fdf4ff',border:'1px solid #e9d5ff',color:'#7e22ce',fontWeight:700}}>🎋 절기음식</span>:
                        s==='hangover'   ?<span key="ha" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fefce8',border:'1px solid #fde68a',color:'#854d0e',fontWeight:700}}>🍶 해장</span>:
                        s==='diet'       ?<span key="di" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#f0fdf4',border:'1px solid #86efac',color:'#166534',fontWeight:700}}>🥗 다이어트</span>:null
                      ))}
                      {(Array.isArray(i.habitat_badge)?i.habitat_badge:[i.habitat_badge]).filter(Boolean).map(h=>(
                        h==='island'     ?<span key="isl" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#f0f9ff',border:'1px solid #7dd3fc',color:'#0369a1',fontWeight:700}}>🏝️ 섬</span>:
                        h==='freshwater' ?<span key="frw" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#eff6ff',border:'1px solid #93c5fd',color:'#1d4ed8',fontWeight:700}}>🐟 민물</span>:
                        h==='tidal'      ?<span key="tid" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#f0fdfa',border:'1px solid #5eead4',color:'#0f766e',fontWeight:700}}>🌊 갯벌</span>:
                        h==='mountain'   ?<span key="mtn" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#f7fee7',border:'1px solid #a3e635',color:'#3f6212',fontWeight:700}}>🏔️ 산</span>:
                        h==='ocean'      ?<span key="ocn" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#f0f9ff',border:'1px solid #38bdf8',color:'#0c4a6e',fontWeight:700}}>🌊 바다</span>:null
                      ))}
                      {(Array.isArray(i.farming_badge)?i.farming_badge:[i.farming_badge]).filter(Boolean).map(p=>(
                        p==='aquaculture'?<span key="aqu" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fdf4ff',border:'1px solid #d8b4fe',color:'#7e22ce',fontWeight:700}}>🤿 양식</span>:
                        p==='wild'       ?<span key="wld" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fff7ed',border:'1px solid #fdba74',color:'#c2410c',fontWeight:700}}>🎣 자연산</span>:
                        p==='fermented'  ?<span key="fer" style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fef9c3',border:'1px solid #fde68a',color:'#713f12',fontWeight:700}}>🥟 발효</span>:null
                      ))}
                    </div>
                    {/* 지역 뱃지 */}
                    {i.regions_preview?.length > 0 && (
                      <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:3 }}>
                        {i.regions_preview.map((lbl,idx) => (
                          <span key={idx} style={{ fontSize:10, padding:'1px 6px', borderRadius:10,
                            background:'#dbeafe', border:'1px solid #93c5fd', color:'#1d4ed8', fontWeight:700 }}>{lbl}</span>
                        ))}
                      </div>
                    )}
                    {/* 제철 월 */}
                    {(i.months||[]).length > 0 && (
                      <div style={{ display:'flex', gap:2, flexWrap:'wrap', marginBottom:3 }}>
                        {i.months.map(m => (
                          <span key={m} style={{ fontSize:10, padding:'1px 5px', borderRadius:10,
                            background:'#dcfce7', border:'1px solid #86efac', color:'#166534', fontWeight:700 }}>{m}월</span>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize:11, color:'#6b7280' }}>{ct?.label}</div>
                    {i.description && <div style={{ fontSize:11, color:'#8aaa8a', marginTop:2 }}>{i.description.slice(0,35)}{i.description.length>35?'…':''}</div>}
                    {i.caution && (
                      <div style={{ fontSize:10, marginTop:3, padding:'2px 6px', background:'#fef2f2', borderRadius:4, border:'1px solid #fca5a5' }}>
                        <span style={{ color:'#dc2626', fontWeight:700 }}>⚠️ </span>
                        <span style={{ color:'#dc2626' }}>{i.caution.slice(0,35)}{i.caution.length>35?'…':''}</span>
                      </div>
                    )}
                    {i.coupang_url && <div style={{ fontSize:10, color:'#ea580c', marginTop:2 }}>🛒 쿠팡</div>}
                    {/* 건강효능 연결 개수 뱃지 */}
                    <div style={{ display:'flex', gap:4, marginTop:4 }}>
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20,
                        background:'#f0fdf4', border:'1px solid #86efac', color:'#16a34a', fontWeight:700 }}>
                        💊 건강효능 {(i.health_benefits||[]).length}개
                      </span>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:3, flexShrink:0, marginLeft:6 }}>
                    <button onClick={e => {
                      e.stopPropagation()
                      setSelId(null); setEditId(i.id)
                      setEditForm({ name:i.name, display_name:i.name, region_id:'', category:i.category,
                        description:i.description||'', coupang_url:i.coupang_url||'', caution:i.caution||'',
                        is_special:i.is_special||false, is_limited:i.is_limited||false, limited_days:i.limited_days||'',
                        is_global:i.is_global||false, is_brand:i.is_brand||false,
                        season_badge:i.season_badge||[], jeolgi_badge:i.jeolgi_badge||[], special_badge:i.special_badge||[], habitat_badge:i.habitat_badge||[], farming_badge:i.farming_badge||[],
                        age_groups:i.age_groups||[], gender:i.gender||'all', months:i.months||[] })
                      setEditRegionForm(EMPTY_REGION); setEditLinkHealthId('')
                      loadEditLinks(i.id)
                    }} style={{ padding:'2px 8px', borderRadius:5, border:'1px solid #d1e8d1', background:'#f5f9f5', color:'#4b6e4b', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>✏️</button>
                    <button onClick={e=>{e.stopPropagation();del(i.id,i.name)}}
                      style={{ padding:'2px 7px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                  </div>
                </div>

                {/* 클릭 → 연결 패널 */}
                {isSel && !isEdit && (
                  <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #e9d5ff' }}
                    onClick={e=>e.stopPropagation()}>
                    <SubNav
                      tabs={[
                        { id:'health', label:`💊 건강효능 (${panelHealths.length})`, color:'#22c55e' },
                        { id:'region', label:`🗺 지역·제철 (${panelRegions.length})`, color:'#0ea5e9' },
                      ]}
                      active={panelSection} onChange={setPanelSection}
                    />

                    {panelSection === 'health' && (
                      <div>
                        <CrossBadge
                          items={panelHealths.map(ih => ({ id:ih.id, label:ih.health_benefits?.name }))}
                          color="#22c55e" onRemove={panelUnlinkHealth}
                        />
                        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, marginTop:10 }}>
                          <SearchSelect items={allHealths} value={panelHealthId} onChange={setPanelHealthId} placeholder="효능 검색..." />
                          <button type="button" onClick={panelLinkHealth} style={{ ...S.btn('#22c55e'), padding:'9px 13px', fontSize:13 }}>+ 연결</button>
                        </div>
                      </div>
                    )}

                    {panelSection === 'region' && (
                      <div>
                        {panelRegions.length > 0 && (
                          <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:10 }}>
                            {panelRegions.map(r => (
                              <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                                background:'#eff6ff', borderRadius:7, padding:'7px 10px', fontSize:12 }}>
                                <span style={{ color:'#1e40af' }}>📍 {r.label || `${categoryLabel(r.region)} ${(r.months||[]).join('·')}월`}</span>
                                <button onClick={()=>panelDelRegion(r.id)}
                                  style={{ padding:'1px 7px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                              </div>
                            ))}
                          </div>
                        )}
                        <RegionAddBox
                          regionForm={panelRegionForm} setRegionForm={setPanelRegionForm}
                          ingName={i.name} onAdd={panelAddRegion}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// TvShowTab
// ══════════════════════════════════════════════════════════
function TvShowTab({ adminToken, showToast, confirmDelete }) {
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name:'', broadcaster:'', category:'', description:'', started_at:'', ended_at:'', air_days:[] })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [dayFilter, setDayFilter] = useState('전체')
  const [formOpen, setFormOpen] = useState(false)

  // 방송분(회차) 기록
  const [expandedId, setExpandedId] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [epLoading, setEpLoading] = useState(false)
  const [epForm, setEpForm] = useState({ aired_at:'', episode:'', summary:'' })
  const [epSaving, setEpSaving] = useState(false)

  const loadEpisodes = useCallback(async (showId) => {
    setEpLoading(true)
    try { setEpisodes(await apiFetch(`${api('tv_episodes')}&show_id=${showId}`)) }
    catch(e) { showToast('❌ '+e.message); setEpisodes([]) }
    setEpLoading(false)
  }, [])

  const toggleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id); setEpForm({ aired_at:'', episode:'', summary:'' }); loadEpisodes(id)
  }

  const addEpisode = async () => {
    if (!epForm.aired_at && !epForm.episode.trim() && !epForm.summary.trim()) {
      showToast('⚠️ 날짜·회차·내용 중 하나는 입력해주세요'); return
    }
    setEpSaving(true)
    try {
      await apiFetch(api('tv_episodes'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ show_id: expandedId, ...epForm })
      })
      setEpForm({ aired_at:'', episode:'', summary:'' })
      loadEpisodes(expandedId); showToast('✅ 방송분 기록됨')
    } catch(e) { showToast('❌ '+e.message) }
    setEpSaving(false)
  }

  const delEpisode = (id) => {
    confirmDelete('이 방송분 기록', async () => {
      try {
        await apiFetch(`${api('tv_episodes')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
        setEpisodes(p => p.filter(e => e.id !== id)); showToast('🗑 삭제됨')
      } catch(e) { showToast('❌ '+e.message) }
    })
  }

  const load = useCallback(async () => {
    setLoading(true)
    try { setShows(await apiFetch(api('tv_shows'))) } catch(e) { showToast('❌ '+e.message) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [])

  const submit = async () => {
    if (!form.name.trim()) { showToast('⚠️ 방송명 필수'); return }
    setSaving(true)
    try {
      await apiFetch(api('tv_shows'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify(form)
      })
      setForm({ name:'', broadcaster:'', category:'', description:'', started_at:'', ended_at:'', air_days:[] })
      showToast('✅ 등록 완료'); load()
    } catch(e) { showToast('❌ '+e.message) }
    setSaving(false)
  }

  const saveEdit = async (id) => {
    try {
      await apiFetch(`${api('tv_shows')}&id=${id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify(editForm)
      })
      setEditId(null); showToast('✅ 저장됨'); load()
    } catch(e) { showToast('❌ '+e.message) }
  }

  const del = (id, name) => {
    confirmDelete(name, async () => {
      try {
        await apiFetch(`${api('tv_shows')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
        setShows(p => p.filter(s => s.id !== id))
        if (expandedId === id) setExpandedId(null)
        showToast('🗑 삭제됨')
      } catch(e) { showToast('❌ '+e.message) }
    })
  }

  const AirDayPicker = ({ value = [], onChange }) => (
    <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:4 }}>
      {AIR_DAYS.map(d => {
        const on = value.includes(d)
        return (
          <button key={d} type="button"
            onClick={() => onChange(on ? value.filter(x=>x!==d) : [...value, d])}
            style={{ width:36, height:36, borderRadius:8, border:`1.5px solid ${on?'#f59e0b':'#d1e8d1'}`,
              background:on?'#fef3c7':'#f5f9f5', color:on?'#92400e':'#4b6e4b',
              fontSize:12, fontWeight:on?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
            {d}
          </button>
        )
      })}
    </div>
  )

  const ShowFields = ({ f, setF }) => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      <div>
        <label style={S.label}>방송명 *</label>
        <input value={f.name||''} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="예: 흑백요리사" style={S.input} />
      </div>
      <div>
        <label style={S.label}>방송사</label>
        <input value={f.broadcaster||''} onChange={e=>setF(p=>({...p,broadcaster:e.target.value}))} placeholder="예: tvN, Netflix" style={S.input} />
      </div>
      <div>
        <label style={S.label}>장르</label>
        <select value={f.category||''} onChange={e=>setF(p=>({...p,category:e.target.value}))} style={S.input}>
          <option value="">선택</option>
          {SHOW_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label style={S.label}>설명</label>
        <input value={f.description||''} onChange={e=>setF(p=>({...p,description:e.target.value}))} placeholder="간단 설명" style={S.input} />
      </div>
      <div>
        <label style={S.label}>📅 방송 시작일</label>
        <input type="date" value={f.started_at||''} onChange={e=>setF(p=>({...p,started_at:e.target.value}))} style={S.input} />
      </div>
      <div>
        <label style={S.label}>📅 종료일 (방송 중이면 비워두세요)</label>
        <input type="date" value={f.ended_at||''} onChange={e=>setF(p=>({...p,ended_at:e.target.value}))} style={S.input} />
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>📡 방송 요일</label>
        <AirDayPicker value={f.air_days||[]} onChange={v=>setF(p=>({...p,air_days:v}))} />
      </div>
    </div>
  )

  const filteredShows = shows.filter(s =>
    dayFilter === '전체' ? true :
    dayFilter === '미등록' ? (!s.air_days || s.air_days.length === 0) :
    (s.air_days||[]).includes(dayFilter)
  )

  return (
    <div>
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
          onClick={() => setFormOpen(p => !p)}>
          <div style={S.cardTitle}>📺 TV 프로그램 등록</div>
          <span style={{ fontSize:16, color:'#f59e0b', lineHeight:1 }}>{formOpen ? '▲' : '▼'}</span>
        </div>
        {formOpen && (
          <>
            <ShowFields f={form} setF={setForm} />
            <button onClick={submit} disabled={saving} style={{ ...S.btn(), marginTop:14, opacity:saving?.6:1 }}>+ 등록</button>
          </>
        )}
      </div>

      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
          <div style={S.cardTitle}>📋 방송 목록 ({filteredShows.length})</div>
        </div>
        {/* 요일 탭 */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:14, borderBottom:'1px solid #d1e8d1', paddingBottom:10 }}>
          {['전체','월','화','수','목','금','토','일','미등록'].map(d => {
            const on = dayFilter === d
            const cnt = d==='전체' ? shows.length : d==='미등록' ? shows.filter(s=>!s.air_days||s.air_days.length===0).length : shows.filter(s=>(s.air_days||[]).includes(d)).length
            return (
              <button key={d} onClick={()=>setDayFilter(d)}
                style={{ padding:'5px 12px', borderRadius:20, border:`1.5px solid ${on?'#f59e0b':'#d1e8d1'}`,
                  background:on?'#fef3c7':'#f5f9f5', color:on?'#92400e':'#4b6e4b',
                  fontSize:12, fontWeight:on?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif", whiteSpace:'nowrap' }}>
                {d} <span style={{ opacity:.7, fontSize:11 }}>({cnt})</span>
              </button>
            )
          })}
        </div>

        {loading ? <p style={{ textAlign:'center', color:'#aaa', padding:30 }}>불러오는 중...</p> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:8 }}>
            {filteredShows.sort((a,b)=>a.name.localeCompare(b.name,'ko')).map(s => {
              if (editId === s.id) return (
                <div key={s.id} style={{ ...S.row, border:'2px solid #f59e0b', gridColumn:'1/-1', background:'#fff' }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#f59e0b', marginBottom:14 }}>✏️ 수정 중 — {s.name}</div>
                  <ShowFields f={editForm} setF={setEditForm} />
                  <div style={{ display:'flex', gap:8, marginTop:14 }}>
                    <button onClick={()=>saveEdit(s.id)} style={S.btn()}>저장</button>
                    <button onClick={()=>setEditId(null)} style={S.btnGhost}>취소</button>
                  </div>
                </div>
              )
              const isExpanded = expandedId === s.id
              return (
                <div key={s.id} style={{ ...S.row, background:'#f5f9f5', border:'1px solid #d1e8d1', gridColumn: isExpanded ? '1/-1' : undefined }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, flexWrap:'wrap' }}>
                        <span style={{ fontWeight:700, color:'#111', fontSize:13 }}>📺 {s.name}</span>
                        {s.ended_at
                          ? <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#f1f5f9', border:'1px solid #cbd5e1', color:'#64748b', fontWeight:600 }}>방송종료</span>
                          : <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#dcfce7', border:'1px solid #86efac', color:'#16a34a', fontWeight:700 }}>🔴 방송중</span>}
                      </div>
                      <div style={{ fontSize:11, color:'#4b6e4b', marginBottom:2 }}>{s.broadcaster}{s.category&&` · ${s.category}`}</div>
                      <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                        {(s.air_days||[]).length > 0
                          ? s.air_days.map(d => <span key={d} style={{ fontSize:10, padding:'1px 6px', borderRadius:6, background:'#fef3c7', border:'1px solid #fde68a', color:'#92400e', fontWeight:600 }}>📡 {d}요일</span>)
                          : <span style={{ fontSize:10, color:'#aaa' }}>요일 미등록</span>}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:4, flexShrink:0, marginLeft:8 }}>
                      <button onClick={()=>toggleExpand(s.id)}
                        style={{ padding:'3px 8px', borderRadius:5, border:`1px solid ${isExpanded?'#f59e0b':'#d1e8d1'}`, background:isExpanded?'#fef3c7':'#f5f9f5', color:isExpanded?'#92400e':'#4b6e4b', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>📝 방송분 {isExpanded?'▲':'▼'}</button>
                      <button onClick={()=>{ setEditId(s.id); setEditForm({name:s.name,broadcaster:s.broadcaster||'',category:s.category||'',description:s.description||'',started_at:s.started_at||'',ended_at:s.ended_at||'',air_days:s.air_days||[]}) }}
                        style={{ padding:'3px 8px', borderRadius:5, border:'1px solid #d1e8d1', background:'#f5f9f5', color:'#4b6e4b', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>✏️</button>
                      <button onClick={()=>del(s.id,s.name)}
                        style={{ padding:'3px 8px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop:12, paddingTop:12, borderTop:'1px dashed #d1e8d1' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'140px 140px 1fr auto', gap:8, alignItems:'end' }}>
                        <div>
                          <label style={S.label}>날짜</label>
                          <input type="date" value={epForm.aired_at} onChange={e=>setEpForm(p=>({...p,aired_at:e.target.value}))} style={S.input} />
                        </div>
                        <div>
                          <label style={S.label}>회차</label>
                          <input value={epForm.episode} onChange={e=>setEpForm(p=>({...p,episode:e.target.value}))} placeholder="예: 1234회" style={S.input} />
                        </div>
                        <div>
                          <label style={S.label}>간략한 내용</label>
                          <input value={epForm.summary} onChange={e=>setEpForm(p=>({...p,summary:e.target.value}))} placeholder="예: 제철 감자·전남 무안 소개" style={S.input} />
                        </div>
                        <button onClick={addEpisode} disabled={epSaving} style={{ ...S.btn(), opacity:epSaving?.6:1, height:38 }}>+ 추가</button>
                      </div>
                      <div style={{ marginTop:10 }}>
                        {epLoading ? <p style={{ fontSize:12, color:'#aaa' }}>불러오는 중...</p> :
                          episodes.length === 0 ? <p style={{ fontSize:12, color:'#aaa' }}>기록된 방송분이 없습니다.</p> :
                          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                            {episodes.map(e => (
                              <div key={e.id} style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', border:'1px solid #e5efe5', borderRadius:8, padding:'6px 10px' }}>
                                {e.aired_at && <span style={{ fontSize:11, fontWeight:700, color:'#16a34a', whiteSpace:'nowrap' }}>{e.aired_at}</span>}
                                {e.episode && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#faf5ff', color:'#7c3aed', border:'1px solid #e9d5ff', whiteSpace:'nowrap' }}>{e.episode}</span>}
                                {e.summary && <span style={{ fontSize:12, color:'#333', flex:1 }}>{e.summary}</span>}
                                <button onClick={()=>delEpisode(e.id)}
                                  style={{ padding:'2px 7px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:10, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                              </div>
                            ))}
                          </div>
                        }
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// ChefTab (간소화)
// ══════════════════════════════════════════════════════════
function ChefTab({ adminToken, showToast, confirmDelete }) {
  const [formOpen, setFormOpen] = useState(false)
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name:'', role:'', specialty:'', description:'' })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try { setList(await apiFetch(api('chefs'))) } catch(e) { showToast('❌ '+e.message) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [])

  const submit = async () => {
    if (!form.name.trim()) { showToast('⚠️ 이름 필수'); return }
    setSaving(true)
    try {
      await apiFetch(api('chefs'), { method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken}, body:JSON.stringify(form) })
      setForm({ name:'', role:'', specialty:'', description:'' }); showToast('✅ 등록 완료'); load()
    } catch(e) { showToast('❌ '+e.message) }
    setSaving(false)
  }

  const saveEdit = async (id) => {
    try {
      await apiFetch(`${api('chefs')}&id=${id}`, { method:'PATCH', headers:{'Content-Type':'application/json','x-admin-token':adminToken}, body:JSON.stringify(editForm) })
      setEditId(null); showToast('✅ 저장됨'); load()
    } catch(e) { showToast('❌ '+e.message) }
  }

  const del = (id, name) => {
    confirmDelete(name, async () => {
      try {
        await apiFetch(`${api('chefs')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
        setList(p=>p.filter(c=>c.id!==id)); showToast('🗑 삭제됨')
      } catch(e) { showToast('❌ '+e.message) }
    })
  }

  const ChefFields = ({ f, setF }) => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      <div>
        <label style={S.label}>이름 *</label>
        <input value={f.name||''} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="예: 백종원" style={S.input} />
      </div>
      <div>
        <label style={S.label}>역할</label>
        <select value={f.role||''} onChange={e=>setF(p=>({...p,role:e.target.value}))} style={S.input}>
          <option value="">선택</option>
          {CHEF_ROLES.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label style={S.label}>전문 분야</label>
        <input value={f.specialty||''} onChange={e=>setF(p=>({...p,specialty:e.target.value}))} placeholder="예: 한식, 양식" style={S.input} />
      </div>
      <div>
        <label style={S.label}>설명</label>
        <input value={f.description||''} onChange={e=>setF(p=>({...p,description:e.target.value}))} placeholder="간단 설명" style={S.input} />
      </div>
    </div>
  )

  return (
    <div>
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
          onClick={() => setFormOpen(p => !p)}>
          <div style={S.cardTitle}>👨‍🍳 셰프/출연자 등록</div>
          <span style={{ fontSize:16, color:'#8b5cf6', lineHeight:1 }}>{formOpen ? '▲' : '▼'}</span>
        </div>
        {formOpen && (
          <>
            <ChefFields f={form} setF={setForm} />
            <button onClick={submit} disabled={saving} style={{ ...S.btn(), marginTop:14, opacity:saving?.6:1 }}>+ 등록</button>
          </>
        )}
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>📋 셰프 목록 ({list.length})</div>
        {loading ? <p style={{ textAlign:'center', color:'#aaa', padding:30 }}>불러오는 중...</p> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:8 }}>
            {list.map(c => editId===c.id ? (
              <div key={c.id} style={{ ...S.row, border:'2px solid #22c55e', gridColumn:'1/-1', background:'#fff' }}>
                <ChefFields f={editForm} setF={setEditForm} />
                <div style={{ display:'flex', gap:8, marginTop:12 }}>
                  <button onClick={()=>saveEdit(c.id)} style={S.btn()}>저장</button>
                  <button onClick={()=>setEditId(null)} style={S.btnGhost}>취소</button>
                </div>
              </div>
            ) : (
              <div key={c.id} style={{ ...S.row, display:'flex', justifyContent:'space-between', background:'#f5f9f5' }}>
                <div>
                  <div style={{ fontWeight:700, color:'#111', marginBottom:3 }}>👨‍🍳 {c.name}</div>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    {c.role && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#fef3c7', color:'#92400e', border:'1px solid #fde68a' }}>{c.role}</span>}
                    {c.specialty && <span style={{ fontSize:11, color:'#4b6e4b' }}>{c.specialty}</span>}
                  </div>
                  {c.description && <p style={{ fontSize:11, color:'#666', margin:'3px 0 0' }}>{c.description}</p>}
                </div>
                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                  <button onClick={()=>{ setEditId(c.id); setEditForm({name:c.name,role:c.role||'',specialty:c.specialty||'',description:c.description||''}) }}
                    style={{ ...S.btnGhost, padding:'4px 10px', fontSize:12 }}>✏️</button>
                  <button onClick={()=>del(c.id,c.name)}
                    style={{ padding:'4px 10px', borderRadius:7, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:12, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// UtensilTab — 조리기구 관리
// ══════════════════════════════════════════════════════════
const UTENSIL_CATEGORIES = ['칼·도마','냄비·팬','그릇·볼','계량·저울','거름·체','찜기·솥','오븐·에어프라이어','믹서·블렌더','기타']
const UTENSIL_USAGES     = ['가정용','영업용','공통']
const UTENSIL_CUISINES   = ['한식','양식','중식','일식','공통']

function UtensilTab({ adminToken, showToast, confirmDelete }) {
  const [formOpen, setFormOpen] = useState(false)
  const EMPTY = { name:'', category:'', cuisine:'', usage:'', description:'', coupang_url:'' }
  const [list, setList]     = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [searchQ, setSearchQ] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setList(await apiFetch(api('utensils'))) } catch(e) { showToast('❌ '+e.message) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [])

  const submit = async () => {
    if (!form.name.trim()) { showToast('⚠️ 이름 필수'); return }
    setSaving(true)
    try {
      await apiFetch(api('utensils'), { method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken}, body:JSON.stringify(form) })
      setForm(EMPTY); showToast('✅ 등록 완료'); load()
    } catch(e) { showToast('❌ '+e.message) }
    setSaving(false)
  }

  const saveEdit = async (id) => {
    try {
      await apiFetch(`${api('utensils')}&id=${id}`, { method:'PATCH', headers:{'Content-Type':'application/json','x-admin-token':adminToken}, body:JSON.stringify(editForm) })
      setEditId(null); showToast('✅ 저장됨'); load()
    } catch(e) { showToast('❌ '+e.message) }
  }

  const del = (id, name) => {
    confirmDelete(name, async () => {
      try {
        await apiFetch(`${api('utensils')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
        setList(p=>p.filter(u=>u.id!==id)); showToast('🗑 삭제됨')
      } catch(e) { showToast('❌ '+e.message) }
    })
  }

  const UtensilFields = ({ f, setF }) => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>도구명 *</label>
        <input value={f.name||''} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="예: 산토쿠 칼, 무쇠 냄비" style={S.input} />
      </div>
      <div>
        <label style={S.label}>카테고리</label>
        <select value={f.category||''} onChange={e=>setF(p=>({...p,category:e.target.value}))} style={S.input}>
          <option value="">선택</option>
          {UTENSIL_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label style={S.label}>요리종류</label>
        <select value={f.cuisine||''} onChange={e=>setF(p=>({...p,cuisine:e.target.value}))} style={S.input}>
          <option value="">선택</option>
          {UTENSIL_CUISINES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label style={S.label}>용도</label>
        <select value={f.usage||''} onChange={e=>setF(p=>({...p,usage:e.target.value}))} style={S.input}>
          <option value="">선택</option>
          {UTENSIL_USAGES.map(u=><option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div>
        <label style={S.label}>쿠팡 URL</label>
        <input value={f.coupang_url||''} onChange={e=>setF(p=>({...p,coupang_url:e.target.value}))} placeholder="https://coupa.ng/..." style={S.input} />
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>설명</label>
        <input value={f.description||''} onChange={e=>setF(p=>({...p,description:e.target.value}))} placeholder="간단 설명" style={S.input} />
      </div>
    </div>
  )

  const filtered = searchQ ? list.filter(u=>u.name.includes(searchQ)||u.category?.includes(searchQ)) : list

  return (
    <div>
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
          onClick={() => setFormOpen(p => !p)}>
          <div style={S.cardTitle}>🍳 조리기구 등록</div>
          <span style={{ fontSize:16, color:'#0ea5e9', lineHeight:1 }}>{formOpen ? '▲' : '▼'}</span>
        </div>
        {formOpen && (
          <>
            <UtensilFields f={form} setF={setForm} />
            <button onClick={submit} disabled={saving} style={{ ...S.btn(), marginTop:14, opacity:saving?.6:1 }}>+ 등록</button>
          </>
        )}
      </div>
      <div style={S.card}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={S.cardTitle}>📋 조리기구 목록 ({list.length})</div>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="검색..." style={{ ...S.input, width:160, fontSize:12 }} />
        </div>
        {loading ? <p style={{ textAlign:'center', color:'#aaa', padding:30 }}>불러오는 중...</p> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:8 }}>
            {filtered.map(u => editId===u.id ? (
              <div key={u.id} style={{ ...S.row, border:'2px solid #22c55e', gridColumn:'1/-1', background:'#fff' }}>
                <UtensilFields f={editForm} setF={setEditForm} />
                <div style={{ display:'flex', gap:8, marginTop:12 }}>
                  <button onClick={()=>saveEdit(u.id)} style={S.btn()}>저장</button>
                  <button onClick={()=>setEditId(null)} style={S.btnGhost}>취소</button>
                </div>
              </div>
            ) : (
              <div key={u.id} style={{ ...S.row, display:'flex', justifyContent:'space-between', background:'#f5f9f5' }}>
                <div>
                  <div style={{ fontWeight:700, color:'#111', marginBottom:3 }}>🍳 {u.name}</div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {u.category && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#fef3c7', color:'#92400e', border:'1px solid #fde68a' }}>{u.category}</span>}
                    {u.cuisine  && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#e0f2fe', color:'#0369a1', border:'1px solid #bae6fd' }}>{u.cuisine}</span>}
                    {u.usage    && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }}>{u.usage}</span>}
                  </div>
                  {u.description && <p style={{ fontSize:11, color:'#666', margin:'3px 0 0' }}>{u.description}</p>}
                </div>
                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                  <button onClick={()=>{ setEditId(u.id); setEditForm({name:u.name,category:u.category||'',cuisine:u.cuisine||'',usage:u.usage||'',description:u.description||'',coupang_url:u.coupang_url||''}) }}
                    style={{ ...S.btnGhost, padding:'4px 10px', fontSize:12 }}>✏️</button>
                  <button onClick={()=>del(u.id,u.name)}
                    style={{ padding:'4px 10px', borderRadius:7, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:12, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// RecipeTab — 레시피 관리
// ══════════════════════════════════════════════════════════
function RecipeTab({ adminToken, showToast, confirmDelete, allTvShows }) {
  const EMPTY = { title:'', dish_id:'', show_id:'', chef_id:'', episode:'', aired_at:'', summary:'', source_url:'' }
  const [formOpen, setFormOpen] = useState(false)
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState(EMPTY)
  const [content, setContent] = useState('')
  const [stepImages, setStepImages] = useState([''])
  const [saving, setSaving]   = useState(false)
  const [editId, setEditId]   = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editContent, setEditContent] = useState('')
  const [editStepImages, setEditStepImages] = useState([''])
  const [editContentLoading, setEditContentLoading] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [allDishes, setAllDishes] = useState([])
  const [allChefs,  setAllChefs]  = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [recipes, dishes, chefs] = await Promise.all([
        apiFetch(api('recipes')),
        apiFetch(api('dishes')),
        apiFetch(api('chefs')),
      ])
      setList(recipes); setAllDishes(dishes); setAllChefs(chefs)
    } catch(e) { showToast('❌ '+e.message) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [])

  // 연동된 블로그 글의 content에 본문+사진을 그대로 써넣는다 (블로그 글쓰기와 완전히 동일한 방식)
  const pushContentToBlog = async (recipeId, contentText, images) => {
    const finalContent = injectStepImages(contentText, images)
    if (!finalContent.trim()) return
    try {
      await fetch('/api/blog/posts', {
        method:'PUT', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body: JSON.stringify({ id: recipeId, content: finalContent }),
      })
    } catch(e) { showToast('❌ 블로그 본문 저장 실패: '+e.message) }
  }

  const submit = async () => {
    if (!form.title.trim()) { showToast('⚠️ 제목 필수'); return }
    setSaving(true)
    try {
      const created = await apiFetch(api('recipes'), { method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken}, body:JSON.stringify(form) })
      await pushContentToBlog(created.id, content, stepImages)
      setForm(EMPTY); setContent(''); setStepImages(['']); showToast('✅ 등록 완료 (블로그에도 함께 발행됨)'); load()
    } catch(e) { showToast('❌ '+e.message) }
    setSaving(false)
  }

  const startEdit = async (r) => {
    setEditId(r.id)
    setEditForm({title:r.title,dish_id:r.dish_id||'',show_id:r.show_id||'',chef_id:r.chef_id||'',episode:r.episode||'',aired_at:r.aired_at||'',summary:r.summary||'',source_url:r.source_url||''})
    setEditContent(''); setEditStepImages([''])
    setEditContentLoading(true)
    try {
      const post = await apiFetch(`/api/blog/posts?id=${r.id}`, { headers:{'x-admin-token':adminToken} })
      const { content: cleanContent, images } = extractStepImages(post.content || '')
      setEditContent(cleanContent); setEditStepImages(images.length ? images : [''])
    } catch(e) { /* 연동된 블로그 글이 아직 없으면 빈 상태로 시작 */ }
    setEditContentLoading(false)
  }

  const saveEdit = async (id) => {
    try {
      await apiFetch(`${api('recipes')}&id=${id}`, { method:'PATCH', headers:{'Content-Type':'application/json','x-admin-token':adminToken}, body:JSON.stringify(editForm) })
      await pushContentToBlog(id, editContent, editStepImages)
      setEditId(null); showToast('✅ 저장됨 (블로그에도 함께 반영됨)'); load()
    } catch(e) { showToast('❌ '+e.message) }
  }

  const del = (id, name) => {
    confirmDelete(name, async () => {
      try {
        await apiFetch(`${api('recipes')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
        setList(p=>p.filter(r=>r.id!==id)); showToast('🗑 삭제됨 (블로그 글도 함께 삭제됨)')
      } catch(e) { showToast('❌ '+e.message) }
    })
  }

  // 블로그 글쓰기 화면과 동일한 방식: 마크다운 본문(## 소제목 = 단계) + 오른쪽 사진 목록(순서대로 매칭)
  const RecipeContentEditor = ({ value, onChange, images, setImages }) => {
    const setImg = (i, val) => setImages(p => { const n=[...p]; n[i]=val; return n })
    const addImg = () => setImages(p => [...p, ''])
    const removeImg = (i) => setImages(p => { const n = p.filter((_,ii)=>ii!==i); return n.length?n:[''] })
    return (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16 }}>
        <div>
          <label style={S.label}>본문 (마크다운)</label>
          <textarea value={value} onChange={e=>onChange(e.target.value)} rows={14}
            placeholder={'## 1단계: 재료 손질하기\n\n손질 방법 설명...\n\n## 2단계: 끓이기\n\n끓이는 방법 설명...\n\n※ 오른쪽 1번째 사진이 1단계에, 2번째 사진이 2단계에 순서대로 붙습니다.'}
            style={{ ...S.textarea, fontFamily:"'Outfit', sans-serif" }} />
        </div>
        <div style={{ background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:10, padding:16 }}>
          <div style={{ fontSize:13, fontWeight:800, color:'#16a34a', marginBottom:4 }}>🖼 단계별 사진 (여러 장)</div>
          <p style={{ fontSize:11, color:'#4b6e4b', marginBottom:12, lineHeight:1.6 }}>
            본문의 <code>## 소제목</code> 순서대로 아래 사진이 하나씩 짝지어져, 블로그 "레시피" 글에 왼쪽 설명·오른쪽 사진 타임라인으로 나타납니다.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {images.map((url, i) => (
              <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#4b6e4b', width:16, flexShrink:0 }}>{i+1}</span>
                {url && <img src={url} alt="" style={{ width:36, height:36, objectFit:'cover', borderRadius:6, flexShrink:0, border:'1px solid #d1e8d1' }} onError={e=>{e.currentTarget.style.visibility='hidden'}} />}
                <input value={url} onChange={e=>setImg(i, e.target.value)} placeholder={`https://... (${i+1}번째 사진)`} style={{ ...S.input, flex:1 }} />
                <button onClick={()=>removeImg(i)} style={{ background:'none', border:'none', color:'#dc2626', fontSize:16, cursor:'pointer', flexShrink:0 }}>×</button>
              </div>
            ))}
          </div>
          <button onClick={addImg} style={{ ...S.btn('#fff'), color:'#16a34a', border:'1.5px dashed #86efac', marginTop:12, width:'100%', padding:'8px 0' }}>
            + 사진 추가
          </button>
        </div>
      </div>
    )
  }

  const RecipeFields = ({ f, setF }) => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>레시피 제목 *</label>
        <input value={f.title||''} onChange={e=>setF(p=>({...p,title:e.target.value}))} placeholder="예: 백종원 된장찌개" style={S.input} />
      </div>
      <div>
        <label style={S.label}>요리</label>
        <select value={f.dish_id||''} onChange={e=>setF(p=>({...p,dish_id:e.target.value}))} style={S.input}>
          <option value="">선택 안 함</option>
          {allDishes.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div>
        <label style={S.label}>TV방송</label>
        <select value={f.show_id||''} onChange={e=>setF(p=>({...p,show_id:e.target.value}))} style={S.input}>
          <option value="">선택 안 함</option>
          {(allTvShows||[]).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label style={S.label}>셰프</label>
        <select value={f.chef_id||''} onChange={e=>setF(p=>({...p,chef_id:e.target.value}))} style={S.input}>
          <option value="">선택 안 함</option>
          {allChefs.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label style={S.label}>회차</label>
        <input value={f.episode||''} onChange={e=>setF(p=>({...p,episode:e.target.value}))} placeholder="예: 302회, 3화" style={S.input} />
      </div>
      <div>
        <label style={S.label}>방영일</label>
        <input type="date" value={f.aired_at||''} onChange={e=>setF(p=>({...p,aired_at:e.target.value}))} style={S.input} />
      </div>
      <div>
        <label style={S.label}>출처 URL</label>
        <input value={f.source_url||''} onChange={e=>setF(p=>({...p,source_url:e.target.value}))} placeholder="https://..." style={S.input} />
      </div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={S.label}>요약</label>
        <input value={f.summary||''} onChange={e=>setF(p=>({...p,summary:e.target.value}))} placeholder="레시피 간단 설명" style={S.input} />
      </div>
    </div>
  )

  const filtered = searchQ ? list.filter(r=>r.title?.includes(searchQ)) : list

  return (
    <div>
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
          onClick={() => setFormOpen(p => !p)}>
          <div style={S.cardTitle}>📖 레시피 등록</div>
          <span style={{ fontSize:16, color:'#f97316', lineHeight:1 }}>{formOpen ? '▲' : '▼'}</span>
        </div>
        {formOpen && (
          <>
            <RecipeFields f={form} setF={setForm} />
            <RecipeContentEditor value={content} onChange={setContent} images={stepImages} setImages={setStepImages} />
            <button onClick={submit} disabled={saving} style={{ ...S.btn(), marginTop:14, opacity:saving?.6:1 }}>+ 등록</button>
          </>
        )}
      </div>
      <div style={S.card}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={S.cardTitle}>📋 레시피 목록 ({list.length})</div>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="검색..." style={{ ...S.input, width:160, fontSize:12 }} />
        </div>
        {loading ? <p style={{ textAlign:'center', color:'#aaa', padding:30 }}>불러오는 중...</p> : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {filtered.map(r => editId===r.id ? (
              <div key={r.id} style={{ ...S.row, border:'2px solid #22c55e', background:'#fff' }}>
                <RecipeFields f={editForm} setF={setEditForm} />
                {editContentLoading ? (
                  <p style={{ fontSize:12, color:'#9ca3af', marginTop:12 }}>본문 불러오는 중...</p>
                ) : (
                  <RecipeContentEditor value={editContent} onChange={setEditContent} images={editStepImages} setImages={setEditStepImages} />
                )}
                <div style={{ display:'flex', gap:8, marginTop:12 }}>
                  <button onClick={()=>saveEdit(r.id)} style={S.btn()}>저장</button>
                  <button onClick={()=>setEditId(null)} style={S.btnGhost}>취소</button>
                </div>
              </div>
            ) : (
              <div key={r.id} style={{ ...S.row, display:'flex', justifyContent:'space-between', alignItems:'flex-start', background:'#f5f9f5' }}>
                <div>
                  <div style={{ fontWeight:700, color:'#111', marginBottom:4 }}>📖 {r.title}</div>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    {r.dishes    && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#fef3c7', color:'#92400e', border:'1px solid #fde68a' }}>{r.dishes.name}</span>}
                    {r.tv_shows  && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#e0f2fe', color:'#0369a1', border:'1px solid #bae6fd' }}>📺 {r.tv_shows.name}</span>}
                    {r.chefs     && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }}>👨‍🍳 {r.chefs.name}</span>}
                    {r.episode   && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#faf5ff', color:'#7c3aed', border:'1px solid #e9d5ff' }}>{r.episode}</span>}
                    {r.aired_at  && <span style={{ fontSize:10, color:'#9ca3af' }}>{r.aired_at}</span>}
                  </div>
                  {r.summary && <p style={{ fontSize:11, color:'#666', margin:'4px 0 0' }}>{r.summary}</p>}
                </div>
                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                  <button onClick={()=>startEdit(r)}
                    style={{ ...S.btnGhost, padding:'4px 10px', fontSize:12 }}>✏️</button>
                  <button onClick={()=>del(r.id, r.title)}
                    style={{ padding:'4px 10px', borderRadius:7, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:12, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// 메인 MapAdminPanel — 전역 데이터 공유 허브
// ══════════════════════════════════════════════════════════
const SUBTABS = [
  { id:'ingredient', label:'🥕 식재료' },
  { id:'health',     label:'💊 건강효능' },
  { id:'tv',         label:'📺 TV방송' },
  { id:'chef',       label:'👨‍🍳 셰프' },
  { id:'recipe',     label:'📖 레시피' },
  { id:'utensil',    label:'🍳 조리기구' },
]

export default function MapAdminPanel({ adminToken }) {
  const [subTab, setSubTab] = useState('ingredient')
  const [toast, setToast] = useState('')
  const [deleteItem, setDeleteItem] = useState(null) // { name, onConfirm }

  // ── 전역 공유 데이터 ──
  const [allIngredients, setAllIngredients] = useState([])
  const [allHealths, setAllHealths] = useState([])
  const [allTvShows, setAllTvShows] = useState([])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const confirmDelete = (name, onConfirm) => setDeleteItem({ name, onConfirm })

  const refreshIngredients = useCallback(async () => {
    try { setAllIngredients(await apiFetch(api('ingredients'))) } catch {}
  }, [])

  const refreshHealths = useCallback(async () => {
    try { setAllHealths(await apiFetch(api('health_benefits'))) } catch {}
  }, [])

  const refreshTvShows = useCallback(async () => {
    try { setAllTvShows(await apiFetch(api('tv_shows'))) } catch {}
  }, [])

  // 최초 로드
  useEffect(() => {
    Promise.all([
      apiFetch(api('ingredients')).then(setAllIngredients).catch(()=>{}),
      apiFetch(api('health_benefits')).then(setAllHealths).catch(()=>{}),
      apiFetch(api('tv_shows')).then(setAllTvShows).catch(()=>{}),
    ])
  }, [])

  return (
    <div>
      <Toast msg={toast} />
      <DeleteModal
        item={deleteItem}
        onConfirm={() => deleteItem?.onConfirm()}
        onCancel={() => setDeleteItem(null)}
      />

      {/* 서브탭 네비 */}
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:24, borderBottom:'1px solid #d1e8d1', paddingBottom:12 }}>
        {SUBTABS.map(t => (
          <button key={t.id} onClick={()=>setSubTab(t.id)}
            style={{ padding:'9px 20px', borderRadius:9, border:'none', cursor:'pointer',
              fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:subTab===t.id?700:500,
              background:subTab===t.id?'#22c55e':'#f5f9f5',
              color:subTab===t.id?'#fff':'#6b7280',
              transition:'all .15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'ingredient' && (
        <IngredientTab
          adminToken={adminToken} showToast={showToast} confirmDelete={confirmDelete}
          allHealths={allHealths} allTvShows={allTvShows}
          refreshHealths={refreshHealths}
        />
      )}
      {subTab === 'health' && (
        <HealthTab
          adminToken={adminToken} showToast={showToast} confirmDelete={confirmDelete}
          allIngredients={allIngredients} allTvShows={allTvShows}
          refreshIngredients={refreshIngredients}
        />
      )}
      {subTab === 'tv' && (
        <TvShowTab adminToken={adminToken} showToast={showToast} confirmDelete={confirmDelete} />
      )}
      {subTab === 'chef' && (
        <ChefTab adminToken={adminToken} showToast={showToast} confirmDelete={confirmDelete} />
      )}
      {subTab === 'recipe' && (
        <RecipeTab
          adminToken={adminToken} showToast={showToast} confirmDelete={confirmDelete}
          allTvShows={allTvShows}
        />
      )}
      {subTab === 'utensil' && (
        <UtensilTab adminToken={adminToken} showToast={showToast} confirmDelete={confirmDelete} />
      )}
    </div>
  )
}
