import { useState, useEffect, useCallback, useMemo } from 'react'
import { S, Toast } from './AdminUI'

// ── 백링크 체크리스트 데이터 (제철먹거라 / Fresh Season 맞춤)
const GROUPS = [
  {
    key: 'search',
    title: '🔍 검색엔진 & 디렉토리 등록',
    desc: '가장 기본적이고 확실한 백링크 — 모든 사이트가 최우선으로 끝내야 할 항목',
    color: '#16a34a', border: '#bbf7d0', bg: '#f0fdf4',
    items: [
      { text: '구글 서치콘솔 백링크 보고서 확인', desc: '링크 → 외부 링크에서 현재 백링크 소스 점검', link: 'https://search.google.com/search-console' },
      { text: '네이버 서치어드바이저 등록 및 최적화', desc: '소유확인 · 사이트맵 제출 · RSS 등록', link: 'https://searchadvisor.naver.com' },
      { text: '빙(Bing) 웹마스터 도구 등록', desc: '구글 서치콘솔에서 가져오기 기능 사용 가능', link: 'https://www.bing.com/webmasters' },
      { text: '다음(카카오) 검색 등록', desc: '카카오 사이트 등록 신청 페이지에서 진행', link: 'https://register.search.daum.net' },
      { text: '무료 디렉토리/포털 사이트 등록', desc: '그린리뷰 등 국내 큐레이션·디렉토리 사이트 등록', link: null },
    ],
  },
  {
    key: 'sns',
    title: '📱 SNS·채널 백링크',
    desc: '프로필/게시물에 fsfood.kr 링크를 꾸준히 노출',
    color: '#7c3aed', border: '#ddd6fe', bg: '#faf5ff',
    items: [
      { text: '인스타그램 비즈니스 계정 프로필 링크 연결', desc: '바이오 링크 + 하이라이트에 사이트 주소 고정', link: 'https://instagram.com' },
      { text: '네이버 블로그 운영 + 글마다 사이트 링크 삽입', desc: '레시피/제철 정보 요약 후 원문 링크 연결', link: 'https://blog.naver.com' },
      { text: '핀터레스트 비즈니스 계정 + 레시피 이미지 핀', desc: '이미지 클릭 시 원문으로 연결되는 핀 등록', link: 'https://pinterest.com' },
      { text: '유튜브 채널 설명란/고정댓글에 링크 추가', desc: '쇼츠·영상 설명란 첫 줄에 사이트 링크', link: 'https://youtube.com' },
      { text: '카카오톡 채널(플러스친구) 홈 링크 연결', desc: '채널 홈 프로필 영역에 사이트 주소 등록', link: 'https://center-pf.kakao.com' },
      { text: '페이스북 페이지 생성 + 게시물 공유', desc: '신규 글 발행 시 자동/수동 공유', link: 'https://facebook.com' },
    ],
  },
  {
    key: 'community',
    title: '🤝 커뮤니티 & 카페 활동',
    desc: '실사용자가 모이는 곳에 자연스럽게 정보와 링크를 공유',
    color: '#0891b2', border: '#a5f3fc', bg: '#f0f9ff',
    items: [
      { text: '네이버 요리/레시피 카페 가입 및 정보 공유', desc: '홍보성 아닌 정보성 글로 신뢰 먼저 쌓기', link: null },
      { text: '지역 맘카페에 제철 식재료 정보 공유', desc: '지역별 특산물 콘텐츠와 자연스럽게 연결', link: null },
      { text: '디시인사이드 요리 갤러리 등 커뮤니티 활동', desc: '정보 공유 위주, 과도한 홍보는 역효과 주의', link: null },
      { text: '네이버 지식인 답변에 출처 링크 삽입', desc: '식재료·레시피 질문에 답하며 출처로 연결', link: 'https://kin.naver.com' },
      { text: '카카오 오픈채팅방에서 홍보', desc: '요리/육아/지역 오픈채팅방에 자연스럽게 공유', link: null },
    ],
  },
  {
    key: 'content',
    title: '✍️ 콘텐츠 제휴 & 게스트 포스팅',
    desc: '다른 사이트가 자발적으로 우리 사이트를 링크하게 만들기',
    color: '#d97706', border: '#fde68a', bg: '#fffbeb',
    items: [
      { text: '관련 푸드 블로거에게 게스트 포스팅 제안', desc: '상호 이득이 되는 협업 형태로 제안', link: null },
      { text: '요리 인플루언서와 협업 콘텐츠 + 상호 링크', desc: '레시피 협업 후 서로의 채널에 링크 교환', link: null },
      { text: '지역 농수산물 협회·축제 사이트에 자료 제공', desc: '제철 정보 자료 제공 후 출처 링크 요청', link: null },
      { text: '브런치/티스토리에 요약글 발행 후 원문 링크', desc: '타 플랫폼 글 하단에 "원문 보기" 링크 연결', link: 'https://brunch.co.kr' },
      { text: '보도자료(프레스릴리즈) 배포', desc: '신규 기능/콘텐츠 출시 시 보도자료 배포', link: null },
    ],
  },
  {
    key: 'maintenance',
    title: '🛠️ 백링크 분석 & 유지보수',
    desc: '확보한 백링크의 품질을 점검하고 손상된 링크를 관리',
    color: '#dc2626', border: '#fecaca', bg: '#fef2f2',
    items: [
      { text: '경쟁 사이트 백링크 소스 분석', desc: 'Ahrefs/Ubersuggest 등으로 경쟁사가 어디서 링크를 받는지 확인', link: null },
      { text: '깨진 링크(Broken Link) 찾아 대체 링크 제안', desc: '관련 사이트의 404 링크를 찾아 우리 콘텐츠로 대체 제안', link: null },
      { text: '서치콘솔 링크 보고서 월간 점검', desc: '스팸성/저품질 백링크 발견 시 거부 처리 검토', link: 'https://search.google.com/search-console' },
      { text: '신규 백링크 발생 시 출처 품질 확인', desc: '품질 낮은 사이트에서의 링크는 점수에 악영향 가능', link: null },
      { text: '사이트맵에 새 페이지 빠짐없이 반영 확인', desc: '신규 글/페이지가 sitemap.xml에 자동 포함되는지 확인', link: null },
    ],
  },
  {
    key: 'schema',
    title: '🧩 구조화 데이터 & 기술 SEO 반영 현황',
    desc: '검색결과에 리치 스니펫이 노출되도록 적용한 JSON-LD·robots.txt·MCP 작업 현황',
    color: '#0d9488', border: '#99f6e4', bg: '#f0fdfa',
    items: [
      { text: 'pages/blog/[slug].js — BlogPosting + Breadcrumb JSON-LD', desc: 'JSON-LD 2개(BlogPosting+Breadcrumb) 및 author.url 포함 최신 버전 반영', link: 'https://search.google.com/test/rich-results' },
      { text: 'pages/region/[slug].js — Breadcrumb JSON-LD', desc: '지역별 페이지에 Breadcrumb 구조화 데이터 반영', link: null },
      { text: 'pages/ingredient/[name].js — Breadcrumb JSON-LD', desc: '식재료별 페이지에 Breadcrumb 구조화 데이터 반영', link: null },
      { text: 'pages/index.js — WebSite JSON-LD', desc: '메인 페이지에 WebSite 구조화 데이터 반영', link: null },
      { text: 'public/robots.txt — sitemap 주소 정상화', desc: 'sitemap 경로가 /sitemap.xml로 정상 수정됨', link: null },
      { text: 'app/api/mcp/route.js — TV 방송 도구 반영', desc: 'list_tv_episodes, add_tv_episode 도구 정상 반영', link: null },
    ],
  },
]

export default function BacklinkPanel({ adminToken }) {
  const [checks, setChecks] = useState({})
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [collapsed, setCollapsed] = useState({})

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/checklist', { headers: { 'x-admin-token': adminToken } })
      const data = await res.json()
      if (data.backlink) setChecks(data.backlink)
    } catch {}
    setLoading(false)
  }, [adminToken])

  useEffect(() => { load() }, [load])

  const toggle = async (key) => {
    const next = { ...checks, [key]: !checks[key] }
    setChecks(next) // 즉시 반영 (optimistic update)
    try {
      const res = await fetch('/api/admin/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ backlink: next }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setChecks(checks) // 실패 시 롤백
      showToast('❌ 저장 실패 — 다시 시도해주세요')
    }
  }

  const totalItems = useMemo(() => GROUPS.reduce((sum, g) => sum + g.items.length, 0), [])
  const doneCount = useMemo(() => Object.values(checks).filter(Boolean).length, [checks])
  const pct = totalItems ? Math.round((doneCount / totalItems) * 100) : 0

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f1f0f' }}>🔗 백링크 관리</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
            사이트 외부에서 유입되는 링크(백링크)를 늘리기 위해 해야 할 일들을 체크하세요. 체크는 자동으로 서버에 저장됩니다.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{doneCount} / {totalItems}</span>
          <div style={{ width: 120, height: 8, borderRadius: 5, background: '#eef6ee', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: '#16a34a', borderRadius: 5, transition: 'width .25s' }} />
          </div>
          <span style={{ fontSize: 12, color: '#4b6e4b', fontWeight: 700 }}>{pct}%</span>
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>불러오는 중...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {GROUPS.map(g => {
            const groupDone = g.items.filter((_, ii) => checks[`${g.key}__${ii}`]).length
            const isCollapsed = !!collapsed[g.key]
            return (
              <div key={g.key} style={{ background: '#fff', border: `1px solid ${g.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <button onClick={() => setCollapsed(p => ({ ...p, [g.key]: !p[g.key] }))}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: g.bg, border: 'none', borderBottom: isCollapsed ? 'none' : `1px solid ${g.border}`,
                    padding: '14px 18px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", textAlign: 'left',
                  }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: g.color }}>{g.title}</div>
                    <div style={{ fontSize: 12, color: '#4b6e4b', marginTop: 2 }}>{g.desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: g.color, background: '#fff', border: `1px solid ${g.border}`, borderRadius: 8, padding: '3px 10px' }}>
                      {groupDone}/{g.items.length}
                    </span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{isCollapsed ? '▼' : '▲'}</span>
                  </div>
                </button>

                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 16px' }}>
                    {g.items.map((item, ii) => {
                      const ck = `${g.key}__${ii}`
                      const checked = !!checks[ck]
                      return (
                        <div key={ii} onClick={() => toggle(ck)}
                          style={{
                            display: 'flex', gap: 10, alignItems: 'flex-start', background: '#f5f9f5',
                            borderRadius: 8, padding: '10px 12px', cursor: 'pointer',
                            opacity: checked ? 0.6 : 1, transition: 'opacity .15s',
                          }}>
                          <span style={{ fontSize: 18, flexShrink: 0, color: checked ? '#16a34a' : '#9ca3af', lineHeight: 1.4 }}>
                            {checked ? '☑' : '☐'}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: checked ? '#6b7280' : '#0f1f0f', textDecoration: checked ? 'line-through' : 'none' }}>
                              {item.text}
                            </div>
                            <div style={{ fontSize: 12, color: '#4b6e4b', lineHeight: 1.6, marginTop: 2 }}>{item.desc}</div>
                          </div>
                          {item.link && (
                            <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                              style={{ fontSize: 11, fontWeight: 700, color: g.color, flexShrink: 0, whiteSpace: 'nowrap', textDecoration: 'none', alignSelf: 'center' }}>
                              바로가기 →
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {toast && <Toast msg={toast} />}
    </div>
  )
}
