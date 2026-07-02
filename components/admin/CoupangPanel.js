import { useState, useEffect, useCallback } from 'react'
import { S, Toggle, Toast } from './AdminUI'

const ACCENT = '#ea580c'

const DEFAULT_TEMPLATE = 'https://www.coupang.com/np/search?component=&q={query}&channel={channel}'

const EMPTY = {
  partner_path: '',
  partner_id: '',
  search_template: DEFAULT_TEMPLATE,
  widget_html: '',
  fallback_enabled: false,
  fallback_mode: 'link',
}

export default function CoupangPanel({ adminToken }) {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [previewQuery, setPreviewQuery] = useState('제철 딸기')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/coupang')
      const data = await res.json()
      setForm(p => ({ ...p, ...data }))
    } catch {
      showToast('❌ 불러오기 실패')
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
      if (res.ok) {
        showToast('✅ 저장되었습니다')
      } else {
        showToast(`❌ 저장 실패${data.error ? `: ${data.error}` : ''}`)
      }
    } catch {
      showToast('❌ 저장 실패: 서버 연결 오류')
    }
    setSaving(false)
  }

  const previewUrl = form.search_template
    ? form.search_template
        .replace('{query}', encodeURIComponent(previewQuery))
        .replace('{channel}', encodeURIComponent(form.partner_id || ''))
    : form.partner_path

  if (loading) return <div style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>불러오는 중...</div>

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f1f0f' }}>🛒 쿠팡 관리</div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
          쿠팡 파트너스 기본 경로 / 내 번호 / 위젯을 설정해두면, 개별 상품에 쿠팡 링크가 등록되지 않았을 때 자동으로 대체 노출됩니다.
        </div>
      </div>

      {/* 기본 경로 / 번호 */}
      <div style={S.card}>
        <div style={S.cardTitle}>🔗 파트너스 기본 정보</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={S.label}>쿠팡 파트너스 기본 경로</label>
            <input value={form.partner_path} onChange={e => set('partner_path', e.target.value)}
              placeholder="https://link.coupang.com/a/xxxxxxx" style={S.input} />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
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
              placeholder={DEFAULT_TEMPLATE} style={{ ...S.input, fontFamily: 'monospace', fontSize: 12 }} />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              {'{query}'}는 상품명, {'{channel}'}은 위 파트너스 번호로 자동 치환됩니다.
            </div>
          </div>

          {/* 미리보기 */}
          <div style={{ background: '#fafaf9', border: '1px dashed #d1e8d1', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>미리보기 (예시 상품명)</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <input value={previewQuery} onChange={e => setPreviewQuery(e.target.value)}
                style={{ ...S.input, flex: 1, padding: '6px 10px', fontSize: 12 }} />
            </div>
            <div style={{ fontSize: 12, color: ACCENT, wordBreak: 'break-all' }}>{previewUrl || '(경로 미설정)'}</div>
          </div>
        </div>
      </div>

      {/* 위젯 */}
      <div style={S.card}>
        <div style={S.cardTitle}>📺 대체 위젯 코드</div>
        <label style={S.label}>쿠팡 파트너스 위젯 / 배너 iframe 코드</label>
        <textarea value={form.widget_html} onChange={e => set('widget_html', e.target.value)}
          rows={5} style={{ ...S.textarea, marginBottom: 10 }}
          placeholder='<iframe src="https://ads-partners.coupang.com/widgets.html?..." width="680" height="140" frameborder="0" scrolling="no"></iframe>' />
        {form.widget_html && form.widget_html.includes('<iframe') && (
          <div style={{ background: '#fafaf9', border: '1px dashed #d1e8d1', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>미리보기</div>
            <div dangerouslySetInnerHTML={{ __html: form.widget_html }} />
          </div>
        )}
      </div>

      {/* 대체 노출 규칙 */}
      <div style={S.card}>
        <div style={S.cardTitle}>⚙️ 대체 노출 규칙</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.fallback_enabled ? 16 : 0 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>상품에 쿠팡 링크 미등록 시 자동 대체</div>
            <div style={{ fontSize: 12, color: '#666' }}>OFF면 쿠팡 링크가 없는 상품은 아무것도 노출되지 않습니다</div>
          </div>
          <Toggle value={form.fallback_enabled} onChange={v => set('fallback_enabled', v)} />
        </div>

        {form.fallback_enabled && (
          <div>
            <label style={S.label}>대체 노출 방식</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'link', label: '검색 링크 버튼' },
                { id: 'widget', label: '위젯 코드' },
                { id: 'both', label: '둘 다' },
              ].map(opt => (
                <button key={opt.id} onClick={() => set('fallback_mode', opt.id)}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${form.fallback_mode === opt.id ? ACCENT : '#d1e8d1'}`,
                    background: form.fallback_mode === opt.id ? '#fff7ed' : '#f5f9f5',
                    color: form.fallback_mode === opt.id ? ACCENT : '#4b6e4b',
                    fontWeight: form.fallback_mode === opt.id ? 700 : 500,
                    fontFamily: "'Outfit', sans-serif", fontSize: 13,
                  }}>{opt.label}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button onClick={save} disabled={saving} style={{ ...S.btn(ACCENT), opacity: saving ? 0.6 : 1 }}>
        {saving ? '저장 중...' : '저장하기'}
      </button>

      <Toast msg={toast} />
    </div>
  )
}
