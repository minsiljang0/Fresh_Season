import { useState, useEffect, useCallback } from 'react'
import { S } from './AdminUI'

const ACCENT = '#16a34a'

const SECTIONS = [
  { value: 'strategy',   label: '🗺️ 월간전략',  color: '#7c3aed', bg: '#f5f3ff' },
  { value: 'angle',      label: '✏️ 각도/기획', color: '#f59e0b', bg: '#fffbeb' },
  { value: 'special',    label: '⭐ 특집/테마', color: '#ec4899', bg: '#fdf4ff' },
  { value: 'ingredient', label: '🥕 식재료',    color: '#16a34a', bg: '#f0fdf4' },
  { value: 'season',     label: '🌤️ 계절/날씨', color: '#0ea5e9', bg: '#f0f9ff' },
  { value: 'health',     label: '💊 건강/효능', color: '#8b5cf6', bg: '#faf5ff' },
  { value: 'food',       label: '🍽️ 음식/요리', color: '#f59e0b', bg: '#fffbeb' },
  { value: 'festival',   label: '🎉 절기/행사', color: '#ef4444', bg: '#fff1f2' },
  { value: 'event',      label: '🏖️ 특이사항',  color: '#06b6d4', bg: '#ecfeff' },
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
  const sorted = Object.entries(catCount).sort((a, b) => b[1] - a[1])
  const limited   = ingredients.filter(i => i.is_limited)
  const special   = ingredients.filter(i => i.is_special)
  const caution   = ingredients.filter(i => i.caution)
  const superfood = ingredients.filter(i => i.is_superfood)
  const global_   = ingredients.filter(i => i.is_global)
  const brand     = ingredients.filter(i => i.is_brand)
  const Tag = ({label,bg,border,color}) => (
    <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:bg,border:`1px solid ${border}`,color,fontWeight:700,whiteSpace:'nowrap'}}>{label}</span>
  )
  return (
    <div style={{ background:'#fff', border:'1px solid #d1e8d1', borderRadius:10, marginBottom:8, overflow:'hidden' }}>
      {/* 헤더 요약 */}
      <div style={{ padding:'8px 16px', background:'#f0fdf4', borderBottom:'1px solid #d1e8d1', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <span style={{ fontSize:13, fontWeight:700, color:'#0f1f0f' }}>📊 {ingredients.length}개 소스 현황</span>
        {limited.length > 0   && <Tag label={`⏰ 기간한정 ${limited.length}개`}   bg='#d1fae5' border='#10b981' color='#059669'/>}
        {special.length > 0   && <Tag label={`🏆 특산품 ${special.length}개`}     bg='#fef3c7' border='#f59e0b' color='#b45309'/>}
        {superfood.length > 0 && <Tag label={`🌟 슈퍼푸드 ${superfood.length}개`} bg='#fef3c7' border='#f59e0b' color='#92400e'/>}
        {global_.length > 0   && <Tag label={`🌍 해외 ${global_.length}개`}       bg='#dbeafe' border='#93c5fd' color='#1d4ed8'/>}
        {brand.length > 0     && <Tag label={`🏷️ 지역브랜드 ${brand.length}개`}  bg='#ffe4e6' border='#fca5a5' color='#be123c'/>}
        {caution.length > 0   && <Tag label={`⚠️ 주의사항 ${caution.length}개`}  bg='#fef2f2' border='#fca5a5' color='#dc2626'/>}
      </div>
      {/* 카테고리 현황 */}
      <div style={{ padding:'8px 16px', display:'flex', gap:5, flexWrap:'wrap' }}>
        {sorted.map(([label, cnt]) => (
          <span key={label} style={{ fontSize:11, padding:'2px 8px', borderRadius:8, background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534', fontWeight:600 }}>{label} {cnt}</span>
        ))}
      </div>
      {/* 기간한정 재료명 */}
      {limited.length > 0 && (
        <div style={{ padding:'6px 16px', borderTop:'1px solid #d1fae5', background:'#f0fdf4', fontSize:11, color:'#059669' }}>
          <span style={{ fontWeight:700 }}>⏰ 기간한정 — 시즌 끝나기 전 먼저 발행: </span>
          {limited.map(i => i.name).join(' · ')}
        </div>
      )}
      {/* 특산품 재료명 */}
      {special.length > 0 && (
        <div style={{ padding:'6px 16px', borderTop:'1px solid #fde68a', background:'#fffbeb', fontSize:11, color:'#b45309' }}>
          <span style={{ fontWeight:700 }}>🏆 특산품: </span>
          {special.map(i => i.name).join(' · ')}
        </div>
      )}
      {/* 슈퍼푸드 재료명 */}
      {superfood.length > 0 && (
        <div style={{ padding:'6px 16px', borderTop:'1px solid #f59e0b', background:'#fffbeb', fontSize:11, color:'#92400e' }}>
          <span style={{ fontWeight:700 }}>🌟 슈퍼푸드: </span>
          {superfood.map(i => i.name).join(' · ')}
        </div>
      )}
      {/* 해외 재료명 */}
      {global_.length > 0 && (
        <div style={{ padding:'6px 16px', borderTop:'1px solid #93c5fd', background:'#eff6ff', fontSize:11, color:'#1d4ed8' }}>
          <span style={{ fontWeight:700 }}>🌍 해외: </span>
          {global_.map(i => i.name).join(' · ')}
        </div>
      )}
      {/* 지역브랜드 재료명 */}
      {brand.length > 0 && (
        <div style={{ padding:'6px 16px', borderTop:'1px solid #fca5a5', background:'#ffe4e6', fontSize:11, color:'#be123c' }}>
          <span style={{ fontWeight:700 }}>🏷️ 지역브랜드: </span>
          {brand.map(i => i.name).join(' · ')}
        </div>
      )}
      {/* 주의사항 재료명 */}
      {caution.length > 0 && (
        <div style={{ padding:'6px 16px', borderTop:'1px solid #fca5a5', background:'#fef2f2', fontSize:11, color:'#dc2626' }}>
          <span style={{ fontWeight:700 }}>⚠️ 주의사항: </span>
          {caution.map(i => `${i.name}(${(i.caution||'').slice(0,15)})`).join(' · ')}
        </div>
      )}
    </div>
  )
}

// ── 월간전략 카드 (섹션별 파싱) ─────────────────────────────
function parseStrategy(content) {
  const sections = { issues: [], bigPicture: '', weeks: [], principle: '' }
  const lines = (content || '').split('\n')
  let current = null
  lines.forEach(line => {
    const t = line.trim()
    if (t === '[이달의 핵심 이슈]') { current = 'issues'; return }
    if (t === '[이달의 큰 틀]') { current = 'bigPicture'; return }
    if (t === '[주차별 방향]') { current = 'weeks'; return }
    if (t === '[각도 운영 원칙]') { current = 'principle'; return }
    if (!t) return
    if (current === 'issues') sections.issues.push(t)
    else if (current === 'bigPicture') sections.bigPicture = t
    else if (current === 'weeks') sections.weeks.push(t)
    else if (current === 'principle') sections.principle = t
  })
  return sections
}

function StrategyCard({ idea, onDelete, ingredients }) {
  const s = parseStrategy(idea.content)

  // 각도별 소스 — 식재료 데이터에서 자동 추출
  const limited = (ingredients || []).filter(i => i.is_limited)
  const special  = (ingredients || []).filter(i => i.is_special)
  const caution  = (ingredients || []).filter(i => i.caution)
  const child    = (ingredients || []).filter(i => (i.age_groups||[]).some(a => ['infant','child'].includes(a)))
  const male     = (ingredients || []).filter(i => i.gender === 'male')

  const weekColors = ['#fecdd3','#bfdbfe','#d9f99d','#fde68a']
  const weekTextColors = ['#be123c','#1d4ed8','#166534','#92400e']

  return (
    <div style={{ border:'2px solid #7c3aed', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
      {/* 헤더 */}
      <div style={{ background:'#7c3aed', padding:'10px 16px', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>🗺️ 월간전략</span>
        <span style={{ fontSize:11, color:'#c4b5fd', marginLeft:'auto' }}>등록 {fmtDate(idea.created_at)}</span>
        <button onClick={() => onDelete(idea.id)} style={{ background:'none', border:'1px solid #c4b5fd', borderRadius:6, color:'#ede9fe', cursor:'pointer', padding:'2px 8px', fontSize:12 }}>×</button>
      </div>

      <div style={{ background:'#faf5ff', padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>

        {/* 각도별 소스 */}
        {ingredients && ingredients.length > 0 && (
          <div style={{ background:'#fff', border:'1px solid #e9d5ff', borderRadius:8, padding:'10px 14px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#7c3aed', marginBottom:8 }}>각도별 소스</div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {limited.length > 0 && (
                <div style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'6px 10px', background:'#fef2f2', borderRadius:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#dc2626', whiteSpace:'nowrap' }}>⏰ 기간한정 {limited.length}개</span>
                  <span style={{ fontSize:11, color:'#dc2626' }}>{limited.map(i => i.name).join(' · ')}</span>
                </div>
              )}
              {special.length > 0 && (
                <div style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'6px 10px', background:'#fffbeb', borderRadius:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#b45309', whiteSpace:'nowrap' }}>🏆 특산품 {special.length}개</span>
                  <span style={{ fontSize:11, color:'#b45309' }}>{special.map(i => i.name).join(' · ')}</span>
                </div>
              )}
              {caution.length > 0 && (
                <div style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'6px 10px', background:'#fff7ed', borderRadius:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#c2410c', whiteSpace:'nowrap' }}>⚠️ 주의사항 {caution.length}개</span>
                  <span style={{ fontSize:11, color:'#c2410c' }}>{caution.map(i => i.name + '(' + (i.caution||'').slice(0,10) + ')').join(' · ')}</span>
                </div>
              )}
              {child.length > 0 && (
                <div style={{ display:'flex', gap:8, alignItems:'center', padding:'6px 10px', background:'#fefce8', borderRadius:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#854d0e', whiteSpace:'nowrap' }}>👶 어린이·영유아 {child.length}개</span>
                  <span style={{ fontSize:11, color:'#854d0e' }}>타겟별 각도 활용 가능</span>
                </div>
              )}
              {male.length > 0 && (
                <div style={{ display:'flex', gap:8, alignItems:'center', padding:'6px 10px', background:'#eff6ff', borderRadius:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#1d4ed8', whiteSpace:'nowrap' }}>👨 남성 특화 {male.length}개</span>
                  <span style={{ fontSize:11, color:'#1d4ed8' }}>{male.map(i => i.name).join(' · ')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 이달의 이슈 */}
        {s.issues.length > 0 && (
          <div style={{ background:'#fff', border:'1px solid #e9d5ff', borderRadius:8, padding:'10px 14px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#7c3aed', marginBottom:8 }}>이달의 이슈 (웹 검색 결과)</div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {s.issues.map((issue, i) => {
                const parts = issue.split('→')
                const isImportant = issue.includes('복') || issue.includes('월드컵') || issue.includes('올림픽')
                return (
                  <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'6px 10px', background: isImportant ? '#fef2f2' : '#f8fafc', borderRadius:6 }}>
                    {parts.length > 1 ? (
                      <>
                        <span style={{ fontSize:11, fontWeight:700, color: isImportant ? '#dc2626' : '#374151', whiteSpace:'nowrap' }}>{parts[0].trim()}</span>
                        <span style={{ fontSize:11, color: isImportant ? '#dc2626' : '#6b7280' }}>→ {parts[1].trim()}</span>
                      </>
                    ) : (
                      <span style={{ fontSize:11, color:'#374151' }}>{issue}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 작성 순서 원칙 */}
        {(s.weeks.length > 0 || s.principle) && (
          <div style={{ background:'#fff', border:'1px solid #e9d5ff', borderRadius:8, padding:'10px 14px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#7c3aed', marginBottom:8 }}>작성 순서 원칙</div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {s.weeks.map((w, i) => {
                const parts = w.split(':')
                return (
                  <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'1px 8px', borderRadius:10, background: weekColors[i] || '#f3f4f6', color: weekTextColors[i] || '#374151', whiteSpace:'nowrap', flexShrink:0 }}>
                      {parts[0].trim()}
                    </span>
                    <span style={{ fontSize:12, color:'#374151', lineHeight:1.6 }}>{parts.slice(1).join(':').trim()}</span>
                  </div>
                )
              })}
              {s.principle && (
                <div style={{ marginTop:6, padding:'7px 10px', background:'#f5f3ff', borderRadius:6, fontSize:11, color:'#4c1d95', lineHeight:1.7 }}>
                  {s.principle}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 큰 틀 */}
        {s.bigPicture && (
          <div style={{ background:'#fff', border:'1px solid #e9d5ff', borderRadius:8, padding:'10px 14px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#7c3aed', marginBottom:4 }}>이달의 큰 틀</div>
            <div style={{ fontSize:12, color:'#374151', lineHeight:1.7 }}>{s.bigPicture}</div>
          </div>
        )}

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
function AddIdeaModal({ activeMonth, onClose, onSave }) {
  const [form, setForm] = useState({ section: 'angle', type: 'idea', content: '', keyword: '', angle: '', memo: '' })
  const [strategy, setStrategy] = useState({ issues: '', bigPicture: '', week1: '', week2: '', week3: '', week4: '', principle: '' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const setSt = (k, v) => setStrategy(p => ({ ...p, [k]: v }))
  const isStrategy = form.section === 'strategy'

  const buildStrategyContent = () => {
    return [
      '[이달의 핵심 이슈]', strategy.issues, '',
      '[이달의 큰 틀]', strategy.bigPicture, '',
      '[주차별 방향]',
      '1주차: ' + strategy.week1,
      '2주차: ' + strategy.week2,
      '3주차: ' + strategy.week3,
      '4주차: ' + strategy.week4, '',
      '[각도 운영 원칙]', strategy.principle,
    ].join('\n')
  }

  const handleSave = () => {
    if (isStrategy) {
      if (!strategy.issues.trim()) return
      onSave({ section: 'strategy', type: 'memo', content: buildStrategyContent(), keyword: '', angle: '', memo: '', tab_id: 'month_' + activeMonth })
    } else {
      if (!form.content.trim()) return
      onSave({ ...form, tab_id: 'month_' + activeMonth })
    }
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
          {isStrategy ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ background:'#f5f3ff', border:'1px solid #c4b5fd', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#4c1d95' }}>
                글 쓰는 Claude가 이 달을 보고 방향을 잡을 수 있도록 작성합니다
              </div>
              <div>
                <label style={S.label}>이달의 핵심 이슈 * <span style={{color:'#9ca3af',fontWeight:400}}>(날짜 포함)</span></label>
                <textarea value={strategy.issues} onChange={e => setSt('issues', e.target.value)}
                  placeholder="예: 초복 7/15 · 중복 7/25 · 북중미 월드컵 · 여름방학 · 장마" rows={2} style={S.textarea} />
              </div>
              <div>
                <label style={S.label}>이달의 큰 틀</label>
                <textarea value={strategy.bigPicture} onChange={e => setSt('bigPicture', e.target.value)}
                  placeholder="예: 삼복 보양식 + 여름 과일 풍성 시즌 — 보양·urgency·이슈 각도 중심" rows={2} style={S.textarea} />
              </div>
              <div>
                <label style={S.label}>주차별 방향</label>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {[['week1','1주차'],['week2','2주차'],['week3','3주차'],['week4','4주차']].map(([k, label]) => (
                    <div key={k} style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ fontSize:11, fontWeight:700, color:'#7c3aed', background:'#ede9fe', border:'1px solid #c4b5fd', padding:'2px 8px', borderRadius:10, whiteSpace:'nowrap', flexShrink:0 }}>{label}</span>
                      <input value={strategy[k]} onChange={e => setSt(k, e.target.value)} style={{ ...S.input, margin:0 }} placeholder={label + ' 주력 방향'} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label style={S.label}>각도 운영 원칙</label>
                <input value={strategy.principle} onChange={e => setSt('principle', e.target.value)}
                  style={S.input} placeholder="예: 과일·해산물 번갈아 / 같은 각도 2편 연속 금지" />
              </div>
            </div>
          ) : (
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
          )}
        </div>
        <div style={{ display:'flex', gap:8, marginTop:20, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btnGhost}>취소</button>
          <button onClick={handleSave}
            disabled={isStrategy ? !strategy.issues.trim() : !form.content.trim()}
            style={{ ...S.btn(), opacity: (isStrategy ? strategy.issues.trim() : form.content.trim()) ? 1 : 0.4 }}>저장</button>
        </div>
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

// ── 아이디어 카드 ────────────────────────────────────────────
function IdeaCard({ idea, onUse, onUndoUse, onDelete, index, onMoveUp, onMoveDown, isFirst, isLast }) {
  const sec = SECTIONS.find(s => s.value === idea.tool_id) || SECTIONS[7]
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
      <div style={{ display:'flex', flexDirection:'column', gap:2, flexShrink:0, paddingTop:2 }}>
        <button onClick={onMoveUp} disabled={isFirst}
          style={{ background:'none', border:'none', cursor: isFirst ? 'default' : 'pointer', color: isFirst ? '#ddd' : '#aaa', fontSize:11, lineHeight:1, padding:'2px 4px' }}>▲</button>
        <span style={{ fontSize:11, color:'#ccc', textAlign:'center', lineHeight:1 }}>{index+1}</span>
        <button onClick={onMoveDown} disabled={isLast}
          style={{ background:'none', border:'none', cursor: isLast ? 'default' : 'pointer', color: isLast ? '#ddd' : '#aaa', fontSize:11, lineHeight:1, padding:'2px 4px' }}>▼</button>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:10, background:sec.bg, color:sec.color }}>{sec.label}</span>
          <span style={{ fontSize:11, fontWeight:700, color:typ.color }}>#{typ.label}</span>
          {isUsed && (
            <span style={{ fontSize:11, color:'#16a34a', fontWeight:700, background:'#dcfce7', padding:'2px 7px', borderRadius:6 }}>
              ✓ {fmtUsedAt(idea.used_at)}
            </span>
          )}
          {isUsed && idea.used_slug && (
            <span style={{ fontSize:11, color:'#6b7280', background:'#f3f4f6', padding:'2px 7px', borderRadius:6, fontFamily:'monospace' }}>
              /{idea.used_slug}
            </span>
          )}
          <span style={{ fontSize:11, color:'#bbb', marginLeft:'auto' }}>등록 {fmtDate(idea.created_at)}</span>
        </div>
        <div style={{ fontSize:14, color: isUsed ? '#9ca3af' : '#111', lineHeight:1.6, wordBreak:'break-word' }}>{idea.content}</div>
        {idea.keyword && <div style={{ fontSize:12, color:'#16a34a', marginTop:5 }}>🔑 {idea.keyword}</div>}
        {idea.memo && <div style={{ fontSize:12, color:'#888', marginTop:4, fontStyle:'italic' }}>📝 {idea.memo}</div>}
      </div>
      <div style={{ display:'flex', gap:5, flexShrink:0 }}>
        {isUsed ? (
          <button onClick={onUndoUse} title="미사용으로 되돌리기"
            style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:7, color:'#16a34a', cursor:'pointer', padding:'5px 9px', fontSize:13 }}>↩</button>
        ) : (
          <button onClick={onUse} title="사용 완료 처리"
            style={{ background:'none', border:'1px solid #d1e8d1', borderRadius:7, color:'#6b7280', cursor:'pointer', padding:'5px 9px', fontSize:13 }}>✓</button>
        )}
        <button onClick={onDelete}
          style={{ background:'none', border:'1px solid #fecaca', borderRadius:7, color:'#f87171', cursor:'pointer', padding:'5px 9px', fontSize:13 }}>×</button>
      </div>
    </div>
  )
}

// ── 섹션 그룹 ────────────────────────────────────────────────
function SectionGroup({ section, ideas, allIdeas, onUse, onUndoUse, onDelete, onMove }) {
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
            // 지역별 재료
            const regionMap = {}
            ingredients.forEach(i=>(i.regions_preview||[]).forEach(r=>{ if(!regionMap[r]) regionMap[r]=[]; regionMap[r].push(i.name) }))
            const regionSorted = Object.entries(regionMap).sort((a,b)=>b[1].length-a[1].length)
            // 절기별 재료
            const jeolgiIngMap = {}
            jeolgis.forEach(jk => {
              jeolgiIngMap[jk] = ingredients.filter(i=>(Array.isArray(i.jeolgi_badge)?i.jeolgi_badge:[i.jeolgi_badge]).includes(jk)).map(i=>i.name)
            })
            // 테마별 재료
            const specialIngMap = {}
            specials.forEach(sk => {
              specialIngMap[sk] = ingredients.filter(i=>(Array.isArray(i.special_badge)?i.special_badge:[i.special_badge]).includes(sk)).map(i=>i.name)
            })
            // 서식별 재료
            const habitatIngMap = {}
            habitats.forEach(hk => {
              habitatIngMap[hk] = ingredients.filter(i=>(Array.isArray(i.habitat_badge)?i.habitat_badge:[i.habitat_badge]).includes(hk)).map(i=>i.name)
            })
            // 양식별 재료
            const farmingIngMap = {}
            farmings.forEach(fk => {
              farmingIngMap[fk] = ingredients.filter(i=>(Array.isArray(i.farming_badge)?i.farming_badge:[i.farming_badge]).includes(fk)).map(i=>i.name)
            })
            // 연령별 재료
            const ageIngMap = {}
            ageGroups.filter(a=>a!=='all').forEach(a => {
              ageIngMap[a] = ingredients.filter(i=>(i.age_groups||[]).includes(a)).map(i=>i.name)
            })
            const maleIngs   = ingredients.filter(i=>i.gender==='male')
            const femaleIngs = ingredients.filter(i=>i.gender==='female')

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
            return (
              <div style={{padding:'6px 16px 12px',borderTop:'1px solid #f0fdf4',display:'flex',flexDirection:'column',gap:0}}>
                <Row label="계절" labelColor='#166534' show={seasons.length>0} badges={seasons.map(v=>seasonMap[v]).filter(Boolean)}/>
                {jeolgis.map(jk => jeolgiMap[jk] ? (
                  <Row key={jk} label={jeolgiMap[jk][0]} labelColor={jeolgiMap[jk][3]} show={true}
                    ingNames={jeolgiIngMap[jk]||[]} bg={jeolgiMap[jk][1]} border={jeolgiMap[jk][2]+'66'} color={jeolgiMap[jk][3]}/>
                ) : null)}
                {specials.map(sk => specialMap[sk] ? (
                  <Row key={sk} label={specialMap[sk][0]} labelColor={specialMap[sk][3]} show={true}
                    ingNames={specialIngMap[sk]||[]} bg={specialMap[sk][1]} border={specialMap[sk][2]} color={specialMap[sk][3]}/>
                ) : null)}
                {habitats.map(hk => habitatMap[hk] ? (
                  <Row key={hk} label={habitatMap[hk][0]} labelColor={habitatMap[hk][3]} show={true}
                    ingNames={habitatIngMap[hk]||[]} bg={habitatMap[hk][1]} border={habitatMap[hk][2]+'66'} color={habitatMap[hk][3]}/>
                ) : null)}
                {farmings.map(fk => farmingMap[fk] ? (
                  <Row key={fk} label={farmingMap[fk][0]} labelColor={farmingMap[fk][3]} show={true}
                    ingNames={farmingIngMap[fk]||[]} bg={farmingMap[fk][1]} border={farmingMap[fk][2]+'66'} color={farmingMap[fk][3]}/>
                ) : null)}
                {ingredients.some(i=>i.is_special)   && <Row label='🏆 특산품'    labelColor='#b45309' show={true} ingNames={ingredients.filter(i=>i.is_special).map(i=>i.name)}   bg='#fef3c7' border='#f59e0b' color='#92400e'/>}
                {ingredients.some(i=>i.is_limited)   && <Row label='⏰ 기간한정'  labelColor='#059669' show={true} ingNames={ingredients.filter(i=>i.is_limited).map(i=>i.name)}   bg='#d1fae5' border='#10b981' color='#065f46'/>}
                {ingredients.some(i=>i.is_superfood) && <Row label='🌟 슈퍼푸드'  labelColor='#92400e' show={true} ingNames={ingredients.filter(i=>i.is_superfood).map(i=>i.name)} bg='#fef3c7' border='#f59e0b' color='#78350f'/>}
                {ingredients.some(i=>i.is_global)    && <Row label='🌍 해외'      labelColor='#1d4ed8' show={true} ingNames={ingredients.filter(i=>i.is_global).map(i=>i.name)}    bg='#dbeafe' border='#93c5fd' color='#1e40af'/>}
                {ingredients.some(i=>i.is_brand)     && <Row label='🏷️ 지역브랜드' labelColor='#e63946' show={true} ingNames={ingredients.filter(i=>i.is_brand).map(i=>i.name)}   bg='#ffe4e6' border='#fca5a5' color='#be123c'/>}
                {ageGroups.filter(a=>a!=='all').map(a => ageMap[a] ? (
                  <Row key={a} label={ageMap[a][0]} labelColor={ageMap[a][3]} show={true}
                    ingNames={ageIngMap[a]||[]} bg={ageMap[a][1]} border={ageMap[a][2]+'66'} color={ageMap[a][3]}/>
                ) : null)}
                {genders.map(g => genderMap[g] ? (
                  <Row key={g} label={genderMap[g][0]} labelColor={genderMap[g][3]} show={true}
                    ingNames={g==='male'?maleIngs.map(i=>i.name):femaleIngs.map(i=>i.name)}
                    bg={genderMap[g][1]} border={genderMap[g][2]+'66'} color={genderMap[g][3]}/>
                ) : null)}
                {regionSorted.map(([region, names]) => (
                  <Row key={region} label={`📍 ${region}`} labelColor='#1d4ed8' show={true}
                    ingNames={names} bg='#dbeafe' border='#93c5fd' color='#1e40af'/>
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
            )
          })()}
        </div>

        {/* ── 저장된 글감 목록 ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'12px 0 8px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#0f1f0f' }}>📋 저장된 글감</div>
          <button onClick={() => setShowAdd(true)} style={{ ...S.btn(), padding:'6px 14px', fontSize:12 }}>+ 추가</button>
        </div>
        {loading ? (
          <div style={{ color:'#888', fontSize:14, padding:'20px 0', textAlign:'center' }}>불러오는 중...</div>
        ) : (
          <>
            {/* 월간전략 카드 — 데이터 없어도 항상 표시 */}
            {tabIdeas.filter(i => i.tool_id === 'strategy').length > 0 ? (
              tabIdeas.filter(i => i.tool_id === 'strategy').map(idea => (
                <StrategyCard key={idea.id} idea={idea} onDelete={deleteIdea} ingredients={ingredients} />
              ))
            ) : (
              <div style={{ border:'2px dashed #c4b5fd', borderRadius:12, padding:'20px 16px', marginBottom:16, textAlign:'center', background:'#faf5ff' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#7c3aed', marginBottom:6 }}>🗺️ 월간전략</div>
                <div style={{ fontSize:12, color:'#a78bfa' }}>아직 등록된 월간전략이 없어요</div>
                <button onClick={() => setShowAdd(true)} style={{ marginTop:10, padding:'6px 16px', borderRadius:8, border:'none', background:'#7c3aed', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>+ 전략 추가</button>
              </div>
            )}
            {tabIdeas.filter(i => i.tool_id !== 'strategy').length === 0 && (
              <div style={{ color:'#aaa', fontSize:13, padding:'16px 0', textAlign:'center' }}>저장된 글감이 없어요</div>
            )}
            {SECTIONS.filter(s => s.value !== 'strategy').map(sec => {
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
