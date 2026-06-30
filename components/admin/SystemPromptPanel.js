import { useState, useEffect, useCallback, useRef } from 'react'
import { S, Toast } from './AdminUI'

const ACCENT = '#16a34a'

const TABS = [
  { id: 'claude', label: '1️⃣ 클로드 실행지침',     desc: 'Claude 전체 행동 지침 — 대화 시작 시 가장 먼저 불러오는 메인 시스템 프롬프트예요.' },
  { id: 'main',   label: '2️⃣ 블로그 글작성지침',   desc: '"오늘 블로그 글 써줘" 할 때 사용하는 지침 — 글 1편 작성·발행 절차예요.' },
  { id: 'month',  label: '3️⃣ 글감관리 월기획지침', desc: '글감관리에서 해당 월 글감을 기획·조사할 때("N월 기획하자") 사용하는 지침이에요.' },
]

export default function SystemPromptPanel({ adminToken }) {
  const [activeTab, setActiveTab] = useState('claude')

  // 탭별로 상태를 분리 보관: { [tabId]: { content, original, updatedAt, loaded } }
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')
  const [copied, setCopied]   = useState(false)

  const token = () => adminToken || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin_token') : '')

  const loadTab = useCallback(async (tabId) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/system-prompt?id=${tabId}`, {
        headers: { 'x-admin-token': token() },
      })
      if (res.ok) {
        const json = await res.json()
        setData(prev => ({
          ...prev,
          [tabId]: { content: json.content || '', original: json.content || '', updatedAt: json.updated_at || '', loaded: true },
        }))
      }
    } catch { /* 무시 */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!data[activeTab]?.loaded) loadTab(activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const cur = data[activeTab] || { content: '', original: '', updatedAt: '', loaded: false }

  const setContent = (val) => {
    setData(prev => ({ ...prev, [activeTab]: { ...cur, content: val } }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/system-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token() },
        body: JSON.stringify({ id: activeTab, content: cur.content }),
      })
      if (!res.ok) throw new Error()
      const kst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
      setData(prev => ({ ...prev, [activeTab]: { ...cur, original: cur.content, updatedAt: kst } }))
      setMsg('✅ 저장됐어요!')
    } catch {
      setMsg('❌ 저장 실패')
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 2500)
  }

  const copyAll = () => {
    navigator.clipboard.writeText(cur.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const downloadMd = () => {
    const blob = new Blob([cur.content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const fileInputRef = useRef(null)

  const onFilePicked = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setContent(ev.target.result || '')
      setMsg('📁 파일 불러왔어요 — 내용 확인 후 저장을 눌러주세요')
      setTimeout(() => setMsg(''), 3000)
    }
    reader.onerror = () => {
      setMsg('❌ 파일을 읽지 못했어요')
      setTimeout(() => setMsg(''), 2500)
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = '' // 같은 파일 다시 선택해도 onChange 발생하도록 초기화
  }

  const isDirty   = cur.content !== cur.original
  const charCount = cur.content.length
  const lineCount = cur.content.split('\n').length

  const fmtDate = (iso) => {
    if (!iso) return ''
    try { return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) }
    catch { return iso }
  }

  const activeMeta = TABS.find(t => t.id === activeTab)

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={S.cardTitle}>🤖 Claude 시스템 프롬프트</div>
            <div style={{ fontSize: 13, color: '#4b6e4b', lineHeight: 1.6 }}>
              Claude 프로젝트 Instructions에 붙여넣을 지침을 여기서 관리해요.<br />
              MCP <code style={{ background: '#e8f5e9', padding: '1px 6px', borderRadius: 4, fontSize: 12, color: '#15803d' }}>get_system_prompt</code> 툴로 Claude가 직접 불러갈 수 있어요.
            </div>
          </div>
          {cur.updatedAt && (
            <span style={{ fontSize: 12, color: '#555', whiteSpace: 'nowrap' }}>
              마지막 저장: {fmtDate(cur.updatedAt)}
            </span>
          )}
        </div>

        {/* 탭 */}
        <div style={{ overflowX: 'auto', marginTop: 18, paddingBottom: 4 }}>
          <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e5e7eb', minWidth: 'max-content' }}>
            {TABS.map(t => {
              const isActive = activeTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: '10px 16px', background: 'none', border: 'none',
                    borderBottom: isActive ? `2px solid ${ACCENT}` : '2px solid transparent',
                    marginBottom: -2,
                    color: isActive ? ACCENT : '#6b7280',
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 10 }}>{activeMeta?.desc}</div>

        {!loading && (
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            {[
              { label: '글자수', value: charCount.toLocaleString() },
              { label: '줄수',   value: lineCount.toLocaleString() },
              { label: '상태',   value: isDirty ? '⚠️ 미저장' : '✅ 저장됨', color: isDirty ? '#d97706' : '#16a34a' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#f5f9f5', border: '1px solid #d1e8d1', borderRadius: 8, padding: '8px 14px', minWidth: 90 }}>
                <div style={{ fontSize: 11, color: '#4b6e4b', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: color || '#0f1f0f' }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={S.card}>
        {loading ? (
          <div style={{ color: '#666', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>불러오는 중...</div>
        ) : (
          <>
            <textarea
              key={activeTab}
              value={cur.content}
              onChange={e => setContent(e.target.value)}
              style={{
                ...S.textarea,
                minHeight: 520,
                fontSize: 13,
                lineHeight: 1.75,
                fontFamily: "'Fira Mono', 'Consolas', monospace",
              }}
              placeholder={`${activeMeta?.label} 지침(마크다운)을 여기에 붙여넣거나 직접 작성하세요...`}
              spellCheck={false}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <button
                onClick={save}
                disabled={saving || !isDirty}
                style={{ ...S.btn(), opacity: (saving || !isDirty) ? 0.45 : 1, cursor: (saving || !isDirty) ? 'not-allowed' : 'pointer' }}
              >
                {saving ? '저장 중...' : '💾 저장'}
              </button>
              <button onClick={() => fileInputRef.current?.click()} style={S.btnGhost}>
                📁 파일 업로드
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,text/markdown,text/plain"
                onChange={onFilePicked}
                style={{ display: 'none' }}
              />
              <button onClick={copyAll} style={S.btnGhost}>
                {copied ? '✅ 복사됨!' : '📋 전체 복사'}
              </button>
              <button onClick={downloadMd} style={S.btnGhost}>
                ⬇️ MD 다운로드
              </button>
              {isDirty && (
                <button onClick={() => setData(prev => ({ ...prev, [activeTab]: { ...cur, content: cur.original } }))} style={{ ...S.btnGhost, color: '#e63946', borderColor: '#e63946' }}>
                  ↩ 되돌리기
                </button>
              )}
            </div>

            {msg && (
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: msg.startsWith('✅') ? '#16a34a' : '#dc2626' }}>
                {msg}
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ ...S.card, background: '#f0fdf4', border: '1px solid #86efac' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginBottom: 12 }}>💡 사용 방법</div>
        <div style={{ fontSize: 13, color: '#166534', lineHeight: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>① 탭(1️⃣ 클로드 실행지침 / 2️⃣ 블로그 글작성지침 / 3️⃣ 글감관리 월기획지침)을 선택해서 각각 따로 수정하고 <b style={{ color: '#0f1f0f' }}>💾 저장</b>을 누르세요.</span>
          <span>⓪ 긴 문서는 직접 타이핑하지 않아도 <b style={{ color: '#0f1f0f' }}>📁 파일 업로드</b> 버튼으로 .md/.txt 파일을 선택하면 내용이 그대로 불러와져요 (이후 💾 저장 필수).</span>
          <span>② Claude 프로젝트 Instructions에는 아래 한 줄만 남겨두세요:</span>
          <code style={{
            display: 'block', background: '#e8f5e9', border: '1px solid #86efac',
            borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#15803d',
            marginTop: 4, marginBottom: 4, lineHeight: 1.6,
          }}>
            대화를 시작하면 즉시 get_system_prompt 툴을 호출해서 전체 지침을 로드하고, 그 지침대로만 행동하세요.
          </code>
          <span>③ MCP <code style={{ background: '#e8f5e9', padding: '1px 6px', borderRadius: 4, fontSize: 12, color: '#15803d' }}>get_system_prompt</code> 툴에 id(<b>claude</b>=클로드 실행지침/<b>main</b>=블로그 글작성지침/<b>month</b>=글감관리 월기획지침)를 넘기면 해당 탭만 불러와요. id를 안 주면 기존 호환을 위해 2️⃣ 블로그 글작성지침 탭 내용을 가져와요.</span>
          <span>④ <b style={{ color: '#0f1f0f' }}>📋 전체 복사</b>로 복사해서 직접 붙여넣는 것도 가능해요.</span>
        </div>
      </div>

      <Toast msg="" />
    </div>
  )
}
