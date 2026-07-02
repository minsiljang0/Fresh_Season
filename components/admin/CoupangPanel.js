import { useState, useEffect, useCallback } from 'react'
import { S, Toggle } from './AdminUI'

const ACCENT = '#ea580c'
const DEFAULT_TEMPLATE = 'https://www.coupang.com/np/search?component=&q={query}&channel={channel}'

const EMPTY_BASE = {
  partner_path: '',
  partner_id: '',
  search_template: DEFAULT_TEMPLATE,
  widget_html: '',
  fallback_enabled: false,
  fallback_mode: 'link',
}

const EMPTY_LINK = { label: '', url: '', widget_html: '', enabled: true }

function ResultToast({ ok, message, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', border:'1px solid #d1e8d1', borderRadius:14, padding:32, width:360, textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize:36, marginBottom:12 }}>{ok ? '✅' : '❌'}</div>
        <div style={{ fontSize:16, fontWeight:700, color:'#0f1f0f', marginBottom:8 }}>
          {ok ? '저장되었습니다' : '저장에 실패했습니다'}
        </div>
        {message && <div style={{ fontSize:13, color:'#6b7280', marginBottom:20, wordBreak:'break-all' }}>{message}</div>}
        <button onClick={onClose} style={{ ...S.btn(ok ? '#16a34a' : '#ef4444'), width:'100%' }}>확인</button>
      </div>
    </div>
  )
}

// ── 기본 정보 카드 (하나) ──────────────────────────────────
function BaseInfoCard({ adminToken }) {
  const [form, setForm] = useState(EMPTY_BASE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [previewQuery, setPreviewQuery] = useState('제철 딸기')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/coupang')
      const data = await res.json()
      setForm(p => ({ ...p, ...data }))
    } catch {
      setResult({ ok: false, message: '설정을 불러오지 못했습니다' })
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/coupang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) setResult({ ok: true, message: '' })
      else setResult({ ok: false, message: data.error || `HTTP ${res.status}` })
    } catch (e) {
      setResult({ ok: false, message: e.message || '서버 연결 오류' })
    }
    setSaving(false)
  }

  const previewUrl = form.search_template
    ? form.search_template
        .replace('{query}', encodeURIComponent(previewQuery))
        .replace('{channel}', encodeURIComponent(form.partner_id || ''))
    : form.partner_path

  if (loading) return <div style={{ ...S.card, color:'#888', textAlign:'center' }}>불러오는 중...</div>

  return (
    <div style={S.card}>
      <div style={S.cardTitle}>🔗 파트너스 기본 정보</div>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div>
          <label style={S.label}>쿠팡 파트너스로 가는 링크 (기본 경로)</label>
          <input value={form.partner_path} onChange={e => set('partner_path', e.target.value)}
            placeholder="https://link.coupang.com/a/xxxxxxx" style={S.input} />
          <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>
            검색 템플릿을 쓰지 않을 경우, 상품에 링크가 없을 때 이 경로로 대체 연결됩니다.
          </div>
        </div>
        <div>
          <label style={S.label}>내 파트너스 번호 (채널 ID / SubID)</label>
          <input value={form.partner_id} onChange={e => set('partner_id', e.target.value)}
            placeholder="예: AF1234567" style={S.input} />
        </div>
        <div>
          <label style={S.label}>검색 링크 템플릿 (선택)</label>
          <input value={form.search_template} onChange={e => set('search_template', e.target.value)}
            placeholder={DEFAULT_TEMPLATE} style={{ ...S.input, fontFamily:'monospace', fontSize:12 }} />
          <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>
            {'{query}'}는 상품명, {'{channel}'}은 위 파트너스 번호로 자동 치환됩니다.
          </div>
        </div>

        <div style={{ background:'#fafaf9', border:'1px dashed #d1e8d1', borderRadius:8, padding:'10px 14px' }}>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:6 }}>미리보기 (예시 상품명)</div>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
            <input value={previewQuery} onChange={e => setPreviewQuery(e.target.value)}
              style={{ ...S.input, flex:1, padding:'6px 10px', fontSize:12 }} />
          </div>
          <div style={{ fontSize:12, color:ACCENT, wordBreak:'break-all' }}>{previewUrl || '(경로 미설정)'}</div>
        </div>

        <div>
          <label style={S.label}>쿠팡 파트너스 위젯 / 배너 iframe 코드 (선택)</label>
          <textarea value={form.widget_html} onChange={e => set('widget_html', e.target.value)}
            rows={4} style={{ ...S.textarea, marginBottom:10 }}
            placeholder='<iframe src="https://ads-partners.coupang.com/widgets.html?..." width="680" height="140" frameborder="0" scrolling="no"></iframe>' />
        </div>

        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: form.fallback_enabled ? 12 : 0 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:2 }}>이 기본 정보로 자동 대체 링크 생성</div>
              <div style={{ fontSize:12, color:'#666' }}>OFF면 아래 검색 링크는 생성되지 않고, 링크 목록에 추가한 링크만 노출됩니다</div>
            </div>
            <Toggle value={form.fallback_enabled} onChange={v => set('fallback_enabled', v)} />
          </div>
          {form.fallback_enabled && (
            <div style={{ display:'flex', gap:8 }}>
              {[
                { id:'link', label:'검색 링크 버튼' },
                { id:'widget', label:'위젯 코드' },
                { id:'both', label:'둘 다' },
              ].map(opt => (
                <button key={opt.id} onClick={() => set('fallback_mode', opt.id)}
                  style={{
                    flex:1, padding:'10px 12px', borderRadius:8, cursor:'pointer',
                    border: `1px solid ${form.fallback_mode === opt.id ? ACCENT : '#d1e8d1'}`,
                    background: form.fallback_mode === opt.id ? '#fff7ed' : '#f5f9f5',
                    color: form.fallback_mode === opt.id ? ACCENT : '#4b6e4b',
                    fontWeight: form.fallback_mode === opt.id ? 700 : 500,
                    fontFamily: "'Outfit', sans-serif", fontSize:13,
                  }}>{opt.label}</button>
              ))}
            </div>
          )}
        </div>

        <button onClick={save} disabled={saving} style={{ ...S.btn(ACCENT), opacity: saving ? 0.6 : 1 }}>
          {saving ? '저장 중...' : '기본 정보 저장'}
        </button>
      </div>

      {result && <ResultToast ok={result.ok} message={result.message} onClose={() => setResult(null)} />}
    </div>
  )
}

// ── 링크 목록 카드 (여러 개 추가) ──────────────────────────
function LinkRow({ adminToken, link, isNew, onSaved, onDeleted, onCancelNew }) {
  const [form, setForm] = useState(link)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(isNew)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch('/api/admin/coupang-links', {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify(isNew ? form : { ...form, id: link.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) onSaved(isNew ? data : { ...form, id: link.id })
      else alert('저장 실패: ' + (data.error || res.status))
    } catch (e) {
      alert('저장 실패: ' + e.message)
    }
    setSaving(false)
  }

  const del = async () => {
    if (!confirm(`"${form.label || '이 링크'}"를 삭제할까요?`)) return
    try {
      const res = await fetch(`/api/admin/coupang-links?id=${encodeURIComponent(link.id)}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken },
      })
      if (res.ok) onDeleted(link.id)
      else alert('삭제 실패')
    } catch (e) {
      alert('삭제 실패: ' + e.message)
    }
  }

  return (
    <div style={{ ...S.row, background:'#fff' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
        onClick={() => setOpen(p => !p)}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontWeight:700, color:'#0f1f0f' }}>{form.label || (isNew ? '(새 링크)' : '(이름없음)')}</span>
          {form.enabled ? <span style={{ fontSize:11, color:'#16a34a' }}>● 사용중</span> : <span style={{ fontSize:11, color:'#9ca3af' }}>○ 꺼짐</span>}
        </div>
        <span style={{ fontSize:13, color:'#9ca3af' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={S.label}>이름 (구분용)</label>
            <input value={form.label} onChange={e => set('label', e.target.value)}
              placeholder="예: 무쇠 냄비, 제철 딸기 특가" style={S.input} />
          </div>
          <div>
            <label style={S.label}>링크 URL</label>
            <input value={form.url} onChange={e => set('url', e.target.value)}
              placeholder="https://link.coupang.com/a/... 또는 https://coupa.ng/..." style={S.input} />
          </div>
          <div>
            <label style={S.label}>위젯 코드 (선택)</label>
            <textarea value={form.widget_html} onChange={e => set('widget_html', e.target.value)}
              rows={3} style={S.textarea}
              placeholder='<iframe src="https://ads-partners.coupang.com/widgets.html?..." ...></iframe>' />
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <label style={S.label}>사용</label>
            <Toggle value={form.enabled} onChange={v => set('enabled', v)} />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={save} disabled={saving} style={{ ...S.btn(ACCENT), flex:1, opacity: saving ? 0.6 : 1 }}>
              {saving ? '저장 중...' : (isNew ? '링크 추가' : '저장하기')}
            </button>
            {isNew ? (
              <button onClick={onCancelNew} style={S.btnGhost}>취소</button>
            ) : (
              <button onClick={del}
                style={{ padding:'10px 16px', borderRadius:8, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontWeight:600, cursor:'pointer', fontFamily:"'Outfit', sans-serif" }}>
                삭제
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function LinksListCard({ adminToken }) {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newDraft, setNewDraft] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/coupang-links')
      const data = await res.json()
      setLinks(Array.isArray(data) ? data : [])
    } catch {
      setLinks([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const addNew = () => setNewDraft({ ...EMPTY_LINK })
  const onSavedExisting = (updated) => setLinks(p => p.map(x => x.id === updated.id ? updated : x))
  const onSavedNew = (created) => { setLinks(p => [...p, created]); setNewDraft(null) }
  const onDeleted = (id) => setLinks(p => p.filter(x => x.id !== id))

  return (
    <div style={S.card}>
      <div style={S.cardTitle}>📋 링크 목록 (필요한 만큼 추가)</div>
      <div style={{ fontSize:12, color:'#888', marginTop:-12, marginBottom:16 }}>
        상품에 쿠팡 링크가 없을 때, 기본 정보로 만든 검색 링크와 함께(또는 대신) 여기 등록한 링크들이 노출됩니다.
      </div>

      {loading ? (
        <div style={{ color:'#888', textAlign:'center', padding:'20px 0' }}>불러오는 중...</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
          {links.map(l => (
            <LinkRow key={l.id} adminToken={adminToken} link={l} isNew={false}
              onSaved={onSavedExisting} onDeleted={onDeleted} />
          ))}
          {newDraft && (
            <LinkRow adminToken={adminToken} link={newDraft} isNew={true}
              onSaved={onSavedNew} onDeleted={() => {}} onCancelNew={() => setNewDraft(null)} />
          )}
          {links.length === 0 && !newDraft && (
            <div style={{ fontSize:12, color:'#9ca3af', textAlign:'center', padding:'10px 0' }}>
              아직 등록된 링크가 없어요.
            </div>
          )}
        </div>
      )}

      {!newDraft && (
        <button onClick={addNew} style={{ ...S.btn(ACCENT), width:'100%' }}>+ 링크 추가</button>
      )}
    </div>
  )
}

export default function CoupangPanel({ adminToken }) {
  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:17, fontWeight:700, color:'#0f1f0f' }}>🛒 쿠팡 관리</div>
        <div style={{ fontSize:12, color:'#888', marginTop:3 }}>
          기본 정보(경로/번호/템플릿)를 설정해두고, 그 아래 링크 목록에 필요한 링크를 원하는 만큼 추가하세요.
          상품에 쿠팡 링크가 없을 때 이 정보들이 대체로 노출됩니다.
        </div>
      </div>

      <BaseInfoCard adminToken={adminToken} />
      <LinksListCard adminToken={adminToken} />
    </div>
  )
}
