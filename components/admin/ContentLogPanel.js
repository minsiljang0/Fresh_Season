import { useState, useEffect, useCallback } from 'react'
import { S, Toast } from './AdminUI'
import { DEFAULT_CATEGORIES, categoryLabel } from '../../lib/blogCategories'

const ANGLE_ORDER = ['제철 소개', 'TV 레시피 연계', '건강 효능 심화', '구입·보관 팁', '산지 탐방']

export default function ContentLogPanel({ adminToken }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('all')
  const [toast, setToast] = useState('')
  const [promptText, setPromptText] = useState('')
  const [promptOpen, setPromptOpen] = useState(false)
  const [form, setForm] = useState({ category: 'seoul', angle: '', title: '', slug: '', memo: '', targetKeyword: '', searchPc: '', searchMobile: '', searchTotal: '', competition: '', publishedAt: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [parseMsg, setParseMsg] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200) }

  const buildClaudePrompt = () => {
    const lines = []
    lines.push('아래는 Fresh Season 블로그 발행 기록입니다. 이 기록을 기준으로 중복 없이 오늘 블로그 글 1편을 써줘.')
    lines.push('')
    if (!logs.length) {
      lines.push('발행 기록: 없음 (처음 시작)')
    } else {
      lines.push(`발행 기록 (${logs.length}건, 최신순):`)
      logs.forEach(l => {
        let line = `- 시도: ${l.category} / 각도: ${l.angle} / 제목: ${l.title} / 슬러그: ${l.slug}${l.published_at ? ' / 발행일: ' + l.published_at : ''}`
        if (l.target_keyword) {
          line += ` / 타겟키워드: ${l.target_keyword}`
          if (l.search_total) line += ` (검색수 ${Number(l.search_total).toLocaleString()}${l.competition ? ' / 경쟁도 ' + l.competition : ''})`
        }
        lines.push(line)
      })
    }
    lines.push('')
    let nextCat = DEFAULT_CATEGORIES[0]
    if (logs.length > 0) {
      const lastCat = logs[0].category
      const idx = DEFAULT_CATEGORIES.indexOf(lastCat)
      nextCat = idx >= 0 ? DEFAULT_CATEGORIES[(idx + 1) % DEFAULT_CATEGORIES.length] : DEFAULT_CATEGORIES[0]
    }
    const usedAngles = logs.filter(l => l.category === nextCat).map(l => l.angle)
    const nextAngle = ANGLE_ORDER.find(a => !usedAngles.includes(a)) || ANGLE_ORDER[usedAngles.length % ANGLE_ORDER.length]
    lines.push(`→ 순환 로직상 다음 시도는 "${categoryLabel(nextCat)}(${nextCat})", 아직 안 쓴 각도는 "${nextAngle}"로 추정됩니다.`)
    lines.push('이 시도·각도가 맞으면 그대로 진행하고, 사용자가 다른 시도를 지정하면 그걸 우선해줘.')
    return lines.join('\n')
  }

  const parsePastedLog = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const picked = { category: '', angle: '', title: '', slug: '', memo: '', targetKeyword: '', searchPc: '', searchMobile: '', searchTotal: '', competition: '', publishedAt: '' }
    const patterns = {
      category: /^(시도|카테고리|category)[:：]\s*(.+)$/i,
      angle: /^(키워드\s*각도|각도|angle)[:：]\s*(.+)$/i,
      title: /^(제목|title)[:：]\s*(.+)$/i,
      slug: /^(슬러그|slug)[:：]\s*(.+)$/i,
      memo: /^(메모|비고|memo)[:：]\s*(.+)$/i,
      targetKeyword: /^(타겟\s*키워드|타겟키워드|target.?keyword)[:：]\s*(.+)$/i,
      searchPc: /^(PC\s*검색수|search.?pc)[:：]\s*(.+)$/i,
      searchMobile: /^(모바일\s*검색수|search.?mobile)[:：]\s*(.+)$/i,
      searchTotal: /^(검색수\s*합계|합계|search.?total)[:：]\s*(.+)$/i,
      competition: /^(경쟁도|competition)[:：]\s*(.+)$/i,
      publishedAt: /^(발행일|date)[:：]\s*(.+)$/i,
    }
    lines.forEach(line => {
      for (const key of Object.keys(patterns)) {
        const m = line.match(patterns[key])
        if (m) picked[key] = m[2].trim()
      }
    })
    return picked
  }

  const handlePasteParse = (text) => {
    setPasteText(text)
    if (!text.trim()) { setParseMsg(''); return }
    const picked = parsePastedLog(text)
    const found = Object.entries(picked).filter(([, v]) => v)
    if (!found.length) { setParseMsg('⚠️ 인식된 항목이 없습니다.'); return }
    setForm(f => ({
      category: picked.category && DEFAULT_CATEGORIES.includes(picked.category) ? picked.category : f.category,
      angle: picked.angle || f.angle,
      title: picked.title || f.title,
      slug: picked.slug || f.slug,
      memo: picked.memo || f.memo,
      targetKeyword: picked.targetKeyword || f.targetKeyword,
      searchPc: picked.searchPc || f.searchPc,
      searchMobile: picked.searchMobile || f.searchMobile,
      searchTotal: picked.searchTotal || f.searchTotal,
      competition: picked.competition || f.competition,
      publishedAt: picked.publishedAt || f.publishedAt,
    }))
    const labels = { category: '시도', angle: '각도', title: '제목', slug: '슬러그', memo: '메모', targetKeyword: '타겟키워드', searchPc: 'PC검색수', searchMobile: '모바일검색수', searchTotal: '합계검색수', competition: '경쟁도', publishedAt: '발행일' }
    setParseMsg(`✅ ${found.map(([k]) => labels[k]).join(', ')} 자동 입력됨 — 확인 후 "기록 추가" 눌러주세요`)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/content-log', { headers: { 'x-admin-token': adminToken } })
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch { showToast('❌ 불러오기 실패') }
    setLoading(false)
  }, [adminToken])

  useEffect(() => { load() }, [load])

  const addLog = async () => {
    if (!form.category || !form.angle.trim() || !form.title.trim() || !form.slug.trim()) {
      showToast('⚠️ 시도·각도·제목·슬러그는 필수입니다'); return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/content-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setForm(f => ({ ...f, angle: '', title: '', slug: '', memo: '', targetKeyword: '', searchPc: '', searchMobile: '', searchTotal: '', competition: '', publishedAt: new Date().toISOString().slice(0, 10) }))
      setPasteText(''); setParseMsg('')
      showToast('✅ 기록 추가됨'); load()
    } catch { showToast('❌ 저장 실패') }
    setSaving(false)
  }

  const deleteLog = async (id) => {
    if (!confirm('이 기록을 삭제할까요?')) return
    try {
      await fetch(`/api/admin/content-log?id=${id}`, { method: 'DELETE', headers: { 'x-admin-token': adminToken } })
      showToast('🗑 삭제됨'); load()
    } catch { showToast('❌ 삭제 실패') }
  }

  const filtered = filterCat === 'all' ? logs : logs.filter(l => l.category === filterCat)

  return (
    <div>
      <Toast msg={toast} />
      <div style={S.card}>
        <div style={S.cardTitle}>📋 발행 기록 (관리자 전용)</div>
        <p style={{ color: '#888', fontSize: 13, lineHeight: 1.7, marginBottom: 18 }}>
          Claude가 글을 작성할 때마다 어떤 시도를, 어떤 각도로 다뤘는지 기록합니다.
          아래 붙여넣기 칸에 Claude가 준 발행 기록을 붙여넣으면 자동으로 입력됩니다.
        </p>

        <div style={{ marginBottom: 18 }}>
          <label style={S.label}>📋 Claude가 준 발행 기록을 여기에 붙여넣으세요</label>
          <textarea value={pasteText} onChange={e => handlePasteParse(e.target.value)}
            placeholder={'시도: gangwon\n각도: 제철 소개\n제목: 강원도 오징어 제철 시기와 건강 효능\n슬러그: gangwon-ojingeo-season\n발행일: 2026-06-22'}
            rows={5} style={{ ...S.textarea, marginBottom: 6 }} />
          {parseMsg && <div style={{ fontSize: 12, color: parseMsg.startsWith('✅') ? '#4ade80' : '#fbbf24' }}>{parseMsg}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={S.label}>시도</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={S.input}>
              {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>키워드 각도</label>
            <input value={form.angle} onChange={e => setForm(f => ({ ...f, angle: e.target.value }))} placeholder="예: 제철 소개" style={S.input} />
          </div>
          <div>
            <label style={S.label}>제목</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="글 제목" style={S.input} />
          </div>
          <div>
            <label style={S.label}>슬러그</label>
            <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="gangwon-ojingeo-season" style={S.input} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>타겟 키워드 (선택)</label>
            <input value={form.targetKeyword} onChange={e => setForm(f => ({ ...f, targetKeyword: e.target.value }))} placeholder="예: 강원도 오징어 제철" style={S.input} />
          </div>
          <div>
            <label style={S.label}>PC 검색수</label>
            <input type="number" value={form.searchPc} onChange={e => setForm(f => ({ ...f, searchPc: e.target.value }))} placeholder="0" style={S.input} />
          </div>
          <div>
            <label style={S.label}>모바일 검색수</label>
            <input type="number" value={form.searchMobile} onChange={e => setForm(f => ({ ...f, searchMobile: e.target.value }))} placeholder="0" style={S.input} />
          </div>
          <div>
            <label style={S.label}>합계 검색수</label>
            <input type="number" value={form.searchTotal} onChange={e => setForm(f => ({ ...f, searchTotal: e.target.value }))} placeholder="0" style={S.input} />
          </div>
          <div>
            <label style={S.label}>경쟁도</label>
            <select value={form.competition} onChange={e => setForm(f => ({ ...f, competition: e.target.value }))} style={S.input}>
              <option value="">-</option>
              <option value="낮음">낮음</option>
              <option value="중간">중간</option>
              <option value="높음">높음</option>
            </select>
          </div>
          <div>
            <label style={S.label}>발행일</label>
            <input type="date" value={form.publishedAt} onChange={e => setForm(f => ({ ...f, publishedAt: e.target.value }))} style={S.input} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>메모 (선택)</label>
            <input value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="비고" style={S.input} />
          </div>
        </div>
        <button onClick={addLog} disabled={saving} style={{ ...S.btn(), opacity: saving ? 0.6 : 1 }}>
          {saving ? '저장 중...' : '+ 기록 추가'}
        </button>
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={S.cardTitle}>📜 기록 목록 ({filtered.length})</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { setPromptText(buildClaudePrompt()); setPromptOpen(true) }}
              style={{ ...S.btn(), padding: '7px 16px', fontSize: 13 }}>🤖 클로드에게 부탁하기</button>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[['all', '전체'], ...DEFAULT_CATEGORIES.map(c => [c, categoryLabel(c)])].map(([key, label]) => (
                <button key={key} onClick={() => setFilterCat(key)} style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: filterCat === key ? 700 : 500,
                  border: `1.5px solid ${filterCat === key ? '#22c55e' : '#2a2a2a'}`,
                  background: filterCat === key ? '#0a2a0a' : '#161616',
                  color: filterCat === key ? '#22c55e' : '#888', cursor: 'pointer',
                  fontFamily: "'Outfit', sans-serif",
                }}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        {promptOpen && (
          <div style={{ background: '#0f1115', border: '1px solid #2a2a2a', borderRadius: 10, padding: 16, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f0' }}>💬 아래 내용을 복사해서 Claude 채팅창에 붙여넣으세요</div>
              <button onClick={() => setPromptOpen(false)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <textarea readOnly value={promptText}
              rows={Math.min(Math.max(promptText.split('\n').length + 1, 6), 16)}
              style={{ ...S.textarea, marginBottom: 10, fontSize: 12, color: '#d4d4d4', background: '#161616' }}
              onFocus={e => e.target.select()} />
            <button onClick={() => {
              navigator.clipboard?.writeText(promptText).catch(() => {
                const ta = document.createElement('textarea'); ta.value = promptText
                ta.style.cssText = 'position:fixed;top:-9999px'; document.body.appendChild(ta)
                ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
              })
              showToast('✅ 복사됨')
            }} style={{ ...S.btn(), padding: '8px 18px', fontSize: 13 }}>📋 복사하기</button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>불러오는 중...</div>
        ) : !filtered.length ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', background: '#161616', borderRadius: 12, border: '1px solid #2a2a2a', color: '#555' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>아직 기록이 없습니다</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(log => (
              <div key={log.id} style={{ ...S.row, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#888', background: '#1f1f1f', borderRadius: 4, padding: '2px 8px', border: '1px solid #2a2a2a' }}>
                      {categoryLabel(log.category)}
                    </span>
                    <span style={{ fontSize: 11, color: '#22c55e' }}>{log.angle}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0', marginBottom: 2 }}>{log.title}</div>
                  <div style={{ fontSize: 12, color: '#555' }}>
                    /blog/{log.slug}
                    {log.published_at && <span style={{ marginLeft: 8, color: '#888' }}>· {log.published_at}</span>}
                    {log.memo && <span style={{ marginLeft: 8, opacity: 0.7 }}>· {log.memo}</span>}
                  </div>
                  {log.target_keyword && (
                    <div style={{ marginTop: 5, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#60a5fa', background: '#0f1f3d', borderRadius: 4, padding: '2px 8px', border: '1px solid #1e3a5f', fontWeight: 700 }}>
                        🔑 {log.target_keyword}
                      </span>
                      {log.search_total != null && (
                        <span style={{ fontSize: 11, color: '#888' }}>
                          검색수 <strong style={{ color: '#f0f0f0' }}>{Number(log.search_total).toLocaleString()}</strong>
                          {log.search_pc != null && <span> (PC {Number(log.search_pc).toLocaleString()} / 모바일 {Number(log.search_mobile).toLocaleString()})</span>}
                        </span>
                      )}
                      {log.competition && (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          background: log.competition === '낮음' ? '#052e16' : log.competition === '중간' ? '#1c1c00' : '#2a0a0a',
                          color: log.competition === '낮음' ? '#4ade80' : log.competition === '중간' ? '#facc15' : '#f87171',
                          border: `1px solid ${log.competition === '낮음' ? '#166534' : log.competition === '중간' ? '#854d0e' : '#7f1d1d'}`,
                        }}>경쟁도 {log.competition}</span>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteLog(log.id)}
                  style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #166534', background: '#052e16', color: '#4ade80', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
