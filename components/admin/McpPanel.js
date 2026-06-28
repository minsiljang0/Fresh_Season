import { useState, useEffect, useCallback } from 'react'
import { S, Toggle, Toast } from './AdminUI'

const ACCENT = '#16a34a'

function AddMcpModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', url: '', description: '' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const valid = form.name.trim() && form.url.trim()

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', border:'1px solid #d1e8d1', borderRadius:14, padding:28, width:500, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:20, color:'#0f1f0f' }}>🔌 MCP 툴 추가</div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={S.label}>툴 이름 *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              style={S.input} placeholder="예: get_publish_log" />
          </div>
          <div>
            <label style={S.label}>MCP URL *</label>
            <input value={form.url} onChange={e => set('url', e.target.value)}
              style={S.input} placeholder="https://example.vercel.app/api/mcp" />
          </div>
          <div>
            <label style={S.label}>설명</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={4} style={S.textarea} placeholder="이 툴이 하는 일을 설명해주세요" />
          </div>
        </div>

        <div style={{ display:'flex', gap:8, marginTop:20, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnGhost}>취소</button>
          <button onClick={() => valid && onSave({ ...form, is_active: true })}
            disabled={!valid}
            style={{ ...S.btn(), opacity: valid ? 1 : 0.4 }}>등록</button>
        </div>
      </div>
    </div>
  )
}

export default function McpPanel({ adminToken }) {
  const [mcps, setMcps] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/mcps', { headers: { 'x-admin-token': adminToken } })
      const data = await res.json()
      if (Array.isArray(data.mcps)) setMcps(data.mcps)
    } catch {}
    setLoading(false)
  }, [adminToken])

  useEffect(() => { load() }, [load])

  const addMcp = async (form) => {
    setShowAdd(false)
    const res = await fetch('/api/admin/mcps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify(form),
    })
    if (res.ok) { showToast('✅ 툴 등록됨'); load() }
  }

  const toggleActive = async (id, current) => {
    await fetch('/api/admin/mcps', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ action: 'toggle', id, is_active: !current }),
    })
    setMcps(prev => prev.map(m => m.id === id ? { ...m, is_active: !current } : m))
    showToast(!current ? '✅ 활성화됨' : '⏸ 비활성화됨')
  }

  const deleteMcp = async (id) => {
    if (!confirm('이 툴을 삭제할까요?')) return
    await fetch('/api/admin/mcps', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ id }),
    })
    setMcps(prev => prev.filter(m => m.id !== id))
    showToast('삭제됨')
  }

  const copyUrl = (url) => {
    navigator.clipboard?.writeText(url).then(() => showToast('URL 복사됨'))
  }

  const activeCount = mcps.filter(m => m.is_active).length

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:17, fontWeight:700, color:'#0f1f0f' }}>🔌 MCP 툴 관리</div>
          <div style={{ fontSize:12, color:'#888', marginTop:3 }}>
            활성 <span style={{ color:ACCENT, fontWeight:700 }}>{activeCount}개</span> / 전체 {mcps.length}개
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ ...S.btn(), padding:'8px 16px', fontSize:13 }}>+ 툴 추가</button>
      </div>

      {loading ? (
        <div style={{ color:'#888', textAlign:'center', padding:'40px 0' }}>불러오는 중...</div>
      ) : mcps.length === 0 ? (
        <div style={{ color:'#aaa', textAlign:'center', padding:'60px 0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔌</div>
          <div style={{ marginBottom:16 }}>등록된 툴이 없어요</div>
          <button onClick={() => setShowAdd(true)} style={{ ...S.btn(), fontSize:13 }}>+ 툴 추가하기</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {mcps.map(m => (
            <div key={m.id} style={{
              background:'#fff',
              border:`1px solid ${m.is_active ? '#d1e8d1' : '#e5e7eb'}`,
              borderLeft:`4px solid ${m.is_active ? ACCENT : '#d1d5db'}`,
              borderRadius:10, overflow:'hidden',
              opacity: m.is_active ? 1 : 0.55,
            }}>
              {/* 헤더 행 */}
              <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
                {/* 이름+URL — 클릭 시 펼치기 */}
                <div style={{ flex:1, minWidth:0, cursor:'pointer' }}
                  onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}>
                  <div style={{ fontWeight:700, fontSize:14, color:'#0f1f0f', fontFamily:'monospace' }}>{m.name}</div>
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.url}</div>
                </div>

                {/* 활성 토글 */}
                <Toggle value={m.is_active} onChange={() => toggleActive(m.id, m.is_active)} />

                {/* 펼치기 화살표 */}
                <span style={{ color:'#aaa', fontSize:12, cursor:'pointer', flexShrink:0 }}
                  onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}>
                  {expandedId === m.id ? '▲' : '▼'}
                </span>
              </div>

              {/* 펼쳐진 내용 */}
              {expandedId === m.id && (
                <div style={{ padding:'0 16px 16px', borderTop:'1px solid #f3f4f6' }}>
                  {/* URL 복사 */}
                  <div style={{ marginTop:12, background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:12, color:'#6b7280', flex:1, fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.url}</span>
                    <button onClick={() => copyUrl(m.url)}
                      style={{ background:'none', border:'1px solid #d1e8d1', borderRadius:6, padding:'4px 10px', fontSize:11, color:ACCENT, cursor:'pointer', fontWeight:700, flexShrink:0 }}>복사</button>
                  </div>

                  {/* 설명 */}
                  {m.description && (
                    <div style={{ marginTop:10, fontSize:13, color:'#374151', lineHeight:1.7 }}>{m.description}</div>
                  )}

                  {/* 삭제 */}
                  <div style={{ marginTop:12 }}>
                    <button onClick={() => deleteMcp(m.id)}
                      style={{ background:'none', border:'1px solid #fecaca', borderRadius:8, padding:'6px 14px', fontSize:12, color:'#ef4444', cursor:'pointer', fontWeight:700 }}>
                      🗑 삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddMcpModal onClose={() => setShowAdd(false)} onSave={addMcp} />}
      <Toast msg={toast} />
    </div>
  )
}
