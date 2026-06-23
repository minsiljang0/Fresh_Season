import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { REGIONS } from '../../lib/regions'

// 1. 서버(getServerSideProps)에서 미리 받아온 post 데이터를 props로 바로 사용합니다.
export default function BlogPost({ post }) {
  const region = post ? REGIONS.find(r => r.id === post.category) : null

  return (
    <>
      <Head>
        {/* 서버에서 완성된 상태로 내려오므로 크롤러가 100% 정확하게 수집합니다 */}
        <title>{post?.title || '글을 찾을 수 없습니다'} — Fresh Season</title>
        <meta name="description" content={post?.summary || '제철 식재료와 건강 레시피 블로그'} />
        <meta property="og:title" content={`${post?.title || 'Fresh Season'} — Fresh Season`} />
        <meta property="og:description" content={post?.summary || '제철 식재료와 건강 레시피 블로그'} />
        <meta property="og:image" content={post?.cover_image || 'https://www.fsfood.kr/og-image.png'} />
        <meta property="og:url" content={`https://www.fsfood.kr/blog/${post?.slug || ''}`} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Fresh Season" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post?.title || 'Fresh Season'} />
        <meta name="twitter:description" content={post?.summary || '제철 식재료와 건강 레시피 블로그'} />
        <meta name="twitter:image" content={post?.cover_image || 'https://www.fsfood.kr/og-image.png'} />
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
              {new Date(post.published_at).toLocaleDateString('ko-KR')}
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

// 2. 중요: Next.js 서버사이드 데이터 패칭 추가
export async function getServerSideProps(context) {
  const { slug } = context.params

  try {
    // 내부 API를 호출할 때는 호스트 주소(도메인)가 포함된 절대 경로가 필요합니다.
    // 환경변수가 없다면 기본 배포 도메인을 폴백으로 사용하도록 설정했습니다.
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fsfood.kr'
    const res = await fetch(`${baseUrl}/api/blog/posts?slug=${slug}`)
    
    if (!res.ok) {
      return { props: { post: null } }
    }

    const post = await res.json()

    return {
      props: {
        post: post || null
      }
    }
  } catch (error) {
    console.error('블로그 상세 SSR 에러:', error)
    return {
      props: {
        post: null
      }
    }
  }
}