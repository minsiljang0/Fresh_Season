import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { AdSlot } from '../../../components/AdSlot'
import { useAdSlot } from '../../../lib/AdSlotsContext'

const LABEL = { free: '자유게시판', request: '부탁해요' }

export default function BoardDetail() {
  const router = useRouter()
  const { type, id } = router.query
  const [post, setPost] = useState(null)
  const [needPassword, setNeedPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const middleSlot = useAdSlot('home_middle')

  const fetchPost = async (pw) => {
    setError('')
    try {
      const res = await fetch('/api/board/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password: pw }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.needPassword || res.status === 401) {
          setNeedPassword(true)
          if (pw) setError(data.error)
        } else {
          setError(data.error || '오류가 발생했습니다')
        }
        return
      }
      setPost(data)
      setNeedPassword(false)
    } catch {
      setError('오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchPost()
  }, [id])

  const handleVerify = (e) => {
    e.preventDefault()
    fetchPost(password)
  }

  const handleDelete = async () => {
    const pw = post?.is_secret ? password : (prompt('비밀번호를 입력해주세요') || '')
    if (!pw && post?.is_secret) return
    if (!confirm('이 글을 삭제할까요?')) return
    try {
      const res = await fetch('/api/board/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password: pw, action: 'delete' }),
      })
      const data = await res.json()
      if (!res.ok) return alert(data.error || '삭제 실패')
      alert('삭제되었습니다')
      router.push(`/board/${type}`)
    } catch {
      alert('삭제 실패')
    }
  }

  if (!type || !LABEL[type]) return null

  return (
    <>
      <Head><title>{post?.title || LABEL[type]} — Fresh Season</title></Head>
      <Header />
      <main className="wrap" style={{ maxWidth: 720 }}>
        {/* 전체 페이지 중단 배너 */}
        <div className="ad-banner-slot" style={{ maxWidth: 720, padding: 0, margin: '24px auto' }}>
          <AdSlot slot="home_middle" label="중단 배너 광고" slotData={middleSlot} />
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text2)' }}>불러오는 중...</div>
        ) : needPassword ? (
          <div style={{ padding: '60px 0', maxWidth: 360, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
            <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>비밀글입니다. 비밀번호를 입력해주세요.</p>
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="password" autoFocus value={password} onChange={e => setPassword(e.target.value)}
                style={{ padding: '11px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, textAlign: 'center' }}
                placeholder="비밀번호"
              />
              {error && <div style={{ fontSize: 13, color: '#dc2626' }}>{error}</div>}
              <button type="submit" style={{ padding: '11px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                확인
              </button>
            </form>
            <div style={{ marginTop: 24 }}>
              <Link href={`/board/${type}`} className="back-link">← {LABEL[type]} 목록</Link>
            </div>
          </div>
        ) : !post ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--text2)', marginBottom: 16 }}>{error || '글을 찾을 수 없어요.'}</p>
            <Link href={`/board/${type}`} className="back-link">← {LABEL[type]} 목록</Link>
          </div>
        ) : (
          <article style={{ padding: '40px 0 64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              {post.is_secret && <span style={{ fontSize: 12 }}>🔒</span>}
              <h1 style={{ fontSize: 'clamp(20px,4vw,28px)', fontWeight: 900, lineHeight: 1.3, margin: 0 }}>{post.title}</h1>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 32 }}>
              {post.author_name || '익명'} ·{' '}
              {new Date(new Date(post.created_at).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '. ') + '.'}
            </p>

            <div style={{ fontSize: 15, lineHeight: 1.85, color: 'var(--text)', whiteSpace: 'pre-wrap', minHeight: 100 }}>
              {post.content}
            </div>

            <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href={`/board/${type}`} className="back-link">← {LABEL[type]} 목록</Link>
              <button onClick={handleDelete}
                style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
                🗑 삭제
              </button>
            </div>
          </article>
        )}
      </main>
      <Footer />
    </>
  )
}
