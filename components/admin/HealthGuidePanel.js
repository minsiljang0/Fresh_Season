import { useState, useEffect, useCallback } from 'react'

const HEALTH_CATEGORIES = [
  '','면역·항산화','활력·피로회복','뼈·관절','혈관·심장',
  '혈당·당뇨','간·해독','신장·비뇨','소화·장',
  '피부·미용','혈액·빈혈','두뇌·눈','체중·다이어트',
  '호흡기·폐','항암','갱년기·호르몬','수면·신경',
  '치아·구강','체력·근육','임산부·태아',
  '탈모·모발','아토피·피부염','통풍·요산','콜레스테롤',
  '전립선·남성건강','신장·저칼륨','알레르기완화',
  '수험생·집중력','어린이성장','노인·골감소증',
  '귀·청각건강','췌장·담도건강','기타',
]

const AGE_GROUP_OPTIONS = [
  { id: 'infant', label: '👶 영유아' },
  { id: 'child', label: '🧒 어린이' },
  { id: 'middleTeen', label: '🧑‍🎓 중학생' },
  { id: 'highTeen', label: '🎓 고등학생' },
  { id: 'adult', label: '🧑‍💼 성인' },
  { id: 'middle', label: '🧑‍🦳 중장년' },
  { id: 'senior', label: '👴 노년' },
]

const SECTIONS = [
  { id: 'groups', label: '연령대 기준' },
  { id: 'nutrients', label: '영양소' },
  { id: 'issues', label: '질환·검진 이슈' },
  { id: 'checkup_highlights', label: '추가 국가검진' },
  { id: 'school_meal', label: '학교급식 기준' },
  { id: 'checkup_common', label: '공통 필수 검진' },
  { id: 'cancer_screening', label: '국가암검진 6대암' },
  { id: 'sources', label: '출처' },
  { id: 'meta', label: '전역 문구/최종확인일' },
]

const api = (type, extra = '') => `/api/admin/health-guide?type=${type}${extra}`

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, opts)
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `요청 실패 (${res.status})`) }
  return res.json()
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#666', marginBottom: 3 }}>{label}</label>
      {children}
    </div>
  )
}
const inputStyle = { width: '100%', padding: '7px 9px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, boxSizing: 'border-box' }
const btnStyle = (bg, color = '#fff') => ({ padding: '7px 14px', borderRadius: 6, border: 'none', background: bg, color, fontSize: 12, fontWeight: 700, cursor: 'pointer' })

export default function HealthGuidePanel({ adminToken }) {
  const [section, setSection] = useState('issues')
  const [ageGroup, setAgeGroup] = useState('middle')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(null) // 편집중인 row (없으면 새 row 폼)
  const [toast, setToast] = useState('')

  const isGroupScoped = ['nutrients', 'issues', 'checkup_highlights', 'school_meal'].includes(section)

  const load = useCallback(() => {
    setLoading(true)
    const extra = isGroupScoped ? `&age_group_id=${ageGroup}` : ''
    apiFetch(api(section, extra))
      .then(data => setRows(section === 'meta' ? (data ? [data] : []) : (data || [])))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [section, ageGroup, isGroupScoped])

  useEffect(() => { load() }, [load])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const startNew = () => {
    if (section === 'groups') setEditing({ id: '', label: '', age_range: '', emoji: '', kdri_range: '', for_me_note: '', sort_order: rows.length + 1 })
    else if (section === 'cancer_screening') setEditing({ name: '', target: '', cycle: '', method: '', food_category: '', food_link_label: '', note: '', sort_order: rows.length + 1 })
    else if (section === 'sources') setEditing({ label: '', url: '', sort_order: rows.length + 1 })
    else setEditing({ age_group_id: ageGroup, tags: '', body: '', food_category: '', food_link_label: '', note: '', sort_order: rows.length + 1 })
  }

  const startEdit = (row) => {
    setEditing({ ...row, tags: Array.isArray(row.tags) ? row.tags.join(', ') : (row.tags || '') })
  }

  const save = async () => {
    try {
      const isNew = !editing.id && section !== 'meta'
      const payload = { ...editing }
      if (isNew) {
        await apiFetch(api(section), {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
          body: JSON.stringify(payload),
        })
      } else {
        const targetId = section === 'meta' ? '' : `&id=${editing.id}`
        await apiFetch(api(section, targetId), {
          method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
          body: JSON.stringify(payload),
        })
      }
      showToast('✅ 저장했어요')
      setEditing(null)
      load()
    } catch (e) {
      alert('저장 실패: ' + e.message)
    }
  }

  const remove = async (row) => {
    if (!confirm('이 항목을 삭제할까요?')) return
    try {
      await apiFetch(api(section, `&id=${row.id}`), { method: 'DELETE', headers: { 'x-admin-token': adminToken } })
      showToast('🗑️ 삭제했어요')
      load()
    } catch (e) {
      alert('삭제 실패: ' + e.message)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>🩺 연령별 건강 가이드 관리</h2>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
        /health-guide 페이지에 나오는 영양소·질환·검진 데이터와, for-me.js 추천의 근거가 되는 내용을 여기서 직접 수정할 수 있어요.
      </p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => { setSection(s.id); setEditing(null) }}
            style={{ padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${section === s.id ? '#16a34a' : '#ddd'}`,
              background: section === s.id ? '#f0fdf4' : '#fff', color: section === s.id ? '#16a34a' : '#555',
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
            {s.label}
          </button>
        ))}
      </div>

      {isGroupScoped && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {AGE_GROUP_OPTIONS.map(g => (
            <button key={g.id} onClick={() => { setAgeGroup(g.id); setEditing(null) }}
              style={{ padding: '6px 12px', borderRadius: 999, border: `1.5px solid ${ageGroup === g.id ? '#3b82f6' : '#ddd'}`,
                background: ageGroup === g.id ? '#eff6ff' : '#fff', color: ageGroup === g.id ? '#2563eb' : '#555',
                fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {g.label}
            </button>
          ))}
        </div>
      )}

      {section !== 'meta' && (
        <button onClick={startNew} style={{ ...btnStyle('#16a34a'), marginBottom: 14 }}>+ 새 항목 추가</button>
      )}

      {loading ? <p style={{ fontSize: 13, color: '#999' }}>불러오는 중...</p> : (
        <div style={{ display: 'grid', gap: 10 }}>
          {rows.length === 0 && section !== 'meta' && <p style={{ fontSize: 13, color: '#999' }}>등록된 항목이 없어요.</p>}

          {rows.map(row => (
            <div key={row.id || 'meta'} style={{ border: '1px solid #eee', borderRadius: 10, padding: 14, background: '#fafafa' }}>
              {section === 'groups' && (
                <>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{row.emoji} {row.label} <span style={{ color: '#999', fontWeight: 400 }}>({row.age_range})</span></div>
                  <div style={{ fontSize: 12, color: '#777', marginTop: 4 }}>{row.kdri_range}</div>
                  <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>🧬 {row.for_me_note}</div>
                </>
              )}
              {section === 'cancer_screening' && (
                <>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{row.name} <span style={{ color: '#999', fontWeight: 400, fontSize: 12 }}>{row.target} · {row.cycle}</span></div>
                  <div style={{ fontSize: 12, color: '#777', marginTop: 4 }}>{row.method}</div>
                  {row.food_category && <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>🍽️ {row.food_category} — {row.food_link_label}</div>}
                  {row.note && <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>📝 {row.note}</div>}
                </>
              )}
              {section === 'sources' && (
                <div style={{ fontSize: 13 }}><a href={row.url} target="_blank" rel="noopener noreferrer">{row.label}</a></div>
              )}
              {section === 'meta' && (
                <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                  <div><b>최종 확인일:</b> {row.last_verified_label}</div>
                  <div><b>공통검진 제목:</b> {row.checkup_common_title}</div>
                  <div><b>공통검진 부제:</b> {row.checkup_common_subtitle}</div>
                  <div><b>공통검진 설명:</b> {row.checkup_common_note}</div>
                  <div><b>암검진표 제목:</b> {row.cancer_screening_title}</div>
                </div>
              )}
              {['nutrients', 'issues', 'checkup_highlights', 'checkup_common', 'school_meal'].includes(section) && (
                <>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                    {(row.tags || []).map(t => <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: '#e5e7eb', color: '#374151', fontWeight: 700 }}>{t}</span>)}
                  </div>
                  <div style={{ fontSize: 13 }}>{row.body}</div>
                  {row.food_category && <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>🍽️ {row.food_category} — {row.food_link_label}</div>}
                  {row.note && <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>📝 {row.note}</div>}
                </>
              )}

              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button onClick={() => startEdit(row)} style={btnStyle('#3b82f6')}>수정</button>
                {section !== 'meta' && <button onClick={() => remove(row)} style={btnStyle('#dc2626')}>삭제</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: 16 }}
          onClick={() => setEditing(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 20, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>{editing.id ? '수정' : '새 항목 추가'}</h3>

            {section === 'groups' && (
              <>
                <Field label="ID (예: infant)"><input style={inputStyle} value={editing.id} onChange={e => setEditing({ ...editing, id: e.target.value })} disabled={!!rows.find(r => r.id === editing.id)} /></Field>
                <Field label="라벨"><input style={inputStyle} value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })} /></Field>
                <Field label="범위 (예: 0~6세 미만)"><input style={inputStyle} value={editing.age_range} onChange={e => setEditing({ ...editing, age_range: e.target.value })} /></Field>
                <Field label="이모지"><input style={inputStyle} value={editing.emoji} onChange={e => setEditing({ ...editing, emoji: e.target.value })} /></Field>
                <Field label="KDRI 기준 설명"><input style={inputStyle} value={editing.kdri_range} onChange={e => setEditing({ ...editing, kdri_range: e.target.value })} /></Field>
                <Field label="for-me 반영 설명"><textarea style={{ ...inputStyle, minHeight: 60 }} value={editing.for_me_note} onChange={e => setEditing({ ...editing, for_me_note: e.target.value })} /></Field>
                <Field label="정렬순서"><input type="number" style={inputStyle} value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></Field>
              </>
            )}

            {section === 'cancer_screening' && (
              <>
                <Field label="암종 이름"><input style={inputStyle} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></Field>
                <Field label="대상"><input style={inputStyle} value={editing.target} onChange={e => setEditing({ ...editing, target: e.target.value })} /></Field>
                <Field label="주기"><input style={inputStyle} value={editing.cycle} onChange={e => setEditing({ ...editing, cycle: e.target.value })} /></Field>
                <Field label="검진 방법"><input style={inputStyle} value={editing.method} onChange={e => setEditing({ ...editing, method: e.target.value })} /></Field>
                <Field label="연결할 효능 카테고리 (없으면 '없음' 선택)">
                  <select style={inputStyle} value={editing.food_category || ''} onChange={e => setEditing({ ...editing, food_category: e.target.value || null })}>
                    {HEALTH_CATEGORIES.map(c => <option key={c} value={c}>{c || '(없음)'}</option>)}
                  </select>
                </Field>
                <Field label="링크 문구 (예: 위 건강에 도움되는 성분과 식재료 보러가기 →)"><input style={inputStyle} value={editing.food_link_label || ''} onChange={e => setEditing({ ...editing, food_link_label: e.target.value })} /></Field>
                <Field label="판단 근거 메모 (선택)"><textarea style={{ ...inputStyle, minHeight: 50 }} value={editing.note || ''} onChange={e => setEditing({ ...editing, note: e.target.value })} /></Field>
                <Field label="정렬순서"><input type="number" style={inputStyle} value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></Field>
              </>
            )}

            {section === 'sources' && (
              <>
                <Field label="출처 라벨"><input style={inputStyle} value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })} /></Field>
                <Field label="URL"><input style={inputStyle} value={editing.url} onChange={e => setEditing({ ...editing, url: e.target.value })} /></Field>
                <Field label="정렬순서"><input type="number" style={inputStyle} value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></Field>
              </>
            )}

            {section === 'meta' && (
              <>
                <Field label="최종 확인일 (예: 2026년 7월)"><input style={inputStyle} value={editing.last_verified_label || ''} onChange={e => setEditing({ ...editing, last_verified_label: e.target.value })} /></Field>
                <Field label="공통검진 섹션 제목"><input style={inputStyle} value={editing.checkup_common_title || ''} onChange={e => setEditing({ ...editing, checkup_common_title: e.target.value })} /></Field>
                <Field label="공통검진 섹션 부제"><input style={inputStyle} value={editing.checkup_common_subtitle || ''} onChange={e => setEditing({ ...editing, checkup_common_subtitle: e.target.value })} /></Field>
                <Field label="공통검진 섹션 설명"><textarea style={{ ...inputStyle, minHeight: 60 }} value={editing.checkup_common_note || ''} onChange={e => setEditing({ ...editing, checkup_common_note: e.target.value })} /></Field>
                <Field label="암검진표 제목"><input style={inputStyle} value={editing.cancer_screening_title || ''} onChange={e => setEditing({ ...editing, cancer_screening_title: e.target.value })} /></Field>
              </>
            )}

            {['nutrients', 'issues', 'checkup_highlights', 'checkup_common', 'school_meal'].includes(section) && (
              <>
                {isGroupScoped && (
                  <Field label="연령대">
                    <select style={inputStyle} value={editing.age_group_id} onChange={e => setEditing({ ...editing, age_group_id: e.target.value })}>
                      {AGE_GROUP_OPTIONS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                    </select>
                  </Field>
                )}
                <Field label="뱃지 (쉼표로 구분, 예: 칼슘, 비타민D)"><input style={inputStyle} value={editing.tags} onChange={e => setEditing({ ...editing, tags: e.target.value })} /></Field>
                <Field label="설명 문장"><textarea style={{ ...inputStyle, minHeight: 70 }} value={editing.body} onChange={e => setEditing({ ...editing, body: e.target.value })} /></Field>
                <Field label="연결할 효능 카테고리 (없으면 '없음' 선택 — 링크가 사라져요)">
                  <select style={inputStyle} value={editing.food_category || ''} onChange={e => setEditing({ ...editing, food_category: e.target.value || null })}>
                    {HEALTH_CATEGORIES.map(c => <option key={c} value={c}>{c || '(없음)'}</option>)}
                  </select>
                </Field>
                <Field label="링크 문구 (예: 위 건강에 도움되는 성분과 식재료 보러가기 →)"><input style={inputStyle} value={editing.food_link_label || ''} onChange={e => setEditing({ ...editing, food_link_label: e.target.value })} /></Field>
                <Field label="판단 근거 메모 (선택 — 왜 이렇게 연결했는지 남겨두는 칸)"><textarea style={{ ...inputStyle, minHeight: 50 }} value={editing.note || ''} onChange={e => setEditing({ ...editing, note: e.target.value })} /></Field>
                <Field label="정렬순서"><input type="number" style={inputStyle} value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></Field>
              </>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setEditing(null)} style={btnStyle('#e5e7eb', '#374151')}>취소</button>
              <button onClick={save} style={btnStyle('#16a34a')}>저장</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#111', color: '#fff', padding: '10px 20px', borderRadius: 999, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
