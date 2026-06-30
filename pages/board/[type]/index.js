import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

const LABEL = { free: '자유게시판', request: '부탁해요' }
const DESC = {
  free: '자유롭게 이야기를 나누는 공간이에요. 누구나 글을 쓸 수 있어요.',
  request: 'Fresh Season에 바라는 점이나 요청사항을 남겨주세요.',
}

export default function BoardIndex() {
  const router = useRouter()
  const { type } = router.query
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!type || !LABEL[type]) return
    setLoading(true)
    fetch(`/api/board/posts?type=${type}&limit=50`)
      .then(r => r.json())
      .then(d => setPosts(Array.isArray(d) ? d : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [type])

  if (type && !LABEL[type]) {
    return (
      <>
        <Header />
        <main className="wrap" style={{ padding: '60px 0', textAlign: 'center' }}>
          존재하지 않는 게시판입니다.
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{LABEL[type] || '게시판'} — Fresh Season</title>
      </Head>
      <Header />
      <main className="wrap">
        <section style={{ padding: '40px 0 8px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>{LABEL[type]}</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>{DESC[type]}</p>
        </section>

        <section style={{ margin: '20px 0 28px', display: 'flex', justifyContent: 'flex-end' }}>
          <Link href={`/board/${type}/write`} className="month-pill"
            style={{ fontWeight: 700, color: 'var(--accent)', borderColor: 'var(--accent)' }}>
            ✏️ 글쓰기
          </Link>
        </section>

        <section style={{ marginBottom: 64 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>불러오는 중...</div>
          )}
          {!loading && posts.length === 0 && (
            <div className="empty-state">
              <p>아직 글이 없어요.</p>
              <small>첫 번째 글을 남겨보세요!</small>
            </div>
          )}
          {!loading && posts.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 90px 100px',
                padding: '10px 16px', borderBottom: '1px solid var(--border)',
                fontSize: 12, fontWeight: 700, color: 'var(--text3)', background: 'var(--surface2)',
              }}>
                <span>제목</span>
                <span style={{ textAlign: 'center' }}>작성자</span>
                <span style={{ textAlign: 'right' }}>날짜</span>
              </div>
              {posts.map(post => (
                <Link key={post.id} href={`/board/${type}/${post.id}`}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 90px 100px',
                    padding: '14px 16px', borderBottom: '1px solid var(--border)',
                    alignItems: 'center', textDecoration: 'none', color: 'inherit',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    {post.is_secret && <span style={{ fontSize: 13 }}>🔒</span>}
                    <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.title}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center' }}>{post.author_name || '익명'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right' }}>
                    {new Date(new Date(post.created_at).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '. ') + '.'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}
