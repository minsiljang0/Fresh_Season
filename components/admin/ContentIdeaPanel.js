import { useState, useEffect, useCallback } from 'react'
import { S } from './AdminUI'

const ACCENT = '#16a34a'

const SECTIONS = [
  { value: 'ingredient', label: '🥕 식재료',   color: '#16a34a', bg: '#f0fdf4' },
  { value: 'season',     label: '🌤️ 계절/날씨', color: '#0ea5e9', bg: '#f0f9ff' },
  { value: 'health',     label: '💊 건강/효능', color: '#8b5cf6', bg: '#faf5ff' },
  { value: 'food',       label: '🍽️ 음식/요리', color: '#f59e0b', bg: '#fffbeb' },
  { value: 'festival',   label: '🎉 절기/행사', color: '#ef4444', bg: '#fff1f2' },
  { value: 'special',    label: '⭐ 특집/테마', color: '#ec4899', bg: '#fdf4ff' },
  { value: 'angle',      label: '✏️ 각도/기획', color: '#6b7280', bg: '#f9fafb' },
]

const TYPE_LABELS = {
  idea:    { label: '아이디어', color: '#60a5fa' },
  keyword: { label: '키워드',   color: '#16a34a' },
  angle:   { label: '각도',     color: '#f59e0b' },
  memo:    { label: '메모',     color: '#a78bfa' },
}

const MONTH_ICONS   = ['❄️','🌸','🌸','🌿','🌿','☀️','☀️','☀️','🍂','🍂','🍁','❄️']
const MONTH_SEASONS = ['겨울','봄','봄','봄','초여름','여름','여름','여름','가을','가을','가을','겨울']

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth()+1}/${d.getDate()}`
}

function fmtUsedAt(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth()+1}월 ${d.getDate()}일 사용`
}

// ── 추가 모달 ────────────────────────────────────────────────
function AddIdeaModal({ activeMonth, onClose, onSave }) {
  const [form, setForm] = useState({
    section: 'ingredient', type: 'idea',
    content: '', keyword: '', angle: '', memo: '',
  })
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', border:'1px solid #d1e8d1', borderRadius:14, padding:28, width:480, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:4, color:'#0f1f0f' }}>
          {MONTH_ICONS[activeMonth-1]} {activeMonth}월 글감 추가
        </div>
        <div style={{ fontSize:12, color:'#888', marginBottom:20 }}>{MONTH_SEASONS[activeMonth-1]} 시즌</div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={S.label}>섹션</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {SECTIONS.map(s => (
                <button key={s.value} onClick={() => set('section', s.value)} style={{
                  padding:'6px 12px', borderRadius:20, border:'none', cursor:'pointer',
                  fontSize:12, fontWeight:700,
                  background: form.section === s.value ? s.bg : '#f5f5f5',
                  color: form.section === s.value ? s.color : '#999',
                  outline: form.section === s.value ? `1.5px solid ${s.color}` : 'none',
                }}>{s.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={S.label}>종류</label>
            <div style={{ display:'flex', gap:6 }}>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <button key={k} onClick={() => set('type', k)} style={{
                  padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer',
                  fontSize:13, fontWeight:700,
                  background: form.type === k ? '#f0fdf4' : '#f5f5f5',
                  color: form.type === k ? v.color : '#999',
                  outline: form.type === k ? `1.5px solid ${v.color}` : 'none',
                }}>{v.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={S.label}>내용 *</label>
            <textarea value={form.content} onChange={e => set('content', e.target.value)}
              placeholder="글감 아이디어를 입력하세요" rows={3} style={{ ...S.textarea }} />
          </div>
          <div>
            <label style={S.label}>각도 (선택)</label>
            <input value={form.angle} onChange={e => set('angle', e.target.value)}
              style={{ ...S.input }} placeholder="예: 복날 보양식으로서의 민어" />
          </div>
          <div>
            <label style={S.label}>타겟 키워드 (선택)</label>
            <input value={form.keyword} onChange={e => set('keyword', e.target.value)}
              style={{ ...S.input }} placeholder="예: 민어 효능, 민어 제철" />
          </div>
          <div>
            <label style={S.label}>메모 (선택)</label>
            <input value={form.memo} onChange={e => set('memo', e.target.value)}
              style={{ ...S.input }} placeholder="추가 메모" />
          </div>
        </div>

        <div style={{ display:'flex', gap:8, marginTop:20, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ ...S.btnGhost }}>취소</button>
          <button
            onClick={() => { if (form.content.trim()) onSave({ ...form, tab_id: `month_${activeMonth}` }) }}
            disabled={!form.content.trim()}
            style={{ ...S.btn(), opacity: form.content.trim() ? 1 : 0.4 }}>저장</button>
        </div>
      </div>
    </div>
  )
}

// ── 아이디어 카드 ────────────────────────────────────────────
function IdeaCard({ idea, onToggle, onDelete, index, onMoveUp, onMoveDown, isFirst, isLast }) {
  const sec = SECTIONS.find(s => s.value === idea.tool_id) || SECTIONS[6]
  const typ = TYPE_LABELS[idea.type] || TYPE_LABELS.idea
  const isUsed = idea.status === 'used'

  return (
    <div style={{
      background: isUsed ? '#fafafa' : '#fff',
      border: `1px solid ${isUsed ? '#e5e7eb' : '#d1e8d1'}`,
      borderLeft: `4px solid ${isUsed ? '#d1d5db' : sec.color}`,
      borderRadius: 10, padding:'12px 14px',
      opacity: isUsed ? 0.6 : 1,
      display:'flex', alignItems:'flex-start', gap:10,
    }}>
      {/* 순서 */}
      <div style={{ display:'flex', flexDirection:'column', gap:2, flexShrink:0, paddingTop:2 }}>
        <button onClick={onMoveUp} disabled={isFirst}
          style={{ background:'none', border:'none', cursor: isFirst ? 'default' : 'pointer', color: isFirst ? '#ddd' : '#aaa', fontSize:11, lineHeight:1, padding:'2px 4px' }}>▲</button>
        <span style={{ fontSize:11, color:'#ccc', textAlign:'center', lineHeight:1 }}>{index+1}</span>
        <button onClick={onMoveDown} disabled={isLast}
          style={{ background:'none', border:'none', cursor: isLast ? 'default' : 'pointer', color: isLast ? '#ddd' : '#aaa', fontSize:11, lineHeight:1, padding:'2px 4px' }}>▼</button>
      </div>

      {/* 본문 */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:10, background:sec.bg, color:sec.color }}>{sec.label}</span>
          <span style={{ fontSize:11, fontWeight:700, color:typ.color }}>#{typ.label}</span>
          {isUsed && (
            <span style={{ fontSize:11, color:'#16a34a', fontWeight:700, background:'#dcfce7', padding:'2px 7px', borderRadius:6 }}>
              ✓ {fmtUsedAt(idea.used_at)}
            </span>
          )}
          <span style={{ fontSize:11, color:'#bbb', marginLeft:'auto' }}>등록 {fmtDate(idea.created_at)}</span>
        </div>
        <div style={{ fontSize:14, color: isUsed ? '#9ca3af' : '#111', lineHeight:1.6, wordBreak:'break-word' }}>{idea.content}</div>
        {idea.keyword && <div style={{ fontSize:12, color:'#16a34a', marginTop:5 }}>🔑 {idea.keyword}</div>}
        {idea.memo && <div style={{ fontSize:12, color:'#888', marginTop:4, fontStyle:'italic' }}>📝 {idea.memo}</div>}
      </div>

      {/* 액션 */}
      <div style={{ display:'flex', gap:5, flexShrink:0 }}>
        <button onClick={onToggle}
          title={isUsed ? '미사용으로 되돌리기' : '사용 완료 처리'}
          style={{
            background: isUsed ? '#f0fdf4' : 'none',
            border: `1px solid ${isUsed ? '#86efac' : '#d1e8d1'}`,
            borderRadius:7, color: isUsed ? '#16a34a' : '#6b7280',
            cursor:'pointer', padding:'5px 9px', fontSize:13
          }}>
          {isUsed ? '↩' : '✓'}
        </button>
        <button onClick={onDelete}
          style={{ background:'none', border:'1px solid #fecaca', borderRadius:7, color:'#f87171', cursor:'pointer', padding:'5px 9px', fontSize:13 }}>×</button>
      </div>
    </div>
  )
}

// ── 섹션 그룹 ────────────────────────────────────────────────
function SectionGroup({ section, ideas, allIdeas, onToggle, onDelete, onMove }) {
  const [collapsed, setCollapsed] = useState(false)
  if (ideas.length === 0) return null
  const pendingCnt = ideas.filter(i => i.status !== 'used').length

  return (
    <div style={{ marginBottom:16 }}>
      <div onClick={() => setCollapsed(p => !p)} style={{
        display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
        background: section.bg, borderRadius:8, cursor:'pointer', marginBottom:8,
        border:`1px solid ${section.color}22`,
      }}>
        <span style={{ fontSize:14 }}>{section.label}</span>
        <span style={{ fontSize:12, color:section.color, fontWeight:700 }}>{pendingCnt}개 미사용</span>
        {ideas.length !== pendingCnt && (
          <span style={{ fontSize:11, color:'#9ca3af' }}>({ideas.length - pendingCnt}개 완료)</span>
        )}
        <span style={{ marginLeft:'auto', color:section.color, fontSize:12 }}>{collapsed ? '▶' : '▼'}</span>
      </div>
      {!collapsed && (
        <div style={{ display:'flex', flexDirection:'column', gap:6, paddingLeft:4 }}>
          {ideas.map((idea, idx) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              index={allIdeas.findIndex(i => i.id === idea.id)}
              isFirst={idx === 0}
              isLast={idx === ideas.length - 1}
              onToggle={() => onToggle(idea.id, idea.status)}
              onDelete={() => onDelete(idea.id)}
              onMoveUp={() => onMove(idea.id, 'up', section.value)}
              onMoveDown={() => onMove(idea.id, 'down', section.value)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── 메인 패널 ────────────────────────────────────────────────
export default function ContentIdeaPanel({ adminToken }) {
  const thisMonth = new Date().getMonth() + 1
  const [activeMonth, setActiveMonth] = useState(thisMonth)
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filterStatus, setFilterStatus] = useState('pending')
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/content-ideas', { headers: { 'x-admin-token': adminToken } })
      const data = await res.json()
      if (Array.isArray(data.ideas)) setIdeas(data.ideas)
    } catch {}
    setLoading(false)
  }, [adminToken])

  useEffect(() => { load() }, [load])

  const addIdea = async (form) => {
    setShowAdd(false)
    const res = await fetch('/api/admin/content-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify(form),
    })
    if (res.ok) { showToast('✅ 추가됨'); load() }
  }

  const toggleStatus = async (id, current) => {
    const next = current === 'used' ? 'pending' : 'used'
    const used_at = next === 'used' ? new Date().toISOString() : null
    await fetch('/api/admin/content-ideas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ action: 'update_status', id, status: next, used_at }),
    })
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, status: next, used_at } : i))
    showToast(next === 'used' ? '✅ 사용 처리됨' : '↩ 미사용으로 되돌림')
  }

  const deleteIdea = async (id) => {
    if (!confirm('삭제할까요?')) return
    await fetch('/api/admin/content-ideas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ id }),
    })
    setIdeas(prev => prev.filter(i => i.id !== id))
    showToast('삭제됨')
  }

  const moveIdea = async (id, direction, sectionValue) => {
    const tabId = `month_${activeMonth}`
    const sectionIdeas = ideas.filter(i => i.tab_id === tabId && i.tool_id === sectionValue)
    const idx = sectionIdeas.findIndex(i => i.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sectionIdeas.length) return
    const newIdeas = [...ideas]
    const aIdx = newIdeas.findIndex(i => i.id === sectionIdeas[idx].id)
    const bIdx = newIdeas.findIndex(i => i.id === sectionIdeas[swapIdx].id)
    ;[newIdeas[aIdx], newIdeas[bIdx]] = [newIdeas[bIdx], newIdeas[aIdx]]
    setIdeas(newIdeas)
    const orders = newIdeas
      .filter(i => i.tab_id === tabId && i.tool_id === sectionValue)
      .map((i, idx) => ({ id: i.id, sort_order: idx }))
    await fetch('/api/admin/content-ideas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ action: 'update_sort', orders }),
    })
  }

  const tabId = `month_${activeMonth}`
  const tabIdeas = ideas.filter(i => {
    if (i.tab_id !== tabId) return false
    if (filterStatus === 'pending' && i.status === 'used') return false
    if (filterStatus === 'used' && i.status !== 'used') return false
    return true
  })
  const totalPending = ideas.filter(i => i.tab_id === tabId && i.status === 'pending').length
  const totalUsed    = ideas.filter(i => i.tab_id === tabId && i.status === 'used').length

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div style={{ fontSize:17, fontWeight:700, color:'#0f1f0f' }}>💡 글감 관리</div>
        <button onClick={() => setShowAdd(true)} style={{ ...S.btn(), padding:'8px 16px', fontSize:13 }}>+ 추가</button>
      </div>

      {/* 월별 탭 */}
      <div style={{ overflowX:'auto', marginBottom:20, paddingBottom:4 }}>
        <div style={{ display:'flex', gap:4, borderBottom:'2px solid #e5e7eb', minWidth:'max-content' }}>
          {MONTH_ICONS.map((icon, i) => {
            const m = i + 1
            const mid = `month_${m}`
            const cnt = ideas.filter(x => x.tab_id === mid && x.status === 'pending').length
            const isActive = activeMonth === m
            const isNow = m === thisMonth
            return (
              <button key={m} onClick={() => setActiveMonth(m)} style={{
                padding:'10px 14px', background:'none', border:'none',
                borderBottom: isActive ? `2px solid ${ACCENT}` : '2px solid transparent',
                marginBottom:-2,
                color: isActive ? ACCENT : '#6b7280',
                fontSize:13, fontWeight: isActive ? 700 : 500,
                cursor:'pointer', display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap',
              }}>
                <span>{icon}</span>
                <span>{m}월</span>
                {isNow && <span style={{ fontSize:9, background:'#fef3c7', color:'#d97706', padding:'1px 4px', borderRadius:4, fontWeight:700 }}>NOW</span>}
                {cnt > 0 && <span style={{ fontSize:10, background:'#dcfce7', color:ACCENT, padding:'1px 5px', borderRadius:8, fontWeight:700 }}>{cnt}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* 월 요약 헤더 */}
      <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'12px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
        <span style={{ fontSize:22 }}>{MONTH_ICONS[activeMonth-1]}</span>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:'#0f1f0f' }}>{activeMonth}월 — {MONTH_SEASONS[activeMonth-1]} 시즌</div>
          <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>
            <span style={{ color:ACCENT, fontWeight:700 }}>미작성 {totalPending}개</span>
            {totalUsed > 0 && <span style={{ marginLeft:10, color:'#9ca3af' }}>완료 {totalUsed}개</span>}
          </div>
        </div>
        <div style={{ marginLeft:'auto' }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ ...S.input, width:'auto', padding:'6px 10px', fontSize:12 }}>
            <option value="pending">미사용만</option>
            <option value="used">사용됨만</option>
            <option value="">전체</option>
          </select>
        </div>
      </div>

      {/* 섹션별 목록 */}
      {loading ? (
        <div style={{ color:'#888', fontSize:14, padding:'40px 0', textAlign:'center' }}>불러오는 중...</div>
      ) : tabIdeas.length === 0 ? (
        <div style={{ color:'#aaa', fontSize:14, padding:'60px 0', textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>{MONTH_ICONS[activeMonth-1]}</div>
          <div style={{ marginBottom:16 }}>
            {filterStatus === 'used' ? `${activeMonth}월에 완료된 글감이 없어요` : `${activeMonth}월 글감이 없어요`}
          </div>
          {filterStatus !== 'used' && (
            <button onClick={() => setShowAdd(true)} style={{ ...S.btn(), fontSize:13 }}>+ 첫 글감 추가하기</button>
          )}
        </div>
      ) : (
        SECTIONS.map(sec => {
          const secIdeas = tabIdeas.filter(i => i.tool_id === sec.value)
          return (
            <SectionGroup
              key={sec.value}
              section={sec}
              ideas={secIdeas}
              allIdeas={tabIdeas}
              onToggle={toggleStatus}
              onDelete={deleteIdea}
              onMove={moveIdea}
            />
          )
        })
      )}

      {showAdd && (
        <AddIdeaModal activeMonth={activeMonth} onClose={() => setShowAdd(false)} onSave={addIdea} />
      )}

      {toast && (
        <div style={{
          position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
          background:'#fff', border:'1px solid #d1e8d1', borderRadius:10,
          padding:'12px 22px', fontSize:14, color:'#0f1f0f', zIndex:9999,
          boxShadow:'0 8px 24px rgba(22,163,74,0.15)',
        }}>{toast}</div>
      )}
    </div>
  )
}
