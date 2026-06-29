import { useState, useEffect, useCallback } from 'react'
import { S } from './AdminUI'

const ACCENT = '#16a34a'

const SECTIONS = [
  { value: 'angle',      label: '✏️ 각도/기획', color: '#f59e0b', bg: '#fffbeb' },
  { value: 'special',    label: '⭐ 특집/테마', color: '#ec4899', bg: '#fdf4ff' },
  { value: 'ingredient', label: '🥕 식재료',    color: '#16a34a', bg: '#f0fdf4' },
  { value: 'season',     label: '🌤️ 계절/날씨', color: '#0ea5e9', bg: '#f0f9ff' },
  { value: 'health',     label: '💊 건강/효능', color: '#8b5cf6', bg: '#faf5ff' },
  { value: 'food',       label: '🍽️ 음식/요리', color: '#f59e0b', bg: '#fffbeb' },
  { value: 'festival',   label: '🎉 절기/행사', color: '#ef4444', bg: '#fff1f2' },
  { value: 'event',      label: '👤 사용자입력',  color: '#06b6d4', bg: '#ecfeff' },
]

const TYPE_LABELS = {
  idea:    { label: '아이디어', color: '#60a5fa' },
  keyword: { label: '키워드',   color: '#16a34a' },
  angle:   { label: '각도',     color: '#f59e0b' },
  memo:    { label: '메모',     color: '#a78bfa' },
}


const CAT_LABELS = {
  fish:'🐟 생선류', crustacean:'🦞 갑각류', shellfish:'🦪 조개·패류', seaweed:'🌿 해조류',
  other_seafood:'🐙 기타수산', veg:'🥬 채소·나물', root_veg:'🥕 뿌리채소', fruit_veg:'🍆 열매채소',
  herb_veg:'🌱 나물·산채', fruit:'🍑 국내과일', tropical_fruit:'🍌 열대과일', berry:'🍓 베리류',
  grain:'🌾 곡물', processed:'🏭 가공식품', beef:'🥩 소고기', pork:'🐷 돼지고기',
  chicken:'🐔 닭고기', egg:'🥚 달걀', processed_meat:'🌭 가공육', meat:'🍖 기타육류',
  mushroom:'🍄 버섯', wild_herb:'🌿 산채·약초', dairy:'🥛 유제품',
}

const MONTH_ICONS   = ['❄️','🌸','🌸','🌿','🌿','☀️','☀️','☀️','🍂','🍂','🍁','❄️']
const MONTH_SEASONS = ['겨울','봄','봄','봄','초여름','여름','여름','여름','가을','가을','가을','겨울']

const REGION_LABELS = {
  seoul:'서울', busan:'부산', daegu:'대구', incheon:'인천', gwangju:'광주',
  daejeon:'대전', ulsan:'울산', sejong:'세종', gyeonggi:'경기', gangwon:'강원',
  chungbuk:'충북', chungnam:'충남', jeonbuk:'전북', jeonnam:'전남',
  gyeongbuk:'경북', gyeongnam:'경남', jeju:'제주', '해외':'해외',
}

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth()+1}/${d.getDate()}`
}



// ── 카테고리별 소스 현황 ──────────────────────────────────────
function SourceSummary({ ingredients }) {
  if (!ingredients || ingredients.length === 0) return null
  const catCount = {}
  ingredients.forEach(i => {
    const label = CAT_LABELS[i.category] || i.category
    catCount[label] = (catCount[label] || 0) + 1
  })
  return (
    <div style={{ background:'#fff', border:'1px solid #d1e8d1', borderRadius:10, marginBottom:8, overflow:'hidden' }}>
      <div style={{ padding:'6px 16px', background:'#e8f5e9', borderBottom:'1px solid #c8e6c9' }}>
        <span style={{ fontSize:12, fontWeight:800, color:'#1b5e20' }}>📋 소스 현황 요약</span>
      </div>
      <div style={{ padding:'8px 16px', background:'#f0fdf4', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <span style={{ fontSize:13, fontWeight:700, color:'#0f1f0f' }}>📊 {ingredients.length}개 소스 현황</span>
      </div>
    </div>
  )
}

// ── 월간전략 카드 (섹션별 파싱) ─────────────────────────────
function parseStrategy(content) {
  const sections = { bigPicture: '', bigPictureReason: '', priority: [], weeks: [], principle: '' }
  const lines = (content || '').split('\n')
  let current = null
  lines.forEach(line => {
    const t = line.trim()
    if (t === '[이달의 큰 틀]') { current = 'bigPicture'; return }
    if (t.startsWith('근거:')) { sections.bigPictureReason = t.replace('근거:', '').trim(); return }
    if (t === '[놓치면 안 되는 우선 특집/이슈]') { current = 'priority'; return }
    if (t === '[주차별 방향]') { current = 'weeks'; return }
    if (t === '[각도 운영 원칙]') { current = 'principle'; return }
    if (!t) return
    if (current === 'bigPicture' && !sections.bigPicture) sections.bigPicture = t
    else if (current === 'priority' && t.startsWith('-')) sections.priority.push(t.slice(1).trim())
    else if (current === 'weeks' && t.startsWith('-')) sections.weeks.push(t.slice(1).trim())
    else if (current === 'principle') sections.principle += (sections.principle ? ' ' : '') + t
  })
  return sections
}

function StrategyCard({ idea, onDelete, onEdit }) {
  const s = parseStrategy(idea.content)
  const weekColors = ['#fecdd3','#bfdbfe','#d9f99d','#fde68a']
  const weekTextColors = ['#be123c','#1d4ed8','#166534','#92400e']

  return (
    <div style={{ border:'2px solid #7c3aed', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
      {/* 헤더 */}
      <div style={{ background:'#7c3aed', padding:'10px 16px', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>🗺️ 월간 전략</span>
        <span style={{ fontSize:11, color:'#c4b5fd', marginLeft:'auto' }}>등록 {fmtDate(idea.created_at)}</span>
        {onEdit && <button onClick={() => onEdit(idea)} style={{ background:'none', border:'1px solid #c4b5fd', borderRadius:6, color:'#ede9fe', cursor:'pointer', padding:'2px 10px', fontSize:12 }}>수정</button>}
        <button onClick={() => onDelete(idea.id)} style={{ background:'none', border:'1px solid #c4b5fd', borderRadius:6, color:'#ede9fe', cursor:'pointer', padding:'2px 8px', fontSize:12 }}>×</button>
      </div>

      <div style={{ background:'#faf5ff', padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>

        {/* 이달의 큰 틀 */}
        <div style={{ background:'#fff', border:'1px solid #e9d5ff', borderRadius:8, padding:'10px 14px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#7c3aed', marginBottom:6 }}>🎯 이달의 큰 틀</div>
          {s.bigPicture
            ? <div style={{ fontSize:13, fontWeight:700, color:'#1e1b4b', lineHeight:1.6 }}>{s.bigPicture}</div>
            : <div style={{ fontSize:12, color:'#c4b5fd' }}>아직 입력된 내용이 없어요</div>
          }
          {s.bigPictureReason && (
            <div style={{ marginTop:6, fontSize:11, color:'#6b7280', lineHeight:1.6, borderTop:'1px solid #f3f4f6', paddingTop:6 }}>
              💡 {s.bigPictureReason}
            </div>
          )}
        </div>

        {/* 놓치면 안 되는 우선 특집/이슈 */}
        <div style={{ background:'#fff', border:'2px solid #fca5a5', borderRadius:8, padding:'10px 14px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#dc2626', marginBottom:8 }}>🚨 놓치면 안 되는 우선 특집/이슈</div>
          {s.priority.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {s.priority.map((p, i) => {
                const parts = p.split('—')
                return (
                  <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'6px 10px', background:'#fef2f2', borderRadius:6 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#dc2626', flexShrink:0 }}>⚠️</span>
                    <div>
                      <span style={{ fontSize:12, fontWeight:700, color:'#dc2626' }}>{parts[0]?.trim()}</span>
                      {parts[1] && <span style={{ fontSize:11, color:'#9ca3af', marginLeft:6 }}>— {parts[1].trim()}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ fontSize:12, color:'#fca5a5' }}>아직 입력된 내용이 없어요</div>
          )}
        </div>

        {/* 주차별 방향 */}
        <div style={{ background:'#fff', border:'1px solid #e9d5ff', borderRadius:8, padding:'10px 14px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#7c3aed', marginBottom:8 }}>📅 주차별 방향</div>
          {s.weeks.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {s.weeks.map((w, i) => {
                const parts = w.split(':')
                return (
                  <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:10, background: weekColors[i] || '#f3f4f6', color: weekTextColors[i] || '#374151', whiteSpace:'nowrap', flexShrink:0 }}>
                      {parts[0].trim()}
                    </span>
                    <span style={{ fontSize:12, color:'#374151', lineHeight:1.6 }}>{parts.slice(1).join(':').trim()}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {['1주차','2주차','3주차','4주차'].map((lbl, i) => (
                <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:10, background: weekColors[i], color: weekTextColors[i], whiteSpace:'nowrap', flexShrink:0 }}>{lbl}</span>
                  <span style={{ fontSize:12, color:'#c4b5fd' }}>아직 입력된 내용이 없어요</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 각도 운영 원칙 */}
        <div style={{ background:'#f5f3ff', border:'1px solid #e9d5ff', borderRadius:8, padding:'10px 14px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#7c3aed', marginBottom:4 }}>📌 각도 운영 원칙</div>
          {s.principle
            ? <div style={{ fontSize:12, color:'#4c1d95', lineHeight:1.7 }}>{s.principle}</div>
            : <div style={{ fontSize:12, color:'#c4b5fd' }}>아직 입력된 내용이 없어요</div>
          }
        </div>

      </div>
    </div>
  )
}

function fmtUsedAt(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth()+1}월 ${d.getDate()}일 사용`
}

// ── 식재료 카드 (자동 로드) ──────────────────────────────────
// ── 식재료 카드 (맵 관리와 동일한 구조) ────────────────────
const ING_CAT = {
  fish:'🐟생선', crustacean:'🦞갑각류', shellfish:'🦪조개·패류', seaweed:'🌿해조류',
  other_seafood:'🐙기타수산', veg:'🥬잎채소', root_veg:'🥕뿌리채소', fruit_veg:'🍆열매채소',
  herb_veg:'🌱나물·산채', fruit:'🍎국내과일', tropical_fruit:'🍌열대과일', berry:'🍓베리류',
  grain:'🌾곡물·잡곡', processed:'🏭가공식품', beef:'🥩소고기', pork:'🐷돼지고기',
  chicken:'🐔닭고기', egg:'🥚달걀', processed_meat:'🌭가공육', meat:'🍖기타육류',
  mushroom:'🍄버섯', wild_herb:'🌿산채·약초',
}

function SeasonBadge({ v }) {
  const map = {
    spring: ['🌸 봄', '#f0fdf4','#86efac','#166534'],
    summer: ['🌞 여름', '#fefce8','#fde68a','#92400e'],
    fall:   ['🍂 가을', '#fff7ed','#fdba74','#c2410c'],
    winter: ['❄️ 겨울', '#eff6ff','#bae6fd','#1e40af'],
  }
  const d = map[v]; if (!d) return null
  return <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:d[1],border:`1px solid ${d[2]}`,color:d[3],fontWeight:700}}>{d[0]}</span>
}

function JeolgiBadge({ v }) {
  const map = {
    seollal:['🎍 설날','#fdf4ff','#e9d5ff','#7e22ce'],
    sambok:['🔥 삼복','#fff1f2','#fecdd3','#be123c'],
    chopbok:['🔥 초복','#fff1f2','#fecdd3','#be123c'],
    jungbok:['🔥 중복','#fff1f2','#fecdd3','#be123c'],
    malbok:['🔥 말복','#fff1f2','#fecdd3','#be123c'],
    chuseok:['🌕 추석','#fefce8','#fde68a','#854d0e'],
    gimjang:['🥬 김장철','#f0fdf4','#86efac','#166534'],
    dongji:['☯️ 동지','#eff6ff','#bae6fd','#1e40af'],
    dano:['🌿 단오','#f0fdf4','#86efac','#166534'],
  }
  const d = map[v]; if (!d) return null
  return <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:d[1],border:`1px solid ${d[2]}`,color:d[3],fontWeight:700}}>{d[0]}</span>
}

function SpecialBadge({ v }) {
  const map = {
    boyangshik:['💪 보양식','#fff7ed','#fed7aa','#c2410c'],
    jeolgi_food:['🎋 절기음식','#fdf4ff','#e9d5ff','#7e22ce'],
    hangover:['🍶 해장','#fefce8','#fde68a','#854d0e'],
    diet:['🥗 다이어트','#f0fdf4','#86efac','#166534'],
  }
  const d = map[v]; if (!d) return null
  return <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:d[1],border:`1px solid ${d[2]}`,color:d[3],fontWeight:700}}>{d[0]}</span>
}

function HabitatBadge({ v }) {
  const map = {
    island:['🏝️ 섬','#f0f9ff','#7dd3fc','#0369a1'],
    freshwater:['🐟 민물','#eff6ff','#93c5fd','#1d4ed8'],
    tidal:['🌊 갯벌','#f0fdfa','#5eead4','#0f766e'],
    mountain:['🏔️ 산','#f7fee7','#a3e635','#3f6212'],
    ocean:['🌊 바다','#f0f9ff','#38bdf8','#0c4a6e'],
  }
  const d = map[v]; if (!d) return null
  return <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:d[1],border:`1px solid ${d[2]}`,color:d[3],fontWeight:700}}>{d[0]}</span>
}

function FarmingBadge({ v }) {
  const map = {
    aquaculture:['🤿 양식','#fdf4ff','#d8b4fe','#7e22ce'],
    wild:['🎣 자연산','#fff7ed','#fdba74','#c2410c'],
    fermented:['🥟 발효','#fef9c3','#fde68a','#713f12'],
  }
  const d = map[v]; if (!d) return null
  return <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:d[1],border:`1px solid ${d[2]}`,color:d[3],fontWeight:700}}>{d[0]}</span>
}

function IngredientCard({ ing, onDelete }) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [angle, setAngle] = useState('')
  const [memo, setMemo] = useState('')
  const ct = ING_CAT[ing.category] || ''
  const seasonMap  = { spring:['🌸 봄','#f0fdf4','#86efac','#166534'], summer:['🌞 여름','#fefce8','#fde68a','#92400e'], fall:['🍂 가을','#fff7ed','#fdba74','#c2410c'], winter:['❄️ 겨울','#eff6ff','#bae6fd','#1e40af'] }
  const jeolgiMap  = { seollal:['🎍 설날','#fdf4ff','#e9d5ff','#7e22ce'], sambok:['🔥 삼복','#fff1f2','#fecdd3','#be123c'], chopbok:['🔥 초복','#fff1f2','#fecdd3','#be123c'], jungbok:['🔥 중복','#fff1f2','#fecdd3','#be123c'], malbok:['🔥 말복','#fff1f2','#fecdd3','#be123c'], chuseok:['🌕 추석','#fefce8','#fde68a','#854d0e'], gimjang:['🥬 김장철','#f0fdf4','#86efac','#166534'], dongji:['☯️ 동지','#eff6ff','#bae6fd','#1e40af'], dano:['🌿 단오','#f0fdf4','#86efac','#166534'], ipchun:['🌱 입춘','#f0fdf4','#86efac','#166534'], daeboreum:['🌕 정월대보름','#fef9c3','#fde68a','#713f12'], hansik:['🌸 한식','#fdf4ff','#e9d5ff','#7e22ce'] }
  const specialMap = { boyangshik:['💪 보양식','#fff7ed','#fed7aa','#c2410c'], jeolgi_food:['🎋 절기음식','#fdf4ff','#e9d5ff','#7e22ce'], hangover:['🍶 해장','#fefce8','#fde68a','#854d0e'], diet:['🥗 다이어트','#f0fdf4','#86efac','#166534'] }
  const habitatMap = { island:['🏝️ 섬','#f0f9ff','#7dd3fc','#0369a1'], freshwater:['🐟 민물','#eff6ff','#93c5fd','#1d4ed8'], tidal:['🌊 갯벌','#f0fdfa','#5eead4','#0f766e'], mountain:['🏔️ 산','#f7fee7','#a3e635','#3f6212'], ocean:['🌊 바다','#f0f9ff','#38bdf8','#0c4a6e'] }
  const farmingMap = { aquaculture:['🤿 양식','#fdf4ff','#d8b4fe','#7e22ce'], wild:['🎣 자연산','#fff7ed','#fdba74','#c2410c'], fermented:['🥟 발효','#fef9c3','#fde68a','#713f12'] }
  const SB = ({v, map}) => { const d=map[v]; if(!d) return null; return <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:d[1],border:`1px solid ${d[2]}`,color:d[3],fontWeight:700}}>{d[0]}</span> }

  return (
    <div onClick={() => setOpen(p => !p)}
      style={{ ...S.row, cursor:'pointer', border:'1.5px solid #d1e8d1', background:'#fff' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap', marginBottom:3 }}>
            <span style={{ fontWeight:800, color:'#111', fontSize:13 }}>{[...ct][0]} {ing.name}</span>
            {ing.is_special   && <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fef3c7',border:'1px solid #f59e0b',color:'#b45309',fontWeight:700}}>🏆 특산</span>}
            {ing.is_limited   && <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#d1fae5',border:'1px solid #10b981',color:'#059669',fontWeight:700}}>⏰ {ing.limited_days||'기간한정'}</span>}
            {ing.is_superfood && <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#fef3c7',border:'1px solid #f59e0b',color:'#92400e',fontWeight:700}}>🌟 슈퍼푸드</span>}
            {ing.is_global    && <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#dbeafe',border:'1px solid #3b82f6',color:'#1d4ed8',fontWeight:700}}>🌍 해외</span>}
            {ing.is_brand     && <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,background:'#ffe4e6',border:'1px solid #e63946',color:'#e63946',fontWeight:700}}>🏷️ 지역브랜드</span>}
            {(Array.isArray(ing.season_badge)?ing.season_badge:[ing.season_badge]).filter(Boolean).map((v,i)=><SB key={i} v={v} map={seasonMap}/>)}
            {(Array.isArray(ing.jeolgi_badge)?ing.jeolgi_badge:[ing.jeolgi_badge]).filter(Boolean).map((v,i)=><SB key={i} v={v} map={jeolgiMap}/>)}
            {(Array.isArray(ing.special_badge)?ing.special_badge:[ing.special_badge]).filter(Boolean).map((v,i)=><SB key={i} v={v} map={specialMap}/>)}
            {(Array.isArray(ing.habitat_badge)?ing.habitat_badge:[ing.habitat_badge]).filter(Boolean).map((v,i)=><SB key={i} v={v} map={habitatMap}/>)}
            {(Array.isArray(ing.farming_badge)?ing.farming_badge:[ing.farming_badge]).filter(Boolean).map((v,i)=><SB key={i} v={v} map={farmingMap}/>)}
          </div>
          {ing.regions_preview?.length > 0 && (
            <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:3 }}>
              {ing.regions_preview.map((lbl,idx) => (
                <span key={idx} style={{fontSize:10,padding:'1px 6px',borderRadius:10,background:'#dbeafe',border:'1px solid #93c5fd',color:'#1d4ed8',fontWeight:700}}>{lbl}</span>
              ))}
            </div>
          )}
          {(ing.months||[]).length > 0 && (
            <div style={{ display:'flex', gap:2, flexWrap:'wrap', marginBottom:3 }}>
              {ing.months.map(m => (
                <span key={m} style={{fontSize:10,padding:'1px 5px',borderRadius:10,background:'#dcfce7',border:'1px solid #86efac',color:'#166534',fontWeight:700}}>{m}월</span>
              ))}
            </div>
          )}
          <div style={{ fontSize:11, color:'#6b7280' }}>{ct}</div>
          {ing.description && <div style={{ fontSize:11, color:'#8aaa8a', marginTop:2 }}>{ing.description.slice(0,35)}{ing.description.length>35?'…':''}</div>}
          {ing.caution && (
            <div style={{ fontSize:10, marginTop:3, padding:'2px 6px', background:'#fef2f2', borderRadius:4, border:'1px solid #fca5a5' }}>
              <span style={{ color:'#dc2626', fontWeight:700 }}>⚠️ </span>
              <span style={{ color:'#dc2626' }}>{ing.caution.slice(0,35)}{ing.caution.length>35?'…':''}</span>
            </div>
          )}
          {ing.coupang_url && <div style={{ fontSize:10, color:'#ea580c', marginTop:2 }}>🛒 쿠팡</div>}
          <div style={{ display:'flex', gap:4, marginTop:4 }}>
            <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:'#f0fdf4',border:'1px solid #86efac',color:'#16a34a',fontWeight:700}}>
              💊 건강효능 {(ing.health_benefits||[]).length}개
            </span>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:3, flexShrink:0, marginLeft:6 }}>
          <button onClick={e => { e.stopPropagation(); onDelete(ing.id, ing.name) }}
            style={{ padding:'2px 7px', borderRadius:5, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', fontSize:11, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>삭제</button>
        </div>
      </div>
      {open && (
        <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid #e9d5ff' }} onClick={e=>e.stopPropagation()}>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button onClick={() => setOpen(false)}
              style={{ padding:'3px 10px', borderRadius:5, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#6b7280', fontSize:11, cursor:'pointer' }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  )
}


// ── 확인 모달 ────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:14, padding:28, width:320, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize:15, fontWeight:700, color:'#111', marginBottom:20 }}>{message}</div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onCancel} style={{ padding:'8px 18px', borderRadius:8, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#6b7280', fontSize:13, cursor:'pointer', fontWeight:600 }}>취소</button>
          <button onClick={onConfirm} style={{ padding:'8px 18px', borderRadius:8, border:'none', background:'#dc2626', color:'#fff', fontSize:13, cursor:'pointer', fontWeight:700 }}>삭제</button>
        </div>
      </div>
    </div>
  )
}

// ── 추가 모달 ────────────────────────────────────────────────
function AddIdeaModal({ activeMonth, initialSection = 'angle', onClose, onSave }) {
  const [form, setForm] = useState({ section: initialSection, type: 'idea', content: '', keyword: '', angle: '', memo: '' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    if (!form.content.trim()) return
    onSave({ ...form, tab_id: 'month_' + activeMonth })
  }

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
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={S.label}>내용 *</label>
              <textarea value={form.content} onChange={e => set('content', e.target.value)}
                placeholder="글감 아이디어를 입력하세요" rows={3} style={S.textarea} />
            </div>
            <div>
              <label style={S.label}>각도 (선택)</label>
              <input value={form.angle} onChange={e => set('angle', e.target.value)}
                style={S.input} placeholder="예: 복날 보양식으로서의 민어" />
            </div>
            <div>
              <label style={S.label}>타겟 키워드 (선택)</label>
              <input value={form.keyword} onChange={e => set('keyword', e.target.value)}
                style={S.input} placeholder="예: 민어 효능, 민어 제철" />
            </div>
            <div>
              <label style={S.label}>메모 (선택)</label>
              <input value={form.memo} onChange={e => set('memo', e.target.value)}
                style={S.input} placeholder="추가 메모" />
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, marginTop:20, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnGhost}>취소</button>
          <button onClick={handleSave}
            disabled={!form.content.trim()}
            style={{ ...S.btn(), opacity: form.content.trim() ? 1 : 0.4 }}>저장</button>
        </div>
      </div>
    </div>
  )
}

// ── 기획 메모 입력 모달 (소스각도 / 이슈목록+이슈각도 / 월간전략) ────────
function PlanningMemoModal({ activeMonth, type, initialContent = '', onClose, onSave }) {
  const configs = {
    source_angle: {
      title: '📐 소스 각도 기록',
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#86efac',
      section: 'ingredient',
      keyword: `${activeMonth}월 소스각도`,
      angle: '소스각도',
      placeholder: `식재료 기반 각도 목록을 정리하세요.\n\n예)\n[기간한정]\n- 신비복숭아: 지금 아니면 못 먹는 신비복숭아, 제철이 단 2주\n\n[효능·영양]\n- 전복: 전복 효능 7가지, 이런 분께 특히 좋아요\n\n[주의·부작용]\n- 복숭아: 복숭아 먹으면 안 되는 사람 따로 있다`,
      hint: 'STEP 1 소스 + STEP 3 검색량 기반으로 각도를 정리합니다',
    },
    issue_list: {
      title: '🔍 이슈목록 + 이슈각도 기록',
      color: '#0ea5e9',
      bg: '#f0f9ff',
      border: '#7dd3fc',
      section: 'season',
      keyword: `${activeMonth}월 이슈각도`,
      angle: '이슈각도',
      placeholder: `이슈 목록과 각도를 함께 정리하세요.\n\n예)\n[고정 이슈]\n- 초복 (7/15): 초복에 삼계탕 말고, 올해는 장어 어때요? → 7/8 이전 발행\n- 여름방학 (7월말): 여름방학 아이 간식으로 좋은 제철 과일 → 7/3주차\n- 폭염 (7월 전체): 폭염에 수분 보충하기 좋은 제철 식재료 → 7/1주차\n\n[사용자 추가 이슈]\n- 없음`,
      hint: 'STEP 2 이슈 + STEP 3 검색량 기반으로 이슈별 각도와 발행 시기를 정리합니다',
    },
  }

  // ── 월간전략 전용 폼 ──────────────────────────────────────────
  if (type === 'strategy') {
    return <StrategyMemoModal activeMonth={activeMonth} initialContent={initialContent} onClose={onClose} onSave={onSave} />
  }

  const cfg = configs[type]
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!content.trim()) return
    setSaving(true)
    await onSave({
      section: cfg.section,
      type: 'memo',
      content: content.trim(),
      keyword: cfg.keyword,
      angle: cfg.angle,
      memo: '',
      tab_id: `month_${activeMonth}`,
    })
    setSaving(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', border:`1px solid ${cfg.border}`, borderRadius:14, padding:28, width:560, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:4, color:'#0f1f0f' }}>{cfg.title}</div>
        <div style={{ fontSize:12, color:'#888', marginBottom:16 }}>{MONTH_ICONS[activeMonth-1]} {activeMonth}월 · {cfg.hint}</div>
        <div style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:8, padding:'8px 12px', fontSize:12, color:cfg.color, marginBottom:14 }}>
          Claude가 기획 완료 후 자동으로 저장하거나, 직접 입력해서 기록해둘 수 있어요.
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={cfg.placeholder}
          rows={14}
          style={{ ...S.textarea, fontSize:12, lineHeight:1.7, fontFamily:"'Fira Mono', monospace" }}
        />
        <div style={{ display:'flex', gap:8, marginTop:16, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnGhost}>취소</button>
          <button onClick={handleSave} disabled={saving || !content.trim()}
            style={{ ...S.btn(), background:cfg.color, opacity: (!saving && content.trim()) ? 1 : 0.4 }}>
            {saving ? '저장 중...' : '💾 저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 월간전략 전용 입력 모달 ────────────────────────────────────
// 지침 STEP 5-2 포맷:
//   [이달의 큰 틀] 방향한줄 / 근거: ...
//   [놓치면 안 되는 우선 특집/이슈] - 특집명 (데드라인) — 이유
//   [주차별 방향] - 1주차 (날짜): 방향 + 이유
//   [각도 운영 원칙] ...
// 저장: section='special', angle='월간전략', type='memo'
function StrategyMemoModal({ activeMonth, initialContent = '', onClose, onSave }) {
  // initialContent 파싱 → 폼 초기값
  const parse = (raw) => {
    const result = { bigPicture: '', bigPictureReason: '', priority: ['', '', ''], weeks: ['', '', '', ''], principle: '' }
    const lines = raw.split('\n')
    let cur = null
    let piIdx = 0, wkIdx = 0
    lines.forEach(line => {
      const t = line.trim()
      if (t === '[이달의 큰 틀]') { cur = 'bigPicture'; return }
      if (t === '[놓치면 안 되는 우선 특집/이슈]') { cur = 'priority'; piIdx = 0; return }
      if (t === '[주차별 방향]') { cur = 'weeks'; wkIdx = 0; return }
      if (t === '[각도 운영 원칙]') { cur = 'principle'; return }
      if (!t) return
      if (cur === 'bigPicture') {
        if (!result.bigPicture) result.bigPicture = t
        else if (t.startsWith('근거:')) result.bigPictureReason = t.replace('근거:', '').trim()
      } else if (cur === 'priority' && t.startsWith('-') && piIdx < 3) {
        result.priority[piIdx++] = t.slice(1).trim()
      } else if (cur === 'weeks' && t.startsWith('-') && wkIdx < 4) {
        // "- 1주차 (7/1~7/7): 방향" → 앞 레이블 제거하고 날짜+방향만 저장
        const m = t.slice(1).trim().match(/^\d주차\s*(.*)/)
        result.weeks[wkIdx++] = m ? m[1].trim() : t.slice(1).trim()
      } else if (cur === 'principle') {
        result.principle += (result.principle ? '\n' : '') + t
      }
    })
    return result
  }

  const init = parse(initialContent)
  const [bigPicture, setBigPicture] = useState(init.bigPicture)
  const [bigPictureReason, setBigPictureReason] = useState(init.bigPictureReason)
  const [priority, setPriority] = useState(init.priority)
  const [weeks, setWeeks] = useState(init.weeks)   // [날짜+방향 문자열 4개]
  const [principle, setPrinciple] = useState(init.principle)
  const [saving, setSaving] = useState(false)

  const setPri = (i, v) => setPriority(p => { const a=[...p]; a[i]=v; return a })
  const setWeek = (i, v) => setWeeks(p => { const a=[...p]; a[i]=v; return a })

  const buildContent = () => [
    '[이달의 큰 틀]',
    bigPicture.trim(),
    bigPictureReason.trim() ? '근거: ' + bigPictureReason.trim() : '',
    '',
    '[놓치면 안 되는 우선 특집/이슈]',
    ...priority.filter(p => p.trim()).map(p => '- ' + p.trim()),
    '',
    '[주차별 방향]',
    ...['1주차','2주차','3주차','4주차'].map((lbl, i) =>
      weeks[i].trim() ? `- ${lbl} ${weeks[i].trim()}` : ''
    ).filter(Boolean),
    '',
    '[각도 운영 원칙]',
    principle.trim(),
  ].join('\n')

  const handleSave = async () => {
    if (!bigPicture.trim()) return
    setSaving(true)
    await onSave({
      section: 'special',
      type: 'memo',
      content: buildContent(),
      keyword: `${activeMonth}월 월간전략`,
      angle: '월간전략',
      memo: '',
      tab_id: `month_${activeMonth}`,
    })
    setSaving(false)
  }

  const weekColors   = ['#fecdd3','#bfdbfe','#d9f99d','#fde68a']
  const weekTxtClrs  = ['#be123c','#1d4ed8','#166534','#92400e']

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', border:'2px solid #c4b5fd', borderRadius:14, padding:28, width:580, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.18)' }}>

        <div style={{ fontSize:16, fontWeight:700, marginBottom:4, color:'#0f1f0f' }}>🗺️ 월간 전략 기록</div>
        <div style={{ fontSize:12, color:'#888', marginBottom:16 }}>{MONTH_ICONS[activeMonth-1]} {activeMonth}월 · STEP 5-2 포맷</div>
        <div style={{ background:'#f5f3ff', border:'1px solid #c4b5fd', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#4c1d95', marginBottom:20 }}>
          소스·이슈·검색량을 종합한 이달의 전략 판단을 기록합니다. Claude가 자동 저장하거나 직접 입력할 수 있어요.
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

          {/* 이달의 큰 틀 */}
          <div style={{ background:'#faf5ff', border:'1px solid #e9d5ff', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:12, fontWeight:800, color:'#7c3aed', marginBottom:10 }}>🎯 이달의 큰 틀</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div>
                <label style={S.label}>핵심 방향 한 줄 *</label>
                <textarea value={bigPicture} onChange={e => setBigPicture(e.target.value)}
                  placeholder="예: 삼복×보양식재료 특집 + 여름 과일 urgency — 기간한정·시의성 집중"
                  rows={2} style={S.textarea} />
              </div>
              <div>
                <label style={S.label}>근거 <span style={{ fontWeight:400, color:'#9ca3af' }}>(왜 이 방향인지)</span></label>
                <textarea value={bigPictureReason} onChange={e => setBigPictureReason(e.target.value)}
                  placeholder="예: 초복·중복·말복이 7월에 집중, 장어·민어 기간한정, 복숭아 검색량 상위권"
                  rows={2} style={S.textarea} />
              </div>
            </div>
          </div>

          {/* 놓치면 안 되는 우선 특집/이슈 */}
          <div style={{ background:'#fff', border:'2px solid #fca5a5', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:12, fontWeight:800, color:'#dc2626', marginBottom:10 }}>🚨 놓치면 안 되는 우선 특집/이슈</div>
            <div style={{ fontSize:11, color:'#9ca3af', marginBottom:10 }}>형식: 특집명 (데드라인) — 이유</div>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {priority.map((p, i) => (
                <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5', padding:'2px 8px', borderRadius:10, whiteSpace:'nowrap', flexShrink:0 }}>⚠️ {i+1}</span>
                  <input value={p} onChange={e => setPri(i, e.target.value)}
                    style={{ ...S.input, margin:0 }}
                    placeholder="예: 삼복 특집 (7/8 데드라인) — 초복 일주일 전 발행 필수" />
                </div>
              ))}
              <button onClick={() => setPriority(p => [...p, ''])}
                style={{ alignSelf:'flex-start', fontSize:11, color:'#dc2626', background:'none', border:'1px dashed #fca5a5', borderRadius:6, padding:'3px 10px', cursor:'pointer' }}>+ 항목 추가</button>
            </div>
          </div>

          {/* 주차별 방향 */}
          <div style={{ background:'#fff', border:'1px solid #e9d5ff', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:12, fontWeight:800, color:'#7c3aed', marginBottom:10 }}>📅 주차별 방향</div>
            <div style={{ fontSize:11, color:'#9ca3af', marginBottom:10 }}>형식: (날짜): 주력 방향 + 이유 &nbsp;예) (7/1~7/7): 삼복 특집 선발행, 시의성 최우선</div>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {['1주차','2주차','3주차','4주차'].map((lbl, i) => (
                <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:10, background:weekColors[i], color:weekTxtClrs[i], whiteSpace:'nowrap', flexShrink:0 }}>{lbl}</span>
                  <input value={weeks[i]} onChange={e => setWeek(i, e.target.value)}
                    style={{ ...S.input, margin:0 }}
                    placeholder={`(날짜): 주력 방향 + 이유`} />
                </div>
              ))}
            </div>
          </div>

          {/* 각도 운영 원칙 */}
          <div style={{ background:'#f5f3ff', border:'1px solid #e9d5ff', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:12, fontWeight:800, color:'#7c3aed', marginBottom:8 }}>📌 각도 운영 원칙</div>
            <textarea value={principle} onChange={e => setPrinciple(e.target.value)}
              placeholder="예: 과일·해산물 번갈아 발행 / 같은 각도 2편 연속 금지 / 기간한정·특집 먼저"
              rows={3} style={{ ...S.textarea, fontSize:12 }} />
          </div>

        </div>

        <div style={{ display:'flex', gap:8, marginTop:20, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnGhost}>취소</button>
          <button onClick={handleSave} disabled={saving || !bigPicture.trim()}
            style={{ ...S.btn(), background:'#7c3aed', opacity: (!saving && bigPicture.trim()) ? 1 : 0.4 }}>
            {saving ? '저장 중...' : '💾 저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 기획 메모 카드 ────────────────────────────────────────────
function PlanningMemoCard({ idea, label, color, bg, border, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const lines = (idea?.content || '').split('\n')
  const preview = lines.slice(0, 3).join('\n')
  const hasMore = lines.length > 3

  const fmtDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${d.getMonth()+1}/${d.getDate()}`
  }

  if (!idea) return (
    <div style={{ border:`1.5px dashed ${border}`, borderRadius:10, overflow:'hidden', background:'#fafafa' }}>
      <div style={{ background:bg, padding:'7px 14px', borderBottom:`1px dashed ${border}` }}>
        <span style={{ fontSize:12, fontWeight:800, color }}>{label}</span>
      </div>
      <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:12, color:'#aaa' }}>아직 기록이 없어요</span>
        <button onClick={onEdit} style={{ padding:'5px 14px', borderRadius:7, border:'none', background:color, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>+ 입력</button>
      </div>
    </div>
  )

  return (
    <div style={{ border:`1.5px solid ${border}`, borderRadius:10, overflow:'hidden', background:'#fff' }}>
      <div style={{ background:bg, padding:'8px 14px', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:12, fontWeight:800, color }}>{label}</span>
        <span style={{ fontSize:11, color:'#9ca3af', marginLeft:'auto' }}>저장 {fmtDate(idea.created_at)}</span>
        <button onClick={onEdit} style={{ padding:'2px 10px', borderRadius:6, border:`1px solid ${border}`, background:'#fff', color, fontSize:11, fontWeight:700, cursor:'pointer' }}>수정</button>
        <button onClick={onDelete} style={{ padding:'2px 8px', borderRadius:6, border:'1px solid #fca5a5', background:'#fff', color:'#dc2626', fontSize:11, cursor:'pointer' }}>×</button>
      </div>
      <div style={{ padding:'10px 14px' }}>
        <pre style={{ margin:0, fontSize:12, lineHeight:1.7, color:'#374151', whiteSpace:'pre-wrap', fontFamily:"'Fira Mono', monospace" }}>
          {expanded ? idea.content : preview}
        </pre>
        {hasMore && (
          <button onClick={() => setExpanded(p=>!p)} style={{ marginTop:6, fontSize:11, color, background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>
            {expanded ? '▲ 접기' : `▼ 더 보기 (${lines.length - 3}줄 더)`}
          </button>
        )}
      </div>
    </div>
  )
}

// ── 사용 처리 모달 ───────────────────────────────────────────
function UseModal({ idea, onClose, onSave }) {
  const [slug, setSlug] = useState('')
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', border:'1px solid #d1e8d1', borderRadius:14, padding:28, width:420, boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:6, color:'#0f1f0f' }}>✅ 사용 처리</div>
        <div style={{ fontSize:13, color:'#6b7280', marginBottom:20, lineHeight:1.6 }}>{idea.content}</div>
        <div>
          <label style={S.label}>발행된 글 슬러그 (선택)</label>
          <input value={slug} onChange={e => setSlug(e.target.value)}
            style={S.input} placeholder="예: busan-meoneo-boyang-jul" />
          <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>어떤 글로 썼는지 추적할 수 있어요</div>
        </div>
        <div style={{ display:'flex', gap:8, marginTop:20, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnGhost}>취소</button>
          <button onClick={() => onSave(slug)} style={{ ...S.btn(), background: ACCENT }}>사용 처리</button>
        </div>
      </div>
    </div>
  )
}

// ── 글감 행 (묶음 카드 내부 한 줄) ─────────────────────────
function IdeaRow({ idea, index, onUse, onUndoUse, onDelete, onMoveUp, onMoveDown, isFirst, isLast, sectionColor }) {
  const isUsed = idea.status === 'used'
  const keyword = idea.keyword || ''
  const content = idea.content || ''
  const memo    = (idea.memo || '').replace(/^\[각도\]\s*/, '')

  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:8,
      padding:'7px 12px',
      borderBottom:'1px solid #f3f4f6',
      background: isUsed ? '#fafafa' : '#fff',
      opacity: isUsed ? 0.55 : 1,
    }}>
      {/* 순서 버튼 */}
      <div style={{ display:'flex', flexDirection:'column', gap:1, flexShrink:0, paddingTop:2 }}>
        <button onClick={onMoveUp} disabled={isFirst}
          style={{ background:'none', border:'none', cursor: isFirst ? 'default' : 'pointer', color: isFirst ? '#e5e7eb' : '#d1d5db', fontSize:10, lineHeight:1, padding:'1px 3px' }}>▲</button>
        <span style={{ fontSize:10, color:'#d1d5db', textAlign:'center', lineHeight:1 }}>{index+1}</span>
        <button onClick={onMoveDown} disabled={isLast}
          style={{ background:'none', border:'none', cursor: isLast ? 'default' : 'pointer', color: isLast ? '#e5e7eb' : '#d1d5db', fontSize:10, lineHeight:1, padding:'1px 3px' }}>▼</button>
      </div>

      {/* 키워드 */}
      <div style={{ width:110, flexShrink:0, paddingTop:2 }}>
        {keyword ? (
          <span style={{ fontSize:11, fontWeight:700, color: isUsed ? '#9ca3af' : sectionColor, wordBreak:'break-all' }}>
            {keyword}
          </span>
        ) : (
          <span style={{ fontSize:11, color:'#d1d5db' }}>—</span>
        )}
        {isUsed && (
          <div style={{ fontSize:10, color:'#16a34a', marginTop:2 }}>✓ {fmtUsedAt(idea.used_at)}</div>
        )}
        {isUsed && idea.used_slug && (
          <div style={{ fontSize:10, color:'#9ca3af', fontFamily:'monospace', marginTop:1, wordBreak:'break-all' }}>/{idea.used_slug}</div>
        )}
      </div>

      {/* 구분선 */}
      <span style={{ color:'#d1d5db', fontSize:12, paddingTop:2, flexShrink:0 }}>/</span>

      {/* 내용 + 메모 */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, color: isUsed ? '#9ca3af' : '#111', lineHeight:1.55, wordBreak:'break-word' }}>
          {content}
        </div>
        {memo && (
          <div style={{ fontSize:11, color:'#9ca3af', marginTop:3, lineHeight:1.45 }}>
            📝 {memo}
          </div>
        )}
      </div>

      {/* 버튼 */}
      <div style={{ display:'flex', gap:4, flexShrink:0, paddingTop:1 }}>
        {isUsed ? (
          <button onClick={onUndoUse} title="미사용으로 되돌리기"
            style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:6, color:'#16a34a', cursor:'pointer', padding:'3px 7px', fontSize:12 }}>↩</button>
        ) : (
          <button onClick={onUse} title="사용 완료 처리"
            style={{ background:'none', border:'1px solid #d1e8d1', borderRadius:6, color:'#9ca3af', cursor:'pointer', padding:'3px 7px', fontSize:12 }}>✓</button>
        )}
        <button onClick={onDelete}
          style={{ background:'none', border:'1px solid #fecaca', borderRadius:6, color:'#f87171', cursor:'pointer', padding:'3px 7px', fontSize:12 }}>×</button>
      </div>
    </div>
  )
}

// ── 섹션 그룹 (묶음 카드) ────────────────────────────────────
function SectionGroup({ section, ideas, allIdeas, onUse, onUndoUse, onDelete, onMove }) {
  const [collapsed, setCollapsed] = useState(false)
  if (ideas.length === 0) return null
  const pendingCnt = ideas.filter(i => i.status !== 'used').length

  return (
    <div style={{ marginBottom:12, border:`1px solid ${section.color}33`, borderRadius:10, overflow:'hidden' }}>
      {/* 섹션 헤더 */}
      <div onClick={() => setCollapsed(p => !p)} style={{
        display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
        background: section.bg, cursor:'pointer',
        borderBottom: collapsed ? 'none' : `1px solid ${section.color}22`,
      }}>
        <span style={{ fontSize:13, fontWeight:700, color: section.color }}>{section.label}</span>
        <span style={{ fontSize:12, color: section.color, fontWeight:700 }}>{pendingCnt}개 미사용</span>
        {ideas.length !== pendingCnt && (
          <span style={{ fontSize:11, color:'#9ca3af' }}>({ideas.length - pendingCnt}개 완료)</span>
        )}
        <span style={{ marginLeft:'auto', color: section.color, fontSize:12 }}>{collapsed ? '▶' : '▼'}</span>
      </div>

      {/* 글감 행 목록 */}
      {!collapsed && (
        <div style={{ background:'#fff' }}>
          {ideas.map((idea, idx) => (
            <IdeaRow
              key={idea.id}
              idea={idea}
              index={allIdeas.findIndex(i => i.id === idea.id)}
              isFirst={idx === 0}
              isLast={idx === ideas.length - 1}
              sectionColor={section.color}
              onUse={() => onUse(idea)}
              onUndoUse={() => onUndoUse(idea.id)}
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
  const [ingredients, setIngredients] = useState([])  // 해당 월 제철 식재료
  const [ingLoading, setIngLoading] = useState(false)
  const [ingLoaded, setIngLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [useTarget, setUseTarget] = useState(null)
  const [filterStatus, setFilterStatus] = useState('pending')
  const [showIngredients, setShowIngredients] = useState(true)
  const [toast, setToast] = useState('')
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [showPlanningModal, setShowPlanningModal] = useState(null)
  const [editingMemo, setEditingMemo] = useState(null)

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

  // 월별 제철 식재료 불러오기 + monthly_ingredients 저장
  const loadIngredients = useCallback(async (month) => {
    setIngLoading(true)
    setIngLoaded(false)
    try {
      const res = await fetch(`/api/admin/seasonal-foods?month=${month}`, { headers: { 'x-admin-token': adminToken } })
      const data = await res.json()
      if (Array.isArray(data.ingredients)) {
        setIngredients(data.ingredients)
        // monthly_ingredients 테이블에 저장
        await fetch('/api/admin/seasonal-foods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
          body: JSON.stringify({ month, ingredient_ids: data.ingredients.map(i => i.id) }),
        })
        showToast(`✅ ${data.ingredients.length}개 불러오기 완료`)
        setIngLoaded(true)
      }
    } catch {}
    setIngLoading(false)
  }, [adminToken])

  useEffect(() => { load() }, [load])

  // 월 바뀔 때 monthly_ingredients에 저장된 식재료 자동 로드
  useEffect(() => {
    const checkSaved = async () => {
      try {
        const res = await fetch(`/api/admin/seasonal-foods?month=${activeMonth}&saved=1`, { headers: { 'x-admin-token': adminToken } })
        const data = await res.json()
        if (data.ids && data.ids.length > 0) {
          // 저장된 게 있으면 자동으로 식재료 불러오기
          const res2 = await fetch(`/api/admin/seasonal-foods?month=${activeMonth}`, { headers: { 'x-admin-token': adminToken } })
          const data2 = await res2.json()
          if (Array.isArray(data2.ingredients)) {
            setIngredients(data2.ingredients)
            setIngLoaded(true)
          }
        }
      } catch {}
    }
    checkSaved()
  }, [activeMonth, adminToken])

  const addIdea = async (form) => {
    setShowAdd(false)
    const res = await fetch('/api/admin/content-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify(form),
    })
    if (res.ok) { showToast('✅ 추가됨'); load() }
  }

  // 기획 메모 저장 (신규 or 수정)
  const savePlanningMemo = async (form) => {
    setShowPlanningModal(null)
    if (editingMemo) {
      // 수정: PATCH
      await fetch('/api/admin/content-ideas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ action: 'update_content', id: editingMemo, content: form.content }),
      })
      setEditingMemo(null)
      showToast('✅ 수정됨')
    } else {
      // 신규: POST
      const res = await fetch('/api/admin/content-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify(form),
      })
      if (res.ok) showToast('✅ 저장됨')
    }
    load()
  }


  // 식재료 삭제
  const deleteIngredient = (id, name) => {
    setConfirmTarget({ message: `"${name}"을(를) 삭제할까요?`, onConfirm: async () => {
      const res = await fetch("/api/admin/ingredients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ id }),
      })
      if (res.ok) { showToast(`🗑 ${name} 삭제됨`); loadIngredients(activeMonth) }
      setConfirmTarget(null)
    }})
  }



  const markUsed = async (slug) => {
    const idea = useTarget
    setUseTarget(null)
    const now = new Date().toISOString()
    await fetch('/api/admin/content-ideas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ action: 'update_status', id: idea.id, status: 'used', used_at: now, used_slug: slug || null }),
    })
    setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, status: 'used', used_at: now, used_slug: slug || null } : i))
    showToast('✅ 사용 처리됨')
  }

  const undoUse = async (id) => {
    await fetch('/api/admin/content-ideas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ action: 'update_status', id, status: 'pending', used_at: null, used_slug: null }),
    })
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, status: 'pending', used_at: null, used_slug: null } : i))
    showToast('↩ 미사용으로 되돌림')
  }

  const deleteIdea = async (id) => {
    setConfirmTarget({ message: '글감을 삭제할까요?', onConfirm: async () => {
      await fetch('/api/admin/content-ideas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ id }),
      })
      setIdeas(prev => prev.filter(i => i.id !== id))
      showToast('삭제됨')
      setConfirmTarget(null)
    }})
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
  // 이미 content_ideas에 저장된 식재료 이름 목록
  const tabIdeas = ideas.filter(i => {
    if (i.tab_id !== tabId) return false
    if (i.type === 'memo') return false  // 기획 기록은 글감 목록에서 제외
    if (filterStatus === 'pending' && i.status === 'used') return false
    if (filterStatus === 'used' && i.status !== 'used') return false
    return true
  })
  const totalPending = ideas.filter(i => i.tab_id === tabId && i.status === 'pending').length
  const totalUsed    = ideas.filter(i => i.tab_id === tabId && i.status === 'used').length

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:17, fontWeight:700, color:'#0f1f0f' }}>💡 글감 관리</div>
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
              <button key={m} onClick={() => { setActiveMonth(m); setIngLoaded(false); setIngredients([]) }} style={{
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

      {/* 월 요약 */}
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

      {/* ── 제철 식재료 자동 로드 섹션 ── */}
      <div style={{ marginBottom: 20 }}>
        <div onClick={() => setShowIngredients(p => !p)} style={{
          background:'#fff', border:'1px solid #d1e8d1', borderRadius:10,
          cursor:'pointer', marginBottom: showIngredients ? 10 : 0, overflow:'hidden',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px' }}>
            <span style={{ fontSize:14, fontWeight:700, color:'#0f1f0f' }}>🥕 {activeMonth}월 제철 식재료</span>
            {ingredients.length > 0 && (
              <span style={{ fontSize:12, color:ACCENT, fontWeight:700 }}>{ingredients.length}개</span>
            )}
            <span style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={e => { e.stopPropagation(); loadIngredients(activeMonth) }}
                disabled={ingLoading}
                style={{ padding:'4px 12px', borderRadius:6, border:'none', background: ingLoaded ? '#6b7280' : ACCENT, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', opacity: ingLoading ? 0.6 : 1 }}>
                {ingLoading ? '처리 중...' : ingLoaded ? '업데이트' : '불러오기'}
              </button>
              <span style={{ color:'#aaa', fontSize:12 }}>{showIngredients ? '▲' : '▼'}</span>
            </span>
          </div>
          {ingredients.length > 0 && <SourceSummary ingredients={ingredients} />}
          {!ingLoading && ingredients.length > 0 && showIngredients && (() => {
            const monthToSeason = {1:'winter',2:'winter',3:'spring',4:'spring',5:'spring',6:'summer',7:'summer',8:'summer',9:'fall',10:'fall',11:'fall',12:'winter'}
            const currentSeason = monthToSeason[activeMonth]
            const jeolgiMonths  = {seollal:[1,2],ipchun:[2],daeboreum:[1,2],hansik:[4],dano:[5,6],chopbok:[7],jungbok:[7,8],sambok:[7,8],malbok:[8],chuseok:[9,10],gimjang:[11,12],dongji:[12]}
            const seasonMap  = {spring:['🌸 봄','#f0fdf4','#86efac','#166534'],summer:['🌞 여름','#fefce8','#fde68a','#92400e'],fall:['🍂 가을','#fff7ed','#fdba74','#c2410c'],winter:['❄️ 겨울','#eff6ff','#bae6fd','#1e40af']}
            const jeolgiMap  = {seollal:['🎍 설날','#fdf4ff','#e9d5ff','#7e22ce'],sambok:['🔥 삼복','#fff1f2','#fecdd3','#be123c'],chopbok:['🔥 초복','#fff1f2','#fecdd3','#be123c'],jungbok:['🔥 중복','#fff1f2','#fecdd3','#be123c'],malbok:['🔥 말복','#fff1f2','#fecdd3','#be123c'],chuseok:['🌕 추석','#fefce8','#fde68a','#854d0e'],gimjang:['🥬 김장철','#f0fdf4','#86efac','#166534'],dongji:['☯️ 동지','#eff6ff','#bae6fd','#1e40af'],dano:['🌿 단오','#f0fdf4','#86efac','#166534'],ipchun:['🌱 입춘','#f0fdf4','#86efac','#166534'],daeboreum:['🌕 정월대보름','#fef9c3','#fde68a','#713f12'],hansik:['🌸 한식','#fdf4ff','#e9d5ff','#7e22ce']}
            const specialMap = {boyangshik:['💪 보양식','#fff7ed','#fed7aa','#c2410c'],jeolgi_food:['🎋 절기음식','#fdf4ff','#e9d5ff','#7e22ce'],hangover:['🍶 해장','#fefce8','#fde68a','#854d0e'],diet:['🥗 다이어트','#f0fdf4','#86efac','#166534']}
            const habitatMap = {island:['🏝️ 섬','#f0f9ff','#7dd3fc','#0369a1'],freshwater:['🐟 민물','#eff6ff','#93c5fd','#1d4ed8'],tidal:['🌊 갯벌','#f0fdfa','#5eead4','#0f766e'],mountain:['🏔️ 산','#f7fee7','#a3e635','#3f6212'],ocean:['🌊 바다','#f0f9ff','#38bdf8','#0c4a6e']}
            const farmingMap = {aquaculture:['🤿 양식','#fdf4ff','#d8b4fe','#7e22ce'],wild:['🎣 자연산','#fff7ed','#fdba74','#c2410c'],fermented:['🥟 발효','#fef9c3','#fde68a','#713f12']}
            const collect = (field) => [...new Set(ingredients.flatMap(i=>(Array.isArray(i[field])?i[field]:[i[field]]).filter(Boolean)))]
            const seasons  = collect('season_badge').filter(v=>v===currentSeason)
            const jeolgis  = collect('jeolgi_badge').filter(v=>(jeolgiMonths[v]||[]).includes(activeMonth))
            const specials = collect('special_badge')
            const habitats = collect('habitat_badge')
            const farmings = collect('farming_badge')
            const boolBadges = [
              ingredients.some(i=>i.is_special)   && ['🏆 특산',        '#fef3c7','#f59e0b','#b45309'],
              ingredients.some(i=>i.is_limited)   && ['⏰ 기간한정',    '#d1fae5','#10b981','#059669'],
              ingredients.some(i=>i.is_superfood) && ['🌟 슈퍼푸드',    '#fef3c7','#f59e0b','#92400e'],
              ingredients.some(i=>i.is_global)    && ['🌍 해외',         '#dbeafe','#3b82f6','#1d4ed8'],
              ingredients.some(i=>i.is_brand)     && ['🏷️ 지역브랜드', '#ffe4e6','#e63946','#e63946'],
            ].filter(Boolean)
            const ageMap = {infant:['👶 영유아','#fef9c3','#fde68a','#713f12'],child:['🧒 어린이','#fef3c7','#f59e0b','#92400e'],adult:['🧑 성인','#eff6ff','#bae6fd','#1e40af'],senior:['👴 노인','#f0fdf4','#86efac','#166534'],all:['👨‍👩‍👧‍👦 전연령','#f3f4f6','#d1d5db','#374151']}
            const genderMap = {male:['👨 남성','#eff6ff','#93c5fd','#1d4ed8'],female:['👩 여성','#fdf4ff','#e9d5ff','#7e22ce'],all:null}
            const ageGroups = [...new Set(ingredients.flatMap(i=>i.age_groups||[]).filter(Boolean))]
            const genders   = [...new Set(ingredients.map(i=>i.gender).filter(v=>v&&v!=='all'))]
            const regions   = [...new Set(ingredients.flatMap(i=>i.regions_preview||[]))]
            const benefits  = [...new Set(ingredients.flatMap(i=>(i.health_benefits||[]).map(h=>h.name).filter(Boolean)))]
            // 효능 카테고리별 그룹
            const benefitCatMap = {}
            ingredients.forEach(i => (i.health_benefits||[]).forEach(hb => {
              const cat = hb.category || '기타'
              if (!benefitCatMap[cat]) benefitCatMap[cat] = {}
              if (!benefitCatMap[cat][hb.name]) benefitCatMap[cat][hb.name] = []
              benefitCatMap[cat][hb.name].push(i.name)
            }))
            const benefitCats = Object.entries(benefitCatMap).sort((a,b)=>Object.keys(b[1]).length-Object.keys(a[1]).length)
            const ko = (a,b) => a.localeCompare(b,'ko-KR')
            // 지역별 재료
            const regionMap = {}
            ingredients.forEach(i=>(i.regions_preview||[]).forEach(r=>{ if(!regionMap[r]) regionMap[r]=[]; regionMap[r].push(i.name) }))
            const regionSorted = Object.entries(regionMap).sort((a,b)=>b[1].length-a[1].length).map(([r,names])=>[r,names.sort(ko)])
            // 절기별 재료
            const jeolgiIngMap = {}
            jeolgis.forEach(jk => {
              jeolgiIngMap[jk] = ingredients.filter(i=>(Array.isArray(i.jeolgi_badge)?i.jeolgi_badge:[i.jeolgi_badge]).includes(jk)).map(i=>i.name).sort(ko)
            })
            // 테마별 재료
            const specialIngMap = {}
            specials.forEach(sk => {
              specialIngMap[sk] = ingredients.filter(i=>(Array.isArray(i.special_badge)?i.special_badge:[i.special_badge]).includes(sk)).map(i=>i.name).sort(ko)
            })
            // 서식별 재료
            const habitatIngMap = {}
            habitats.forEach(hk => {
              habitatIngMap[hk] = ingredients.filter(i=>(Array.isArray(i.habitat_badge)?i.habitat_badge:[i.habitat_badge]).includes(hk)).map(i=>i.name).sort(ko)
            })
            // 양식별 재료
            const farmingIngMap = {}
            farmings.forEach(fk => {
              farmingIngMap[fk] = ingredients.filter(i=>(Array.isArray(i.farming_badge)?i.farming_badge:[i.farming_badge]).includes(fk)).map(i=>i.name).sort(ko)
            })
            // 연령별 재료
            const ageIngMap = {}
            ageGroups.filter(a=>a!=='all').forEach(a => {
              ageIngMap[a] = ingredients.filter(i=>(i.age_groups||[]).includes(a)).map(i=>i.name).sort(ko)
            })
            const maleIngs   = ingredients.filter(i=>i.gender==='male').sort((a,b)=>ko(a.name,b.name))
            const femaleIngs = ingredients.filter(i=>i.gender==='female').sort((a,b)=>ko(a.name,b.name))

            const Bdg = ({d}) => <span style={{fontSize:10,padding:'1px 7px',borderRadius:20,background:d[1],border:`1px solid ${d[2]}`,color:d[3],fontWeight:700}}>{d[0]}</span>
            const IngTag = ({name,bg,border,color}) => <span style={{fontSize:10,padding:'1px 7px',borderRadius:20,background:bg,border:`1px solid ${border}`,color,fontWeight:600}}>{name}</span>
            const Row = ({label,labelColor,bg,border,color,show,badges,ingNames,children}) => !show ? null : (
              <div style={{display:'flex',gap:4,flexWrap:'wrap',alignItems:'flex-start',padding:'5px 0',borderBottom:'1px solid #f3f4f6'}}>
                <span style={{fontSize:11,color:labelColor||'#6b7280',fontWeight:700,minWidth:72,flexShrink:0,paddingTop:2}}>{label}</span>
                <div style={{display:'flex',gap:3,flexWrap:'wrap',flex:1}}>
                  {badges && badges.map((d,i)=><Bdg key={i} d={d}/>)}
                  {ingNames && ingNames.map((n,i)=><IngTag key={i} name={n} bg={bg||'#f0fdf4'} border={border||'#86efac'} color={color||'#166534'}/>)}
                  {children}
                </div>
              </div>
            )
            // ㄱㄴㄷ 정렬을 위한 이모지 제거 함수
            const stripEmoji = str => str.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2300}-\u{23FF}\u{FE00}-\u{FEFF}]/gu,'').replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g,'').trim()
            const koSort = (a,b) => stripEmoji(a.label).localeCompare(stripEmoji(b.label),'ko-KR')

            // 카테고리별 재료 목록
            const catIngMap = {}
            ingredients.forEach(i => {
              const label = CAT_LABELS[i.category] || i.category
              if (!catIngMap[label]) catIngMap[label] = []
              catIngMap[label].push(i.name)
            })
            Object.keys(catIngMap).forEach(k => catIngMap[k].sort(ko))

            // bool 카테고리별 재료 목록
            const limitedIngs   = ingredients.filter(i=>i.is_limited).sort((a,b)=>ko(a.name,b.name)).map(i=>i.name)
            const specialIngs   = ingredients.filter(i=>i.is_special).sort((a,b)=>ko(a.name,b.name)).map(i=>i.name)
            const superfoodIngs = ingredients.filter(i=>i.is_superfood).sort((a,b)=>ko(a.name,b.name)).map(i=>i.name)
            const globalIngs    = ingredients.filter(i=>i.is_global).sort((a,b)=>ko(a.name,b.name)).map(i=>i.name)
            const brandIngs     = ingredients.filter(i=>i.is_brand).sort((a,b)=>ko(a.name,b.name)).map(i=>i.name)

            // 개수 표시 헬퍼
            const wc = (label, n) => `${label} (${n})`

            // 모든 행 데이터를 하나의 배열로 수집
            const allRows = [
              ...(seasons.length > 0 ? [{
                key:'계절', label:'계절', labelColor:'#166534',
                badges: seasons.map(v=>seasonMap[v]).filter(Boolean)
              }] : []),
              ...(limitedIngs.length > 0 ? [{
                key:'기간한정', label:wc('⏰ 기간한정', limitedIngs.length), labelColor:'#059669',
                ingNames:limitedIngs, bg:'#f0fdf4', border:'#10b981', color:'#059669'
              }] : []),
              ...(specialIngs.length > 0 ? [{
                key:'특산', label:wc('🏆 특산품', specialIngs.length), labelColor:'#b45309',
                ingNames:specialIngs, bg:'#fffbeb', border:'#f59e0b', color:'#b45309'
              }] : []),
              ...(superfoodIngs.length > 0 ? [{
                key:'슈퍼푸드', label:wc('🌟 슈퍼푸드', superfoodIngs.length), labelColor:'#92400e',
                ingNames:superfoodIngs, bg:'#fffbeb', border:'#f59e0b', color:'#92400e'
              }] : []),
              ...(globalIngs.length > 0 ? [{
                key:'해외', label:wc('🌍 해외', globalIngs.length), labelColor:'#1d4ed8',
                ingNames:globalIngs, bg:'#eff6ff', border:'#93c5fd', color:'#1d4ed8'
              }] : []),
              ...(brandIngs.length > 0 ? [{
                key:'지역브랜드', label:wc('🏷️ 지역브랜드', brandIngs.length), labelColor:'#be123c',
                ingNames:brandIngs, bg:'#ffe4e6', border:'#fca5a5', color:'#be123c'
              }] : []),
              ...jeolgis.filter(jk=>jeolgiMap[jk]).map(jk=>({
                key:`jeolgi-${jk}`, label:wc(jeolgiMap[jk][0], (jeolgiIngMap[jk]||[]).length), labelColor:jeolgiMap[jk][3],
                ingNames:jeolgiIngMap[jk]||[], bg:jeolgiMap[jk][1], border:jeolgiMap[jk][2]+'66', color:jeolgiMap[jk][3]
              })),
              ...specials.filter(sk=>specialMap[sk]).map(sk=>({
                key:`special-${sk}`, label:wc(specialMap[sk][0], (specialIngMap[sk]||[]).length), labelColor:specialMap[sk][3],
                ingNames:specialIngMap[sk]||[], bg:specialMap[sk][1], border:specialMap[sk][2], color:specialMap[sk][3]
              })),
              ...habitats.filter(hk=>habitatMap[hk]).map(hk=>({
                key:`habitat-${hk}`, label:wc(habitatMap[hk][0], (habitatIngMap[hk]||[]).length), labelColor:habitatMap[hk][3],
                ingNames:habitatIngMap[hk]||[], bg:habitatMap[hk][1], border:habitatMap[hk][2]+'66', color:habitatMap[hk][3]
              })),
              ...farmings.filter(fk=>farmingMap[fk]).map(fk=>({
                key:`farming-${fk}`, label:wc(farmingMap[fk][0], (farmingIngMap[fk]||[]).length), labelColor:farmingMap[fk][3],
                ingNames:farmingIngMap[fk]||[], bg:farmingMap[fk][1], border:farmingMap[fk][2]+'66', color:farmingMap[fk][3]
              })),
              ...ageGroups.filter(a=>a!=='all'&&ageMap[a]).map(a=>({
                key:`age-${a}`, label:wc(ageMap[a][0], (ageIngMap[a]||[]).length), labelColor:ageMap[a][3],
                ingNames:ageIngMap[a]||[], bg:ageMap[a][1], border:ageMap[a][2]+'66', color:ageMap[a][3]
              })),
              ...genders.filter(g=>genderMap[g]).map(g=>({
                key:`gender-${g}`, label:wc(genderMap[g][0], g==='male'?maleIngs.length:femaleIngs.length), labelColor:genderMap[g][3],
                ingNames:g==='male'?maleIngs.map(i=>i.name):femaleIngs.map(i=>i.name),
                bg:genderMap[g][1], border:genderMap[g][2]+'66', color:genderMap[g][3]
              })),
              ...regionSorted.map(([region,names])=>({
                key:`region-${region}`, label:wc(`📍 ${region}`, names.length), labelColor:'#1d4ed8',
                ingNames:names, bg:'#dbeafe', border:'#93c5fd', color:'#1e40af'
              })),
              ...Object.entries(catIngMap).map(([label, names])=>({
                key:`cat-${label}`, label:wc(label, names.length), labelColor:'#166634',
                ingNames:names, bg:'#f0fdf4', border:'#bbf7d0', color:'#166534'
              })),
              ...(ingredients.some(i=>i.caution) ? [{
                key:'주의사항', label:wc('⚠️ 주의사항', ingredients.filter(i=>i.caution).length), labelColor:'#dc2626',
                ingNames:ingredients.filter(i=>i.caution).sort((a,b)=>ko(a.name,b.name)).map(i=>i.name),
                bg:'#fef2f2', border:'#fca5a5', color:'#dc2626'
              }] : []),
            ].sort(koSort)

            return (
              <div style={{borderTop:'1px solid #d1e8d1',overflow:'hidden'}}>
                <div style={{ padding:'6px 16px', background:'#e8f5e9', borderBottom:'1px solid #c8e6c9' }}>
                  <span style={{ fontSize:12, fontWeight:800, color:'#1b5e20' }}>🔍 이달의 소스 분석</span>
                </div>
                <div style={{padding:'6px 16px 12px',display:'flex',flexDirection:'column',gap:0}}>
                {allRows.map(row => (
                  <Row key={row.key} label={row.label} labelColor={row.labelColor} show={true}
                    badges={row.badges} ingNames={row.ingNames}
                    bg={row.bg} border={row.border} color={row.color}/>
                ))}
                {benefitCats.map(([cat, benefitObj]) => (
                  <div key={cat} style={{padding:'5px 0',borderBottom:'1px solid #f3f4f6'}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#16a34a',marginBottom:4}}>💊 {cat}</div>
                    <div style={{paddingLeft:8,display:'flex',flexDirection:'column',gap:3}}>
                      {Object.entries(benefitObj).map(([bname, ingNames]) => (
                        <div key={bname} style={{display:'flex',gap:4,flexWrap:'wrap',alignItems:'center'}}>
                          <span style={{fontSize:10,color:'#059669',fontWeight:600,minWidth:80,flexShrink:0}}>· {bname}</span>
                          {ingNames.map((n,i)=><IngTag key={i} name={n} bg='#dcfce7' border='#86efac' color='#166534'/>)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )
          })()}
        </div>

        {/* ── 기획 기록 섹션 (소스각도 + 이슈각도 + 월간전략) ── */}
        {(() => {
          const tabId = `month_${activeMonth}`
          const allTabIdeas = ideas.filter(i => i.tab_id === tabId)
          // API에서 angle → memo 필드에 "[각도] XXX" 형식으로 저장됨
          const sourceAngleMemo = allTabIdeas.find(i => i.tool_id === 'ingredient' && i.type === 'memo' && (i.memo||'').includes('[각도] 소스각도'))
          const issueListMemo   = allTabIdeas.find(i => i.tool_id === 'season'     && i.type === 'memo' && (i.memo||'').includes('[각도] 이슈각도'))
          const strategyMemo    = allTabIdeas.find(i => i.tool_id === 'special'    && i.type === 'memo' && (i.memo||'').includes('[각도] 월간전략'))
          return (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <span style={{ fontSize:13, fontWeight:800, color:'#0f1f0f' }}>📋 기획 기록</span>
                <span style={{ fontSize:11, color:'#9ca3af' }}>소스각도 · 이슈각도 · 월간전략</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <PlanningMemoCard
                  idea={sourceAngleMemo}
                  label="📐 소스 각도"
                  color="#16a34a"
                  bg="#f0fdf4"
                  border="#86efac"
                  onEdit={() => { setEditingMemo(sourceAngleMemo?.id || null); setShowPlanningModal('source_angle') }}
                  onDelete={() => sourceAngleMemo && setConfirmTarget({ message:'소스 각도 기록을 삭제할까요?', onConfirm: async () => { await fetch('/api/admin/content-ideas', { method:'DELETE', headers:{'Content-Type':'application/json','x-admin-token':adminToken}, body:JSON.stringify({id:sourceAngleMemo.id}) }); load(); setConfirmTarget(null); showToast('삭제됨') }})}
                />
                <PlanningMemoCard
                  idea={issueListMemo}
                  label="🔍 이슈목록 + 이슈각도"
                  color="#0ea5e9"
                  bg="#f0f9ff"
                  border="#7dd3fc"
                  onEdit={() => { setEditingMemo(issueListMemo?.id || null); setShowPlanningModal('issue_list') }}
                  onDelete={() => issueListMemo && setConfirmTarget({ message:'이슈 기록을 삭제할까요?', onConfirm: async () => { await fetch('/api/admin/content-ideas', { method:'DELETE', headers:{'Content-Type':'application/json','x-admin-token':adminToken}, body:JSON.stringify({id:issueListMemo.id}) }); load(); setConfirmTarget(null); showToast('삭제됨') }})}
                />
                {/* 월간전략 — PlanningMemoCard 방식 + StrategyCard 뷰 */}
                {strategyMemo ? (
                  <StrategyCard
                    idea={strategyMemo}
                    onDelete={deleteIdea}
                    onEdit={() => { setEditingMemo(strategyMemo.id); setShowPlanningModal('strategy') }}
                  />
                ) : (
                  <div style={{ border:'2px dashed #c4b5fd', borderRadius:12, overflow:'hidden' }}>
                    <div style={{ background:'#f5f3ff', padding:'8px 14px', borderBottom:'1px dashed #c4b5fd' }}>
                      <span style={{ fontSize:12, fontWeight:800, color:'#7c3aed' }}>🗺️ 월간 전략</span>
                    </div>
                    <div style={{ padding:'14px 16px', textAlign:'center' }}>
                      <div style={{ fontSize:12, color:'#a78bfa', marginBottom:10 }}>아직 등록된 월간전략이 없어요</div>
                      <button onClick={() => { setEditingMemo(null); setShowPlanningModal('strategy') }}
                        style={{ padding:'6px 16px', borderRadius:8, border:'none', background:'#7c3aed', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>+ 전략 추가</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* ── 저장된 글감 목록 ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'12px 0 8px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#0f1f0f' }}>📋 저장된 글감</div>
          <button onClick={() => setShowAdd(true)} style={{ ...S.btn(), padding:'6px 14px', fontSize:12 }}>+ 추가</button>
        </div>
        {loading ? (
          <div style={{ color:'#888', fontSize:14, padding:'20px 0', textAlign:'center' }}>불러오는 중...</div>
        ) : (
          <>
            {tabIdeas.length === 0 && (
              <div style={{ color:'#aaa', fontSize:13, padding:'16px 0', textAlign:'center' }}>저장된 글감이 없어요</div>
            )}
            {SECTIONS.map(sec => {
              const secIdeas = tabIdeas.filter(i => i.tool_id === sec.value)
              return (
                <SectionGroup
                  key={sec.value}
                  section={sec}
                  ideas={secIdeas}
                  allIdeas={tabIdeas}
                  onUse={setUseTarget}
                  onUndoUse={undoUse}
                  onDelete={deleteIdea}
                  onMove={moveIdea}
                />
              )
            })}
          </>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8 }}>
            {ingLoading ? (
              <div style={{ color:'#aaa', fontSize:13, textAlign:'center', padding:'20px 0', gridColumn:'1/-1' }}>불러오는 중...</div>
            ) : ingredients.length === 0 ? (
              <div style={{ color:'#aaa', fontSize:13, textAlign:'center', padding:'20px 0', gridColumn:'1/-1' }}>등록된 제철 식재료가 없어요</div>
            ) : (
              ingredients.map(ing => (
                <IngredientCard
                  key={ing.id}
                  ing={ing}
                  onDelete={deleteIngredient}
                />
              ))
            )}
        </div>
      </div>



      {confirmTarget && <ConfirmModal message={confirmTarget.message} onConfirm={confirmTarget.onConfirm} onCancel={() => setConfirmTarget(null)} />}
      {showAdd && <AddIdeaModal activeMonth={activeMonth} onClose={() => setShowAdd(false)} onSave={addIdea} />}
      {showPlanningModal && (
        <PlanningMemoModal
          activeMonth={activeMonth}
          type={showPlanningModal}
          initialContent={editingMemo ? ideas.find(i => i.id === editingMemo)?.content || '' : ''}
          onClose={() => { setShowPlanningModal(null); setEditingMemo(null) }}
          onSave={savePlanningMemo}
        />
      )}
      {useTarget && <UseModal idea={useTarget} onClose={() => setUseTarget(null)} onSave={markUsed} />}

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
