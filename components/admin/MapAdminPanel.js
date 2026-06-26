import { useState, useEffect, useMemo, useCallback } from 'react'
import { S, Toast } from './AdminUI'
import { DEFAULT_CATEGORIES, categoryLabel } from '../../lib/blogCategories'

// ── 상수 ─────────────────────────────────────────────────
const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12]

const ING_CATEGORIES = [
  { id:'fish',     emoji:'🐟', label:'수산물' },
  { id:'veg',      emoji:'🥬', label:'채소·나물' },
  { id:'fruit',    emoji:'🍎', label:'과일' },
  { id:'grain',    emoji:'🌾', label:'곡물·가공' },
  { id:'meat',     emoji:'🥩', label:'육류' },
  { id:'mushroom', emoji:'🍄', label:'버섯·산채' },
]

const DISH_CATEGORIES = ['한식','양식','중식','일식','분식','디저트','퓨전','기타']
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
  const [form, setForm] = useState({ name:'', description:'', category:'', coupang_url:'', age_groups:[], caution:'' })
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

  const ING_CAT = { fish:'🐟', veg:'🥬', fruit:'🍎', grain:'🌾', meat:'🥩', mushroom:'🍄' }

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
      setForm({ name:'', description:'', category:'', coupang_url:'', age_groups:[], caution:'' })
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
          showToast('🗑 삭제됨'); load()
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
                    {h.caution && (
                      <div style={{ padding:'4px 8px', borderRadius:6, background:'#fef2f2', border:'1.5px solid #fca5a5', fontSize:11, lineHeight:1.4, marginBottom:4 }}>
                        <span style={{ color:'#dc2626', fontWeight:700 }}>⚠️ 주의 </span>
                        <span style={{ color:'#dc2626', fontWeight:600 }}>{h.caution}</span>
                      </div>
                    )}
                    {h.coupang_url && <a href={h.coupang_url} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:'#ea580c', textDecoration:'none', display:'inline-block' }}>🛒 쿠팡 링크 ↗</a>}
                  </div>
                  <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                    <button onClick={e=>{ e.stopPropagation(); setEditId(h.id); setSelHealth(h); setEditForm({name:h.name,description:h.description||'',category:h.category||'',coupang_url:h.coupang_url||'',age_groups:h.age_groups||[],caution:h.caution||''}); loadLinks(h.id) }}
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

  const ING_CAT = { fish:'🐟', veg:'🥬', fruit:'🍎', grain:'🌾', meat:'🥩', mushroom:'🍄' }

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
      setForm({ name:'', broadcaster:'', category:'', description:'' })
      showToast('✅ 등록 완료'); loadAll()
    } catch(e) { showToast('❌ '+e.message) }
    setSaving(false)
  }

  const delShow = (id, name) => {
    confirmDelete(name, async () => {
      try {
        await apiFetch(`${api('tv_shows')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
        if (selShow?.id===id) setSelShow(null)
        showToast('🗑 삭제됨'); loadAll()
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
        <div style={S.cardTitle}>📋 방송 목록 ({shows.length})</div>
        {loading ? <p style={{ color:'#8aaa8a', textAlign:'center', padding:30 }}>불러오는 중...</p> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:8 }}>
            {[...shows].sort((a,b) => a.name.localeCompare(b.name, 'ko')).map(s => (
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
                    {s.air_days?.length > 0 && (
                      <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:2 }}>
                        {s.air_days.map(d => (
                          <span key={d} style={{ fontSize:10, padding:'1px 6px', borderRadius:6, background:'#fef3c7', border:'1px solid #fde68a', color:'#92400e', fontWeight:600 }}>{d}요일</span>
                        ))}
                      </div>
                    )}
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
        showToast('🗑 삭제됨'); load()
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
function IngredientTab({ adminToken, showToast, confirmDelete }) {
  const [list, setList] = useState([])
  const [healths, setHealths] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name:'', category:'fish', description:'', coupang_url:'', caution:'' })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [selIng, setSelIng] = useState(null)
  const [ingHealths, setIngHealths] = useState([])
  const [ingRegions, setIngRegions] = useState([])
  const [linkHealthId, setLinkHealthId] = useState('')
  const [regionForm, setRegionForm] = useState({ region:'gangwon', district:'', months:[] })
  const [searchQ, setSearchQ] = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [i, h] = await Promise.all([apiFetch(api('ingredients')), apiFetch(api('health_benefits'))])
      setList(i); setHealths(h)
    } catch(e) { showToast('❌ '+e.message) }
    setLoading(false)
  }, [])

  const loadLinks = useCallback(async (id) => {
    try {
      const [ih, ir] = await Promise.all([
        apiFetch(`${api('ingredient_health')}&ingredient_id=${id}`),
        apiFetch(`${api('ingredient_regions')}&ingredient_id=${id}`),
      ])
      setIngHealths(ih); setIngRegions(ir)
    } catch {}
  }, [])

  useEffect(()=>{ loadAll() }, [])
  useEffect(()=>{ if(selIng) loadLinks(selIng.id) }, [selIng])

  const submit = async () => {
    if (!form.name.trim()) { showToast('⚠️ 이름 필수'); return }
    setSaving(true)
    try {
      await apiFetch(api('ingredients'), { method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken}, body:JSON.stringify(form) })
      setForm({ name:'', category:'fish', description:'', coupang_url:'', caution:'' })
      showToast('✅ 등록 완료'); loadAll()
    } catch(e) { showToast('❌ '+e.message) }
    setSaving(false)
  }

  const save = async (id) => {
    try {
      await apiFetch(`${api('ingredients')}&id=${id}`, { method:'PATCH', headers:{'Content-Type':'application/json','x-admin-token':adminToken}, body:JSON.stringify(editForm) })
      setEditId(null); showToast('✅ 저장됨'); loadAll()
    } catch(e) { showToast('❌ '+e.message) }
  }

  const del = (id, name) => {
    confirmDelete(name, async () => {
      try {
        await apiFetch(`${api('ingredients')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
        if (selIng?.id===id) setSelIng(null)
        showToast('🗑 삭제됨'); loadAll()
      } catch(e) { showToast('❌ '+e.message) }
    })
  }

  const linkHealth = async () => {
    if (!selIng||!linkHealthId) { showToast('⚠️ 식재료와 효능 선택 필수'); return }
    try {
      await apiFetch(api('ingredient_health'), { method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ ingredient_id:selIng.id, health_id:linkHealthId }) })
      setLinkHealthId(''); showToast('✅ 효능 연결됨'); loadLinks(selIng.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const unlinkHealth = async (id) => {
    try {
      await apiFetch(`${api('ingredient_health')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      showToast('🗑 해제됨'); loadLinks(selIng.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const addRegion = async () => {
    if (!selIng||!regionForm.region||!regionForm.months.length) { showToast('⚠️ 지역·제철월 필수'); return }
    try {
      await apiFetch(api('ingredient_regions'), { method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ ingredient_id:selIng.id, ...regionForm }) })
      setRegionForm({ region:'gangwon', district:'', months:[] })
      showToast('✅ 지역 연결됨'); loadLinks(selIng.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const delRegion = async (id) => {
    try {
      await apiFetch(`${api('ingredient_regions')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      showToast('🗑 해제됨'); loadLinks(selIng.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const cat = (id) => ING_CATEGORIES.find(c=>c.id===id)
  const filtered = searchQ ? list.filter(i=>i.name.includes(searchQ)) : list

  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>🥕 식재료 등록</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <label style={S.label}>식재료명 *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="예: 돼지고기, 당근" style={S.input} />
          </div>
          <div>
            <label style={S.label}>카테고리</label>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:6 }}>
              {ING_CATEGORIES.map(c=>(
                <button key={c.id} type="button" onClick={()=>setForm(f=>({...f,category:c.id}))}
                  style={{ padding:'4px 10px', borderRadius:20, border:`1.5px solid ${form.category===c.id?'#a855f7':'#333'}`,
                    background:form.category===c.id?'#f5f0ff':'#f5f9f5', color:form.category===c.id?'#a855f7':'#888',
                    fontSize:12, fontWeight:form.category===c.id?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>설명</label>
            <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="간단 설명" style={S.input} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>🛒 쿠팡 파트너스 URL (5단계 — 상품 연결)</label>
            <input value={form.coupang_url||''} onChange={e=>setForm(f=>({...f,coupang_url:e.target.value}))} placeholder="예: https://coupa.ng/xxxxx" style={S.input} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>⚠️ 주의사항 (알레르기·특정질환·섭취제한 등)</label>
            <input
              value={form.caution||''}
              onChange={e=>setForm(f=>({...f,caution:e.target.value}))}
              placeholder="예: 견과류 알레르기 주의 / 통풍 환자 퓨린 함량 높음 / 임산부 과다섭취 주의"
              style={S.input}
              list="caution-presets"
            />
            <p style={{ fontSize:11, color:'#8aaa8a', marginTop:3 }}>💡 입력창 클릭하면 자주 쓰는 주의문구 나와요</p>
          </div>
        </div>
        <button onClick={submit} disabled={saving} style={{ ...S.btn(), opacity:saving?.6:1 }}>+ 등록</button>
      </div>

      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
          <div style={S.cardTitle}>📋 식재료 목록 ({filtered.length}) — 클릭하면 효능·지역 연결</div>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 검색" style={{ ...S.input, width:160 }} />
        </div>
        {loading ? <p style={{ color:'#8aaa8a', textAlign:'center', padding:30 }}>불러오는 중...</p> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:6, marginBottom: selIng?20:0 }}>
            {filtered.map(i => {
              const ct = cat(i.category)
              const on = selIng?.id===i.id
              if (editId === i.id) return (
                <div key={i.id} style={{ ...S.row, border:'1.5px solid #16a34a', gridColumn:'1/-1' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                    <div>
                      <label style={S.label}>식재료명 *</label>
                      <input value={editForm.name||''} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>카테고리</label>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:6 }}>
                        {ING_CATEGORIES.map(ic=>(
                          <button key={ic.id} type="button" onClick={()=>setEditForm(f=>({...f,category:ic.id}))}
                            style={{ padding:'3px 8px', borderRadius:20, border:`1.5px solid ${editForm.category===ic.id?'#a855f7':'#d1e8d1'}`,
                              background:editForm.category===ic.id?'#f5f0ff':'#f5f9f5', color:editForm.category===ic.id?'#7c3aed':'#4b6e4b',
                              fontSize:11, fontWeight:editForm.category===ic.id?700:400, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                            {ic.emoji} {ic.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={S.label}>설명 (건강효능 요약)</label>
                      <input value={editForm.description||''} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))} style={S.input} />
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={S.label}>🛒 쿠팡 URL</label>
                      <input value={editForm.coupang_url||''} onChange={e=>setEditForm(f=>({...f,coupang_url:e.target.value}))} placeholder="https://coupa.ng/..." style={S.input} />
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={S.label}>⚠️ 주의사항</label>
                      <input value={editForm.caution||''} onChange={e=>setEditForm(f=>({...f,caution:e.target.value}))}
                        placeholder="예: 견과류 알레르기 주의" style={S.input} list="caution-presets" />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={()=>save(i.id)} style={S.btn()}>저장</button>
                    <button onClick={()=>setEditId(null)} style={S.btnGhost}>취소</button>
                  </div>
                </div>
              )
              return (
                <div key={i.id} onClick={()=>{ if(editId) return; setSelIng(on?null:i) }}
                  style={{ ...S.row, cursor:'pointer', border:`1.5px solid ${on?'#a855f7':'#d1e8d1'}`, background:on?'#f5f0ff':'#f5f9f5' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, color:'#0f1f0f', fontSize:13 }}>{ct?.emoji} {i.name}</div>
                      <div style={{ fontSize:11, color:'#4b6e4b' }}>{ct?.label}</div>
                      {i.description && <div style={{ fontSize:11, color:'#8aaa8a', marginTop:2 }}>{i.description}</div>}
                      {i.caution && (
                        <div style={{ fontSize:10, marginTop:3, padding:'3px 7px', background:'#fef2f2', borderRadius:4, border:'1.5px solid #fca5a5', lineHeight:1.3 }}>
                          <span style={{ color:'#dc2626', fontWeight:700 }}>⚠️ 주의 </span>
                          <span style={{ color:'#dc2626', fontWeight:600 }}>{i.caution}</span>
                        </div>
                      )}
                      {i.coupang_url && <div style={{ fontSize:10, color:'#ea580c', marginTop:3 }}>🛒 쿠팡 링크 있음</div>}
                    </div>
                    <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                      <button onClick={e=>{ e.stopPropagation(); setEditId(i.id); setEditForm({name:i.name,category:i.category,description:i.description||'',coupang_url:i.coupang_url||'',caution:i.caution||''}); setSelIng(null) }}
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

        {/* 선택된 식재료 연결 관리 */}
        {selIng && (
          <div>
            <SectionCard title={`💊 "${selIng.name}" 건강효능 연결`}>
              <TagRow
                items={ingHealths.map(ih=>({ label:ih.health_benefits?.name, id:ih.id }))}
                onRemove={(i)=>unlinkHealth(ingHealths[i].id)}
                color="#22c55e"
              />
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, marginTop:10, alignItems:'flex-end' }}>
                <SearchSelect
                  label="효능 선택/검색 (기존 선택 or 새로 추가)"
                  items={healths}
                  value={linkHealthId}
                  onChange={setLinkHealthId}
                  placeholder="효능 검색..."
                />
                <button onClick={linkHealth} style={{ ...S.btn('#22c55e'), padding:'10px 14px' }}>연결</button>
              </div>
            </SectionCard>

            <SectionCard title={`🗺 "${selIng.name}" 지역·제철 연결`}>
              {ingRegions.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                  {ingRegions.map(r=>(
                    <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                      background:'#f5f9f5', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
                      <span style={{ color:'#0f1f0f' }}>📍 {categoryLabel(r.region)} {r.district && `· ${r.district}`}</span>
                      <span style={{ color:'#4b6e4b' }}>{(r.months||[]).join('·')}월</span>
                      <button onClick={()=>delRegion(r.id)}
                        style={{ padding:'2px 7px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={S.label}>시도</label>
                  <select value={regionForm.region} onChange={e=>setRegionForm(f=>({...f,region:e.target.value}))} style={S.input}>
                    {DEFAULT_CATEGORIES.map(c=><option key={c} value={c}>{categoryLabel(c)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>시군구 (선택)</label>
                  <input value={regionForm.district} onChange={e=>setRegionForm(f=>({...f,district:e.target.value}))} placeholder="예: 속초시·강릉시" style={S.input} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={S.label}>제철 월</label>
                  <MonthPills value={regionForm.months} onChange={v=>setRegionForm(f=>({...f,months:v}))} />
                </div>
              </div>
              <button onClick={addRegion} style={{ ...S.btn('#0ea5e9'), marginTop:12 }}>+ 지역 추가</button>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// 서브탭 5 : 요리 관리
// ══════════════════════════════════════════════════════════
function DishTab({ adminToken, showToast, confirmDelete }) {
  const [dishes, setDishes] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [shows, setShows] = useState([])
  const [chefs, setChefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name:'', category:'', description:'', coupang_url:'', caution:'' })
  const [saving, setSaving] = useState(false)
  const [selDish, setSelDish] = useState(null)
  const [activeSection, setActiveSection] = useState('ingredients') // 'ingredients' | 'recipes'
  const [dishIngs, setDishIngs] = useState([])
  const [dishRecipes, setDishRecipes] = useState([])
  const [linkIngId, setLinkIngId] = useState('')
  const [linkAmount, setLinkAmount] = useState('')
  const [linkMemo, setLinkMemo] = useState('')
  const [recipeForm, setRecipeForm] = useState({ title:'', show_id:'', chef_id:'', episode:'', aired_at:'', summary:'', source_url:'' })
  const [savingRecipe, setSavingRecipe] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [d, i, s, ch] = await Promise.all([
        apiFetch(api('dishes')), apiFetch(api('ingredients')),
        apiFetch(api('tv_shows')), apiFetch(api('chefs')),
      ])
      setDishes(d); setIngredients(i); setShows(s); setChefs(ch)
    } catch(e) { showToast('❌ '+e.message) }
    setLoading(false)
  }, [])

  const loadDishIngs = useCallback(async (id) => {
    try { setDishIngs(await apiFetch(`${api('dish_ingredients')}&dish_id=${id}`)) } catch {}
  }, [])

  const loadDishRecipes = useCallback(async (dishId) => {
    try {
      const all = await apiFetch(`${api('recipes')}`)
      setDishRecipes(all.filter(r => r.dish_id === dishId))
    } catch {}
  }, [])

  useEffect(()=>{ loadAll() }, [])
  useEffect(()=>{
    if(selDish) {
      loadDishIngs(selDish.id)
      loadDishRecipes(selDish.id)
    }
  }, [selDish])

  const submit = async () => {
    if (!form.name.trim()) { showToast('⚠️ 요리명 필수'); return }
    setSaving(true)
    try {
      await apiFetch(api('dishes'), { method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken}, body:JSON.stringify(form) })
      setForm({ name:'', category:'', description:'', coupang_url:'' })
      showToast('✅ 등록 완료'); loadAll()
    } catch(e) { showToast('❌ '+e.message) }
    setSaving(false)
  }

  const del = (id, name) => {
    confirmDelete(name, async () => {
      try {
        await apiFetch(`${api('dishes')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
        if (selDish?.id===id) setSelDish(null)
        showToast('🗑 삭제됨'); loadAll()
      } catch(e) { showToast('❌ '+e.message) }
    })
  }

  const linkIng = async () => {
    if (!selDish||!linkIngId) { showToast('⚠️ 요리와 식재료 선택 필수'); return }
    try {
      await apiFetch(api('dish_ingredients'), { method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ dish_id:selDish.id, ingredient_id:linkIngId, amount:linkAmount, memo:linkMemo }) })
      setLinkIngId(''); setLinkAmount(''); setLinkMemo('')
      showToast('✅ 재료 연결됨'); loadDishIngs(selDish.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const unlinkIng = async (id) => {
    try {
      await apiFetch(`${api('dish_ingredients')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      showToast('🗑 해제됨'); loadDishIngs(selDish.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const filtered = searchQ ? dishes.filter(d=>d.name.includes(searchQ)) : dishes

  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>🍽 요리/음식 등록</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <label style={S.label}>요리명 *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="예: 돈가스, 된장찌개" style={S.input} />
          </div>
          <div>
            <label style={S.label}>분류</label>
            <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={S.input}>
              <option value="">선택</option>
              {DISH_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>설명</label>
            <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="간단 설명" style={S.input} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>🛒 쿠팡 파트너스 URL (5단계 — 밀키트/상품 연결)</label>
            <input value={form.coupang_url||''} onChange={e=>setForm(f=>({...f,coupang_url:e.target.value}))} placeholder="예: https://coupa.ng/xxxxx" style={S.input} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>⚠️ 주의사항 (알레르기·특정질환 등)</label>
            <input value={form.caution||''} onChange={e=>setForm(f=>({...f,caution:e.target.value}))}
              placeholder="예: 갑각류 알레르기 주의 / 통풍 환자 주의" style={S.input} list="caution-presets" />
            <datalist id="caution-presets">
              {CAUTION_PRESETS.map(p=><option key={p} value={p} />)}
            </datalist>
          </div>
        </div>
        <button onClick={submit} disabled={saving} style={{ ...S.btn(), opacity:saving?.6:1 }}>+ 등록</button>
      </div>

      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
          <div style={S.cardTitle}>📋 요리 목록 ({filtered.length}) — 클릭하면 재료·레시피 연결</div>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 검색" style={{ ...S.input, width:160 }} />
        </div>
        {loading ? <p style={{ color:'#8aaa8a', textAlign:'center', padding:30 }}>불러오는 중...</p> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:6, marginBottom:selDish?20:0 }}>
            {filtered.map(d => {
              const on = selDish?.id===d.id
              return (
                <div key={d.id} onClick={()=>setSelDish(on?null:d)}
                  style={{ ...S.row, cursor:'pointer', border:`1.5px solid ${on?'#f97316':'#d1e8d1'}`, background:on?'#fff7ed':'#f5f9f5' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:700, color:'#0f1f0f', fontSize:13 }}>🍽 {d.name}</div>
                      {d.category && <div style={{ fontSize:11, color:'#4b6e4b' }}>{d.category}</div>}
                      {d.caution && <div style={{ fontSize:10, marginTop:3, padding:'2px 6px', background:'#fef2f2', borderRadius:4, border:'1.5px solid #fca5a5' }}><span style={{ color:'#dc2626', fontWeight:700 }}>⚠️ 주의 </span><span style={{ color:'#dc2626', fontWeight:600 }}>{d.caution}</span></div>}
                    </div>
                    <button onClick={e=>{ e.stopPropagation(); del(d.id, d.name) }}
                      style={{ padding:'2px 7px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {selDish && (
          <div style={{ border:'1.5px solid #86efac', borderRadius:14, overflow:'hidden', marginTop:4 }}>
            {/* 탭 헤더 */}
            <div style={{ display:'flex', borderBottom:'1px solid #d1e8d1', background:'#f0faf0' }}>
              <button onClick={()=>setActiveSection('ingredients')}
                style={{ flex:1, padding:'10px 0', border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                  fontWeight:700, fontSize:13,
                  background: activeSection==='ingredients' ? '#fff' : 'transparent',
                  color: activeSection==='ingredients' ? '#16a34a' : '#4b6e4b',
                  borderBottom: activeSection==='ingredients' ? '2px solid #16a34a' : '2px solid transparent' }}>
                🥕 재료 ({dishIngs.length})
              </button>
              <button onClick={()=>setActiveSection('recipes')}
                style={{ flex:1, padding:'10px 0', border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                  fontWeight:700, fontSize:13,
                  background: activeSection==='recipes' ? '#fff' : 'transparent',
                  color: activeSection==='recipes' ? '#16a34a' : '#4b6e4b',
                  borderBottom: activeSection==='recipes' ? '2px solid #16a34a' : '2px solid transparent' }}>
                📋 레시피 ({dishRecipes.length})
              </button>
            </div>

            {/* 재료 섹션 */}
            {activeSection === 'ingredients' && (
              <div style={{ padding:16 }}>
                <p style={{ fontSize:12, color:'#4b6e4b', marginBottom:12, fontWeight:600 }}>🍽 "{selDish.name}" 들어가는 재료</p>
                {dishIngs.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:14 }}>
                    {dishIngs.map(di=>(
                      <div key={di.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                        background:'#f5f9f5', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
                        <span style={{ color:'#0f1f0f', fontWeight:600 }}>{di.ingredients?.name}</span>
                        {di.amount && <span style={{ color:'#4b6e4b' }}>{di.amount}</span>}
                        {di.memo && <span style={{ color:'#8aaa8a', fontSize:11 }}>{di.memo}</span>}
                        <button onClick={()=>unlinkIng(di.id)}
                          style={{ padding:'2px 7px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:8, alignItems:'flex-end' }}>
                  <SearchSelect label="식재료 선택/검색" items={ingredients} value={linkIngId} onChange={setLinkIngId} placeholder="재료 검색..." />
                  <div>
                    <label style={S.label}>양</label>
                    <input value={linkAmount} onChange={e=>setLinkAmount(e.target.value)} placeholder="예: 200g" style={{ ...S.input, width:90 }} />
                  </div>
                  <div>
                    <label style={S.label}>메모</label>
                    <input value={linkMemo} onChange={e=>setLinkMemo(e.target.value)} placeholder="채 썰기" style={{ ...S.input, width:90 }} />
                  </div>
                  <button onClick={linkIng} style={{ ...S.btn('#f97316'), padding:'10px 14px' }}>추가</button>
                </div>
              </div>
            )}

            {/* 레시피 섹션 */}
            {activeSection === 'recipes' && (
              <div style={{ padding:16 }}>
                <p style={{ fontSize:12, color:'#4b6e4b', marginBottom:12, fontWeight:600 }}>📋 "{selDish.name}" 레시피 목록 — 여러 개 추가 가능</p>
                {/* 기존 레시피 목록 */}
                {dishRecipes.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
                    {dishRecipes.map(r => (
                      <div key={r.id} style={{ background:'#f5f9f5', borderRadius:10, padding:'10px 14px', border:'1px solid #d1e8d1' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                          <div>
                            <div style={{ fontWeight:700, fontSize:13, color:'#0f1f0f', marginBottom:4 }}>{r.title}</div>
                            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                              {r.tv_shows?.name && <span style={{ fontSize:11, padding:'1px 7px', borderRadius:20, background:'#fef9c3', color:'#854d0e', border:'1px solid #fde68a' }}>📺 {r.tv_shows.name}</span>}
                              {r.chefs?.name && <span style={{ fontSize:11, padding:'1px 7px', borderRadius:20, background:'#f3e8ff', color:'#6b21a8', border:'1px solid #e9d5ff' }}>👨‍🍳 {r.chefs.name}</span>}
                              {r.episode && <span style={{ fontSize:11, color:'#8aaa8a' }}>{r.episode}</span>}
                              {r.aired_at && <span style={{ fontSize:11, color:'#8aaa8a' }}>{r.aired_at?.slice(0,10)}</span>}
                            </div>
                            {r.summary && <p style={{ fontSize:11, color:'#4b6e4b', marginTop:4 }}>{r.summary}</p>}
                          </div>
                          <button onClick={()=>confirmDelete(r.title, async()=>{ await apiFetch(`${api('recipes')}&id=${r.id}`,{method:'DELETE',headers:{'x-admin-token':adminToken}}); loadDishRecipes(selDish.id); showToast('🗑 삭제됨') })}
                            style={{ padding:'3px 9px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif", flexShrink:0 }}>삭제</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* 새 레시피 추가 폼 */}
                <div style={{ background:'#f0faf0', borderRadius:10, padding:14, border:'1px dashed #86efac' }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'#16a34a', marginBottom:10 }}>+ 새 레시피 추가</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={S.label}>레시피 제목 *</label>
                      <input value={recipeForm.title} onChange={e=>setRecipeForm(f=>({...f,title:e.target.value}))} placeholder="예: 백종원표 돈가스" style={S.input} />
                    </div>
                    <SearchSelect label="TV 방송" items={shows} value={recipeForm.show_id} onChange={v=>setRecipeForm(f=>({...f,show_id:v}))} placeholder="방송 검색..." />
                    <SearchSelect label="셰프" items={chefs} value={recipeForm.chef_id} onChange={v=>setRecipeForm(f=>({...f,chef_id:v}))} placeholder="셰프 검색..." />
                    <div>
                      <label style={S.label}>회차</label>
                      <input value={recipeForm.episode} onChange={e=>setRecipeForm(f=>({...f,episode:e.target.value}))} placeholder="예: 302회" style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>방영일</label>
                      <input type="date" value={recipeForm.aired_at} onChange={e=>setRecipeForm(f=>({...f,aired_at:e.target.value}))} style={S.input} />
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={S.label}>요약</label>
                      <textarea value={recipeForm.summary} onChange={e=>setRecipeForm(f=>({...f,summary:e.target.value}))} rows={2}
                        style={{ ...S.textarea, fontFamily:"'Outfit',sans-serif" }} placeholder="레시피 간단 설명" />
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={S.label}>출처 URL</label>
                      <input value={recipeForm.source_url} onChange={e=>setRecipeForm(f=>({...f,source_url:e.target.value}))} placeholder="https://..." style={S.input} />
                    </div>
                  </div>
                  <button disabled={savingRecipe} onClick={async()=>{
                    if(!recipeForm.title.trim()){showToast('⚠️ 제목 필수');return}
                    setSavingRecipe(true)
                    try {
                      await apiFetch(api('recipes'),{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':adminToken},
                        body:JSON.stringify({...recipeForm, dish_id:selDish.id})})
                      setRecipeForm({title:'',show_id:'',chef_id:'',episode:'',aired_at:'',summary:'',source_url:''})
                      showToast('✅ 레시피 추가됨'); loadDishRecipes(selDish.id)
                    } catch(e){showToast('❌ '+e.message)}
                    setSavingRecipe(false)
                  }} style={{ ...S.btn(), marginTop:10, opacity:savingRecipe?.6:1 }}>+ 레시피 추가</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// 서브탭 6 : 레시피 관리
// ══════════════════════════════════════════════════════════
function RecipeTab({ adminToken, showToast, confirmDelete }) {
  const [recipes, setRecipes] = useState([])
  const [dishes, setDishes] = useState([])
  const [shows, setShows] = useState([])
  const [chefs, setChefs] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ dish_id:'', show_id:'', chef_id:'', episode:'', aired_at:'', title:'', summary:'', source_url:'' })
  const [saving, setSaving] = useState(false)
  const [selRecipe, setSelRecipe] = useState(null)
  const [recipeIngs, setRecipeIngs] = useState([])
  const [linkIngId, setLinkIngId] = useState('')
  const [linkAmount, setLinkAmount] = useState('')
  const [searchQ, setSearchQ] = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [r, d, s, c, i] = await Promise.all([
        apiFetch(`${api('recipes')}`),
        apiFetch(api('dishes')),
        apiFetch(api('tv_shows')),
        apiFetch(api('chefs')),
        apiFetch(api('ingredients')),
      ])
      setRecipes(r); setDishes(d); setShows(s); setChefs(c); setIngredients(i)
    } catch(e) { showToast('❌ '+e.message) }
    setLoading(false)
  }, [])

  const loadRecipeIngs = useCallback(async (id) => {
    try { setRecipeIngs(await apiFetch(`${api('recipe_ingredients')}&recipe_id=${id}`)) } catch {}
  }, [])

  useEffect(()=>{ loadAll() }, [])
  useEffect(()=>{ if(selRecipe) loadRecipeIngs(selRecipe.id) }, [selRecipe])

  const submit = async () => {
    if (!form.title.trim()) { showToast('⚠️ 제목 필수'); return }
    setSaving(true)
    try {
      await apiFetch(api('recipes'), { method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken}, body:JSON.stringify(form) })
      setForm({ dish_id:'', show_id:'', chef_id:'', episode:'', aired_at:'', title:'', summary:'', source_url:'' })
      showToast('✅ 등록 완료'); loadAll()
    } catch(e) { showToast('❌ '+e.message) }
    setSaving(false)
  }

  const del = (id, name) => {
    confirmDelete(name, async () => {
      try {
        await apiFetch(`${api('recipes')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
        if (selRecipe?.id===id) setSelRecipe(null)
        showToast('🗑 삭제됨'); loadAll()
      } catch(e) { showToast('❌ '+e.message) }
    })
  }

  const linkIng = async () => {
    if (!selRecipe||!linkIngId) { showToast('⚠️ 레시피와 재료 선택 필수'); return }
    try {
      await apiFetch(api('recipe_ingredients'), { method:'POST', headers:{'Content-Type':'application/json','x-admin-token':adminToken},
        body:JSON.stringify({ recipe_id:selRecipe.id, ingredient_id:linkIngId, amount:linkAmount }) })
      setLinkIngId(''); setLinkAmount('')
      showToast('✅ 재료 연결됨'); loadRecipeIngs(selRecipe.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const unlinkIng = async (id) => {
    try {
      await apiFetch(`${api('recipe_ingredients')}&id=${id}`, { method:'DELETE', headers:{'x-admin-token':adminToken} })
      showToast('🗑 해제됨'); loadRecipeIngs(selRecipe.id)
    } catch(e) { showToast('❌ '+e.message) }
  }

  const filtered = searchQ ? recipes.filter(r=>r.title?.includes(searchQ)||r.dishes?.name?.includes(searchQ)) : recipes

  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>📋 레시피 등록 (요리 + 방송 + 셰프 연결)</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>레시피 제목 *</label>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="예: 백종원표 돈가스" style={S.input} />
          </div>
          <SearchSelect label="요리 선택" items={dishes} value={form.dish_id} onChange={v=>setForm(f=>({...f,dish_id:v}))} placeholder="요리 검색..." />
          <SearchSelect label="TV 방송 선택" items={shows} value={form.show_id} onChange={v=>setForm(f=>({...f,show_id:v}))} placeholder="방송 검색..." />
          <SearchSelect label="셰프 선택" items={chefs} value={form.chef_id} onChange={v=>setForm(f=>({...f,chef_id:v}))} placeholder="셰프 검색..." />
          <div>
            <label style={S.label}>방영 회차</label>
            <input value={form.episode} onChange={e=>setForm(f=>({...f,episode:e.target.value}))} placeholder="예: 3화, 302회" style={S.input} />
          </div>
          <div>
            <label style={S.label}>방영일</label>
            <input type="date" value={form.aired_at} onChange={e=>setForm(f=>({...f,aired_at:e.target.value}))} style={S.input} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>요약</label>
            <textarea value={form.summary} onChange={e=>setForm(f=>({...f,summary:e.target.value}))} rows={2}
              style={{ ...S.textarea, fontFamily:"'Outfit',sans-serif" }} placeholder="레시피 요약" />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={S.label}>출처 URL</label>
            <input value={form.source_url} onChange={e=>setForm(f=>({...f,source_url:e.target.value}))} placeholder="https://..." style={S.input} />
          </div>
        </div>
        <button onClick={submit} disabled={saving} style={{ ...S.btn(), opacity:saving?.6:1 }}>+ 등록</button>
      </div>

      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
          <div style={S.cardTitle}>📋 레시피 목록 ({filtered.length}) — 클릭하면 재료 연결</div>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 검색" style={{ ...S.input, width:160 }} />
        </div>
        {loading ? <p style={{ color:'#8aaa8a', textAlign:'center', padding:30 }}>불러오는 중...</p> : (
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:selRecipe?20:0 }}>
            {filtered.map(r => {
              const on = selRecipe?.id===r.id
              return (
                <div key={r.id} onClick={()=>setSelRecipe(on?null:r)}
                  style={{ ...S.row, cursor:'pointer', border:`1.5px solid ${on?'#22c55e':'#d1e8d1'}`, background:on?'#0a1a0a':'#f5f9f5' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, color:'#0f1f0f', marginBottom:4 }}>{r.title}</div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {r.dishes?.name && <span style={{ fontSize:11, padding:'1px 7px', borderRadius:20, background:'#f9731618', color:'#f97316', border:'1px solid #f9731633' }}>🍽 {r.dishes.name}</span>}
                        {r.tv_shows?.name && <span style={{ fontSize:11, padding:'1px 7px', borderRadius:20, background:'#f59e0b18', color:'#f59e0b', border:'1px solid #f59e0b33' }}>📺 {r.tv_shows.name}</span>}
                        {r.chefs?.name && <span style={{ fontSize:11, padding:'1px 7px', borderRadius:20, background:'#a855f718', color:'#7c3aed', border:'1px solid #a855f733' }}>👨‍🍳 {r.chefs.name}</span>}
                        {r.episode && <span style={{ fontSize:11, color:'#666' }}>{r.episode}</span>}
                      </div>
                    </div>
                    <button onClick={e=>{ e.stopPropagation(); del(r.id, r.title) }}
                      style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif", flexShrink:0 }}>삭제</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {selRecipe && (
          <SectionCard title={`🥕 "${selRecipe.title}" 재료 연결`}>
            {recipeIngs.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:14 }}>
                {recipeIngs.map(ri=>(
                  <div key={ri.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    background:'#f5f9f5', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
                    <span style={{ color:'#0f1f0f', fontWeight:600 }}>{ri.ingredients?.name}</span>
                    <span style={{ color:'#4b6e4b' }}>{ri.amount}</span>
                    <button onClick={()=>unlinkIng(ri.id)}
                      style={{ padding:'2px 7px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:8, alignItems:'flex-end' }}>
              <SearchSelect label="식재료 선택/검색" items={ingredients} value={linkIngId} onChange={setLinkIngId} placeholder="재료 검색..." />
              <div>
                <label style={S.label}>양</label>
                <input value={linkAmount} onChange={e=>setLinkAmount(e.target.value)} placeholder="200g" style={{ ...S.input, width:90 }} />
              </div>
              <button onClick={linkIng} style={{ ...S.btn('#22c55e'), padding:'10px 14px' }}>추가</button>
            </div>
          </SectionCard>
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
  { id:'chef',      label:'👨‍🍳 셰프' },
  { id:'ingredient', label:'🥕 식재료' },
  { id:'dish',      label:'🍽 요리' },
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
      {subTab === 'recipe'    && <RecipeTab     adminToken={adminToken} showToast={showToast} confirmDelete={confirmDelete} />}
    </div>
  )
}
