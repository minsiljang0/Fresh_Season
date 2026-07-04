import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { SkeletonGrid } from '../../components/SkeletonCard'
import { MONTH_NAMES, getMonthTheme, AGE_GROUPS, getAgeGroup, getServingSize, buildCalendarMonthPlan } from '../../lib/mealPlans'

const MEAL_META = [
  { key: 'breakfast', label: '아침', icon: '🌅' },
  { key: 'lunch',     label: '점심', icon: '🍽️' },
  { key: 'dinner',    label: '저녁', icon: '🌙' },
]

export async function getStaticPaths() {
  return {
    paths: Array.from({ length: 12 }, (_, i) => ({ params: { month: String(i + 1) } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const month = Number(params.month)
  if (!month || month < 1 || month > 12) return { notFound: true }
  return { props: { month } }
}

function dishSummary(meal) {
  if (!meal || !meal.dishes.length) return '—'
  return meal.dishes.map(d => d.dish).join(' · ')
}

// 주간보기 카드 / 날짜 클릭 모달에서 공통으로 쓰는 하루 식단 상세
function DayMealDetail({ year, month, cell }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h3 style={{ fontSize: 15, fontWeight: 900 }}>{year}.{month}.{cell.date} ({cell.weekday})</h3>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 999, padding: '3px 10px' }}>
          총 {cell.kcal.toLocaleString()}kcal
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
        {MEAL_META.map(mm => {
          const meal = cell[mm.key]
          return (
            <div key={mm.key} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>{mm.icon} {mm.label}</span>
                <span style={{ fontSize: 10.5, color: 'var(--text3)' }}>약 {meal.kcal.toLocaleString()}kcal</span>
              </div>
              <p style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.5 }}>{dishSummary(meal)}</p>
            </div>
          )
        })}
      </div>
    </>
  )
}

export default function MealPlanMonthPage({ month }) {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('month')       // 'month' | 'week'
  const [ageGroupId, setAgeGroupId] = useState('adult')
  const [weekIdx, setWeekIdx] = useState(0)
  const [selectedDate, setSelectedDate] = useState(null)

  const monthTheme = getMonthTheme(month)
  const ageGroup = getAgeGroup(ageGroupId)
  const servingSize = useMemo(() => getServingSize(ageGroupId), [ageGroupId])
  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()
  // 선택한 달이 이번 달보다 이전이면 "다가올" 그 달로 보이도록 내년으로 계산
  const year = month >= currentMonth ? currentYear : currentYear + 1

  useEffect(() => {
    setLoading(true)
    fetch('/api/map/seasonal-foods')
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        const list = Array.isArray(data) ? data : (data.foods || [])
        setFoods(list)
      })
      .catch(() => setFoods([]))
      .finally(() => setLoading(false))
  }, [])

  const plan = useMemo(() => buildCalendarMonthPlan(year, month, foods, ageGroupId), [year, month, foods, ageGroupId])

  useEffect(() => { setWeekIdx(0); setSelectedDate(null) }, [month, ageGroupId])

  const prevMonth = month === 1 ? 12 : month - 1
  const nextMonth = month === 12 ? 1 : month + 1
  const isCurrentMonth = month === currentMonth && year === currentYear

  const weekLabelFor = (week) => {
    const realDays = week.filter(Boolean)
    if (!realDays.length) return ''
    return `${realDays[0].date}일~${realDays[realDays.length - 1].date}일`
  }

  return (
    <>
      <Head>
        <title>{MONTH_NAMES[month - 1]} 제철 식단 (달력형 식단표) — Fresh Season</title>
        <meta name="description" content={`${MONTH_NAMES[month - 1]}에 나오는 제철 식재료로 짜는 달력형 식단표. 연령대별 칼로리 참고치 포함. ${monthTheme.theme}`} />
      </Head>
      <Header />
      <main className="wrap" style={{ paddingTop: 20, paddingBottom: 60 }}>

        <section style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 24, fontWeight: 900 }}>
              {monthTheme.icon} {MONTH_NAMES[month - 1]} 제철 식단
              {isCurrentMonth && (
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--accent)', color: '#fff', verticalAlign: 'middle' }}>이번 달</span>
              )}
            </h1>
            <div style={{ display: 'flex', gap: 6 }}>
              <Link href={`/meal-plan/${prevMonth}`} className="tag" style={{ textDecoration: 'none' }}>← {MONTH_NAMES[prevMonth - 1]}</Link>
              <Link href={`/meal-plan/${nextMonth}`} className="tag" style={{ textDecoration: 'none' }}>{MONTH_NAMES[nextMonth - 1]} →</Link>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8, lineHeight: 1.6 }}>
            {monthTheme.theme} · 이번 달 제철재료 <b>{plan.totalCount}가지</b>로 짠 {year}년 {MONTH_NAMES[month - 1]} 달력형 식단표예요.
          </p>
        </section>

        {/* 연령대 탭 */}
        <section style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {AGE_GROUPS.map(g => (
              <button key={g.id} onClick={() => setAgeGroupId(g.id)}
                style={{
                  padding: '7px 13px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${g.id === ageGroupId ? 'var(--accent)' : 'var(--border)'}`,
                  background: g.id === ageGroupId ? 'var(--accent)' : 'var(--surface)',
                  color: g.id === ageGroupId ? '#fff' : 'var(--text2)',
                }}>
                {g.icon} {g.label} <span style={{ opacity: 0.8, fontWeight: 500 }}>({g.range})</span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 13, fontWeight: 700 }}>
              🔥 {ageGroup.label} 하루 칼로리 참고치: 약 {ageGroup.kcalMin.toLocaleString()}~{ageGroup.kcalMax.toLocaleString()}kcal
            </p>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, lineHeight: 1.5 }}>
              보건복지부 「한국인 영양소 섭취기준」의 연령대별 에너지필요추정량을 성별 평균 낸 대략적인 참고 범위이며, 실제 필요량은 활동량·체격·건강 상태에 따라 달라질 수 있어요.
            </p>
            <p style={{ fontSize: 12.5, fontWeight: 600, marginTop: 8, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <span>🍚 밥 1공기 약 <b>{servingSize.riceG}g</b></span>
              <span>🥣 국 1그릇 약 <b>{servingSize.soupMl}ml</b></span>
            </p>
            <p style={{ fontSize: 10.5, color: 'var(--text3)', marginTop: 2, lineHeight: 1.5 }}>
              성인 1인분(밥 210g·국 300ml)을 기준으로 연령대 권장 칼로리에 맞춰 어림잡은 그릇 크기예요. 실제 그릇·식욕에 따라 조절해주세요.
            </p>
            {ageGroup.note && (
              <p style={{ fontSize: 12, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 10px', marginTop: 8, lineHeight: 1.6 }}>
                📌 {ageGroup.note}
              </p>
            )}
          </div>
        </section>

        {/* 보기 전환 */}
        <section style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => setView('month')}
            style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: `1.5px solid ${view === 'month' ? 'var(--accent)' : 'var(--border)'}`,
              background: view === 'month' ? 'var(--accent)' : 'var(--surface)',
              color: view === 'month' ? '#fff' : 'var(--text2)' }}>📅 월간보기</button>
          <button onClick={() => setView('week')}
            style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: `1.5px solid ${view === 'week' ? 'var(--accent)' : 'var(--border)'}`,
              background: view === 'week' ? 'var(--accent)' : 'var(--surface)',
              color: view === 'week' ? '#fff' : 'var(--text2)' }}>📋 주간보기</button>
          <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 12.5, color: 'var(--text2)' }}>
            이 달 하루 평균 약 <b>{plan.monthlyAvgKcal.toLocaleString()}kcal</b>
          </span>
        </section>

        {loading ? (
          <SkeletonGrid count={6} />
        ) : plan.totalCount === 0 ? (
          <div className="empty-state">
            <p>이 달의 제철재료 데이터를 아직 준비 중이에요.</p>
            <small>다른 달을 확인해보시거나 잠시 후 다시 시도해주세요.</small>
          </div>
        ) : view === 'month' ? (
          /* ───────────── 월간(달력) 보기 ───────────── */
          <section className="detail-box" style={{ padding: 14, marginBottom: 20, overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(120px, 1fr))', gap: 6, minWidth: 780 }}>
              {['월','화','수','목','금','토','일'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'var(--text2)', padding: '4px 0' }}>{d}</div>
              ))}
              {plan.weeks.flat().map((cell, i) => {
                if (!cell) return <div key={i} style={{ minHeight: 108, borderRadius: 8, background: 'var(--surface2)', opacity: 0.4 }} />
                const isToday = isCurrentMonth && cell.date === today.getDate()
                return (
                  <div key={i} onClick={() => setSelectedDate(cell.date)} style={{
                    minHeight: 108, borderRadius: 8, padding: '6px 8px', background: 'var(--surface)', cursor: 'pointer',
                    border: isToday ? '2px solid var(--accent)' : '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2,
                    transition: 'box-shadow 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow, 0 4px 12px rgba(0,0,0,0.08))'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 900 }}>{cell.date}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#ea580c', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 999, padding: '1px 5px' }}>{cell.kcal.toLocaleString()}kcal</span>
                    </div>
                    {MEAL_META.map(mm => (
                      <p key={mm.key} title={dishSummary(cell[mm.key])}
                        style={{ fontSize: 9.5, color: 'var(--text2)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {mm.icon} {dishSummary(cell[mm.key])}
                      </p>
                    ))}
                  </div>
                )
              })}
            </div>
          </section>
        ) : (
          /* ───────────── 주간 보기 ───────────── */
          <section style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button onClick={() => setWeekIdx(i => Math.max(0, i - 1))} disabled={weekIdx === 0} className="tag"
                style={{ cursor: weekIdx === 0 ? 'default' : 'pointer', opacity: weekIdx === 0 ? 0.4 : 1 }}>← 이전 주</button>
              <p style={{ fontSize: 14, fontWeight: 800 }}>
                {weekIdx + 1}주차 ({weekLabelFor(plan.weeks[weekIdx] || [])})
              </p>
              <button onClick={() => setWeekIdx(i => Math.min(plan.weeks.length - 1, i + 1))} disabled={weekIdx >= plan.weeks.length - 1} className="tag"
                style={{ cursor: weekIdx >= plan.weeks.length - 1 ? 'default' : 'pointer', opacity: weekIdx >= plan.weeks.length - 1 ? 0.4 : 1 }}>다음 주 →</button>
            </div>

            {(plan.weeks[weekIdx] || []).filter(Boolean).map(cell => (
              <div key={cell.date} className="detail-box" style={{ padding: '16px 18px', marginBottom: 12, cursor: 'pointer' }}
                onClick={() => setSelectedDate(cell.date)}>
                <DayMealDetail year={year} month={month} cell={cell} />
              </div>
            ))}
          </section>
        )}

        {/* 어린이·유아 참고자료 안내 */}
        {(ageGroupId === 'infant' || ageGroupId === 'child') && (
          <section className="detail-box" style={{ marginBottom: 20, padding: '16px 18px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#1e40af', marginBottom: 6 }}>📖 영유아·어린이 식단 참고자료</p>
            <ul style={{ fontSize: 12.5, color: '#1e3a5f', lineHeight: 1.8, paddingLeft: 18 }}>
              <li>보건복지부 「한국인 영양소 섭취기준」 — 연령대별 에너지·영양소 기준</li>
              <li>어린이급식관리지원센터 — 어린이 식단·영양 관리 자료</li>
              <li>교육부 학교급식법 — 학교급식 영양 기준 (7세 이상)</li>
              <li>영유아 건강검진(국민건강보험공단) — 개월 수·연령별 맞춤 식이 상담</li>
            </ul>
            <p style={{ fontSize: 11.5, color: '#1e40af', marginTop: 8, lineHeight: 1.6 }}>
              이 페이지의 식단은 제철재료를 소개하기 위한 참고용 예시예요. 알레르기·이유식 단계·편식 등 개인차가 큰 시기이니, 실제 급식·이유식 계획은 소아과·영양사 상담과 위 공공기관 자료를 함께 확인해주세요.
            </p>
          </section>
        )}

        <section className="detail-box" style={{ marginBottom: 24, padding: '18px 20px' }}>
          <p className="detail-label">이 달의 제철재료 전체 목록 ({plan.totalCount}가지)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {plan.allIngredients.map(f => (
              <Link key={f.ingredient} href={`/ingredient/${encodeURIComponent(f.ingredient)}`} className="tag" style={{ textDecoration: 'none' }}>
                {f.ingredient}
              </Link>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10, lineHeight: 1.6 }}>
            ⚠️ 칼로리와 식단 구성은 제철재료·조리법을 바탕으로 한 대략적인 추정치예요. 실제 조리 방식·양에 따라 달라질 수 있어요.
          </p>
        </section>

        <Link href="/meal-plan" className="back-link">← 월별 제철 식단 전체보기</Link>
      </main>

      {/* 날짜 클릭 시 하루 식단 상세 모달 */}
      {selectedDate && (() => {
        const cell = plan.days.find(d => d.date === selectedDate)
        if (!cell) return null
        return (
          <div onClick={() => setSelectedDate(null)} style={{
            position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: 'var(--surface, #fff)', borderRadius: 16, width: '100%', maxWidth: 560,
              maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', padding: '22px 22px 20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -6 }}>
                <button onClick={() => setSelectedDate(null)} style={{
                  border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text3)', lineHeight: 1,
                }}>✕</button>
              </div>
              <DayMealDetail year={year} month={month} cell={cell} />
              <p style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 14, lineHeight: 1.6 }}>
                🍚 밥 1공기 약 {servingSize.riceG}g · 🥣 국 1그릇 약 {servingSize.soupMl}ml 기준({ageGroup.label}) 대략적인 추정치예요.
              </p>
              <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                <button onClick={() => setSelectedDate(d => Math.max(1, d - 1))} disabled={selectedDate === 1} className="tag"
                  style={{ cursor: selectedDate === 1 ? 'default' : 'pointer', opacity: selectedDate === 1 ? 0.4 : 1 }}>← 전날</button>
                <button onClick={() => setSelectedDate(d => Math.min(plan.daysInMonth, d + 1))} disabled={selectedDate === plan.daysInMonth} className="tag"
                  style={{ cursor: selectedDate === plan.daysInMonth ? 'default' : 'pointer', opacity: selectedDate === plan.daysInMonth ? 0.4 : 1 }}>다음날 →</button>
              </div>
            </div>
          </div>
        )
      })()}

      <Footer />
    </>
  )
}
