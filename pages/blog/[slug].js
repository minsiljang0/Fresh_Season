import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { REGIONS } from '../../lib/regions'

export default function BlogPost({ post }) {
  const region = post ? REGIONS.find(r => r.id === post.category) : null

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
      </Head>
      
      <Header />
      <main className="wrap" style={{ maxWidth: 780 }}>
        {!post ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--text2)', marginBottom: 16 }}>글을 찾을 수 없어요.</p>
            <Link href="/blog" className="back-link">← 블로그 목록</Link>
          </div>
        ) : (
          <article style={{ padding: '40px 0 64px' }}>
            {region && (
              <span className="badge" style={{ marginBottom: 14, display: 'inline-block', background: `${region.color}22`, color: region.color, border: `1px solid ${region.color}44`, fontSize: 12, padding: '4px 12px' }}>
                {region.icon} {region.name}
              </span>
            )}
            <h1 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, lineHeight: 1.3, marginBottom: 12 }}>{post.title}</h1>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 36 }}>
              {new Date(new Date(post.published_at).getTime() + 9*60*60*1000).toISOString().slice(0,10).replace(/-/g,'. ') + '.'}
            </p>
            <div style={{ fontSize: 15, lineHeight: 1.85, color: 'var(--text)' }}
              dangerouslySetInnerHTML={{ __html: post.content }} />
            <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <Link href="/blog" className="back-link">← 블로그 목록</Link>
            </div>
          </article>
        )}
      </main>
      <Footer />
    </>
  )
}

export async function getServerSideProps(context) {
  const { slug } = context.params
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fsfood.kr'
    const res = await fetch(`${baseUrl}/api/blog/posts?slug=${slug}`)
    if (!res.ok) return { props: { post: null } }
    const post = await res.json()
    return { props: { post: post || null } }
  } catch (error) {
    console.error('블로그 상세 SSR 에러:', error)
    return { props: { post: null } }
  }
}