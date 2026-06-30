import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

const LABEL = { free: '자유게시판', request: '부탁해요' }

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 8,
  border: '1.5px solid var(--border)', background: 'var(--surface)',
  color: 'var(--text)', fontSize: 14, fontFamily: 'inherit',
}

export default function BoardWrite() {
  const router = useRouter()
  const { type } = router.query
  const [title, setTitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [password, setPassword] = useState('')
  const [content, setContent] = useState('')
  const [isSecret, setIsSecret] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!type || !LABEL[type]) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('제목을 입력해주세요')
    if (!content.trim()) return setError('내용을 입력해주세요')
    if (password.length < 4) return setError('비밀번호는 4자 이상 입력해주세요')

    setSubmitting(true)
    try {
      const res = await fetch('/api/board/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type, title, author_name: authorName, password, content, is_secret: isSecret,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '등록 실패')
      router.push(`/board/${type}/${data.id}`)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <>
      <Head><title>{LABEL[type]} 글쓰기 — Fresh Season</title></Head>
      <Header />
      <main className="wrap" style={{ maxWidth: 640 }}>
        <section style={{ padding: '40px 0 28px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>{LABEL[type]} 글쓰기</h1>
        </section>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 64 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>제목</label>
            <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} maxLength={100} placeholder="제목을 입력해주세요" />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>작성자</label>
              <input style={inputStyle} value={authorName} onChange={e => setAuthorName(e.target.value)} maxLength={20} placeholder="익명" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>비밀번호</label>
              <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="4자 이상 (수정·삭제 시 필요)" />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>내용</label>
            <textarea
              style={{ ...inputStyle, minHeight: 220, resize: 'vertical', lineHeight: 1.6 }}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="내용을 입력해주세요"
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text2)', cursor: 'pointer' }}>
            <input type="checkbox" checked={isSecret} onChange={e => setIsSecret(e.target.checked)} />
            🔒 비밀글로 작성 (비밀번호를 아는 사람만 볼 수 있어요)
          </label>

          {error && <div style={{ fontSize: 13, color: '#dc2626' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" onClick={() => router.push(`/board/${type}`)}
              style={{ padding: '11px 20px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              취소
            </button>
            <button type="submit" disabled={submitting}
              style={{ flex: 1, padding: '11px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </>
  )
}
