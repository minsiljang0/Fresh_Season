import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { REGIONS } from '../../lib/regions'

export default function BlogPost({ slug: initialSlug }) {
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const slug = initialSlug || window.location.pathname.split('/').pop()
    fetch(`/api/blog/posts?slug=${slug}`)
      .then(r => r.json()).then(setPost).catch(() => setPost(null))
      .finally(() => setLoading(false))
  }, [])

  const region = post ? REGIONS.find(r => r.id === post.category) : null

  return (
    <>
      <Head>
        <title>{post?.title || '로딩 중'} — 제철밥상</title>
      </Head>
      <Header />
      <main className="wrap" style={{ maxWidth: 780 }}>
        {loading && <p style={{ padding: '60px 0', color: 'var(--text2)', fontSize: 14 }}>불러오는 중...</p>}
        {!loading && !post && (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--text2)', marginBottom: 16 }}>글을 찾을 수 없어요.</p>
            <Link href="/blog" className="back-link">← 블로그 목록</Link>
          </div>
        )}
        {post && (
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

export async function getServerSideProps({ params }) {
  return { props: { slug: params.slug } }
}
