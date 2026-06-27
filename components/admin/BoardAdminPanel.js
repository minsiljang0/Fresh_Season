import { useState, useEffect, useCallback } from 'react'
import { S, Toast } from './AdminUI'

const TYPE_LABEL = { free: '자유게시판', request: '부탁해요' }

export default function BoardAdminPanel({ adminToken, postType }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/blog/posts?post_type=${postType}&limit=100`, {
        headers: { 'x-admin-token': adminToken },
      })
      const data = await res.json()
      setPosts(Array.isArray(data) ? data : [])
    } catch { showToast('❌ 불러오기 실패') }
    setLoading(false)
  }, [adminToken, postType])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    if (!confirm('이 글을 삭제할까요?')) return
    try {
      const res = await fetch(`/api/blog/posts?id=${id}`, {
        method: 'DELETE', headers: { 'x-admin-token': adminToken },
      })
      if (!res.ok) throw new Error()
      showToast('🗑 삭제됨')
      setPosts(p => p.filter(x => x.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch { showToast('❌ 삭제 실패') }
  }

  return (
    <div>
      <Toast msg={toast} />
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={S.cardTitle}>{postType === 'free' ? '💬' : '📬'} {TYPE_LABEL[postType]} 관리</div>
          <button onClick={load} style={{ ...S.btn('sm'), fontSize: 12 }}>🔄 새로고침</button>
        </div>

        {selected ? (
          <div>
            <button onClick={() => setSelected(null)} style={{
              background: 'none', border: 'none', color: '#71717a', fontSize: 14,
              cursor: 'pointer', marginBottom: 16, padding: 0,
            }}>← 목록으로</button>
            <div style={{ background: '#f5f9f5', borderRadius: 10, padding: 20, border: '1px solid #d1e8d1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                {selected.is_secret && <span style={{ fontSize: 12, color: '#92400e', background: '#fffbeb', borderRadius: 4, padding: '2px 8px', border: '1px solid #fcd34d' }}>🔒 비밀글</span>}
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f1f0f', margin: 0 }}>{selected.title}</h3>
              </div>
              <div style={{ fontSize: 12, color: '#4b6e4b', marginBottom: 16 }}>
                {selected.author_name || '익명'} · {selected.created_at ? new Date(new Date(selected.created_at).getTime() + 9*60*60*1000).toISOString().slice(0,16).replace('T',' ') : ''}
              </div>
              <div style={{ fontSize: 14, color: '#d4d4d4', lineHeight: 1.8, whiteSpace: 'pre-wrap', borderTop: '1px solid #2a2a2a', paddingTop: 16 }}>
                {selected.content}
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => handleDelete(selected.id)} style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid #7f1d1d',
                  background: '#f0fdf4', color: '#16a34a', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                }}>🗑 삭제</button>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#4b6e4b' }}>불러오는 중...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#4b6e4b' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
            아직 글이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 80px 100px 60px',
              padding: '8px 12px', borderBottom: '1px solid #2a2a2a',
              fontSize: 11, fontWeight: 700, color: '#4b6e4b',
            }}>
              <span>제목</span>
              <span style={{ textAlign: 'center' }}>작성자</span>
              <span style={{ textAlign: 'right' }}>날짜</span>
              <span></span>
            </div>
            {posts.map(post => (
              <div key={post.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 80px 100px 60px',
                padding: '12px', borderBottom: '1px solid #1f1f1f',
                alignItems: 'center',
              }}>
                <div
                  onClick={() => setSelected(post)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minWidth: 0 }}
                >
                  {post.is_secret && <span style={{ fontSize: 12 }}>🔒</span>}
                  <span style={{
                    fontSize: 14, fontWeight: 600, color: '#0f1f0f',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{post.title}</span>
                </div>
                <div style={{ fontSize: 12, color: '#71717a', textAlign: 'center' }}>{post.author_name || '익명'}</div>
                <div style={{ fontSize: 11, color: '#4b6e4b', textAlign: 'right' }}>
                  {post.created_at ? new Date(new Date(post.created_at).getTime() + 9*60*60*1000).toISOString().slice(0,10).replace(/-/g,'. ') + '.' : ''}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button onClick={() => handleDelete(post.id)} style={{
                    padding: '4px 10px', borderRadius: 6, border: '1px solid #7f1d1d',
                    background: '#f0fdf4', color: '#16a34a', fontSize: 11,
                    cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                  }}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
