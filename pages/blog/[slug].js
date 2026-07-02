import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { REGIONS } from '../../lib/regions'
import { parseMarkdown } from '../../lib/parseMarkdown'
import { isStepCategory } from '../../lib/blogCategories'
import { extractStepImages, splitStepsHtml } from '../../lib/stepContent'
import { AdSlot } from '../../components/AdSlot'
import { useAdSlot } from '../../lib/AdSlotsContext'

// ── 관련도 점수 계산: 같은 지역 카테고리(+3), 태그(+2/개), 제목 키워드 겹침(+1/개)
// 기존 글처럼 category/tags가 비어있어 점수가 전부 0이 되더라도
// 풀이 텅 비지 않게 최신순으로 폴백 채운다.
function scoreRelated(post, allPosts) {
  if (!post || !Array.isArray(allPosts) || allPosts.length === 0) return []

  const others = allPosts.filter(p => p && p.id !== post.id)

  const scored = others.map(p => {
    let score = 0
    if (p.category && p.category === post.category) score += 3
    const postTags = Array.isArray(post.tags) ? post.tags : []
    const pTags = Array.isArray(p.tags) ? p.tags : []
    pTags.forEach(t => { if (postTags.includes(t)) score += 2 })
    const kw = (post.title || '').replace(/[^가-힣a-z0-9]/gi, ' ').split(/\s+/).filter(w => w.length > 1)
    kw.forEach(w => { if ((p.title || '').includes(w)) score += 1 })
    return { ...p, _score: score }
  })

  const ranked = [...scored].sort(
    (a, b) => b._score - a._score || new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at)
  )

  const matched = ranked.filter(p => p._score > 0)
  const fallback = ranked.filter(p => p._score === 0)

  return [...matched, ...fallback]
}

// ── 카테고리 배지 정보(아이콘/이름/색상) 계산 — 지역(REGIONS) + 커스텀 카테고리(레시피·식재료손질·팁·해외 등) 모두 지원
function resolveCategoryBadge(category, customCategories) {
  if (!category) return null
  const region = REGIONS.find(r => r.id === category)
  if (region) return { icon: region.icon, name: region.name, color: region.color }
  const customCat = (Array.isArray(customCategories) ? customCategories : []).find(c => c.label === category)
  if (customCat) return { icon: customCat.icon || '📁', name: customCat.label, color: '#16a34a' }
  return null
}

// ── 본문 중간 삽입용 미니 관련 글 카드
function InlineRelatedCard({ post, customCategories }) {
  const badge = resolveCategoryBadge(post.category, customCategories)
  return (
    <div style={{ margin: '28px 0', padding: 1, background: 'linear-gradient(90deg,#22c55e,#86efac)', borderRadius: 14 }}>
      <Link href={`/blog/${post.slug}`}
        style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', textAlign: 'left', background: 'var(--bg)', borderRadius: 13, padding: '16px 20px', textDecoration: 'none' }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{badge?.icon || '📎'}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent, #16a34a)', marginBottom: 4, letterSpacing: '0.5px' }}>관련 글</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</div>
          {post.summary && <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.summary}</div>}
        </div>
        <span style={{ color: 'var(--accent, #16a34a)', fontSize: 16, flexShrink: 0 }}>→</span>
      </Link>
    </div>
  )
}

// ── 본문 HTML을 블록 단위로 쪼개서 일정 간격마다 관련 글 카드 자동 삽입
function ContentWithInlineLinks({ html, relatedPool, customCategories }) {
  if (!html) return null
  const safePool = Array.isArray(relatedPool) ? relatedPool : []
  const blocks = []
  const re = /(<(?:p|h[2-6]|ul|ol|blockquote|pre|table)[^>]*>[\s\S]*?<\/(?:p|h[2-6]|ul|ol|blockquote|pre|table)>)/gi
  let last = 0, m
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) blocks.push(html.slice(last, m.index))
    blocks.push(m[0])
    last = re.lastIndex
  }
  if (last < html.length) blocks.push(html.slice(last))

  const INTERVAL = 4
  const result = []
  let paraCount = 0
  let cardIdx = 0
  const usedIds = new Set()

  blocks.forEach((block, i) => {
    result.push(<div key={`b${i}`} className="blog-content" dangerouslySetInnerHTML={{ __html: block }} />)
    if (/^<(?:p|h[2-6]|ul|ol)/i.test(block.trim())) paraCount++
    if (paraCount > 0 && paraCount % INTERVAL === 0 && cardIdx < safePool.length) {
      const card = safePool[cardIdx]
      if (card && !usedIds.has(card.id)) {
        usedIds.add(card.id)
        result.push(<InlineRelatedCard key={`rc${cardIdx}`} post={card} customCategories={customCategories} />)
        cardIdx++
      }
    }
  })
  return <>{result}</>
}

// ── 글 자체의 해시태그 줄
function PostTags({ tags }) {
  const safeTags = Array.isArray(tags) ? tags.filter(Boolean) : []
  if (safeTags.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
      {safeTags.map((t, i) => (
        <span key={i} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text2, #4b5563)', background: 'var(--card, #f3f4f6)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 999, padding: '5px 12px' }}>
          #{t}
        </span>
      ))}
    </div>
  )
}

// ── 하단 "이런 것도 궁금하지 않으세요?" 블록
function CuriosityBlock({ post, allPosts, inlineUsedIds, customCategories }) {
  if (!post || !Array.isArray(allPosts)) return null
  const safeUsedIds = inlineUsedIds instanceof Set ? inlineUsedIds : new Set()
  const pool = scoreRelated(post, allPosts).filter(p => !safeUsedIds.has(p.id)).slice(0, 3)
  if (pool.length === 0) return null
  return (
    <div style={{ marginTop: 48, paddingTop: 32, borderTop: '2px solid var(--border)' }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>🤔 이런 글도 궁금하지 않으세요?</div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>비슷한 지역·재료의 글을 더 읽어보세요</div>
      <div className="curiosity-grid">
        {pool.map(p => {
          const badge = resolveCategoryBadge(p.category, customCategories)
          const tags = Array.isArray(p.tags) ? p.tags.filter(Boolean).slice(0, 3) : []
          return (
            <Link key={p.id} href={`/blog/${p.slug}`} className="curiosity-card">
              {badge && (
                <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: `${badge.color}1a`, border: `1px solid ${badge.color}44`, borderRadius: 999, padding: '2px 7px', alignSelf: 'flex-start' }}>
                  {badge.icon} {badge.name}
                </span>
              )}
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.title}</div>
              {p.summary && <div style={{ fontSize: 11.5, color: 'var(--text3)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.summary}</div>}
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {tags.map((t, i) => (
                    <span key={i} style={{ fontSize: 10.5, color: 'var(--accent, #16a34a)', background: 'rgba(22,163,74,0.08)', borderRadius: 999, padding: '2px 7px', fontWeight: 600 }}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--accent, #16a34a)', fontWeight: 700, marginTop: 2 }}>읽어보기 →</div>
            </Link>
          )
        })}
      </div>
      <style>{`
        .curiosity-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .curiosity-card { text-align: left; background: var(--bg); border: 1.5px solid var(--border); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; text-decoration: none; min-width: 0; }
        @media (max-width: 640px) {
          .curiosity-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}

// ── 하단 서비스 유도 CTA 박스
function ServiceCTABlock({ post }) {
  const region = REGIONS.find(r => r.id === post?.category)
  return (
    <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
      <div style={{ background: 'var(--card, #f9fafb)', border: '2px solid var(--border)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 22 }}>{region?.icon || '🗺'}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{region ? `${region.name} 제철지도 보기` : '제철지도 보러가기'}</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, flex: 1 }}>지금 이 지역에서 나는 제철 식재료를 한눈에 확인해보세요</div>
        <Link href={region ? `/map?region=${region.id}` : '/map'} style={{ display: 'inline-block', padding: '8px 16px', background: '#16a34a', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
          제철지도 보기 →
        </Link>
      </div>
      <div style={{ background: 'var(--card, #f9fafb)', border: '2px solid var(--border)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 22 }}>📚</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>다른 지역 이야기도 둘러보기</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, flex: 1 }}>전국 17개 시도 + 글로벌 푸드 블로그를 무료로 만나보세요</div>
        <Link href="/blog" style={{ display: 'inline-block', padding: '8px 16px', background: 'var(--surface2, #f3f4f6)', color: 'var(--text)', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
          전체 블로그 보기 →
        </Link>
      </div>
    </div>
  )
}

// ── 레시피 / 식재료손질: 왼쪽 설명 + 오른쪽 사진, 위→아래 타임라인
function StepTimeline({ introHtml, steps, images }) {
  return (
    <div>
      {introHtml && (
        <div className="blog-content" style={{ marginBottom: 28 }} dangerouslySetInnerHTML={{ __html: introHtml }} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {steps.map((step, i) => {
          const img = images[i]
          const isLast = i === steps.length - 1
          return (
            <div key={i} style={{ display: 'flex', gap: 24, position: 'relative', paddingBottom: isLast ? 0 : 32 }}>
              {/* 타임라인 점 + 선 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 14 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent, #16a34a)', marginTop: 6, flexShrink: 0 }} />
                {!isLast && <div style={{ flex: 1, width: 2, background: 'var(--border, #e5e7eb)', marginTop: 4 }} />}
              </div>

              <div className="step-row" style={{ display: 'flex', gap: 24, flex: 1, minWidth: 0 }}>
                <div className="blog-content step-desc" style={{ flex: img ? '1 1 55%' : '1 1 100%', minWidth: 0 }} dangerouslySetInnerHTML={{ __html: step.html }} />
                {img && (
                  <div className="step-photo" style={{ flex: '1 1 45%', minWidth: 0 }}>
                    <img src={img} alt="" style={{ width: '100%', borderRadius: 12, display: 'block', objectFit: 'cover', maxHeight: 320 }} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <style>{`
        @media (max-width: 640px) {
          .step-row { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}

export default function BlogPost({ post, html, allPosts, stepImages, customCategories }) {
  const topBadge = post ? resolveCategoryBadge(post.category, customCategories) : null
  const relatedPool = post ? scoreRelated(post, allPosts).slice(0, 3) : []
  const inlineUsedIds = new Set(relatedPool.map(p => p.id))
  const stepMode = post ? isStepCategory(post.category) : false
  const { introHtml, steps } = stepMode ? splitStepsHtml(html) : { introHtml: '', steps: [] }
  const middleSlot = useAdSlot('home_middle')

  return (
    <>
      <Head>
        <title>{post?.title || '글을 찾을 수 없습니다'} — Fresh Season</title>
        <meta name="description" content={post?.summary || 'Fresh Season 블로그 — 제철 식재료와 건강 효능, TV 방영 레시피로 차리는 건강한 밥상 이야기를 전해드립니다.'} />
        <meta property="og:title" content={`${post?.title || 'Fresh Season'} — Fresh Season`} />
        <meta property="og:description" content={post?.summary || 'Fresh Season 블로그 — 제철 식재료와 건강 효능, TV 방영 레시피로 차리는 건강한 밥상 이야기를 전해드립니다.'} />
        <meta property="og:image" content={post?.cover_image || 'https://www.fsfood.kr/og-image.png'} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={`https://www.fsfood.kr/blog/${post?.slug || ''}`} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Fresh Season" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post?.title || 'Fresh Season'} />
        <meta name="twitter:description" content={post?.summary || 'Fresh Season 블로그 — 제철 식재료와 건강 효능, TV 방영 레시피로 차리는 건강한 밥상 이야기를 전해드립니다.'} />
        <meta name="twitter:image" content={post?.cover_image || 'https://www.fsfood.kr/og-image.png'} />
        <link rel="canonical" href={`https://www.fsfood.kr/blog/${post?.slug || ''}`} />
        {post && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'BlogPosting',
                headline: post.title,
                description: post.summary || '',
                image: post.cover_image || 'https://www.fsfood.kr/og-image.png',
                datePublished: post.published_at || post.created_at || undefined,
                dateModified: post.updated_at || post.published_at || post.created_at || undefined,
                author: { '@type': 'Organization', name: post.author_name || 'Fresh Season 편집팀', url: 'https://www.fsfood.kr/' },
                publisher: {
                  '@type': 'Organization',
                  name: 'Fresh Season',
                  logo: { '@type': 'ImageObject', url: 'https://www.fsfood.kr/og-image.png' },
                },
                mainEntityOfPage: { '@type': 'WebPage', '@id': `https://www.fsfood.kr/blog/${post.slug}` },
              }),
            }}
          />
        )}
        {post && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Fresh Season', item: 'https://www.fsfood.kr/' },
                  { '@type': 'ListItem', position: 2, name: '블로그', item: 'https://www.fsfood.kr/blog' },
                  { '@type': 'ListItem', position: 3, name: post.title, item: `https://www.fsfood.kr/blog/${post.slug}` },
                ],
              }),
            }}
          />
        )}
      </Head>

      <Header />
      <main className="wrap" style={{ maxWidth: 780 }}>
        {/* 전체 페이지 중단 배너 */}
        <div className="ad-banner-slot" style={{ maxWidth: 780, padding: 0, margin: '20px auto' }}>
          <AdSlot slot="home_middle" label="중단 배너 광고" slotData={middleSlot} />
        </div>

        {!post ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--text2)', marginBottom: 16 }}>글을 찾을 수 없어요.</p>
            <Link href="/blog" className="back-link">← 블로그 목록</Link>
          </div>
        ) : (
          <article style={{ padding: '40px 0 64px' }}>
            {topBadge && (
              <span className="badge" style={{ marginBottom: 14, display: 'inline-block', background: `${topBadge.color}22`, color: topBadge.color, border: `1px solid ${topBadge.color}44`, fontSize: 12, padding: '4px 12px' }}>
                {topBadge.icon} {topBadge.name}
              </span>
            )}
            <h1 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, lineHeight: 1.3, marginBottom: 12 }}>{post.title}</h1>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 36 }}>
              {new Date(new Date(post.published_at).getTime() + 9*60*60*1000).toISOString().slice(0,10).replace(/-/g,'. ') + '.'}
            </p>

            {/* 커버 이미지 */}
            {post.cover_image && (
              <img
                src={post.cover_image}
                alt={post.title}
                style={{ width: '100%', maxHeight: 380, objectFit: 'cover', borderRadius: 12, marginBottom: 36, display: 'block' }}
              />
            )}

            {/* 본문 — 마크다운 → HTML 렌더링 (관련 글 카드 자동 삽입 / 레시피·식재료손질은 단계별 타임라인) */}
            <div style={{ fontSize: 15, lineHeight: 1.85, color: 'var(--text)' }}>
              {stepMode ? (
                <StepTimeline introHtml={introHtml} steps={steps} images={stepImages} />
              ) : (
                <ContentWithInlineLinks html={html} relatedPool={relatedPool} customCategories={customCategories} />
              )}
            </div>

            <PostTags tags={post.tags} />

            <CuriosityBlock post={post} allPosts={allPosts} inlineUsedIds={inlineUsedIds} customCategories={customCategories} />
            <ServiceCTABlock post={post} />

            <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <Link href="/blog" className="back-link">← 블로그 목록</Link>
            </div>
          </article>
        )}
      </main>
      <Footer />

      <style>{`
        .blog-content h2 { color: var(--text); }
        .blog-content img { max-width: 100%; }
        .blog-content table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
        .blog-content th { background: var(--card, #f3f4f6); padding: 10px 14px; text-align: left; border: 1px solid var(--border, #e5e7eb); font-weight: 700; }
        .blog-content td { padding: 9px 14px; border: 1px solid var(--border, #e5e7eb); }
        .blog-content tr:nth-child(even) td { background: var(--bg2, #fafafa); }
        .blog-content svg { max-width: 100%; height: auto; display: block; margin: 16px auto; }
        .blog-content a { color: var(--accent, #16a34a); }
        .blog-content a:hover { text-decoration: underline; }
        .blog-content ol, .blog-content ul { padding-left: 1.5em; }
        .blog-content li { margin-bottom: 6px; }
      `}</style>
    </>
  )
}

export async function getServerSideProps(context) {
  const { slug } = context.params
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fsfood.kr'
    const res = await fetch(`${baseUrl}/api/blog/posts?slug=${slug}`)
    if (!res.ok) return { props: { post: null, html: '', allPosts: [], stepImages: [], customCategories: [] } }
    const post = await res.json()
    if (!post) return { props: { post: null, html: '', allPosts: [], stepImages: [], customCategories: [] } }

    // 서버에서 마크다운 → HTML 변환 (레시피/식재료손질은 본문 끝에 숨겨진 사진 목록을 먼저 분리)
    const { parseMarkdown } = await import('../../lib/parseMarkdown')
    const { content: cleanContent, images: stepImages } = extractStepImages(post.content || '')
    const html = parseMarkdown(cleanContent)

    // 관련 글 추천을 위해 글 목록도 서버에서 같이 가져온다 (SSR에 포함되어야
    // 검색엔진도 내부링크를 크롤링할 수 있다)
    let allPosts = []
    try {
      const listRes = await fetch(`${baseUrl}/api/blog/posts?limit=100`)
      if (listRes.ok) allPosts = await listRes.json()
    } catch {}

    // 커스텀 카테고리(레시피·식재료손질·팁·해외 등)도 함께 가져와야 지역이 아닌
    // 카테고리로 발행된 글에서도 배지가 정상적으로 표시된다
    let customCategories = []
    try {
      const catRes = await fetch(`${baseUrl}/api/blog/categories`)
      if (catRes.ok) customCategories = await catRes.json()
    } catch {}

    return { props: { post, html, allPosts: Array.isArray(allPosts) ? allPosts : [], stepImages, customCategories: Array.isArray(customCategories) ? customCategories : [] } }
  } catch (error) {
    console.error('블로그 상세 SSR 에러:', error)
    return { props: { post: null, html: '', allPosts: [], stepImages: [], customCategories: [] } }
  }
}
