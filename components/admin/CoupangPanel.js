import { useState, useEffect, useCallback } from 'react'
import { S, Toggle } from './AdminUI'
import { COUPANG_TARGET_CATEGORIES, COUPANG_TARGET_GROUPS } from '../../lib/ingredientCategories'

const ACCENT = '#ea580c'
const DEFAULT_TEMPLATE = 'https://www.coupang.com/np/search?component=&q={query}&channel={channel}'

const EMPTY = {
  label: '',
  is_default: false,
  categories: [],
  partner_path: '',
  partner_id: '',
  search_template: DEFAULT_TEMPLATE,
  widget_html: '',
  fallback_enabled: false,
  fallback_mode: 'link',
}

function Toast({ ok, message, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', border:'1px solid #d1e8d1', borderRadius:14, padding:32, width:360, textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize:36, marginBottom:12 }}>{ok ? '✅' : '❌'}</div>
        <div style={{ fontSize:16, fontWeight:700, color:'#0f1f0f', marginBottom:8 }}>
          {ok ? '저장되었습니다' : '처리에 실패했습니다'}
        </div>
        {message && <div style={{ fontSize:13, color:'#6b7280', marginBottom:20, wordBreak:'break-all' }}>{message}</div>}
        <button onClick={onClose} style={{ ...S.btn(ok ? '#16a34a' : '#ef4444'), width:'100%' }}>확인</button>
      </div>
    </div>
  )
}

// 세트 1개를 편집하는 카드
function ProfileCard({ adminToken, profile, isNew, onSaved, onDeleted, onCancelNew }) {
  const [form, setForm] = useState(profile)
  const [saving, setSaving] = useState(false)
  const [previewQuery, setPreviewQuery] = useState('제철 딸기')
  const [open, setOpen] = useState(isNew)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleCategory = (id) => {
    setForm(p => {
      const has = p.categories.includes(id)
      return { ...p, categories: has ? p.categories.filter(c => c !== id) : [...p.categories, id] }
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch('/api/admin/coupang', {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify(isNew ? form : { ...form, id: profile.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        onSaved(isNew ? data : { ...form, id: profile.id })
      } else {
        alert('저장 실패: ' + (data.error || res.status))
      }
    } catch (e) {
      alert('저장 실패: ' + e.message)
    }
    setSaving(false)
  }

  const del = async () => {
    if (!confirm(`"${form.label || '이 세트'}"를 삭제할까요?`)) return
    try {
      const res = await fetch(`/api/admin/coupang?id=${encodeURIComponent(profile.id)}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken },
      })
      if (res.ok) onDeleted(profile.id)
      else alert('삭제 실패')
    } catch (e) {
      alert('삭제 실패: ' + e.message)
    }
  }

  const previewUrl = form.search_template
    ? form.search_template
        .replace('{query}', encodeURIComponent(previewQuery))
        .replace('{channel}', encodeURIComponent(form.partner_id || ''))
    : form.partner_path

  return (
    <div style={S.card}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
        onClick={() => setOpen(p => !p)}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:15, fontWeight:700, color:'#0f1f0f' }}>
            {form.label || (isNew ? '(새 세트)' : '(이름없음)')}
          </span>
          {form.is_default && (
            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'#fff7ed', color:ACCENT, border:`1px solid ${ACCENT}55`, fontWeight:700 }}>
              기본값
            </span>
          )}
          {form.fallback_enabled ? (
            <span style={{ fontSize:11, color:'#16a34a' }}>● 사용중</span>
          ) : (
            <span style={{ fontSize:11, color:'#9ca3af' }}>○ 꺼짐</span>
          )}
        </div>
        <span style={{ fontSize:14, color:'#9ca3af' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={S.label}>세트 이름 (관리용)</label>
            <input value={form.label} onChange={e => set('label', e.target.value)}
              placeholder="예: 채소·나물, 육류, 조리기구" style={S.input} />
          </div>

          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <label style={S.label}>이 세트를 기본값으로 사용</label>
              <Toggle value={form.is_default} onChange={v => set('is_default', v)} />
            </div>
            <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>
              아래 카테고리에 해당하지 않는 상품은 기본값 세트로 대체 노출됩니다. (기본값은 한 세트만 지정 가능)
            </div>
          </div>

          <div>
            <label style={S.label}>적용 대상 카테고리</label>
            <div style={{ fontSize:11, color:'#9ca3af', marginBottom:8 }}>
              선택한 카테고리의 식재료(또는 조리기구)에 쿠팡 링크가 없을 때 이 세트가 사용됩니다.
            </div>
            {COUPANG_TARGET_GROUPS.map(group => (
              <div key={group} style={{ marginBottom:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#4b6e4b', marginBottom:4 }}>{group}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {COUPANG_TARGET_CATEGORIES.filter(c => c.group === group).map(c => {
                    const active = form.categories.includes(c.id)
                    return (
                      <button key={c.id} onClick={() => toggleCategory(c.id)}
                        style={{
                          padding:'5px 10px', borderRadius:20, cursor:'pointer', fontSize:12,
                          border: `1px solid ${active ? ACCENT : '#d1e8d1'}`,
                          background: active ? '#fff7ed' : '#f5f9f5',
                          color: active ? ACCENT : '#4b6e4b',
                          fontWeight: active ? 700 : 500,
                          fontFamily: "'Outfit', sans-serif",
                        }}>{c.emoji} {c.label}</button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label style={S.label}>쿠팡 파트너스 기본 경로</label>
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
            <label style={S.label}>쿠팡 파트너스 위젯 / 배너 iframe 코드</label>
            <textarea value={form.widget_html} onChange={e => set('widget_html', e.target.value)}
              rows={4} style={{ ...S.textarea, marginBottom:10 }}
              placeholder='<iframe src="https://ads-partners.coupang.com/widgets.html?..." width="680" height="140" frameborder="0" scrolling="no"></iframe>' />
            {form.widget_html && form.widget_html.includes('<iframe') && (
              <div style={{ background:'#fafaf9', border:'1px dashed #d1e8d1', borderRadius:8, padding:10 }}>
                <div style={{ fontSize:11, color:'#9ca3af', marginBottom:6 }}>미리보기</div>
                <div dangerouslySetInnerHTML={{ __html: form.widget_html }} />
              </div>
            )}
          </div>

          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: form.fallback_enabled ? 12 : 0 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:2 }}>이 세트로 자동 대체 사용</div>
                <div style={{ fontSize:12, color:'#666' }}>OFF면 이 세트에 해당하는 카테고리라도 대체 노출되지 않습니다</div>
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

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={save} disabled={saving} style={{ ...S.btn(ACCENT), flex:1, opacity: saving ? 0.6 : 1 }}>
              {saving ? '저장 중...' : (isNew ? '세트 추가' : '저장하기')}
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

export default function CoupangPanel({ adminToken }) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [newDraft, setNewDraft] = useState(null) // 추가 중인 새 세트 폼

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/coupang')
      const data = await res.json()
      setProfiles(Array.isArray(data) ? data : [])
    } catch {
      setProfiles([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const addNew = () => {
    setNewDraft({ ...EMPTY, is_default: profiles.length === 0 })
  }

  const onSavedExisting = (updated) => {
    setProfiles(p => p.map(x => x.id === updated.id ? updated : (updated.is_default ? { ...x, is_default: false } : x)))
  }

  const onSavedNew = (created) => {
    setProfiles(p => {
      const next = created.is_default ? p.map(x => ({ ...x, is_default: false })) : p
      return [...next, created]
    })
    setNewDraft(null)
  }

  const onDeleted = (id) => {
    setProfiles(p => p.filter(x => x.id !== id))
  }

  if (loading) return <div style={{ color:'#888', textAlign:'center', padding:'40px 0' }}>불러오는 중...</div>

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:17, fontWeight:700, color:'#0f1f0f' }}>🛒 쿠팡 관리</div>
        <div style={{ fontSize:12, color:'#888', marginTop:3 }}>
          쿠팡 파트너스 세트를 여러 개 만들 수 있어요. 예를 들어 "채소·나물"용 세트, "육류"용 세트, "조리기구"용 세트를 따로 만들면
          카테고리에 맞는 대체 링크가 자동으로 노출됩니다. 어느 카테고리에도 안 걸리면 "기본값" 세트가 사용돼요.
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {profiles.map(p => (
          <ProfileCard key={p.id} adminToken={adminToken} profile={p} isNew={false}
            onSaved={onSavedExisting} onDeleted={onDeleted} />
        ))}

        {newDraft && (
          <ProfileCard adminToken={adminToken} profile={newDraft} isNew={true}
            onSaved={onSavedNew} onDeleted={() => {}} onCancelNew={() => setNewDraft(null)} />
        )}
      </div>

      {!newDraft && (
        <button onClick={addNew}
          style={{ ...S.btn(ACCENT), width:'100%', marginTop:14 }}>
          + 새 세트 추가
        </button>
      )}

      {profiles.length === 0 && !newDraft && (
        <div style={{ fontSize:12, color:'#9ca3af', textAlign:'center', marginTop:12 }}>
          아직 등록된 세트가 없어요. "새 세트 추가"로 시작해보세요.
        </div>
      )}
    </div>
  )
}
