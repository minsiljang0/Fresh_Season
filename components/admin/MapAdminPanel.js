import { useState, useEffect, useMemo, useCallback } from 'react'
import { S, Toast } from './AdminUI'
import { DEFAULT_CATEGORIES, categoryLabel } from '../../lib/blogCategories'

// ── 상수 ─────────────────────────────────────────────────
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
  { id:'grain',          emoji:'🌾', label:'곡물·잡곡', group:'곡물·가공' },
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

// 그룹별로 묶기
const ING_GROUPS = ['수산물','채소·나물','과일','곡물·가공','육류','버섯·산채']

const DISH_CATEGORIES = ['한식','양식','중식','일식','분식','디저트','퓨전','이슈','기타']
const DISH_COLORS = {
  '한식': '#ef4444',
  '양식': '#3b82f6',
  '중식': '#f97316',
  '일식': '#8b5cf6',
  '분식': '#ec4899',
  '디저트': '#f59e0b',
  '퓨전': '#10b981',
  '이슈': '#06b6d4',
  '기타': '#6b7280',
}

const AIR_DAYS = ['월','화','수','목','금','토','일']

const CHEF_ROLES = ['셰프','MC','심사위원','요리연구가','파티시에','참가자']
const SHOW_CATEGORIES = ['요리경연','다큐','예능','생활정보','쿠킹쇼','기타']
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

// ── 주의사항 예시 (자동완성 힌트용) ──────────────────────
const LIMITED_PRESETS = [
  { label:'1주일',  value:'7일'   },
  { label:'10일',   value:'10일'  },
  { label:'2주',    value:'14일'  },
  { label:'3주',    value:'21일'  },
  { label:'1개월',  value:'30일'  },
  { label:'2개월',  value:'60일'  },
  { label:'3개월',  value:'90일'  },
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
  '⚠️ 과민성장증후군(IBS) 주의',
  '⚠️ 고혈압약 복용자 주의 — 자몽과 상호작용',
  '⚠️ 밀 글루텐 알레르기 주의 (셀리악병)',
  '⚠️ 유당불내증 주의',
  '⚠️ 생식 금지 — 반드시 익혀서 섭취',
]

const AGE_GROUPS = [
  { id:'infant',   label:'👶 유아 (0-6세)',      color:'#f9a8d4' },
  { id:'child',    label:'🧒 어린이 (7-12세)',    color:'#fdba74' },
  { id:'teen',     label:'🧑 청소년 (13-18세)',   color:'#fde047' },
  { id:'adult',    label:'🧑‍💼 성인 (19-39세)',   color:'#86efac' },
  { id:'middle',   label:'🧑‍🦳 중장년 (40-64세)', color:'#67e8f9' },
  { id:'senior',   label:'👴 노년 (65세+)',       color:'#c4b5fd' },
  { id:'all',      label:'✅ 전 연령',            color:'#16a34a' },
]

const GENDER_OPTIONS = [
  { id:'all',    label:'⚥ 상관없음 (전체)', color:'#6b7280' },
  { id:'male',   label:'♂ 남성',            color:'#3b82f6' },
  { id:'female', label:'♀ 여성',            color:'#ec4899' },
]

// ── 공통 유틸 ─────────────────────────────────────────────
const api = (type) => `/api/admin/map-data?type=${type}`

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || '요청 실패')
  }
  return res.json()
}

// ── 공통 UI 컴포넌트 ─────────────────────────────────────
function MonthPills({ value, onChange }) {
  return (
    <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:6 }}>
      {MONTHS.map(m => {
        const on = value.includes(m)
        return (
          <button key={m} type="button" onClick={() => onChange(on ? value.filter(x=>x!==m) : [...value,m].sort((a,b)=>a-b))}
            style={{ width:34, height:34, borderRadius:7, border:`1.5px solid ${on?'#16a34a':'#d1e8d1'}`,
              background:on?'#dcfce7':'#f5f9f5', color:on?'#15803d':'#4b6e4b',
              fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
            {m}
          </button>
        )
      })}
    </div>
  )
}

function SearchSelect({ label, items, value, onChange, placeholder, nameKey='name', onAddNew }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const filtered = useMemo(() => {
    if (!q.trim()) return items.slice(0,20)
    return items.filter(i => i[nameKey]?.includes(q)).slice(0,20)
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
            onBlur={() => setTimeout(()=>setOpen(false), 150)}
            placeholder={placeholder || '검색 또는 선택'}
            style={S.input}
          />
          {open && filtered.length > 0 && (
            <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:100,
              background:'#f5f9f5', border:'1px solid #333', borderRadius:8, maxHeight:200, overflowY:'auto', marginTop:2 }}>
              {filtered.map(item => (
                <div key={item.id} onMouseDown={() => { onChange(item.id); setQ(''); setOpen(false) }}
                  style={{ padding:'8px 12px', cursor:'pointer', fontSize:13, color:'#0f1f0f',
                    borderBottom:'1px solid #d1e8d1' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#d1e8d1'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  {item[nameKey]}
                  {item.category && <span style={{ fontSize:11, color:'#666', marginLeft:6 }}>{item.category}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        {value && <button type="button" onClick={()=>onChange('')}
          style={{ padding:'0 10px', background:'none', border:'1px solid #333', borderRadius:7, color:'#4b6e4b', cursor:'pointer' }}>✕</button>}
        {onAddNew && <button type="button" onClick={onAddNew}
          style={{ padding:'0 12px', background:'#dcfce7', border:'1px solid #86efac', borderRadius:7, color:'#22c55e', cursor:'pointer', fontSize:12, fontWeight:700, whiteSpace:'nowrap' }}>+ 신규</button>}
      </div>
    </div>
  )
}

function TagRow({ items, onRemove, color='#22c55e' }) {
  if (!items?.length) return <p style={{ fontSize:12, color:'#8aaa8a', margin:'6px 0' }}>없음</p>
  return (
    <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:6 }}>
      {items.map((item, i) => (
        <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, padding:'3px 10px',
          borderRadius:20, background:`${color}18`, border:`1px solid ${color}44`, color }}>
          {item.label}
          {onRemove && <button type="button" onClick={()=>onRemove(i)}
            style={{ background:'none', border:'none', color, cursor:'pointer', fontSize:14, lineHeight:1, padding:0 }}>×</button>}
        </span>
      ))}
    </div>
  )
}

function SectionCard({ title, children }) {
  return (
    <div style={{ background:'#1a1a1a', border:'1px solid #d1e8d1', borderRadius:12, padding:18, marginBottom:14 }}>
      <div style={{ fontSize:14, fontWeight:700, color:'#aaa', marginBottom:14 }}>{title}</div>
      {children}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// 서브탭 1 : 건강효능 관리
// ══════════════════════════════════════════════════════════
function HealthTab({ adminToken, showToast, confirmDelete }) {
  const [list, setList] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [tvShows, setTvShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name:'', description:'', category:'', coupang_url:'', age_groups:[], gender:'all', caution:'' })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [filterCat, setFilterCat] = useState('')

  // 연결 패널 상태
  const [selHealth, setSelHealth] = useState(null)
  const [activeSection, setActiveSection] = useState('ingredient') // 'ingredient' | 'tv'
  const [healthIngs, setHealthIngs] = useState([])
  const [healthTvs, setHealthTvs] = useState([])
  const [linkIngId, setLinkIngId] = useState('')
  const [linkTvId, setLinkTvId] = useState('')
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, name, onConfirm }
  const [justCreated, setJustCreated] = useState(null)
  const [modalTab, setModalTab] = useState('ingredient')
  const [modalIngId, setModalIngId] = useState('')
  const [modalTvId, setModalTvId] = useState('')
  const [modalIngs, setModalIngs] = useState([])
  const [modalTvs, setModalTvs] = useState([])

  const ING_CAT = Object.fromEntries(ING_CATEGORIES.map(c=>[c.id, c.emoji]))

  const loadModalLinks = useCallback(async (healthId) => {
    try {
      const [ings, tvs] = await Promise.all([
        apiFetch(`${api('ingredient_health')}&health_id=${healthId}`),
        apiFetch(`${api('health_tv_shows')}&health_id=${healthId}`),
      ])
      setModalIngs(ings); setModalTvs(tvs)
    } catch {}
  }, [])

  const modalLinkIng = async () => {
    if (!justCreated || !modalIngId) { showToast('⚠️ 식재료를 선택하세요'); return }
    try {
      await apiFetch(api('ingredient_health'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ ingredient_id: modalIngId, health_id: justCreated.id })
      })
      setModalIngId(''); loadModalLinks(justCreated.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const modalUnlinkIng = async (id) => {
    try {
      await apiFetch(`${api('ingredient_health')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      loadModalLinks(justCreated.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const modalLinkTv = async () => {
    if (!justCreated || !modalTvId) { showToast('⚠️ TV방송을 선택하세요'); return }
    try {
      await apiFetch(api('health_tv_shows'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ health_id: justCreated.id, show_id: modalTvId })
      })
      setModalTvId(''); loadModalLinks(justCreated.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const modalUnlinkTv = async (id) => {
    try {
      await apiFetch(`${api('health_tv_shows')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      loadModalLinks(justCreated.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const closeModal = () => {
    setShowLinkModal(false)
    setJustCreated(null)
    setModalIngs([]); setModalTvs([])
    setModalIngId(''); setModalTvId('')
    setModalTab('ingredient')
    showToast('✅ 등록 완료')
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [h, i, tv] = await Promise.all([
        apiFetch(api('health_benefits')),
        apiFetch(api('ingredients')),
        apiFetch(api('tv_shows')),
      ])
      setList(h); setIngredients(i); setTvShows(tv)
    } catch(e) { showToast('❌ '+e.message) }
    setLoading(false)
  }, [])
  useEffect(()=>{ load() }, [])

  // 모달 오픈 시 자동 로드
  useEffect(()=>{
    if (showLinkModal && justCreated) {
      loadModalLinks(justCreated.id)
    }
  }, [showLinkModal, justCreated])

  const loadLinks = useCallback(async (healthId) => {
    try {
      const [ings, tvs] = await Promise.all([
        apiFetch(`${api('ingredient_health')}&health_id=${healthId}`),
        apiFetch(`${api('health_tv_shows')}&health_id=${healthId}`),
      ])
      setHealthIngs(ings); setHealthTvs(tvs)
    } catch { setHealthIngs([]); setHealthTvs([]) }
  }, [])

  useEffect(()=>{
    if (selHealth) loadLinks(selHealth.id)
    else { setHealthIngs([]); setHealthTvs([]) }
  }, [selHealth])

  const submit = async () => {
    if (!form.name.trim()) { showToast('⚠️ 이름 필수'); return }
    setSaving(true)
    try {
      const created = await apiFetch(api('health_benefits'), {
        method:'POST',
        headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify(form)
      })
      setForm({ name:'', description:'', category:'', coupang_url:'', age_groups:[], gender:'all', caution:'' })
      await load()
      if (created?.id) {
        setJustCreated(created)
        setShowLinkModal(true)
      }
    } catch(e) { showToast('❌ '+e.message) }
    setSaving(false)
  }

  const save = async (id) => {
    try {
      await apiFetch(`${api('health_benefits')}&id=${id}`, {
        method:'PATCH',
        headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify(editForm)
      })
      setEditId(null); showToast('✅ 저장됨'); load()
    } catch(e) { showToast('❌ '+e.message) }
  }

  const del = (id, name) => {
    setDeleteConfirm({
      id, name,
      onConfirm: async () => {
        try {
          await apiFetch(`${api('health_benefits')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
          if (selHealth?.id===id) setSelHealth(null)
          setList(prev => prev.filter(h => h.id !== id))
          showToast('🗑 삭제됨')
        } catch(e) { showToast('❌ '+e.message) }
      }
    })
  }

  const linkIng = async () => {
    if (!selHealth || !linkIngId) { showToast('⚠️ 식재료를 선택하세요'); return }
    try {
      await apiFetch(api('ingredient_health'), {
        method:'POST',
        headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ ingredient_id: linkIngId, health_id: selHealth.id })
      })
      setLinkIngId(''); showToast('✅ 식재료 연결됨'); loadLinks(selHealth.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const unlinkIng = async (id) => {
    try {
      await apiFetch(`${api('ingredient_health')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      showToast('🗑 해제됨'); loadLinks(selHealth.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const linkTv = async () => {
    if (!selHealth || !linkTvId) { showToast('⚠️ TV방송을 선택하세요'); return }
    try {
      await apiFetch(api('health_tv_shows'), {
        method:'POST',
        headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ health_id: selHealth.id, show_id: linkTvId })
      })
      setLinkTvId(''); showToast('✅ TV방송 연결됨'); loadLinks(selHealth.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const unlinkTv = async (id) => {
    try {
      await apiFetch(`${api('health_tv_shows')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      showToast('🗑 해제됨'); loadLinks(selHealth.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const filtered = filterCat ? list.filter(h=>h.category===filterCat) : list

  // 편집 모드 공통 식재료+TV 연결 섹션
  const renderLinkSection = (hId) => (
    <div style={{ gridColumn:'1/-1', borderTop:'1px solid #d1e8d1', paddingTop:14, marginTop:4 }}>
      {/* 탭 */}
      <div style={{ display:'flex', gap:0, marginBottom:12, borderBottom:'1px solid #d1e8d1' }}>
        <button type="button" onClick={()=>setActiveSection('ingredient')}
          style={{ padding:'6px 14px', border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif",
            fontWeight:700, fontSize:12,
            background: activeSection==='ingredient' ? '#f5f9f5' : 'transparent',
            color: activeSection==='ingredient' ? '#a855f7' : '#888',
            borderBottom: activeSection==='ingredient' ? '2px solid #a855f7' : '2px solid transparent' }}>
          🥕 식재료 ({healthIngs.length})
        </button>
        <button type="button" onClick={()=>setActiveSection('tv')}
          style={{ padding:'6px 14px', border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif",
            fontWeight:700, fontSize:12,
            background: activeSection==='tv' ? '#f5f9f5' : 'transparent',
            color: activeSection==='tv' ? '#f59e0b' : '#888',
            borderBottom: activeSection==='tv' ? '2px solid #f59e0b' : '2px solid transparent' }}>
          📺 TV방송 ({healthTvs.length})
        </button>
      </div>

      {/* 식재료 연결 */}
      {activeSection==='ingredient' && (
        <div>
          {healthIngs.length > 0 ? (
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
              {healthIngs.map(ih => {
                const ing = ingredients.find(i=>i.id===ih.ingredient_id)
                return ing ? (
                  <span key={ih.id} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12,
                    padding:'3px 10px', borderRadius:20, background:'#a855f718', border:'1px solid #a855f744', color:'#7c3aed' }}>
                    {ING_CAT[ing.category]||'🥕'} {ing.name}
                    <button type="button" onClick={()=>unlinkIng(ih.id)}
                      style={{ background:'none', border:'none', color:'#7c3aed', cursor:'pointer', fontSize:14, lineHeight:1, padding:0 }}>×</button>
                  </span>
                ) : null
              })}
            </div>
          ) : <p style={{ fontSize:12, color:'#8aaa8a', marginBottom:10 }}>연결된 식재료 없음</p>}
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
            <SearchSelect items={ingredients} value={linkIngId} onChange={setLinkIngId} placeholder="식재료 검색해서 추가..." />
            <button type="button" onClick={linkIng} style={{ ...S.btn('#a855f7'), padding:'10px 14px', whiteSpace:'nowrap' }}>+ 연결</button>
          </div>
        </div>
      )}

      {/* TV방송 연결 */}
      {activeSection==='tv' && (
        <div>
          {healthTvs.length > 0 ? (
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
              {healthTvs.map(ht => (
                <span key={ht.id} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12,
                  padding:'3px 10px', borderRadius:20, background:'#f59e0b18', border:'1px solid #f59e0b44', color:'#b45309' }}>
                  📺 {ht.tv_shows?.name}
                  <button type="button" onClick={()=>unlinkTv(ht.id)}
                    style={{ background:'none', border:'none', color:'#b45309', cursor:'pointer', fontSize:14, lineHeight:1, padding:0 }}>×</button>
                </span>
              ))}
            </div>
          ) : <p style={{ fontSize:12, color:'#8aaa8a', marginBottom:10 }}>연결된 TV방송 없음</p>}
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
            <SearchSelect items={tvShows} value={linkTvId} onChange={setLinkTvId} placeholder="TV방송 검색해서 추가..." />
            <button type="button" onClick={linkTv} style={{ ...S.btn('#f59e0b'), padding:'10px 14px', whiteSpace:'nowrap' }}>+ 연결</button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div>
      {/* ── 삭제 확인 모달 ── */}
      {deleteConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center',
          background:'rgba(0,0,0,0.55)', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:400,
            boxShadow:'0 20px 60px rgba(0,0,0,0.3)', fontFamily:"'Outfit',sans-serif", overflow:'hidden' }}>
            <div style={{ padding:'24px 24px 16px' }}>
              <div style={{ fontSize:32, marginBottom:12, textAlign:'center' }}>🗑️</div>
              <div style={{ fontSize:16, fontWeight:800, color:'#0f1f0f', textAlign:'center', marginBottom:8 }}>정말 삭제할까요?</div>
              <div style={{ fontSize:13, color:'#4b6e4b', textAlign:'center', marginBottom:4 }}>
                <strong style={{ color:'#dc2626' }}>"{deleteConfirm.name}"</strong>
              </div>
              <div style={{ fontSize:12, color:'#8aaa8a', textAlign:'center' }}>삭제하면 복구할 수 없어요</div>
            </div>
            <div style={{ display:'flex', borderTop:'1px solid #e8f5e8' }}>
              <button onClick={()=>setDeleteConfirm(null)}
                style={{ flex:1, padding:'14px 0', border:'none', background:'#f5f9f5', color:'#4b6e4b',
                  fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                  borderRight:'1px solid #e8f5e8' }}>취소</button>
              <button onClick={()=>{ deleteConfirm.onConfirm(); setDeleteConfirm(null) }}
                style={{ flex:1, padding:'14px 0', border:'none', background:'#fff1f2', color:'#dc2626',
                  fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 등록 후 연결 모달 ── */}
      {showLinkModal && justCreated && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center',
          background:'rgba(0,0,0,0.55)', padding:16 }}
          onClick={e=>{ if(e.target===e.currentTarget) closeModal() }}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto',
            boxShadow:'0 20px 60px rgba(0,0,0,0.3)', fontFamily:"'Outfit',sans-serif" }}>
            {/* 모달 헤더 */}
            <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #e8f5e8', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:11, color:'#22c55e', fontWeight:700, letterSpacing:1, marginBottom:4 }}>✅ 등록 완료</div>
                <div style={{ fontSize:18, fontWeight:900, color:'#0f1f0f' }}>💊 {justCreated.name}</div>
                <div style={{ fontSize:12, color:'#4b6e4b', marginTop:4 }}>식재료와 TV방송을 지금 바로 연결해보세요</div>
              </div>
              <button onClick={closeModal}
                style={{ width:32, height:32, borderRadius:8, border:'1px solid #d1e8d1', background:'#f5f9f5',
                  color:'#4b6e4b', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>×</button>
            </div>

            {/* 탭 */}
            <div style={{ display:'flex', borderBottom:'1px solid #e8f5e8' }}>
              <button onClick={()=>{ setModalTab('ingredient'); loadModalLinks(justCreated.id) }}
                style={{ flex:1, padding:'12px 0', border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                  fontWeight:700, fontSize:13,
                  background: modalTab==='ingredient' ? '#fff' : '#f9fbf9',
                  color: modalTab==='ingredient' ? '#a855f7' : '#888',
                  borderBottom: modalTab==='ingredient' ? '2.5px solid #a855f7' : '2.5px solid transparent' }}>
                🥕 식재료 연결 ({modalIngs.length})
              </button>
              <button onClick={()=>{ setModalTab('tv'); loadModalLinks(justCreated.id) }}
                style={{ flex:1, padding:'12px 0', border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                  fontWeight:700, fontSize:13,
                  background: modalTab==='tv' ? '#fff' : '#f9fbf9',
                  color: modalTab==='tv' ? '#f59e0b' : '#888',
                  borderBottom: modalTab==='tv' ? '2.5px solid #f59e0b' : '2.5px solid transparent' }}>
                📺 TV방송 연결 ({modalTvs.length})
              </button>
            </div>

            {/* 탭 콘텐츠 */}
            <div style={{ padding:20 }}>
              {/* 식재료 탭 */}
              {modalTab==='ingredient' && (
                <div>
                  {modalIngs.length > 0 ? (
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 }}>
                      {modalIngs.map(ih => {
                        const ing = ingredients.find(i=>i.id===ih.ingredient_id)
                        return ing ? (
                          <span key={ih.id} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12,
                            padding:'4px 12px', borderRadius:20, background:'#a855f718', border:'1px solid #a855f744', color:'#7c3aed' }}>
                            {ING_CAT[ing.category]||'🥕'} {ing.name}
                            <button type="button" onClick={()=>modalUnlinkIng(ih.id)}
                              style={{ background:'none', border:'none', color:'#7c3aed', cursor:'pointer', fontSize:15, lineHeight:1, padding:0 }}>×</button>
                          </span>
                        ) : null
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize:13, color:'#8aaa8a', marginBottom:14, textAlign:'center', padding:'12px 0' }}>
                      아직 연결된 식재료가 없어요
                    </p>
                  )}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
                    <SearchSelect items={ingredients} value={modalIngId} onChange={setModalIngId} placeholder="식재료 검색해서 추가..." />
                    <button type="button" onClick={modalLinkIng}
                      style={{ ...S.btn('#a855f7'), padding:'10px 16px', whiteSpace:'nowrap' }}>+ 연결</button>
                  </div>
                </div>
              )}

              {/* TV방송 탭 */}
              {modalTab==='tv' && (
                <div>
                  {modalTvs.length > 0 ? (
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 }}>
                      {modalTvs.map(ht => (
                        <span key={ht.id} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12,
                          padding:'4px 12px', borderRadius:20, background:'#f59e0b18', border:'1px solid #f59e0b44', color:'#b45309' }}>
                          📺 {ht.tv_shows?.name}
                          <button type="button" onClick={()=>modalUnlinkTv(ht.id)}
                            style={{ background:'none', border:'none', color:'#b45309', cursor:'pointer', fontSize:15, lineHeight:1, padding:0 }}>×</button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize:13, color:'#8aaa8a', marginBottom:14, textAlign:'center', padding:'12px 0' }}>
                      아직 연결된 TV방송이 없어요
                    </p>
                  )}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
                    <SearchSelect items={tvShows} value={modalTvId} onChange={setModalTvId} placeholder="TV방송 검색해서 추가..." />
                    <button type="button" onClick={modalLinkTv}
                      style={{ ...S.btn('#f59e0b'), padding:'10px 16px', whiteSpace:'nowrap' }}>+ 연결</button>
                  </div>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div style={{ padding:'16px 24px', borderTop:'1px solid #e8f5e8', display:'flex', justifyContent:'flex-end' }}>
              <button onClick={closeModal}
                style={{ ...S.btn(), padding:'10px 28px' }}>완료</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 등록 폼 ── */}
      <div style={S.card}>
        <div style={S.cardTitle}>💊 건강효능 등록</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <label style={S.label}>효능명 *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="예: 항산화" style={S.input} />
          </div>
          <div>
            <label style={S.label}>카테고리</label>
            <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={S.input}>
              <option value="">선택</option>
              {HEALTH_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>설명</label>
            <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="예: 활성산소 제거, 노화 방지" style={S.input} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>🛒 쿠팡 파트너스 URL (5단계 — 상품 연결)</label>
            <input value={form.coupang_url||''} onChange={e=>setForm(f=>({...f,coupang_url:e.target.value}))} placeholder="예: https://coupa.ng/xxxxx" style={S.input} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>👥 권장 연령대 (복수 선택 가능)</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
              {AGE_GROUPS.map(ag => {
                const on = (form.age_groups||[]).includes(ag.id)
                return (
                  <button key={ag.id} type="button"
                    onClick={() => setForm(f => ({ ...f, age_groups: on ? (f.age_groups||[]).filter(x=>x!==ag.id) : [...(f.age_groups||[]), ag.id] }))}
                    style={{ padding:'5px 12px', borderRadius:20, border:`1.5px solid ${on ? ag.color : '#d1e8d1'}`,
                      background: on ? ag.color+'22' : '#f5f9f5', color: on ? '#0f1f0f' : '#4b6e4b',
                      fontSize:12, fontWeight: on?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                    {ag.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={{ ...S.label, marginBottom:4 }}>👤 성별</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {GENDER_OPTIONS.map(g => {
                const on = (form.gender||'all') === g.id
                return (
                  <button key={g.id} type="button"
                    onClick={() => setForm(f => ({ ...f, gender: g.id }))}
                    style={{ padding:'5px 14px', borderRadius:20, border:`1.5px solid ${on ? g.color : '#d1e8d1'}`,
                      background: on ? g.color+'22' : '#f5f9f5', color: on ? g.color : '#4b6e4b',
                      fontSize:12, fontWeight: on?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                    {g.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>⚠️ 주의사항 (알레르기·특정질환 등 — 없으면 비워두세요)</label>
            <input value={form.caution||''} onChange={e=>setForm(f=>({...f,caution:e.target.value}))}
              placeholder="예: 견과류 알레르기 주의 / 통풍 환자 퓨린 함량 높음 / 임산부 과다섭취 주의"
              style={S.input} list="caution-presets" />
            <datalist id="caution-presets">
              {CAUTION_PRESETS.map(p=><option key={p} value={p} />)}
            </datalist>
            <p style={{ fontSize:11, color:'#dc2626', marginTop:4, fontWeight:600 }}>💡 입력창 클릭하면 자주 쓰는 주의문구가 나와요</p>
          </div>
        </div>
        <button onClick={submit} disabled={saving} style={{ ...S.btn(), opacity:saving?.6:1 }}>+ 등록</button>
        <p style={{ fontSize:12, color:'#4b6e4b', marginTop:10, lineHeight:1.6 }}>
          💡 등록 후 아래 효능 목록에서 해당 카드를 클릭하면<br/>
          <strong>🥕 식재료</strong>와 <strong>📺 TV방송</strong>을 바로 연결할 수 있어요.
        </p>
      </div>

      {/* ── 효능 목록 ── */}
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
          <div style={S.cardTitle}>📋 효능 목록 ({filtered.length})</div>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{ ...S.input, width:150 }}>
            <option value="">전체 카테고리</option>
            {HEALTH_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? <p style={{ color:'#8aaa8a', textAlign:'center', padding:30 }}>불러오는 중...</p> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:8 }}>
            {filtered.map(h => editId===h.id ? (
              /* ── 편집 모드 ── */
              <div key={h.id} style={{ ...S.row, border:'1.5px solid #22c55e', gridColumn: '1/-1' }}>
                {/* 수정 중 헤더 */}
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, paddingBottom:12, borderBottom:'1px solid #d1e8d1' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'#dcfce7', border:'1.5px solid #22c55e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>✏️</div>
                  <div>
                    <div style={{ fontSize:11, color:'#22c55e', fontWeight:700, letterSpacing:1, marginBottom:2 }}>수정 중</div>
                    <div style={{ fontSize:16, fontWeight:900, color:'#0f1f0f' }}>💊 {h.name}</div>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                  <div>
                    <label style={S.label}>효능명 *</label>
                    <input value={editForm.name||''} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>카테고리</label>
                    <select value={editForm.category||''} onChange={e=>setEditForm(f=>({...f,category:e.target.value}))} style={S.input}>
                      <option value="">선택</option>
                      {HEALTH_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={S.label}>설명</label>
                    <input value={editForm.description||''} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))} placeholder="설명" style={S.input} />
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={S.label}>🛒 쿠팡 URL</label>
                    <input value={editForm.coupang_url||''} onChange={e=>setEditForm(f=>({...f,coupang_url:e.target.value}))} placeholder="https://coupa.ng/..." style={S.input} />
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ ...S.label, marginBottom:4 }}>👥 권장 연령대</label>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {AGE_GROUPS.map(ag => {
                        const on = (editForm.age_groups||[]).includes(ag.id)
                        return (
                          <button key={ag.id} type="button"
                            onClick={() => setEditForm(f => ({ ...f, age_groups: on ? (f.age_groups||[]).filter(x=>x!==ag.id) : [...(f.age_groups||[]), ag.id] }))}
                            style={{ padding:'3px 9px', borderRadius:20, border:`1.5px solid ${on ? ag.color : '#d1e8d1'}`,
                              background: on ? ag.color+'22' : '#f5f9f5', color: on ? '#0f1f0f' : '#4b6e4b',
                              fontSize:11, fontWeight: on?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                            {ag.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ ...S.label, marginBottom:4 }}>👤 성별</label>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {GENDER_OPTIONS.map(g => {
                        const on = (editForm.gender||'all') === g.id
                        return (
                          <button key={g.id} type="button"
                            onClick={() => setEditForm(f => ({ ...f, gender: g.id }))}
                            style={{ padding:'4px 12px', borderRadius:20, border:`1.5px solid ${on ? g.color : '#d1e8d1'}`,
                              background: on ? g.color+'22' : '#f5f9f5', color: on ? g.color : '#4b6e4b',
                              fontSize:11, fontWeight: on?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                            {g.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={S.label}>⚠️ 주의사항</label>
                    <input value={editForm.caution||''} onChange={e=>setEditForm(f=>({...f,caution:e.target.value}))}
                      placeholder="예: 통풍 환자 주의" style={S.input} list="caution-presets" />
                  </div>
                  {/* 식재료 + TV방송 연결 탭 */}
                  {renderLinkSection(h.id)}
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>save(h.id)} style={S.btn()}>저장</button>
                  <button onClick={()=>{ setEditId(null); setSelHealth(null) }} style={S.btnGhost}>취소</button>
                </div>
              </div>
            ) : (
              /* ── 보기 모드 ── */
              <div key={h.id} style={{
                ...S.row,
                border: selHealth?.id===h.id ? '1.5px solid #a855f7' : S.row.border,
                cursor:'pointer',
              }}
                onClick={()=>{ if(editId) return; setSelHealth(selHealth?.id===h.id ? null : h) }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:3 }}>
                      <span style={{ fontWeight:700, color:'#0f1f0f' }}>💊 {h.name}</span>
                      {h.category && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#22c55e18', color:'#22c55e', border:'1px solid #22c55e33' }}>{h.category}</span>}
                    </div>
                    {h.description && <p style={{ fontSize:12, color:'#4b6e4b', margin:'0 0 4px' }}>{h.description}</p>}
                    {h.age_groups?.length > 0 && (
                      <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:4 }}>
                        {h.age_groups.map(ag => {
                          const info = AGE_GROUPS.find(a=>a.id===ag)
                          return info ? <span key={ag} style={{ fontSize:10, padding:'1px 7px', borderRadius:20, background:info.color+'22', color:'#0f1f0f', border:`1px solid ${info.color}` }}>{info.label}</span> : null
                        })}
                      </div>
                    )}
                    {h.gender && h.gender !== 'all' && (() => {
                      const g = GENDER_OPTIONS.find(x => x.id === h.gender)
                      return g ? <span style={{ fontSize:10, padding:'1px 8px', borderRadius:20, background:g.color+'22', color:g.color, border:`1px solid ${g.color}44`, display:'inline-block', marginBottom:4 }}>{g.label}</span> : null
                    })()}
                    {h.caution && (
                      <div style={{ padding:'4px 8px', borderRadius:6, background:'#fef2f2', border:'1.5px solid #fca5a5', fontSize:11, lineHeight:1.4, marginBottom:4 }}>
                        <span style={{ color:'#dc2626', fontWeight:700 }}>⚠️ 주의 </span>
                        <span style={{ color:'#dc2626', fontWeight:600 }}>{h.caution}</span>
                      </div>
                    )}
                    {h.coupang_url && <a href={h.coupang_url} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:'#ea580c', textDecoration:'none', display:'inline-block' }}>🛒 쿠팡 링크 ↗</a>}
                  </div>
                  <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                    <button onClick={e=>{ e.stopPropagation(); setEditId(h.id); setSelHealth(h); setEditForm({name:h.name,description:h.description||'',category:h.category||'',coupang_url:h.coupang_url||'',age_groups:h.age_groups||[],gender:h.gender||'all',caution:h.caution||''}); loadLinks(h.id) }}
                      style={{ ...S.btnGhost, padding:'4px 10px', fontSize:12 }}>✏️</button>
                    <button onClick={e=>{ e.stopPropagation(); del(h.id, h.name) }}
                      style={{ padding:'4px 10px', borderRadius:7, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:12, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                  </div>
                </div>

                {/* 보기 모드 연결 패널 (클릭 시 펼침) */}
                {selHealth?.id===h.id && editId!==h.id && (
                  <div id="health-link-panel" style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #d1e8d1' }}
                    onClick={e=>e.stopPropagation()}>
                    {/* 탭 */}
                    <div style={{ display:'flex', gap:0, marginBottom:12, borderBottom:'1px solid #d1e8d1' }}>
                      <button type="button" onClick={()=>setActiveSection('ingredient')}
                        style={{ padding:'6px 14px', border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                          fontWeight:700, fontSize:12,
                          background: activeSection==='ingredient' ? '#f5f9f5' : 'transparent',
                          color: activeSection==='ingredient' ? '#a855f7' : '#888',
                          borderBottom: activeSection==='ingredient' ? '2px solid #a855f7' : '2px solid transparent' }}>
                        🥕 식재료 ({healthIngs.length})
                      </button>
                      <button type="button" onClick={()=>setActiveSection('tv')}
                        style={{ padding:'6px 14px', border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                          fontWeight:700, fontSize:12,
                          background: activeSection==='tv' ? '#f5f9f5' : 'transparent',
                          color: activeSection==='tv' ? '#f59e0b' : '#888',
                          borderBottom: activeSection==='tv' ? '2px solid #f59e0b' : '2px solid transparent' }}>
                        📺 TV방송 ({healthTvs.length})
                      </button>
                    </div>

                    {/* 식재료 */}
                    {activeSection==='ingredient' && (
                      <div>
                        {healthIngs.length > 0 ? (
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
                            {healthIngs.map(ih => {
                              const ing = ingredients.find(i=>i.id===ih.ingredient_id)
                              return ing ? (
                                <span key={ih.id} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12,
                                  padding:'3px 10px', borderRadius:20, background:'#a855f718', border:'1px solid #a855f744', color:'#7c3aed' }}>
                                  {ING_CAT[ing.category]||'🥕'} {ing.name}
                                  <button type="button" onClick={()=>unlinkIng(ih.id)}
                                    style={{ background:'none', border:'none', color:'#7c3aed', cursor:'pointer', fontSize:14, lineHeight:1, padding:0 }}>×</button>
                                </span>
                              ) : null
                            })}
                          </div>
                        ) : <p style={{ fontSize:12, color:'#8aaa8a', marginBottom:10 }}>아직 연결된 식재료가 없어요</p>}
                        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
                          <SearchSelect items={ingredients} value={linkIngId} onChange={setLinkIngId} placeholder="식재료 검색해서 추가..." />
                          <button type="button" onClick={linkIng} style={{ ...S.btn('#a855f7'), padding:'8px 12px', whiteSpace:'nowrap', fontSize:12 }}>+ 연결</button>
                        </div>
                      </div>
                    )}

                    {/* TV방송 */}
                    {activeSection==='tv' && (
                      <div>
                        {healthTvs.length > 0 ? (
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
                            {healthTvs.map(ht => (
                              <span key={ht.id} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12,
                                padding:'3px 10px', borderRadius:20, background:'#f59e0b18', border:'1px solid #f59e0b44', color:'#b45309' }}>
                                📺 {ht.tv_shows?.name}
                                <button type="button" onClick={()=>unlinkTv(ht.id)}
                                  style={{ background:'none', border:'none', color:'#b45309', cursor:'pointer', fontSize:14, lineHeight:1, padding:0 }}>×</button>
                              </span>
                            ))}
                          </div>
                        ) : <p style={{ fontSize:12, color:'#8aaa8a', marginBottom:10 }}>아직 연결된 TV방송이 없어요</p>}
                        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
                          <SearchSelect items={tvShows} value={linkTvId} onChange={setLinkTvId} placeholder="TV방송 검색해서 추가..." />
                          <button type="button" onClick={linkTv} style={{ ...S.btn('#f59e0b'), padding:'8px 12px', whiteSpace:'nowrap', fontSize:12 }}>+ 연결</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// 서브탭 2 : TV방송 관리
// ══════════════════════════════════════════════════════════
function TvShowTab({ adminToken, showToast, confirmDelete }) {
  const [shows, setShows] = useState([])
  const [chefs, setChefs] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [showChefs, setShowChefs] = useState([])
  const [showIngs, setShowIngs] = useState([])
  const [activeSection, setActiveSection] = useState('chef')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name:'', broadcaster:'', category:'', description:'', started_at:'', ended_at:'', air_days:[] })
  const [saving, setSaving] = useState(false)
  const [selShow, setSelShow] = useState(null)
  const [linkChefId, setLinkChefId] = useState('')
  const [linkRole, setLinkRole] = useState('')
  const [linkIngId, setLinkIngId] = useState('')
  const [editTvId, setEditTvId] = useState(null)
  const [editTvForm, setEditTvForm] = useState({})

  const ING_CAT = Object.fromEntries(ING_CATEGORIES.map(c=>[c.id, c.emoji]))

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, c, i] = await Promise.all([
        apiFetch(api('tv_shows')),
        apiFetch(api('chefs')),
        apiFetch(api('ingredients')),
      ])
      setShows(s); setChefs(c); setIngredients(i)
    } catch(e) { showToast('❌ '+e.message) }
    setLoading(false)
  }, [])

  const loadShowChefs = useCallback(async (showId) => {
    try { setShowChefs(await apiFetch(`${api('show_chefs')}&show_id=${showId}`)) } catch {}
  }, [])

  const loadShowIngs = useCallback(async (showId) => {
    try { setShowIngs(await apiFetch(`${api('show_ingredients')}&show_id=${showId}`)) } catch { setShowIngs([]) }
  }, [])

  useEffect(()=>{ loadAll() }, [])
  useEffect(()=>{
    if(selShow) {
      loadShowChefs(selShow.id)
      loadShowIngs(selShow.id)
    } else {
      setShowChefs([]); setShowIngs([])
    }
  }, [selShow])

  const addShow = async () => {
    if (!form.name.trim()) { showToast('⚠️ 방송명 필수'); return }
    setSaving(true)
    try {
      await apiFetch(api('tv_shows'), { method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken}, body:JSON.stringify(form) })
      setForm({ name:'', broadcaster:'', category:'', description:'', started_at:'', ended_at:'', air_days:[] })
      showToast('✅ 등록 완료'); loadAll()
    } catch(e) { showToast('❌ '+e.message) }
    setSaving(false)
  }

  const delShow = (id, name) => {
    confirmDelete(name, async () => {
      try {
        await apiFetch(`${api('tv_shows')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
        if (selShow?.id===id) setSelShow(null)
        setShows(prev => prev.filter(s => s.id !== id))
        showToast('🗑 삭제됨')
      } catch(e) { showToast('❌ '+e.message) }
    })
  }

  const saveShow = async (id) => {
    try {
      await apiFetch(`${api('tv_shows')}&id=${id}`, {
        method:'PATCH',
        headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify(editTvForm)
      })
      setEditTvId(null); showToast('✅ 저장됨'); loadAll()
    } catch(e) { showToast('❌ '+e.message) }
  }

  const linkChef = async () => {
    if (!selShow || !linkChefId) { showToast('⚠️ 방송과 셰프 선택 필수'); return }
    try {
      await apiFetch(api('show_chefs'), { method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ show_id:selShow.id, chef_id:linkChefId, role:linkRole }) })
      setLinkChefId(''); setLinkRole('')
      showToast('✅ 연결됨'); loadShowChefs(selShow.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const unlinkChef = async (id) => {
    try {
      await apiFetch(`${api('show_chefs')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      showToast('🗑 해제됨'); loadShowChefs(selShow.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const linkIng = async () => {
    if (!selShow || !linkIngId) { showToast('⚠️ 식재료를 선택하세요'); return }
    try {
      await apiFetch(api('show_ingredients'), { method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ show_id:selShow.id, ingredient_id:linkIngId }) })
      setLinkIngId(''); showToast('✅ 식재료 연결됨'); loadShowIngs(selShow.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const unlinkIng = async (id) => {
    try {
      await apiFetch(`${api('show_ingredients')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      showToast('🗑 해제됨'); loadShowIngs(selShow.id)
    } catch(e) { showToast('❌ '+e.message) }
  }



  return (
    <div>
      {/* TV 프로그램 등록 */}
      <div style={S.card}>
        <div style={S.cardTitle}>📺 TV 프로그램 등록</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <label style={S.label}>방송명 *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="예: 흑백요리사" style={S.input} />
          </div>
          <div>
            <label style={S.label}>방송사</label>
            <input value={form.broadcaster} onChange={e=>setForm(f=>({...f,broadcaster:e.target.value}))} placeholder="예: tvN, Netflix" style={S.input} />
          </div>
          <div>
            <label style={S.label}>장르</label>
            <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={S.input}>
              <option value="">선택</option>
              {SHOW_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>설명</label>
            <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="간단 설명" style={S.input} />
          </div>
          <div>
            <label style={S.label}>📅 방송 시작일</label>
            <input type="date" value={form.started_at} onChange={e=>setForm(f=>({...f,started_at:e.target.value}))} style={S.input} />
          </div>
          <div>
            <label style={S.label}>📅 방송 종료일 (방송 중이면 비워두세요)</label>
            <input type="date" value={form.ended_at} onChange={e=>setForm(f=>({...f,ended_at:e.target.value}))} style={S.input} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>📡 방송 요일 (복수 선택)</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
              {AIR_DAYS.map(d => {
                const on = (form.air_days||[]).includes(d)
                return (
                  <button key={d} type="button"
                    onClick={()=>setForm(f=>({ ...f, air_days: on ? (f.air_days||[]).filter(x=>x!==d) : [...(f.air_days||[]), d] }))}
                    style={{ width:38, height:38, borderRadius:8, border:`1.5px solid ${on?'#f59e0b':'#d1e8d1'}`,
                      background: on?'#fef3c7':'#f5f9f5', color: on?'#92400e':'#4b6e4b',
                      fontSize:13, fontWeight: on?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                    {d}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <button onClick={addShow} disabled={saving} style={{ ...S.btn(), opacity:saving?.6:1 }}>+ 등록</button>
      </div>

      {/* 방송 목록 */}
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
          <div style={S.cardTitle}>📋 방송 목록 ({shows.length})</div>
        </div>

        {/* 요일 탭 */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:14, borderBottom:'1px solid #d1e8d1', paddingBottom:10 }}>
          {['전체','월','화','수','목','금','토','일','미등록'].map(d => {
            const on = dayFilter === d
            const cnt = d === '전체' ? shows.length
              : d === '미등록' ? shows.filter(s => !s.air_days || s.air_days.length === 0).length
              : shows.filter(s => (s.air_days||[]).includes(d)).length
            return (
              <button key={d} onClick={() => setDayFilter(d)}
                style={{ padding:'5px 12px', borderRadius:20, border:`1.5px solid ${on?'#f59e0b':'#d1e8d1'}`,
                  background: on?'#fef3c7':'#f5f9f5', color: on?'#92400e':'#4b6e4b',
                  fontSize:12, fontWeight: on?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif", whiteSpace:'nowrap' }}>
                {d} <span style={{ opacity:.7, fontSize:11 }}>({cnt})</span>
              </button>
            )
          })}
        </div>

        {loading ? <p style={{ color:'#8aaa8a', textAlign:'center', padding:30 }}>불러오는 중...</p> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:8 }}>
            {[...shows]
              .filter(s => dayFilter === '전체' ? true
                : dayFilter === '미등록' ? (!s.air_days || s.air_days.length === 0)
                : (s.air_days||[]).includes(dayFilter))
              .sort((a,b) => a.name.localeCompare(b.name, 'ko')).map(s => (
              editTvId===s.id ? (
                /* ── 수정 모드 ── */
                <div key={s.id} style={{ ...S.row, border:'1.5px solid #f59e0b', gridColumn:'1/-1' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingBottom:12, borderBottom:'1px solid #fde68a' }}>
                    <div style={{ width:34, height:34, borderRadius:9, background:'#fef3c7', border:'1.5px solid #f59e0b', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>✏️</div>
                    <div>
                      <div style={{ fontSize:11, color:'#f59e0b', fontWeight:700, letterSpacing:1, marginBottom:2 }}>수정 중</div>
                      <div style={{ fontSize:15, fontWeight:900, color:'#0f1f0f' }}>📺 {s.name}</div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                    <div>
                      <label style={S.label}>방송명 *</label>
                      <input value={editTvForm.name||''} onChange={e=>setEditTvForm(f=>({...f,name:e.target.value}))} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>방송사</label>
                      <input value={editTvForm.broadcaster||''} onChange={e=>setEditTvForm(f=>({...f,broadcaster:e.target.value}))} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>장르</label>
                      <select value={editTvForm.category||''} onChange={e=>setEditTvForm(f=>({...f,category:e.target.value}))} style={S.input}>
                        <option value="">선택</option>
                        {SHOW_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>설명</label>
                      <input value={editTvForm.description||''} onChange={e=>setEditTvForm(f=>({...f,description:e.target.value}))} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>📅 방송 시작일</label>
                      <input type="date" value={editTvForm.started_at||''} onChange={e=>setEditTvForm(f=>({...f,started_at:e.target.value}))} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>📅 종료일 (방송 중이면 비워두세요)</label>
                      <input type="date" value={editTvForm.ended_at||''} onChange={e=>setEditTvForm(f=>({...f,ended_at:e.target.value}))} style={S.input} />
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={S.label}>📡 방송 요일</label>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:6 }}>
                        {AIR_DAYS.map(d => {
                          const on = (editTvForm.air_days||[]).includes(d)
                          return (
                            <button key={d} type="button"
                              onClick={()=>setEditTvForm(f=>({ ...f, air_days: on ? (f.air_days||[]).filter(x=>x!==d) : [...(f.air_days||[]), d] }))}
                              style={{ width:36, height:36, borderRadius:7, border:`1.5px solid ${on?'#f59e0b':'#d1e8d1'}`,
                                background: on?'#fef3c7':'#f5f9f5', color: on?'#92400e':'#4b6e4b',
                                fontSize:12, fontWeight: on?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                              {d}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={()=>saveShow(s.id)} style={S.btn()}>저장</button>
                    <button onClick={()=>setEditTvId(null)} style={S.btnGhost}>취소</button>
                  </div>
                </div>
              ) : (
                /* ── 보기 모드 ── */
                <div key={s.id} style={{ ...S.row, display:'flex', justifyContent:'space-between', alignItems:'flex-start', background:'#f5f9f5', border:'1px solid #d1e8d1' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, flexWrap:'wrap' }}>
                      <span style={{ fontWeight:700, color:'#0f1f0f', fontSize:13 }}>📺 {s.name}</span>
                      {s.ended_at ? (
                        <span style={{ fontSize:10, padding:'1px 7px', borderRadius:20, background:'#f1f5f9', border:'1px solid #cbd5e1', color:'#64748b', fontWeight:600 }}>방송종료</span>
                      ) : (
                        <span style={{ fontSize:10, padding:'1px 7px', borderRadius:20, background:'#dcfce7', border:'1px solid #86efac', color:'#16a34a', fontWeight:700 }}>🔴 방송중</span>
                      )}
                    </div>
                    <div style={{ fontSize:11, color:'#4b6e4b', marginBottom:2 }}>
                      {s.broadcaster}{s.category && ` · ${s.category}`}
                    </div>
                    {(s.started_at || s.ended_at) && (
                      <div style={{ fontSize:11, color:'#6b7280', marginBottom:2 }}>
                        📅 {s.started_at ? s.started_at.slice(0,7) : '?'} ~ {s.ended_at ? s.ended_at.slice(0,7) : '현재'}
                      </div>
                    )}
                    <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:2 }}>
                      {s.air_days?.length > 0 ? (
                        s.air_days.map(d => (
                          <span key={d} style={{ fontSize:10, padding:'1px 6px', borderRadius:6, background:'#fef3c7', border:'1px solid #fde68a', color:'#92400e', fontWeight:600 }}>📡 {d}요일</span>
                        ))
                      ) : (
                        <span style={{ fontSize:10, padding:'1px 6px', borderRadius:6, background:'#f8fafc', border:'1px solid #e2e8f0', color:'#94a3b8' }}>요일 미등록</span>
                      )}
                    </div>
                    {s.description && <div style={{ fontSize:11, color:'#8aaa8a', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.description}</div>}
                  </div>
                  <div style={{ display:'flex', gap:4, flexShrink:0, marginLeft:8 }}>
                    <button onClick={()=>{ setEditTvId(s.id); setEditTvForm({name:s.name,broadcaster:s.broadcaster||'',category:s.category||'',description:s.description||'',started_at:s.started_at||'',ended_at:s.ended_at||'',air_days:s.air_days||[]}) }}
                      style={{ padding:'4px 9px', borderRadius:6, border:'1px solid #d1e8d1', background:'#f5f9f5', color:'#4b6e4b', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>✏️</button>
                    <button onClick={()=>delShow(s.id, s.name)}
                      style={{ padding:'4px 9px', borderRadius:6, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// ══════════════════════════════════════════════════════════
// 서브탭 3 : 셰프 관리
// ══════════════════════════════════════════════════════════
function ChefTab({ adminToken, showToast, confirmDelete }) {
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
  useEffect(()=>{ load() }, [])

  const submit = async () => {
    if (!form.name.trim()) { showToast('⚠️ 이름 필수'); return }
    setSaving(true)
    try {
      await apiFetch(api('chefs'), { method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken}, body:JSON.stringify(form) })
      setForm({ name:'', role:'', specialty:'', description:'' })
      showToast('✅ 등록 완료'); load()
    } catch(e) { showToast('❌ '+e.message) }
    setSaving(false)
  }

  const save = async (id) => {
    try {
      await apiFetch(`${api('chefs')}&id=${id}`, { method:'PATCH', headers:{'Content-Type':'application/json','x-admin-token':adminToken}, body:JSON.stringify(editForm) })
      setEditId(null); showToast('✅ 저장됨'); load()
    } catch(e) { showToast('❌ '+e.message) }
  }

  const del = (id, name) => {
    confirmDelete(name, async () => {
      try {
        await apiFetch(`${api('chefs')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
        setList(prev => prev.filter(c => c.id !== id))
        showToast('🗑 삭제됨')
      } catch(e) { showToast('❌ '+e.message) }
    })
  }

  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>👨‍🍳 셰프/출연자 등록</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <label style={S.label}>이름 *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="예: 백종원" style={S.input} />
          </div>
          <div>
            <label style={S.label}>역할</label>
            <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={S.input}>
              <option value="">선택</option>
              {CHEF_ROLES.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>전문 분야</label>
            <input value={form.specialty} onChange={e=>setForm(f=>({...f,specialty:e.target.value}))} placeholder="예: 한식, 양식, 디저트" style={S.input} />
          </div>
          <div>
            <label style={S.label}>설명</label>
            <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="간단 설명" style={S.input} />
          </div>
        </div>
        <button onClick={submit} disabled={saving} style={{ ...S.btn(), opacity:saving?.6:1 }}>+ 등록</button>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>📋 셰프 목록 ({list.length})</div>
        {loading ? <p style={{ color:'#8aaa8a', textAlign:'center', padding:30 }}>불러오는 중...</p> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:8 }}>
            {list.map(c => editId===c.id ? (
              <div key={c.id} style={{ ...S.row, border:'1.5px solid #22c55e44' }}>
                <input value={editForm.name||''} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} placeholder="이름" style={{ ...S.input, marginBottom:6 }} />
                <select value={editForm.role||''} onChange={e=>setEditForm(f=>({...f,role:e.target.value}))} style={{ ...S.input, marginBottom:6 }}>
                  <option value="">역할</option>
                  {CHEF_ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
                <input value={editForm.specialty||''} onChange={e=>setEditForm(f=>({...f,specialty:e.target.value}))} placeholder="전문분야" style={{ ...S.input, marginBottom:6 }} />
                <input value={editForm.description||''} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))} placeholder="설명" style={{ ...S.input, marginBottom:8 }} />
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>save(c.id)} style={S.btn()}>저장</button>
                  <button onClick={()=>setEditId(null)} style={S.btnGhost}>취소</button>
                </div>
              </div>
            ) : (
              <div key={c.id} style={{ ...S.row, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontWeight:700, color:'#0f1f0f', marginBottom:3 }}>👨‍🍳 {c.name}</div>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    {c.role && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#f59e0b18', color:'#f59e0b', border:'1px solid #f59e0b33' }}>{c.role}</span>}
                    {c.specialty && <span style={{ fontSize:11, color:'#4b6e4b' }}>{c.specialty}</span>}
                  </div>
                  {c.description && <p style={{ fontSize:11, color:'#666', margin:'3px 0 0' }}>{c.description}</p>}
                </div>
                <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                  <button onClick={()=>{ setEditId(c.id); setEditForm({name:c.name,role:c.role,specialty:c.specialty,description:c.description}) }}
                    style={{ ...S.btnGhost, padding:'4px 10px', fontSize:12 }}>✏️</button>
                  <button onClick={()=>del(c.id, c.name)}
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
// 서브탭 4 : 식재료 관리
// ══════════════════════════════════════════════════════════

// 식재료 폼 공통 필드 (등록/수정 공용)
function IngForm({ f, setF, healths, regions, onAddRegion, onDelRegion, onLinkHealth, onUnlinkHealth, regionForm, setRegionForm, linkHealthId, setLinkHealthId, submitLabel, onSubmit, onCancel, saving }) {
  const ING_CAT = ING_CATEGORIES

  return (
    <div>
      {/* ── 기본 정보 ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
        <div>
          <label style={S.label}>식재료명 (기본명)</label>
          <input value={f.name||''} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="예: 감귤, 사과" style={S.input} />
        </div>
        <div>
          <label style={S.label}>지역</label>
          <select value={f.region_id||''} onChange={e=>setF(p=>({...p,region_id:e.target.value}))} style={S.input}>
            <option value="">선택 안 함</option>
            {DEFAULT_CATEGORIES.map(c=><option key={c} value={c}>{categoryLabel(c)}</option>)}
          </select>
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={S.label}>📌 등록명 (식재료명-지역) *</label>
          <input
            value={f.display_name !== undefined
              ? (f.display_name || (f.name && f.region_id
                  ? f.name + '-' + categoryLabel(f.region_id).replace(/[🏙🌊🍎🦀🌿🍢🐟🌾🏡🏔🍇🦪🍚🍎🦐🍊]/u,'').replace(/(특별자치도|특별자치시|특별시|광역시|도|시)$/,'').trim()
                  : f.name || ''))
              : f.name || ''}
            onChange={e=>setF(p=>({...p,display_name:e.target.value}))}
            placeholder="예: 감귤-제주, 사과-경북"
            style={{ ...S.input, fontWeight:700, color:'#1d4ed8', fontSize:14 }}
          />
          <p style={{ fontSize:11, color:'#8aaa8a', marginTop:3 }}>💡 식재료명+지역 입력하면 자동완성 — 직접 수정 가능</p>
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={S.label}>카테고리</label>
          {ING_GROUPS.map(group => (
            <div key={group} style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:5, alignItems:'center' }}>
              <span style={{ fontSize:11, color:'#8aaa8a', minWidth:60, fontWeight:600 }}>{group}</span>
              {ING_CATEGORIES.filter(c=>c.group===group).map(c=>(
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
          <label style={S.label}>설명 (건강효능 요약)</label>
          <input value={f.description||''} onChange={e=>setF(p=>({...p,description:e.target.value}))} placeholder="간단 설명" style={S.input} />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={S.label}>🛒 쿠팡 파트너스 URL</label>
          <input value={f.coupang_url||''} onChange={e=>setF(p=>({...p,coupang_url:e.target.value}))} placeholder="예: https://coupa.ng/xxxxx" style={S.input} />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={S.label}>⚠️ 주의사항 (알레르기·특정질환·섭취제한 등)</label>
          <input value={f.caution||''} onChange={e=>setF(p=>({...p,caution:e.target.value}))}
            placeholder="예: 견과류 알레르기 주의 / 통풍 환자 퓨린 함량 높음 / 임산부 과다섭취 주의"
            style={S.input} list="caution-presets" />
        </div>

        {/* 특산품 / 기간한정 */}
        <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:10, marginTop:4 }}>
          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
            <div onClick={() => setF(p => ({ ...p, is_special: !p.is_special }))}
              style={{ width:40, height:22, borderRadius:11, cursor:'pointer', transition:'background 0.2s',
                background: f.is_special ? '#f59e0b' : '#d1e8d1', position:'relative', flexShrink:0 }}>
              <div style={{ position:'absolute', top:3, left: f.is_special ? 20 : 3,
                width:16, height:16, borderRadius:8, background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <span style={{ fontSize:13, fontWeight:700, color: f.is_special ? '#f59e0b' : '#4b6e4b' }}>🏆 특산품</span>
            <span style={{ fontSize:11, color:'#8aaa8a' }}>해당 지역 대표 특산물</span>
          </label>
          <div>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none', marginBottom: f.is_limited ? 8 : 0 }}>
              <div onClick={() => setF(p => ({ ...p, is_limited: !p.is_limited, limited_days:'' }))}
                style={{ width:40, height:22, borderRadius:11, cursor:'pointer', transition:'background 0.2s',
                  background: f.is_limited ? '#10b981' : '#d1e8d1', position:'relative', flexShrink:0 }}>
                <div style={{ position:'absolute', top:3, left: f.is_limited ? 20 : 3,
                  width:16, height:16, borderRadius:8, background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              <span style={{ fontSize:13, fontWeight:700, color: f.is_limited ? '#10b981' : '#4b6e4b' }}>⏰ 기간한정</span>
              <span style={{ fontSize:11, color:'#8aaa8a' }}>특정 기간에만 출하되는 식재료</span>
            </label>
            {f.is_limited && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginLeft:50 }}>
                {LIMITED_PRESETS.map(p => (
                  <button key={p.value} type="button"
                    onClick={() => setF(prev => ({ ...prev, limited_days: p.value }))}
                    style={{ padding:'4px 12px', borderRadius:20, border:'1.5px solid #10b981',
                      background: f.limited_days === p.value ? '#10b981' : '#d1fae5',
                      color: f.limited_days === p.value ? '#fff' : '#059669',
                      fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 해외 식재료 */}
          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
            <div onClick={() => setF(p => ({ ...p, is_global: !p.is_global }))}
              style={{ width:40, height:22, borderRadius:11, cursor:'pointer', transition:'background 0.2s',
                background: f.is_global ? '#3b82f6' : '#d1e8d1', position:'relative', flexShrink:0 }}>
              <div style={{ position:'absolute', top:3, left: f.is_global ? 20 : 3,
                width:16, height:16, borderRadius:8, background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <span style={{ fontSize:13, fontWeight:700, color: f.is_global ? '#3b82f6' : '#4b6e4b' }}>🌍 해외 식재료</span>
            <span style={{ fontSize:11, color:'#8aaa8a' }}>국내 미생산 글로벌 슈퍼푸드 등</span>
          </label>

        </div>
        <div style={{ display:'none' }}>
          <p style={{ fontSize:11, color:'#8aaa8a', marginTop:3 }}>💡 입력창 클릭하면 자주 쓰는 주의문구 나와요</p>
        </div>
      </div>

      {/* ── 건강효능 연결 (수정 모드에서만 — regions/healths prop 있을 때) ── */}
      {healths && (
        <div style={{ marginBottom:14, background:'#f0fdf4', borderRadius:10, padding:14, border:'1px solid #bbf7d0' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#15803d', marginBottom:10 }}>💊 건강효능 연결</div>
          {/* 연결된 효능 태그 */}
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
            {(healths.linked||[]).length > 0
              ? (healths.linked||[]).map(ih=>(
                  <span key={ih.id} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12,
                    padding:'3px 10px', borderRadius:20, background:'#dcfce7', border:'1px solid #86efac', color:'#15803d' }}>
                    {ih.health_benefits?.name}
                    <button type="button" onClick={()=>onUnlinkHealth(ih.id)}
                      style={{ background:'none', border:'none', color:'#15803d', cursor:'pointer', fontSize:14, lineHeight:1, padding:0 }}>×</button>
                  </span>
                ))
              : <p style={{ fontSize:12, color:'#8aaa8a', margin:0 }}>연결된 효능 없음</p>
            }
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'flex-end' }}>
            <SearchSelect items={healths.all||[]} value={linkHealthId} onChange={setLinkHealthId} placeholder="효능 검색해서 추가..." />
            <button type="button" onClick={onLinkHealth} style={{ ...S.btn('#22c55e'), padding:'10px 14px', whiteSpace:'nowrap' }}>+ 연결</button>
          </div>
        </div>
      )}

      {/* ── 지역·제철월 연결 ── */}
      {regions !== undefined && (
        <div style={{ marginBottom:14, background:'#eff6ff', borderRadius:10, padding:14, border:'1px solid #bfdbfe' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#1d4ed8', marginBottom:10 }}>🗺 지역·제철월 연결</div>
          {/* 등록된 지역 목록 */}
          {(regions||[]).length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
              {(regions||[]).map(r=>(
                <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                  background:'#fff', borderRadius:8, padding:'8px 12px', fontSize:12, border:'1px solid #bfdbfe' }}>
                  <span style={{ color:'#1e40af', fontWeight:600 }}>📍 {categoryLabel(r.region)}{r.district ? ` · ${r.district}` : ''}</span>
                  <span style={{ color:'#2563eb', fontWeight:700 }}>
                    {(r.months||[]).length > 0 ? `${(r.months||[]).join('·')}월` : '월 미설정'}
                  </span>
                  <button type="button" onClick={()=>onDelRegion(r.id)}
                    style={{ padding:'2px 8px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize:12, color:'#8aaa8a', marginBottom:12 }}>아직 연결된 지역이 없어요</p>
          )}
          {/* 지역 추가 폼 */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, background:'#fff', borderRadius:8, padding:10, border:'1px solid #bfdbfe' }}>
            <div>
              <label style={S.label}>시도 *</label>
              <select value={regionForm.region} onChange={e=>setRegionForm(p=>({...p,region:e.target.value}))} style={S.input}>
                {DEFAULT_CATEGORIES.map(c=><option key={c} value={c}>{categoryLabel(c)}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>시군구 (선택)</label>
              <input value={regionForm.district||''} onChange={e=>setRegionForm(p=>({...p,district:e.target.value}))} placeholder="예: 속초시·강릉시" style={S.input} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={S.label}>제철 월 *</label>
              <MonthPills value={regionForm.months||[]} onChange={v=>setRegionForm(p=>({...p,months:v}))} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <button type="button" onClick={onAddRegion} style={{ ...S.btn('#0ea5e9'), padding:'8px 18px' }}>+ 지역 추가</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 액션 버튼 ── */}
      <div style={{ display:'flex', gap:8 }}>
        <button type="button" onClick={onSubmit} disabled={saving} style={{ ...S.btn(), opacity:saving?.6:1 }}>{submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} style={S.btnGhost}>취소</button>}
      </div>
    </div>
  )
}

function IngredientTab({ adminToken, showToast, confirmDelete }) {
  const EMPTY_FORM   = { name:'', display_name:'', region_id:'', category:'fish', description:'', coupang_url:'', caution:'', is_special:false, is_limited:false, limited_days:'', is_global:false }
  const EMPTY_REGION = { region:'gangwon', district:'', months:[], label:'' }

  const [list, setList]         = useState([])
  const [healths, setHealths]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [searchQ, setSearchQ]   = useState('')
  const [catTab, setCatTab]     = useState('all')   // 'all' | 카테고리 id

  // 등록 폼
  const [form, setForm]                       = useState(EMPTY_FORM)
  const [formRegions, setFormRegions]         = useState([])
  const [formRegionForm, setFormRegionForm]   = useState(EMPTY_REGION)

  // 수정 모드
  const [editId, setEditId]                   = useState(null)
  const [editForm, setEditForm]               = useState({})
  const [editRegions, setEditRegions]         = useState([])
  const [editHealths, setEditHealths]         = useState([])
  const [editRegionForm, setEditRegionForm]   = useState(EMPTY_REGION)
  const [editLinkHealthId, setEditLinkHealthId] = useState('')

  // 클릭 → 하단 연결 패널
  const [selIng, setSelIng]           = useState(null)
  const [panelHealths, setPanelHealths] = useState([])
  const [panelRegions, setPanelRegions] = useState([])
  const [panelHealthId, setPanelHealthId] = useState('')
  const [panelRegionForm, setPanelRegionForm] = useState(EMPTY_REGION)
  const [panelSection, setPanelSection] = useState('health') // 'health' | 'region'

  // ── 데이터 로드 ──
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [i, h, ir] = await Promise.all([
        apiFetch(api('ingredients')),
        apiFetch(api('health_benefits')),
        apiFetch(api('ingredient_regions')),
      ])
      // 각 식재료에 regions_preview(조합명 배열) 붙이기
      const regMap = {}
      ;(ir||[]).forEach(r => {
        if (!regMap[r.ingredient_id]) regMap[r.ingredient_id] = []
        if (r.label) regMap[r.ingredient_id].push(r.label)
      })
      const enriched = (i||[]).map(ing => ({
        ...ing,
        regions_preview: regMap[ing.id] || [],
      }))
      setList(enriched); setHealths(h)
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

  useEffect(()=>{ loadAll() }, [])
  useEffect(()=>{
    if (selIng) loadPanelLinks(selIng.id)
    else { setPanelHealths([]); setPanelRegions([]) }
  }, [selIng])

  // ── 등록 ──
  const submit = async () => {
    if (!form.name.trim()) { showToast('⚠️ 이름 필수'); return }
    setSaving(true)
    try {
      const submitData = {
        ...form,
        name: form.display_name?.trim() || form.name.trim(), // 등록명 우선
      }
      const created = await apiFetch(api('ingredients'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify(submitData)
      })
      for (const r of formRegions) {
        await apiFetch(api('ingredient_regions'), {
          method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
          body:JSON.stringify({ ingredient_id: created.id, region:r.region, district:r.district, months:r.months, label:r.label||'' })
        }).catch(()=>{})
      }
      setForm(EMPTY_FORM); setFormRegions([]); setFormRegionForm(EMPTY_REGION)
      showToast('✅ 등록 완료'); loadAll()
    } catch(e) { showToast('❌ '+e.message) }
    setSaving(false)
  }

  // 지역 단축명 추출 (경기도→경기, 강원특별자치도→강원 등)
  const shortRegion = (regionId) => {
    const label = categoryLabel(regionId)
    return label.replace(/특별자치(도|시)|특별시|광역시|자치시|도$|시$/, '').replace(/[🏙🌊🍎🦀🌿🍢🐟🌾🏡🏔🍇🦪🍚🌊🍎🦐🍊]/u, '').trim()
  }
  const autoLabel = (ingName, regionId, district) => {
    const rShort = district ? district.replace(/(시|군|구)$/, '') : shortRegion(regionId)
    return ingName && rShort ? `${ingName}-${rShort}` : ''
  }

  const formAddRegion = () => {
    if (!formRegionForm.region || !formRegionForm.months.length) { showToast('⚠️ 지역·제철월 필수'); return }
    const label = formRegionForm.label || autoLabel(form.name, formRegionForm.region, formRegionForm.district)
    setFormRegions(prev => [...prev, { ...formRegionForm, label, _key: Date.now() }])
    setFormRegionForm(EMPTY_REGION)
  }

  // ── 수정 ──
  const save = async (id) => {
    try {
      const saveData = {
        ...editForm,
        name: editForm.display_name?.trim() || editForm.name?.trim(),
      }
      await apiFetch(`${api('ingredients')}&id=${id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify(saveData)
      })
      setEditId(null); showToast('✅ 저장됨'); loadAll()
    } catch(e) { showToast('❌ '+e.message) }
  }

  const editAddRegion = async () => {
    if (!editRegionForm.region || !editRegionForm.months.length) { showToast('⚠️ 지역·제철월 필수'); return }
    try {
      await apiFetch(api('ingredient_regions'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({
        ingredient_id: editId,
        region: editRegionForm.region,
        district: editRegionForm.district,
        months: editRegionForm.months,
        label: editRegionForm.label || autoLabel(editForm.name, editRegionForm.region, editRegionForm.district),
      })
      })
      setEditRegionForm(EMPTY_REGION); showToast('✅ 지역 추가됨'); loadEditLinks(editId)
    } catch(e) { showToast('❌ '+e.message) }
  }
  const editDelRegion = async (id) => {
    try {
      await apiFetch(`${api('ingredient_regions')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      showToast('🗑 삭제됨'); loadEditLinks(editId)
    } catch(e) { showToast('❌ '+e.message) }
  }
  const editLinkHealth = async () => {
    if (!editId || !editLinkHealthId) { showToast('⚠️ 효능을 선택하세요'); return }
    try {
      await apiFetch(api('ingredient_health'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ ingredient_id: editId, health_id: editLinkHealthId })
      })
      setEditLinkHealthId(''); showToast('✅ 효능 연결됨'); loadEditLinks(editId)
    } catch(e) { showToast('❌ '+e.message) }
  }
  const editUnlinkHealth = async (id) => {
    try {
      await apiFetch(`${api('ingredient_health')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      showToast('🗑 해제됨'); loadEditLinks(editId)
    } catch(e) { showToast('❌ '+e.message) }
  }

  // ── 하단 패널 액션 ──
  const panelLinkHealth = async () => {
    if (!selIng || !panelHealthId) { showToast('⚠️ 효능을 선택하세요'); return }
    try {
      await apiFetch(api('ingredient_health'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ ingredient_id: selIng.id, health_id: panelHealthId })
      })
      setPanelHealthId(''); showToast('✅ 효능 연결됨'); loadPanelLinks(selIng.id)
    } catch(e) { showToast('❌ '+e.message) }
  }
  const panelUnlinkHealth = async (id) => {
    try {
      await apiFetch(`${api('ingredient_health')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      showToast('🗑 해제됨'); loadPanelLinks(selIng.id)
    } catch(e) { showToast('❌ '+e.message) }
  }
  const panelAddRegion = async () => {
    if (!selIng || !panelRegionForm.region || !panelRegionForm.months.length) { showToast('⚠️ 지역·제철월 필수'); return }
    try {
      await apiFetch(api('ingredient_regions'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({
        ingredient_id: selIng.id,
        region: panelRegionForm.region,
        district: panelRegionForm.district,
        months: panelRegionForm.months,
        label: panelRegionForm.label || autoLabel(selIng.name, panelRegionForm.region, panelRegionForm.district),
      })
      })
      setPanelRegionForm(EMPTY_REGION); showToast('✅ 지역 추가됨'); loadPanelLinks(selIng.id)
    } catch(e) { showToast('❌ '+e.message) }
  }
  const panelDelRegion = async (id) => {
    try {
      await apiFetch(`${api('ingredient_regions')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      showToast('🗑 삭제됨'); loadPanelLinks(selIng.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  // ── 삭제 ──
  const del = (id, name) => {
    confirmDelete(name, async () => {
      try {
        await apiFetch(`${api('ingredients')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
        if (editId===id) setEditId(null)
        if (selIng?.id===id) setSelIng(null)
        setList(prev => prev.filter(i => i.id !== id))
        showToast('🗑 삭제됨')
      } catch(e) { showToast('❌ '+e.message) }
    })
  }

  const openEdit = (i) => {
    setSelIng(null)
    setEditId(i.id)
    setEditForm({ name:i.name, display_name:i.name, region_id:'', category:i.category, description:i.description||'', coupang_url:i.coupang_url||'', caution:i.caution||'', is_special:i.is_special||false, is_limited:i.is_limited||false, limited_days:i.limited_days||'', is_global:i.is_global||false })
    setEditRegionForm(EMPTY_REGION); setEditLinkHealthId('')
    loadEditLinks(i.id)
  }

  const cat = (id) => ING_CATEGORIES.find(c=>c.id===id)

  // 카테고리 탭 필터 → 검색어 필터
  const byTab  = catTab === 'all' ? list : list.filter(i => i.category === catTab)
  const filtered = searchQ ? byTab.filter(i => i.name.includes(searchQ)) : byTab

  // 탭별 개수
  const countOf = (cid) => cid === 'all' ? list.length : list.filter(i=>i.category===cid).length

  return (
    <div>
      {/* ── 등록 폼 ── */}
      <div style={S.card}>
        <div style={S.cardTitle}>🥕 식재료 등록</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <label style={S.label}>식재료명 *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="예: 감귤, 사과" style={S.input} />
          </div>
          <div>
            <label style={S.label}>지역</label>
            <select value={form.region_id||''} onChange={e=>setForm(f=>({...f,region_id:e.target.value}))} style={S.input}>
              <option value="">선택 안 함</option>
              {DEFAULT_CATEGORIES.map(c=><option key={c} value={c}>{categoryLabel(c)}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>📌 등록명 (식재료명-지역) *</label>
            <input
              value={form.display_name || (form.name && form.region_id ? `${form.name}-${categoryLabel(form.region_id).replace(/[🏙🌊🍎🦀🌿🍢🐟🌾🏡🏔🍇🦪🍚🍎🦐🍊]/u,'').replace(/(특별자치도|특별자치시|특별시|광역시|도|시)$/,'').trim()}` : form.name)}
              onChange={e=>setForm(f=>({...f,display_name:e.target.value}))}
              placeholder="예: 감귤-제주, 사과-경북"
              style={{ ...S.input, fontWeight:700, color:'#1d4ed8', fontSize:14 }}
            />
            <p style={{ fontSize:11, color:'#8aaa8a', marginTop:3 }}>💡 식재료명·지역 입력하면 자동완성 — 직접 수정도 가능합니다</p>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>카테고리</label>
            {ING_GROUPS.map(group => (
              <div key={group} style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:5, alignItems:'center' }}>
                <span style={{ fontSize:11, color:'#8aaa8a', minWidth:60, fontWeight:600 }}>{group}</span>
                {ING_CATEGORIES.filter(c=>c.group===group).map(c=>(
                  <button key={c.id} type="button" onClick={()=>setForm(f=>({...f,category:c.id}))}
                    style={{ padding:'3px 9px', borderRadius:20, border:`1.5px solid ${form.category===c.id?'#a855f7':'#d1e8d1'}`,
                      background:form.category===c.id?'#f5f0ff':'#f5f9f5', color:form.category===c.id?'#a855f7':'#4b6e4b',
                      fontSize:11, fontWeight:form.category===c.id?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>설명 (건강효능 요약)</label>
            <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="간단 설명" style={S.input} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>🛒 쿠팡 파트너스 URL (5단계 — 상품 연결)</label>
            <input value={form.coupang_url||''} onChange={e=>setForm(f=>({...f,coupang_url:e.target.value}))} placeholder="예: https://coupa.ng/xxxxx" style={S.input} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>⚠️ 주의사항 (알레르기·특정질환·섭취제한 등)</label>
            <input value={form.caution||''} onChange={e=>setForm(f=>({...f,caution:e.target.value}))}
              placeholder="예: 견과류 알레르기 주의 / 통풍 환자 퓨린 함량 높음 / 임산부 과다섭취 주의"
              style={S.input} list="caution-presets" />
            <p style={{ fontSize:11, color:'#8aaa8a', marginTop:3 }}>💡 입력창 클릭하면 자주 쓰는 주의문구 나와요</p>
          </div>

          {/* 특산품 / 기간한정 */}
          <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:10 }}>
            {/* 특산품 */}
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
              <div
                onClick={() => setForm(f => ({ ...f, is_special: !f.is_special }))}
                style={{
                  width:40, height:22, borderRadius:11, cursor:'pointer', transition:'background 0.2s',
                  background: form.is_special ? '#f59e0b' : '#d1e8d1',
                  position:'relative', flexShrink:0,
                }}>
                <div style={{
                  position:'absolute', top:3, left: form.is_special ? 20 : 3,
                  width:16, height:16, borderRadius:8, background:'#fff', transition:'left 0.2s',
                  boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              <span style={{ fontSize:13, fontWeight:700, color: form.is_special ? '#f59e0b' : '#4b6e4b' }}>
                🏆 특산품
              </span>
              <span style={{ fontSize:11, color:'#8aaa8a' }}>해당 지역을 대표하는 특산물</span>
            </label>

            {/* 기간한정 */}
            <div>
              <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none', marginBottom: form.is_limited ? 8 : 0 }}>
                <div
                  onClick={() => setForm(f => ({ ...f, is_limited: !f.is_limited, limited_days: '' }))}
                  style={{
                    width:40, height:22, borderRadius:11, cursor:'pointer', transition:'background 0.2s',
                    background: form.is_limited ? '#10b981' : '#d1e8d1',
                    position:'relative', flexShrink:0,
                  }}>
                  <div style={{
                    position:'absolute', top:3, left: form.is_limited ? 20 : 3,
                    width:16, height:16, borderRadius:8, background:'#fff', transition:'left 0.2s',
                    boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
                <span style={{ fontSize:13, fontWeight:700, color: form.is_limited ? '#10b981' : '#4b6e4b' }}>
                  ⏰ 기간한정
                </span>
                <span style={{ fontSize:11, color:'#8aaa8a' }}>특정 기간에만 출하되는 식재료</span>
              </label>
              {form.is_limited && (
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginLeft:50 }}>
                  {LIMITED_PRESETS.map(p => (
                    <button key={p.value} type="button"
                      onClick={() => setForm(f => ({ ...f, limited_days: p.value }))}
                      style={{ padding:'4px 12px', borderRadius:20, border:'1.5px solid #10b981',
                        background: form.limited_days === p.value ? '#10b981' : '#d1fae5',
                        color: form.limited_days === p.value ? '#fff' : '#059669',
                        fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 해외 식재료 */}
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
              <div
                onClick={() => setForm(f => ({ ...f, is_global: !f.is_global }))}
                style={{
                  width:40, height:22, borderRadius:11, cursor:'pointer', transition:'background 0.2s',
                  background: form.is_global ? '#3b82f6' : '#d1e8d1',
                  position:'relative', flexShrink:0,
                }}>
                <div style={{
                  position:'absolute', top:3, left: form.is_global ? 20 : 3,
                  width:16, height:16, borderRadius:8, background:'#fff', transition:'left 0.2s',
                  boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              <span style={{ fontSize:13, fontWeight:700, color: form.is_global ? '#3b82f6' : '#4b6e4b' }}>
                🌍 해외 식재료
              </span>
              <span style={{ fontSize:11, color:'#8aaa8a' }}>국내 미생산 글로벌 슈퍼푸드 등</span>
            </label>

          </div>
        </div>

        {/* 등록 폼 내 지역·제철월 미리 추가 */}
        <div style={{ marginBottom:12, background:'#eff6ff', borderRadius:10, padding:12, border:'1px solid #bfdbfe' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#1d4ed8', marginBottom:8 }}>🗺 지역·제철월 (선택 — 등록과 동시에 저장)</div>
          {formRegions.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:10 }}>
              {formRegions.map(r=>(
                <div key={r._key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                  background:'#fff', borderRadius:7, padding:'6px 10px', fontSize:12, border:'1px solid #bfdbfe' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    {r.label && <div style={{ fontWeight:800, color:'#1d4ed8', fontSize:13, marginBottom:2 }}>{r.label}</div>}
                    <span style={{ color:'#1e40af', fontWeight:600 }}>📍 {categoryLabel(r.region)}{r.district?` · ${r.district}`:''}</span>
                    <span style={{ color:'#2563eb', fontWeight:700, marginLeft:8 }}>{(r.months||[]).join('·')}월</span>
                  </div>
                  <button type="button" onClick={()=>setFormRegions(prev=>prev.filter(x=>x._key!==r._key))}
                    style={{ padding:'1px 7px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif", flexShrink:0, marginLeft:8 }}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div>
              <label style={S.label}>시도</label>
              <select value={formRegionForm.region} onChange={e=>setFormRegionForm(f=>({...f,region:e.target.value}))} style={S.input}>
                {DEFAULT_CATEGORIES.map(c=><option key={c} value={c}>{categoryLabel(c)}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>시군구 (선택)</label>
              <input value={formRegionForm.district||''} onChange={e=>setFormRegionForm(f=>({...f,district:e.target.value}))} placeholder="예: 속초시" style={S.input} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={S.label}>제철 월</label>
              <MonthPills value={formRegionForm.months||[]} onChange={v=>setFormRegionForm(f=>({...f,months:v}))} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={S.label}>📌 조합명 (식재료명-지역) — 자동완성, 수정 가능</label>
              <input
                value={formRegionForm.label || autoLabel(form.name, formRegionForm.region, formRegionForm.district)}
                onChange={e=>setFormRegionForm(f=>({...f,label:e.target.value}))}
                placeholder={autoLabel(form.name, formRegionForm.region, formRegionForm.district) || '예: 감귤-제주'}
                style={{ ...S.input, fontWeight:700, color:'#1d4ed8' }}
              />
              <p style={{ fontSize:11, color:'#8aaa8a', marginTop:3 }}>💡 식재료명·지역 선택하면 자동으로 채워져요. 직접 수정도 가능합니다.</p>
            </div>
          </div>
          <button type="button" onClick={formAddRegion} style={{ ...S.btn('#0ea5e9'), marginTop:8, padding:'6px 16px' }}>+ 지역 추가</button>
        </div>

        <button onClick={submit} disabled={saving} style={{ ...S.btn(), opacity:saving?.6:1 }}>{saving?'등록 중...':'+ 등록'}</button>
      </div>

      {/* ── 목록 ── */}
      <div style={S.card}>
        {/* 헤더: 타이틀 + 검색 */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, flexWrap:'wrap', gap:8 }}>
          <div style={S.cardTitle}>📋 식재료 목록 ({filtered.length}) — 클릭하면 효능·지역 연결</div>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 검색" style={{ ...S.input, width:160 }} />
        </div>

        {/* 카테고리 탭 */}
        <div style={{ marginBottom:14, borderBottom:'1px solid #d1e8d1', paddingBottom:10 }}>
          {/* 전체 버튼 */}
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:8 }}>
            {[{ id:'all', emoji:'🌿', label:'전체' }].map(c=>{
              const on = catTab === c.id
              return (
                <button key={c.id} onClick={()=>{ setCatTab(c.id); setSelIng(null) }}
                  style={{ padding:'5px 12px', borderRadius:20, border:`1.5px solid ${on?'#a855f7':'#d1e8d1'}`,
                    background:on?'#f5f0ff':'#f5f9f5', color:on?'#7c3aed':'#4b6e4b',
                    fontSize:12, fontWeight:on?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif", whiteSpace:'nowrap' }}>
                  {c.emoji} {c.label}
                  <span style={{ marginLeft:4, fontSize:11, opacity:.7 }}>({countOf(c.id)})</span>
                </button>
              )
            })}
          </div>
          {/* 그룹별 카테고리 */}
          {ING_GROUPS.map(group => (
            <div key={group} style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:6, alignItems:'center' }}>
              <span style={{ fontSize:11, color:'#8aaa8a', minWidth:60, fontWeight:600 }}>{group}</span>
              {ING_CATEGORIES.filter(c=>c.group===group).map(c=>{
                const on = catTab === c.id
                return (
                  <button key={c.id} onClick={()=>{ setCatTab(c.id); setSelIng(null) }}
                    style={{ padding:'4px 10px', borderRadius:20, border:`1.5px solid ${on?'#a855f7':'#d1e8d1'}`,
                      background:on?'#f5f0ff':'#f5f9f5', color:on?'#7c3aed':'#4b6e4b',
                      fontSize:11, fontWeight:on?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif", whiteSpace:'nowrap' }}>
                    {c.emoji} {c.label}
                    <span style={{ marginLeft:3, fontSize:10, opacity:.7 }}>({countOf(c.id)})</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {loading ? <p style={{ color:'#8aaa8a', textAlign:'center', padding:30 }}>불러오는 중...</p> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:6, marginBottom: selIng?20:0 }}>
            {filtered.map(i => {
              const ct  = cat(i.category)
              const on  = selIng?.id === i.id

              // ── 수정 모드 ──
              if (editId === i.id) return (
                <div key={i.id} style={{ ...S.row, border:'1.5px solid #a855f7', gridColumn:'1/-1' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, paddingBottom:12, borderBottom:'1px solid #e9d5ff' }}>
                    <div style={{ fontSize:18 }}>✏️</div>
                    <div>
                      <div style={{ fontSize:11, color:'#a855f7', fontWeight:700, letterSpacing:1 }}>수정 중</div>
                      <div style={{ fontSize:15, fontWeight:900, color:'#0f1f0f' }}>{ct?.emoji} {i.name}</div>
                    </div>
                  </div>
                  <IngForm
                    f={editForm} setF={setEditForm}
                    healths={{ all: healths, linked: editHealths }}
                    regions={editRegions}
                    regionForm={editRegionForm} setRegionForm={setEditRegionForm}
                    linkHealthId={editLinkHealthId} setLinkHealthId={setEditLinkHealthId}
                    onAddRegion={editAddRegion}
                    onDelRegion={editDelRegion}
                    onLinkHealth={editLinkHealth}
                    onUnlinkHealth={editUnlinkHealth}
                    submitLabel="저장"
                    onSubmit={()=>save(i.id)}
                    onCancel={()=>setEditId(null)}
                    saving={false}
                  />
                </div>
              )

              // ── 보기 모드 ──
              return (
                <div key={i.id} onClick={()=>{ if(editId) return; setSelIng(on?null:i) }}
                  style={{ ...S.row, cursor:'pointer', border:`1.5px solid ${on?'#a855f7':'#d1e8d1'}`, background:on?'#f5f0ff':'#f5f9f5' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                        <div style={{ fontWeight:700, color:'#0f1f0f', fontSize:13 }}>{ct?.emoji} {i.name}</div>
                        {i.is_special && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#fef3c7', border:'1px solid #f59e0b', color:'#b45309', fontWeight:700 }}>🏆 특산품</span>}
                        {i.is_limited && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#d1fae5', border:'1px solid #10b981', color:'#059669', fontWeight:700 }}>⏰ {i.limited_days || '기간한정'}</span>}
                        {i.is_global && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'#dbeafe', border:'1px solid #3b82f6', color:'#1d4ed8', fontWeight:700 }}>🌍 해외</span>}
                      </div>
                      {i.regions_preview && (
                        <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginTop:2 }}>
                          {i.regions_preview.map((lbl,idx)=>(
                            <span key={idx} style={{ fontSize:11, padding:'1px 7px', borderRadius:12,
                              background:'#dbeafe', border:'1px solid #93c5fd', color:'#1d4ed8', fontWeight:700 }}>{lbl}</span>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize:11, color:'#4b6e4b' }}>{ct?.label}</div>
                      {i.description && <div style={{ fontSize:11, color:'#8aaa8a', marginTop:2 }}>{i.description.slice(0,40)}{i.description.length>40?'…':''}</div>}
                      {i.caution && (
                        <div style={{ fontSize:10, marginTop:3, padding:'2px 6px', background:'#fef2f2', borderRadius:4, border:'1px solid #fca5a5', lineHeight:1.4 }}>
                          <span style={{ color:'#dc2626', fontWeight:700 }}>⚠️ </span>
                          <span style={{ color:'#dc2626' }}>{i.caution.slice(0,40)}{i.caution.length>40?'…':''}</span>
                        </div>
                      )}
                      {i.coupang_url && <div style={{ fontSize:10, color:'#ea580c', marginTop:2 }}>🛒 쿠팡 링크 있음</div>}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:3, flexShrink:0, marginLeft:6 }}>
                      <button onClick={e=>{ e.stopPropagation(); openEdit(i) }}
                        style={{ padding:'2px 8px', borderRadius:5, border:'1px solid #d1e8d1', background:'#f5f9f5', color:'#4b6e4b', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>✏️</button>
                      <button onClick={e=>{ e.stopPropagation(); del(i.id, i.name) }}
                        style={{ padding:'2px 7px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── 클릭 → 하단 연결 패널 ── */}
        {selIng && (
          <div style={{ marginTop:20 }}>
            {/* 패널 헤더 */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#0f1f0f' }}>
                {cat(selIng.category)?.emoji} {selIng.name} 연결 관리
              </div>
              <button onClick={()=>setSelIng(null)}
                style={{ padding:'3px 10px', borderRadius:6, border:'1px solid #d1e8d1', background:'#f5f9f5', color:'#4b6e4b', fontSize:12, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>✕ 닫기</button>
            </div>

            {/* 패널 탭 */}
            <div style={{ display:'flex', borderBottom:'1px solid #d1e8d1', marginBottom:14 }}>
              {[{ id:'health', label:`💊 건강효능 (${panelHealths.length})` }, { id:'region', label:`🗺 지역·제철월 (${panelRegions.length})` }].map(t=>(
                <button key={t.id} onClick={()=>setPanelSection(t.id)}
                  style={{ padding:'10px 16px', border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:700,
                    background:'transparent', color: panelSection===t.id?'#a855f7':'#888',
                    borderBottom: panelSection===t.id?'2.5px solid #a855f7':'2.5px solid transparent' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* 건강효능 탭 */}
            {panelSection==='health' && (
              <SectionCard title={`💊 "${selIng.name}" 건강효능 연결`}>
                <TagRow
                  items={panelHealths.map(ih=>({ label:ih.health_benefits?.name, id:ih.id }))}
                  onRemove={(idx)=>panelUnlinkHealth(panelHealths[idx].id)}
                  color="#22c55e"
                />
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, marginTop:10, alignItems:'flex-end' }}>
                  <SearchSelect
                    label="효능 선택/검색"
                    items={healths}
                    value={panelHealthId}
                    onChange={setPanelHealthId}
                    placeholder="효능 검색..."
                  />
                  <button onClick={panelLinkHealth} style={{ ...S.btn('#22c55e'), padding:'10px 14px' }}>연결</button>
                </div>
              </SectionCard>
            )}

            {/* 지역·제철월 탭 */}
            {panelSection==='region' && (
              <SectionCard title={`🗺 "${selIng.name}" 지역·제철 연결`}>
                {panelRegions.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                    {panelRegions.map(r=>(
                      <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                        background:'#f5f9f5', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
                        <span style={{ color:'#0f1f0f' }}>📍 {categoryLabel(r.region)}{r.district?` · ${r.district}`:''}</span>
                        <span style={{ color:'#4b6e4b', fontWeight:700 }}>{(r.months||[]).join('·')}월</span>
                        <button onClick={()=>panelDelRegion(r.id)}
                          style={{ padding:'2px 7px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <label style={S.label}>시도</label>
                    <select value={panelRegionForm.region} onChange={e=>setPanelRegionForm(f=>({...f,region:e.target.value}))} style={S.input}>
                      {DEFAULT_CATEGORIES.map(c=><option key={c} value={c}>{categoryLabel(c)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>시군구 (선택)</label>
                    <input value={panelRegionForm.district||''} onChange={e=>setPanelRegionForm(f=>({...f,district:e.target.value}))} placeholder="예: 속초시·강릉시" style={S.input} />
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={S.label}>제철 월</label>
                    <MonthPills value={panelRegionForm.months||[]} onChange={v=>setPanelRegionForm(f=>({...f,months:v}))} />
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={S.label}>📌 조합명 (식재료명-지역)</label>
                    <input
                      value={panelRegionForm.label || autoLabel(selIng?.name||'', panelRegionForm.region, panelRegionForm.district)}
                      onChange={e=>setPanelRegionForm(f=>({...f,label:e.target.value}))}
                      placeholder={autoLabel(selIng?.name||'', panelRegionForm.region, panelRegionForm.district) || '예: 감귤-제주'}
                      style={{ ...S.input, fontWeight:700, color:'#1d4ed8' }}
                    />
                  </div>
                </div>
                <button onClick={panelAddRegion} style={{ ...S.btn('#0ea5e9'), marginTop:12 }}>+ 지역 추가</button>
              </SectionCard>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════
// 서브탭 5 : 요리 관리
// ══════════════════════════════════════════════════════════
function DishTab({ adminToken, showToast, confirmDelete }) {
  const [dishes, setDishes]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [searchQ, setSearchQ]   = useState('')
  const [catFilter, setCatFilter] = useState('전체')
  const [form, setForm]         = useState({ name:'', category:'한식', description:'', coupang_url:'', caution:'' })
  const [editId, setEditId]     = useState(null)
  const [editForm, setEditForm] = useState({})

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const d = await apiFetch(api('dishes'))
      setDishes(d)
    } catch(e) { showToast('❌ '+e.message) }
    setLoading(false)
  }, [])

  useEffect(()=>{ loadAll() }, [])

  const submit = async () => {
    if (!form.name.trim()) { showToast('⚠️ 요리명 필수'); return }
    setSaving(true)
    try {
      await apiFetch(api('dishes'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify(form)
      })
      setForm({ name:'', category:form.category, description:'', coupang_url:'', caution:'' })
      showToast('✅ 등록 완료'); loadAll()
    } catch(e) { showToast('❌ '+e.message) }
    setSaving(false)
  }

  const save = async (id) => {
    try {
      await apiFetch(`${api('dishes')}&id=${id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify(editForm)
      })
      setEditId(null); showToast('✅ 저장됨'); loadAll()
    } catch(e) { showToast('❌ '+e.message) }
  }

  const del = (id, name) => {
    confirmDelete(name, async () => {
      try {
        await apiFetch(`${api('dishes')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
        setDishes(prev => prev.filter(d => d.id !== id))
        showToast('🗑 삭제됨')
      } catch(e) { showToast('❌ '+e.message) }
    })
  }


  const CATS = ['전체', ...DISH_CATEGORIES]
  const byTab = catFilter === '전체' ? dishes : dishes.filter(d => d.category === catFilter)
  const filtered = searchQ ? byTab.filter(d => d.name.includes(searchQ)) : byTab

  return (
    <div>
      {/* ── 등록 폼 ── */}
      <div style={S.card}>
        <div style={S.cardTitle}>🍽 요리/음식 등록</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <label style={S.label}>요리명 *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
              placeholder="예: 된장찌개, 까르보나라"
              style={S.input}
              onKeyDown={e=>{ if(e.key==='Enter') submit() }}
            />
          </div>
          <div>
            <label style={S.label}>종류 *</label>
            <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={S.input}>
              {DISH_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>설명</label>
            <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="간단 설명" style={S.input} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>🛒 쿠팡 파트너스 URL (밀키트·상품 연결)</label>
            <input value={form.coupang_url||''} onChange={e=>setForm(f=>({...f,coupang_url:e.target.value}))} placeholder="예: https://coupa.ng/xxxxx" style={S.input} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>⚠️ 주의사항</label>
            <input value={form.caution||''} onChange={e=>setForm(f=>({...f,caution:e.target.value}))}
              placeholder="예: 갑각류 알레르기 주의" style={S.input} list="caution-presets" />
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={submit} disabled={saving} style={{ ...S.btn(), opacity:saving?.6:1 }}>+ 등록</button>

        </div>
      </div>

      {/* ── 목록 ── */}
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, flexWrap:'wrap', gap:8 }}>
          <div style={S.cardTitle}>📋 요리 목록 ({filtered.length})</div>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 검색" style={{ ...S.input, width:160 }} />
        </div>

        {/* 종류 탭 */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:14, borderBottom:'1px solid #d1e8d1', paddingBottom:10 }}>
          {CATS.map(c=>{
            const on = catFilter === c
            const cnt = c === '전체' ? dishes.length : dishes.filter(d=>d.category===c).length
            return (
              <button key={c} onClick={()=>setCatFilter(c)}
                style={{ padding:'5px 12px', borderRadius:20,
                  border: on ? `1.5px solid ${DISH_COLORS[c]||'#888'}` : '1.5px solid #d1e8d1',
                  background: on ? (DISH_COLORS[c]||'#888')+'22' : '#f5f9f5',
                  color: on ? (DISH_COLORS[c]||'#888') : '#4b6e4b',
                  fontSize:12, fontWeight:on?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif", whiteSpace:'nowrap' }}>
                {c} <span style={{ opacity:.7, fontSize:11 }}>({cnt})</span>
              </button>
            )
          })}
        </div>

        {loading ? <p style={{ color:'#8aaa8a', textAlign:'center', padding:30 }}>불러오는 중...</p> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:6 }}>
            {filtered.map(d => {
              if (editId === d.id) return (
                <div key={d.id} style={{ ...S.row, border:'1.5px solid #f97316', gridColumn:'1/-1' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                    <div>
                      <label style={S.label}>요리명 *</label>
                      <input value={editForm.name||''} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>종류</label>
                      <select value={editForm.category||''} onChange={e=>setEditForm(f=>({...f,category:e.target.value}))} style={S.input}>
                        {DISH_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={S.label}>설명</label>
                      <input value={editForm.description||''} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))} style={S.input} />
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={S.label}>🛒 쿠팡 URL</label>
                      <input value={editForm.coupang_url||''} onChange={e=>setEditForm(f=>({...f,coupang_url:e.target.value}))} style={S.input} />
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={S.label}>⚠️ 주의사항</label>
                      <input value={editForm.caution||''} onChange={e=>setEditForm(f=>({...f,caution:e.target.value}))} style={S.input} list="caution-presets" />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={()=>save(d.id)} style={S.btn()}>저장</button>
                    <button onClick={()=>setEditId(null)} style={S.btnGhost}>취소</button>
                  </div>
                </div>
              )
              return (
                <div key={d.id} style={{ ...S.row, background:'#f5f9f5', border:'1px solid #d1e8d1' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, color:'#0f1f0f', fontSize:13 }}>🍽 {d.name}</div>
                      {d.category && (() => {
                        const color = DISH_COLORS[d.category] || '#6b7280'
                        return (
                          <span style={{ fontSize:10, padding:'1px 7px', borderRadius:10,
                            background: color+'22', border:`1px solid ${color}66`,
                            color, fontWeight:700, marginTop:3, display:'inline-block' }}>
                            {d.category}
                          </span>
                        )
                      })()}
                      {d.description && <div style={{ fontSize:11, color:'#8aaa8a', marginTop:3 }}>{d.description}</div>}
                      {d.caution && (
                        <div style={{ fontSize:10, marginTop:3, padding:'2px 6px', background:'#fef2f2', borderRadius:4, border:'1px solid #fca5a5' }}>
                          <span style={{ color:'#dc2626', fontWeight:700 }}>⚠️ </span>
                          <span style={{ color:'#dc2626' }}>{d.caution.slice(0,30)}{d.caution.length>30?'…':''}</span>
                        </div>
                      )}
                      {d.coupang_url && <div style={{ fontSize:10, color:'#ea580c', marginTop:2 }}>🛒 쿠팡 링크 있음</div>}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:3, flexShrink:0, marginLeft:6 }}>
                      <button onClick={()=>{ setEditId(d.id); setEditForm({name:d.name,category:d.category||'한식',description:d.description||'',coupang_url:d.coupang_url||'',caution:d.caution||''}) }}
                        style={{ padding:'2px 7px', borderRadius:5, border:'1px solid #d1e8d1', background:'#f5f9f5', color:'#4b6e4b', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>✏️</button>
                      <button onClick={()=>del(d.id, d.name)}
                        style={{ padding:'2px 7px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// 서브탭 5 : 레시피 관리 (개편)
// ══════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════
// 서브탭 : 조리기구 관리
// ══════════════════════════════════════════════════════════
function UtensilTab({ adminToken, showToast, confirmDelete }) {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({ name:'', category:'', description:'', coupang_url:'', cuisine:'', usage:'' })
  const [editId, setEditId]   = useState(null)
  const [editForm, setEditForm] = useState({})
  const [searchQ, setSearchQ] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterCuisine, setFilterCuisine] = useState('')
  const [filterUsage, setFilterUsage] = useState('')

  const UTENSIL_CUISINES = ['한식','양식','중식','일식','분식·간식','베이킹','공통']
  const UTENSIL_USAGES   = ['가정용','영업용','캠핑·아웃도어','공통']

  const CUISINE_COLORS = {
    '한식':      { bg:'#fff1f2', border:'#fda4af', color:'#be123c' },
    '양식':      { bg:'#eff6ff', border:'#93c5fd', color:'#1d4ed8' },
    '중식':      { bg:'#fff7ed', border:'#fdba74', color:'#c2410c' },
    '일식':      { bg:'#fdf4ff', border:'#d8b4fe', color:'#7e22ce' },
    '분식·간식': { bg:'#fefce8', border:'#fde047', color:'#854d0e' },
    '베이킹':    { bg:'#fdf2f8', border:'#f0abfc', color:'#86198f' },
    '공통':      { bg:'#f9fafb', border:'#d1d5db', color:'#374151' },
  }
  const USAGE_COLORS = {
    '가정용':        { bg:'#f0fdf4', border:'#86efac', color:'#166534' },
    '영업용':        { bg:'#eff6ff', border:'#93c5fd', color:'#1e40af' },
    '캠핑·아웃도어': { bg:'#fefce8', border:'#fcd34d', color:'#92400e' },
    '공통':          { bg:'#f9fafb', border:'#d1d5db', color:'#374151' },
  }

  const UTENSIL_CAT_COLORS = {
    '냄비·팬':        { bg:'#fff7ed', border:'#fdba74', color:'#c2410c' },
    '프라이팬·웍':    { bg:'#fef3c7', border:'#fcd34d', color:'#92400e' },
    '칼·도마':        { bg:'#ecfdf5', border:'#6ee7b7', color:'#065f46' },
    '계량·혼합':      { bg:'#eff6ff', border:'#93c5fd', color:'#1d4ed8' },
    '찜·구이·오븐':   { bg:'#fdf4ff', border:'#d8b4fe', color:'#7e22ce' },
    '에어프라이어':   { bg:'#fff1f2', border:'#fda4af', color:'#be123c' },
    '전기가전':       { bg:'#f0f9ff', border:'#7dd3fc', color:'#0369a1' },
    '그릇·플레이팅':  { bg:'#f5f3ff', border:'#c4b5fd', color:'#5b21b6' },
    '보관·밀폐':      { bg:'#f0fdf4', border:'#86efac', color:'#166534' },
    '청소·관리':      { bg:'#fafafa', border:'#e5e7eb', color:'#374151' },
    '기타':           { bg:'#f9fafb', border:'#d1d5db', color:'#6b7280' },
  }

  const UTENSIL_CATS = [
    '냄비·팬','프라이팬·웍','칼·도마','계량·혼합',
    '찜·구이·오븐','에어프라이어','전기가전',
    '그릇·플레이팅','보관·밀폐','청소·관리','기타'
  ]

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch(api('utensils'))
      setList(data || [])
    } catch(e) { showToast('❌ '+e.message) }
    setLoading(false)
  }, [])
  useEffect(()=>{ load() }, [])

  const submit = async () => {
    if (!form.name.trim()) { showToast('⚠️ 이름 필수'); return }
    setSaving(true)
    try {
      await apiFetch(api('utensils'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify(form)
      })
      setForm({ name:'', category:'', description:'', coupang_url:'' })
      showToast('✅ 등록 완료'); load()
    } catch(e) { showToast('❌ '+e.message) }
    setSaving(false)
  }

  const save = async (id) => {
    try {
      await apiFetch(`${api('utensils')}&id=${id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify(editForm)
      })
      setEditId(null); showToast('✅ 저장됨'); load()
    } catch(e) { showToast('❌ '+e.message) }
  }

  const del = (id, name) => {
    confirmDelete(name, async () => {
      try {
        await apiFetch(`${api('utensils')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
        setList(prev => prev.filter(u => u.id !== id))
        showToast('🗑 삭제됨')
      } catch(e) { showToast('❌ '+e.message) }
    })
  }

  const filtered = list.filter(u =>
    (!searchQ || u.name.includes(searchQ) || (u.category||'').includes(searchQ)) &&
    (!filterCat     || u.category === filterCat) &&
    (!filterCuisine || u.cuisine  === filterCuisine) &&
    (!filterUsage   || u.usage    === filterUsage)
  )

  return (
    <div>
      {/* 등록 폼 */}
      <div style={S.card}>
        <div style={S.cardTitle}>🔧 조리기구 등록</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <label style={S.label}>기구명 *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
              placeholder="예: 프라이팬, 믹싱볼, 계량컵" style={S.input}
              onKeyDown={e=>{ if(e.key==='Enter') submit() }} />
          </div>
          <div>
            <label style={S.label}>카테고리</label>
            <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={S.input}>
              <option value="">선택</option>
              {UTENSIL_CATS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>용도</label>
            <select value={form.usage} onChange={e=>setForm(f=>({...f,usage:e.target.value}))} style={S.input}>
              <option value="">선택</option>
              {UTENSIL_USAGES.map(u=><option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>요리 종류</label>
            <select value={form.cuisine} onChange={e=>setForm(f=>({...f,cuisine:e.target.value}))} style={S.input}>
              <option value="">선택</option>
              {UTENSIL_CUISINES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>설명</label>
            <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
              placeholder="간단 설명" style={S.input} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>🛒 쿠팡 파트너스 URL</label>
            <input value={form.coupang_url||''} onChange={e=>setForm(f=>({...f,coupang_url:e.target.value}))}
              placeholder="예: https://coupa.ng/xxxxx" style={S.input} />
          </div>
        </div>
        <button onClick={submit} disabled={saving} style={{ ...S.btn(), opacity:saving?.6:1 }}>+ 등록</button>
      </div>

      {/* 목록 */}
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, flexWrap:'wrap', gap:8 }}>
          <div style={S.cardTitle}>📋 조리기구 목록 ({filtered.length})</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
            <select value={filterUsage} onChange={e=>setFilterUsage(e.target.value)} style={{ ...S.input, width:100 }}>
              <option value="">전체 용도</option>
              {UTENSIL_USAGES.map(u=><option key={u} value={u}>{u}</option>)}
            </select>
            <select value={filterCuisine} onChange={e=>setFilterCuisine(e.target.value)} style={{ ...S.input, width:110 }}>
              <option value="">전체 요리종류</option>
              {UTENSIL_CUISINES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{ ...S.input, width:120 }}>
              <option value="">전체 카테고리</option>
              {UTENSIL_CATS.flat().map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 이름 검색" style={{ ...S.input, width:120 }} />
          </div>
        </div>
        {loading ? <p style={{ color:'#8aaa8a', textAlign:'center', padding:30 }}>불러오는 중...</p> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:8 }}>
            {filtered.map(u => editId===u.id ? (
              <div key={u.id} style={{ ...S.row, border:'1.5px solid #22c55e' }}>
                <input value={editForm.name||''} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} placeholder="기구명" style={{ ...S.input, marginBottom:6 }} />
                <select value={editForm.category||''} onChange={e=>setEditForm(f=>({...f,category:e.target.value}))} style={{ ...S.input, marginBottom:6 }}>
                  <option value="">카테고리</option>
                  {UTENSIL_CATS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <select value={editForm.usage||''} onChange={e=>setEditForm(f=>({...f,usage:e.target.value}))} style={{ ...S.input, marginBottom:6 }}>
                  <option value="">용도</option>
                  {UTENSIL_USAGES.map(u=><option key={u} value={u}>{u}</option>)}
                </select>
                <select value={editForm.cuisine||''} onChange={e=>setEditForm(f=>({...f,cuisine:e.target.value}))} style={{ ...S.input, marginBottom:6 }}>
                  <option value="">요리종류</option>
                  {UTENSIL_CUISINES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <input value={editForm.description||''} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))} placeholder="설명" style={{ ...S.input, marginBottom:6 }} />
                <input value={editForm.coupang_url||''} onChange={e=>setEditForm(f=>({...f,coupang_url:e.target.value}))} placeholder="쿠팡 URL" style={{ ...S.input, marginBottom:8 }} />
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>save(u.id)} style={S.btn()}>저장</button>
                  <button onClick={()=>setEditId(null)} style={S.btnGhost}>취소</button>
                </div>
              </div>
            ) : (
              <div key={u.id} style={{ ...S.row, background:'#f5f9f5', border:'1px solid #d1e8d1' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, color:'#0f1f0f', fontSize:13, marginBottom:4 }}>🔧 {u.name}</div>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:5 }}>
                      {u.category && (() => {
                        const cc = UTENSIL_CAT_COLORS[u.category] || UTENSIL_CAT_COLORS['기타']
                        return <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:cc.bg, border:`1px solid ${cc.border}`, color:cc.color, fontWeight:700 }}>{u.category}</span>
                      })()}
                      {u.cuisine && (() => {
                        const cc = CUISINE_COLORS[u.cuisine] || CUISINE_COLORS['공통']
                        return <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:cc.bg, border:`1px solid ${cc.border}`, color:cc.color, fontWeight:700 }}>{u.cuisine}</span>
                      })()}
                      {u.usage && (() => {
                        const cc = USAGE_COLORS[u.usage] || USAGE_COLORS['공통']
                        return <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:cc.bg, border:`1px solid ${cc.border}`, color:cc.color, fontWeight:700 }}>{u.usage}</span>
                      })()}
                    </div>
                    {u.description && <div style={{ fontSize:11, color:'#6b7280', marginBottom:5, lineHeight:1.4 }}>{u.description}</div>}
                    {u.coupang_url && (
                      <a href={u.coupang_url} target="_blank" rel="noopener noreferrer"
                        style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700,
                          color:'#fff', background:'linear-gradient(135deg,#ea580c,#f97316)',
                          padding:'4px 10px', borderRadius:6, textDecoration:'none', marginTop:2 }}>
                        🛒 쿠팡에서 구매
                      </a>
                    )}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:4, flexShrink:0, marginLeft:8 }}>
                    <button onClick={()=>{ setEditId(u.id); setEditForm({name:u.name,category:u.category||'',cuisine:u.cuisine||'',usage:u.usage||'',description:u.description||'',coupang_url:u.coupang_url||''}) }}
                      style={{ padding:'3px 8px', borderRadius:5, border:'1px solid #d1e8d1', background:'#f5f9f5', color:'#4b6e4b', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>✏️</button>
                    <button onClick={()=>del(u.id, u.name)}
                      style={{ padding:'3px 8px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RecipeTab({ adminToken, showToast, confirmDelete }) {
  const EMPTY_FORM = { title:'', dish_id:'', show_id:'', chef_id:'', episode:'', aired_at:'', summary:'', source_url:'' }

  const [recipes, setRecipes]     = useState([])
  const [shows, setShows]         = useState([])
  const [chefs, setChefs]         = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [searchQ, setSearchQ]     = useState('')
  const [form, setForm]           = useState(EMPTY_FORM)

  // 선택된 레시피 + 하단 패널 상태
  const [selRecipe, setSelRecipe] = useState(null)
  const [panelTab, setPanelTab]   = useState('ingredients') // 'ingredients' | 'tools' | 'steps'

  // 재료 목록
  const [recipeIngs, setRecipeIngs]   = useState([])
  const [linkIngId, setLinkIngId]     = useState('')
  const [linkAmount, setLinkAmount]   = useState('')
  const [linkIngMemo, setLinkIngMemo] = useState('')

  // 도구 목록
  const [tools, setTools]     = useState([])
  const [toolName, setToolName] = useState('')

  // 요리방법(순서별)
  const [steps, setSteps]     = useState([])
  const [stepForm, setStepForm] = useState({ order_num:1, description:'', photo_url:'' })

  // ── 로드 ──
  const [dishes, setDishes] = useState([])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [r, s, c, i, d] = await Promise.all([
        apiFetch(api('recipes')),
        apiFetch(api('tv_shows')),
        apiFetch(api('chefs')),
        apiFetch(api('ingredients')),
        apiFetch(api('dishes')),
      ])
      setRecipes(r); setShows(s); setChefs(c); setIngredients(i); setDishes(d)
    } catch(e) { showToast('❌ '+e.message) }
    setLoading(false)
  }, [])

  const loadPanelData = useCallback(async (id) => {
    try {
      const [ri, tl, st] = await Promise.all([
        apiFetch(`${api('recipe_ingredients')}&recipe_id=${id}`),
        apiFetch(`${api('recipe_tools')}&recipe_id=${id}`).catch(()=>[]),
        apiFetch(`${api('recipe_steps')}&recipe_id=${id}`).catch(()=>[]),
      ])
      setRecipeIngs(ri)
      setTools(Array.isArray(tl) ? tl : [])
      setSteps(Array.isArray(st) ? [...st].sort((a,b)=>a.order_num-b.order_num) : [])
    } catch {}
  }, [])

  useEffect(()=>{ loadAll() }, [])
  useEffect(()=>{
    if (selRecipe) { loadPanelData(selRecipe.id); setStepForm(f=>({...f, order_num: steps.length+1})) }
    else { setRecipeIngs([]); setTools([]); setSteps([]) }
  }, [selRecipe])

  // ── 레시피 등록 ──
  const submit = async () => {
    if (!form.title.trim()) { showToast('⚠️ 제목 필수'); return }
    setSaving(true)
    try {
      await apiFetch(api('recipes'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify(form)
      })
      setForm(EMPTY_FORM); showToast('✅ 등록 완료'); loadAll()
    } catch(e) { showToast('❌ '+e.message) }
    setSaving(false)
  }

  // ── 레시피 삭제 ──
  const del = (id, name) => {
    confirmDelete(name, async () => {
      try {
        await apiFetch(`${api('recipes')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
        if (selRecipe?.id===id) setSelRecipe(null)
        setRecipes(prev => prev.filter(r => r.id !== id))
        showToast('🗑 삭제됨')
      } catch(e) { showToast('❌ '+e.message) }
    })
  }

  // ── 재료 ──
  const addIng = async () => {
    if (!selRecipe||!linkIngId) { showToast('⚠️ 재료 선택 필수'); return }
    try {
      await apiFetch(api('recipe_ingredients'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ recipe_id:selRecipe.id, ingredient_id:linkIngId, amount:linkAmount, memo:linkIngMemo })
      })
      setLinkIngId(''); setLinkAmount(''); setLinkIngMemo('')
      showToast('✅ 재료 추가됨'); loadPanelData(selRecipe.id)
    } catch(e) { showToast('❌ '+e.message) }
  }
  const delIng = async (id) => {
    try {
      await apiFetch(`${api('recipe_ingredients')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      showToast('🗑 삭제됨'); loadPanelData(selRecipe.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  // ── 도구 ──
  const addTool = async () => {
    if (!selRecipe||!toolName.trim()) { showToast('⚠️ 도구명 입력 필수'); return }
    try {
      await apiFetch(api('recipe_tools'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ recipe_id:selRecipe.id, name:toolName.trim() })
      })
      setToolName(''); showToast('✅ 도구 추가됨'); loadPanelData(selRecipe.id)
    } catch(e) { showToast('❌ '+e.message) }
  }
  const delTool = async (id) => {
    try {
      await apiFetch(`${api('recipe_tools')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      showToast('🗑 삭제됨'); loadPanelData(selRecipe.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  // ── 요리방법 ──
  const addStep = async () => {
    if (!selRecipe||!stepForm.description.trim()) { showToast('⚠️ 설명 필수'); return }
    try {
      await apiFetch(api('recipe_steps'), {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ recipe_id:selRecipe.id, ...stepForm })
      })
      setStepForm(f=>({ order_num:f.order_num+1, description:'', photo_url:'' }))
      showToast('✅ 스텝 추가됨'); loadPanelData(selRecipe.id)
    } catch(e) { showToast('❌ '+e.message) }
  }
  const delStep = async (id) => {
    try {
      await apiFetch(`${api('recipe_steps')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      showToast('🗑 삭제됨'); loadPanelData(selRecipe.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const filtered = searchQ
    ? recipes.filter(r=>r.title?.includes(searchQ)||r.tv_shows?.name?.includes(searchQ)||r.chefs?.name?.includes(searchQ))
    : recipes

  return (
    <div>
      {/* ── 등록 폼 ── */}
      <div style={S.card}>
        <div style={S.cardTitle}>📋 레시피 등록</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>레시피 제목 *</label>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
              placeholder="예: 백종원표 된장찌개, 강레오의 감귤 드레싱" style={S.input} />
          </div>
          <SearchSelect label="🍽 기본 요리 선택" items={dishes} value={form.dish_id} onChange={v=>setForm(f=>({...f,dish_id:v}))} placeholder="요리 검색..." />
          <SearchSelect label="📺 TV 방송" items={shows} value={form.show_id} onChange={v=>setForm(f=>({...f,show_id:v}))} placeholder="방송 검색..." />
          <SearchSelect label="👨‍🍳 셰프/요리사" items={chefs} value={form.chef_id} onChange={v=>setForm(f=>({...f,chef_id:v}))} placeholder="셰프 검색..." />
          <div>
            <label style={S.label}>회차</label>
            <input value={form.episode} onChange={e=>setForm(f=>({...f,episode:e.target.value}))} placeholder="예: 3화, 302회" style={S.input} />
          </div>
          <div>
            <label style={S.label}>방영일</label>
            <input type="date" value={form.aired_at} onChange={e=>setForm(f=>({...f,aired_at:e.target.value}))} style={S.input} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>📝 레시피 순서 (단계별 설명 + 사진)</label>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {(form.steps||[{ desc:'', photo:null }]).map((step, i) => (
                <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', background:'#f5f9f5', borderRadius:10, padding:10, border:'1px solid #d1e8d1' }}>
                  <span style={{ fontSize:13, fontWeight:800, color:'#22c55e', minWidth:24, paddingTop:8 }}>{i+1}.</span>
                  <div style={{ flex:1 }}>
                    <textarea
                      value={step.desc} rows={2}
                      onChange={e => setForm(f => ({ ...f, steps: f.steps.map((s,j) => j===i ? {...s, desc:e.target.value} : s) }))}
                      placeholder={`${i+1}단계 설명을 입력하세요`}
                      style={{ ...S.textarea, marginBottom:6, fontFamily:"'Outfit',sans-serif" }} />
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      <label style={{ fontSize:11, color:'#4b6e4b', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4,
                        padding:'4px 10px', borderRadius:20, border:'1px solid #d1e8d1', background:'#fff', width:'fit-content' }}>
                        📸 사진 추가 (여러 장)
                        <input type="file" accept="image/*" multiple style={{ display:'none' }}
                          onChange={e => {
                            const files = Array.from(e.target.files)
                            const newPhotos = files.map(file => ({ url: URL.createObjectURL(file), file }))
                            setForm(f => ({ ...f, steps: f.steps.map((s,j) => j===i ? {...s, photos:[...(s.photos||[]), ...newPhotos]} : s) }))
                          }} />
                      </label>
                      {(step.photos||[]).length > 0 && (
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          {(step.photos||[]).map((p, pi) => (
                            <div key={pi} style={{ position:'relative' }}>
                              <img src={p.url} alt="" style={{ width:60, height:60, objectFit:'cover', borderRadius:8, border:'1px solid #d1e8d1' }} />
                              <button type="button"
                                onClick={() => setForm(f => ({ ...f, steps: f.steps.map((s,j) => j===i ? {...s, photos:(s.photos||[]).filter((_,k)=>k!==pi)} : s) }))}
                                style={{ position:'absolute', top:-5, right:-5, width:16, height:16, borderRadius:8,
                                  background:'#ef4444', color:'#fff', border:'none', cursor:'pointer', fontSize:9 }}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={() => setForm(f => ({ ...f, steps: f.steps.filter((_,j)=>j!==i) }))}
                    style={{ padding:'3px 7px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2',
                      color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif", flexShrink:0 }}>✕</button>
                </div>
              ))}
              <button type="button"
                onClick={() => setForm(f => ({ ...f, steps: [...(f.steps||[]), { desc:'', photos:[] }] }))}
                style={{ padding:'7px', borderRadius:10, border:'1.5px dashed #22c55e', background:'#f0fdf4',
                  color:'#16a34a', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                + 단계 추가
              </button>
            </div>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>출처 URL</label>
            <input value={form.source_url} onChange={e=>setForm(f=>({...f,source_url:e.target.value}))} placeholder="https://..." style={S.input} />
          </div>
        </div>
        <button onClick={submit} disabled={saving} style={{ ...S.btn(), opacity:saving?.6:1 }}>{saving?'등록 중...':'+ 등록'}</button>
      </div>

      {/* ── 목록 ── */}
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
          <div style={S.cardTitle}>📋 레시피 목록 ({filtered.length}) — 클릭하면 재료·도구·방법 관리</div>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 검색" style={{ ...S.input, width:160 }} />
        </div>

        {loading ? <p style={{ color:'#8aaa8a', textAlign:'center', padding:30 }}>불러오는 중...</p> : (
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:selRecipe?20:0 }}>
            {filtered.map(r => {
              const on = selRecipe?.id===r.id
              return (
                <div key={r.id} onClick={()=>setSelRecipe(on?null:r)}
                  style={{ ...S.row, cursor:'pointer', border:`1.5px solid ${on?'#22c55e':'#d1e8d1'}`, background:on?'#f0fdf4':'#f5f9f5' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      {/* 제목 (요리명) */}
                      <div style={{ fontWeight:800, color:'#0f1f0f', fontSize:14, marginBottom:5 }}>🍳 {r.title}</div>
                      {/* 요리명 + 요리사 + TV 표시 */}
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        {r.dishes?.name && (
                          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20,
                            background:'#fff7ed', border:'1px solid #fed7aa', color:'#ea580c', fontWeight:700 }}>
                            🍽 {r.dishes.name}{r.dishes.category ? ` · ${r.dishes.category}` : ''}
                          </span>
                        )}
                        {r.tv_shows?.name && (
                          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20,
                            background:'#fef3c7', border:'1px solid #fde68a', color:'#92400e', fontWeight:700 }}>
                            📺 {r.tv_shows.name}
                          </span>
                        )}
                        {r.chefs?.name && (
                          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20,
                            background:'#f5f0ff', border:'1px solid #e9d5ff', color:'#7c3aed', fontWeight:700 }}>
                            👨‍🍳 {r.chefs.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={e=>{ e.stopPropagation(); del(r.id, r.title) }}
                      style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #fca5a5', background:'#fff1f2',
                        color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif", flexShrink:0, marginLeft:8 }}>삭제</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── 하단 관리 패널 ── */}
        {selRecipe && (
          <div style={{ marginTop:20, border:'1.5px solid #22c55e', borderRadius:14, overflow:'hidden' }}>
            {/* 패널 헤더 */}
            <div style={{ padding:'14px 18px', background:'#f0fdf4', borderBottom:'1px solid #bbf7d0',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:11, color:'#22c55e', fontWeight:700, letterSpacing:1, marginBottom:2 }}>선택된 레시피</div>
                <div style={{ fontSize:16, fontWeight:900, color:'#0f1f0f' }}>🍳 {selRecipe.title}</div>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:4 }}>
                  {selRecipe.tv_shows?.name && <span style={{ fontSize:11, color:'#92400e', background:'#fef3c7', padding:'1px 7px', borderRadius:10, border:'1px solid #fde68a' }}>📺 {selRecipe.tv_shows.name}</span>}
                  {selRecipe.chefs?.name && <span style={{ fontSize:11, color:'#7c3aed', background:'#f5f0ff', padding:'1px 7px', borderRadius:10, border:'1px solid #e9d5ff' }}>👨‍🍳 {selRecipe.chefs.name}</span>}
                </div>
              </div>
              <button onClick={()=>setSelRecipe(null)}
                style={{ padding:'4px 12px', borderRadius:7, border:'1px solid #bbf7d0', background:'#fff',
                  color:'#4b6e4b', fontSize:12, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>✕ 닫기</button>
            </div>

            {/* 패널 탭 */}
            <div style={{ display:'flex', borderBottom:'1px solid #d1e8d1' }}>
              {[
                { id:'ingredients', label:`🥕 재료 목록 (${recipeIngs.length})` },
                { id:'tools',       label:`🔧 도구 목록 (${tools.length})` },
                { id:'steps',       label:`📝 요리방법 (${steps.length}단계)` },
              ].map(t=>(
                <button key={t.id} onClick={()=>setPanelTab(t.id)}
                  style={{ flex:1, padding:'11px 8px', border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                    fontSize:12, fontWeight:700,
                    background: panelTab===t.id?'#fff':'#f9fdf9',
                    color: panelTab===t.id?'#22c55e':'#888',
                    borderBottom: panelTab===t.id?'2.5px solid #22c55e':'2.5px solid transparent' }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ padding:18 }}>

              {/* ── 재료 목록 탭 ── */}
              {panelTab==='ingredients' && (
                <div>
                  {recipeIngs.length > 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:14 }}>
                      {recipeIngs.map(ri=>(
                        <div key={ri.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                          background:'#f5f9f5', borderRadius:8, padding:'8px 12px', fontSize:12, border:'1px solid #d1e8d1' }}>
                          <span style={{ fontWeight:700, color:'#0f1f0f', minWidth:80 }}>{ri.ingredients?.name}</span>
                          <span style={{ color:'#22c55e', fontWeight:600 }}>{ri.amount}</span>
                          {ri.memo && <span style={{ color:'#8aaa8a', fontSize:11 }}>{ri.memo}</span>}
                          <button onClick={()=>delIng(ri.id)}
                            style={{ padding:'2px 8px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2',
                              color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                        </div>
                      ))}
                    </div>
                  ) : <p style={{ fontSize:12, color:'#8aaa8a', marginBottom:14, textAlign:'center' }}>아직 재료가 없어요</p>}

                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:8, alignItems:'flex-end' }}>
                    <SearchSelect label="재료 선택" items={ingredients} value={linkIngId} onChange={setLinkIngId} placeholder="재료 검색..." />
                    <div>
                      <label style={S.label}>양/단위</label>
                      <input value={linkAmount} onChange={e=>setLinkAmount(e.target.value)} placeholder="예: 200g, 2개" style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>메모 (선택)</label>
                      <input value={linkIngMemo} onChange={e=>setLinkIngMemo(e.target.value)} placeholder="예: 다져서" style={S.input} />
                    </div>
                    <button onClick={addIng} style={{ ...S.btn('#22c55e'), padding:'10px 14px' }}>+ 추가</button>
                  </div>
                </div>
              )}

              {/* ── 도구 목록 탭 ── */}
              {panelTab==='tools' && (
                <div>
                  {tools.length > 0 ? (
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
                      {tools.map(t=>(
                        <span key={t.id} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12,
                          padding:'4px 12px', borderRadius:20, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1d4ed8', fontWeight:600 }}>
                          🔧 {t.name}
                          <button onClick={()=>delTool(t.id)}
                            style={{ background:'none', border:'none', color:'#1d4ed8', cursor:'pointer', fontSize:14, lineHeight:1, padding:0 }}>×</button>
                        </span>
                      ))}
                    </div>
                  ) : <p style={{ fontSize:12, color:'#8aaa8a', marginBottom:14, textAlign:'center' }}>아직 도구가 없어요</p>}

                  <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'flex-end' }}>
                    <div>
                      <label style={S.label}>도구명</label>
                      <input value={toolName} onChange={e=>setToolName(e.target.value)}
                        placeholder="예: 프라이팬, 믹싱볼, 계량컵, 거품기"
                        style={S.input}
                        onKeyDown={e=>{ if(e.key==='Enter') addTool() }}
                      />
                    </div>
                    <button onClick={addTool} style={{ ...S.btn('#3b82f6'), padding:'10px 14px' }}>+ 추가</button>
                  </div>
                  <p style={{ fontSize:11, color:'#8aaa8a', marginTop:6 }}>💡 Enter로도 추가 가능</p>
                </div>
              )}

              {/* ── 요리방법 탭 ── */}
              {panelTab==='steps' && (
                <div>
                  {steps.length > 0 && (
                    <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }}>
                      {steps.map((st, idx)=>(
                        <div key={st.id} style={{ display:'flex', gap:12, background:'#f5f9f5', borderRadius:10,
                          padding:'12px 14px', border:'1px solid #d1e8d1', alignItems:'flex-start' }}>
                          {/* 순서 번호 */}
                          <div style={{ width:32, height:32, borderRadius:50, background:'#22c55e', color:'#fff',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:14, fontWeight:900, flexShrink:0 }}>{st.order_num}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, color:'#0f1f0f', lineHeight:1.6, fontWeight:500 }}>{st.description}</div>
                            {st.photo_url && (
                              <img src={st.photo_url} alt={`step ${st.order_num}`}
                                style={{ marginTop:8, width:'100%', maxWidth:280, borderRadius:8, border:'1px solid #d1e8d1', display:'block' }}
                                onError={e=>{ e.target.style.display='none' }}
                              />
                            )}
                          </div>
                          <button onClick={()=>delStep(st.id)}
                            style={{ padding:'3px 8px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2',
                              color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif", flexShrink:0 }}>삭제</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 스텝 추가 폼 */}
                  <div style={{ background:'#fff', border:'1.5px solid #bbf7d0', borderRadius:10, padding:14 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#15803d', marginBottom:10 }}>
                      📝 {stepForm.order_num}단계 추가
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:8, alignItems:'start', marginBottom:10 }}>
                      <div>
                        <label style={S.label}>순서</label>
                        <input type="number" min="1" value={stepForm.order_num}
                          onChange={e=>setStepForm(f=>({...f,order_num:parseInt(e.target.value)||1}))}
                          style={{ ...S.input, width:60 }} />
                      </div>
                      <div>
                        <label style={S.label}>설명 *</label>
                        <textarea value={stepForm.description}
                          onChange={e=>setStepForm(f=>({...f,description:e.target.value}))}
                          rows={3} placeholder="예: 팬을 달군 후 기름을 두르고 중불로 가열합니다."
                          style={{ ...S.textarea, fontFamily:"'Outfit',sans-serif" }} />
                      </div>
                    </div>
                    <div style={{ marginBottom:10 }}>
                      <label style={S.label}>📸 사진 URL (선택)</label>
                      <input value={stepForm.photo_url||''}
                        onChange={e=>setStepForm(f=>({...f,photo_url:e.target.value}))}
                        placeholder="https://... (이미지 URL 직접 입력)"
                        style={S.input} />
                      {stepForm.photo_url && (
                        <img src={stepForm.photo_url} alt="미리보기"
                          style={{ marginTop:6, width:120, height:80, objectFit:'cover', borderRadius:6, border:'1px solid #d1e8d1' }}
                          onError={e=>{ e.target.style.display='none' }} />
                      )}
                    </div>
                    <button onClick={addStep} style={{ ...S.btn('#22c55e'), padding:'9px 20px' }}>+ {stepForm.order_num}단계 추가</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// 메인 MapAdminPanel
// ══════════════════════════════════════════════════════════
const SUBTABS = [
  { id:'health',     label:'💊 건강효능' },
  { id:'tv',        label:'📺 TV방송' },
  { id:'chef',      label:'👨\u200d🍳 셰프' },
  { id:'ingredient', label:'🥕 식재료' },
  { id:'dish',      label:'🍽 요리' },
  { id:'utensil',   label:'🔧 조리도구' },
  { id:'recipe',    label:'📋 레시피' },
]

export default function MapAdminPanel({ adminToken }) {
  const [subTab, setSubTab] = useState('ingredient')
  const [toast, setToast] = useState('')
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''), 2500) }
  const [deleteModal, setDeleteModal] = useState(null) // { name, onConfirm }
  const confirmDelete = (name, onConfirm) => setDeleteModal({ name, onConfirm })

  return (
    <div>
      <Toast msg={toast} />

      {/* ── 전역 삭제 확인 모달 ── */}
      {deleteModal && (
        <div style={{ position:'fixed', inset:0, zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center',
          background:'rgba(0,0,0,0.55)', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:380,
            boxShadow:'0 20px 60px rgba(0,0,0,0.3)', fontFamily:"'Outfit',sans-serif", overflow:'hidden' }}>
            <div style={{ padding:'28px 24px 20px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:14 }}>🗑️</div>
              <div style={{ fontSize:17, fontWeight:800, color:'#0f1f0f', marginBottom:10 }}>정말 삭제할까요?</div>
              <div style={{ fontSize:14, background:'#fff1f2', border:'1px solid #fca5a5', borderRadius:8,
                padding:'10px 16px', color:'#dc2626', fontWeight:700, marginBottom:8 }}>
                "{deleteModal.name}"
              </div>
              <div style={{ fontSize:12, color:'#8aaa8a' }}>삭제하면 복구할 수 없어요</div>
            </div>
            <div style={{ display:'flex', borderTop:'1px solid #f0f0f0' }}>
              <button onClick={()=>setDeleteModal(null)}
                style={{ flex:1, padding:'16px 0', border:'none', background:'#f5f9f5', color:'#4b6e4b',
                  fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                  borderRight:'1px solid #f0f0f0', borderRadius:'0 0 0 14px' }}>취소</button>
              <button onClick={()=>{ deleteModal.onConfirm(); setDeleteModal(null) }}
                style={{ flex:1, padding:'16px 0', border:'none', background:'#fee2e2', color:'#dc2626',
                  fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                  borderRadius:'0 0 14px 0' }}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 서브탭 네비 */}
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:24, borderBottom:'1px solid #d1e8d1', paddingBottom:12 }}>
        {SUBTABS.map(t => (
          <button key={t.id} onClick={()=>setSubTab(t.id)} style={{
            padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer',
            fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight: subTab===t.id?700:500,
            background: subTab===t.id ? '#22c55e' : '#f5f9f5',
            color: subTab===t.id ? '#000' : '#888',
            transition:'all .15s',
          }}>{t.label}</button>
        ))}
      </div>

      {subTab === 'health'     && <HealthTab     adminToken={adminToken} showToast={showToast} confirmDelete={confirmDelete} />}
      {subTab === 'tv'        && <TvShowTab     adminToken={adminToken} showToast={showToast} confirmDelete={confirmDelete} />}
      {subTab === 'chef'      && <ChefTab       adminToken={adminToken} showToast={showToast} confirmDelete={confirmDelete} />}
      {subTab === 'ingredient' && <IngredientTab adminToken={adminToken} showToast={showToast} confirmDelete={confirmDelete} />}
      {subTab === 'dish'      && <DishTab       adminToken={adminToken} showToast={showToast} confirmDelete={confirmDelete} />}
      {subTab === 'utensil'   && <UtensilTab    adminToken={adminToken} showToast={showToast} confirmDelete={confirmDelete} />}
      {subTab === 'recipe'    && <RecipeTab     adminToken={adminToken} showToast={showToast} confirmDelete={confirmDelete} />}
    </div>
  )
}
