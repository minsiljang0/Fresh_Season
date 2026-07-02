import { useState, useEffect, useCallback } from 'react'
import { S, Toggle } from './AdminUI'

const ACCENT = '#ea580c'

const DEFAULT_TEMPLATE = 'https://www.coupang.com/np/search?component=&q={query}&channel={channel}'

export default function CoupangPanel({ adminToken }) {
  const [form, setForm] = useState({
    partnerPath: '',
    partnerId: '',
    searchTemplate: DEFAULT_TEMPLATE,
    widgetHtml: '',
    fallbackEnabled: false,
    fallbackMode: 'link',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [previewQuery, setPreviewQuery] = useState('제철 딸기')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings/get', { headers: { 'x-admin-token': adminToken } })
      const data = await res.json()
      if (data.coupang) setForm(p => ({ ...p, ...data.coupang }))
    } catch {}
    setLoading(false)
  }, [adminToken])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ coupang: form }),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    } catch {}
    setSaving(false)
  }

  const previewUrl = form.searchTemplate
    ? form.searchTemplate
        .replace('{query}', encodeURIComponent(previewQuery))
        .replace('{channel}', encodeURIComponent(form.partnerId || ''))
    : form.partnerPath

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
            <input value={form.partnerPath} onChange={e => set('partnerPath', e.target.value)}
              placeholder="https://link.coupang.com/a/xxxxxxx" style={S.input} />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              검색 템플릿을 쓰지 않을 경우, 상품에 링크가 없을 때 이 경로로 대체 연결됩니다.
            </div>
          </div>
          <div>
            <label style={S.label}>내 파트너스 번호 (채널 ID / SubID)</label>
            <input value={form.partnerId} onChange={e => set('partnerId', e.target.value)}
              placeholder="예: AF1234567" style={S.input} />
          </div>
          <div>
            <label style={S.label}>검색 링크 템플릿 (선택)</label>
            <input value={form.searchTemplate} onChange={e => set('searchTemplate', e.target.value)}
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
        <textarea value={form.widgetHtml} onChange={e => set('widgetHtml', e.target.value)}
          rows={5} style={{ ...S.textarea, marginBottom: 10 }}
          placeholder='<iframe src="https://ads-partners.coupang.com/widgets.html?..." width="680" height="140" frameborder="0" scrolling="no"></iframe>' />
        {form.widgetHtml && form.widgetHtml.includes('<iframe') && (
          <div style={{ background: '#fafaf9', border: '1px dashed #d1e8d1', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>미리보기</div>
            <div dangerouslySetInnerHTML={{ __html: form.widgetHtml }} />
          </div>
        )}
      </div>

      {/* 대체 노출 규칙 */}
      <div style={S.card}>
        <div style={S.cardTitle}>⚙️ 대체 노출 규칙</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.fallbackEnabled ? 16 : 0 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>상품에 쿠팡 링크 미등록 시 자동 대체</div>
            <div style={{ fontSize: 12, color: '#666' }}>OFF면 쿠팡 링크가 없는 상품은 아무것도 노출되지 않습니다</div>
          </div>
          <Toggle value={form.fallbackEnabled} onChange={v => set('fallbackEnabled', v)} />
        </div>

        {form.fallbackEnabled && (
          <div>
            <label style={S.label}>대체 노출 방식</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'link', label: '검색 링크 버튼' },
                { id: 'widget', label: '위젯 코드' },
                { id: 'both', label: '둘 다' },
              ].map(opt => (
                <button key={opt.id} onClick={() => set('fallbackMode', opt.id)}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${form.fallbackMode === opt.id ? ACCENT : '#d1e8d1'}`,
                    background: form.fallbackMode === opt.id ? '#fff7ed' : '#f5f9f5',
                    color: form.fallbackMode === opt.id ? ACCENT : '#4b6e4b',
                    fontWeight: form.fallbackMode === opt.id ? 700 : 500,
                    fontFamily: "'Outfit', sans-serif", fontSize: 13,
                  }}>{opt.label}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button onClick={save} disabled={saving} style={{ ...S.btn(ACCENT), opacity: saving ? 0.6 : 1 }}>
        {saved ? '✅ 저장됨' : saving ? '저장 중...' : '저장하기'}
      </button>
    </div>
  )
}
