import { useState, useEffect } from 'react'
import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { REGIONS } from '../lib/regions'

export default function Admin() {
  const [token, setToken] = useState('')
  const [pw, setPw] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [tab, setTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [recipes, setRecipes] = useState([])
  const [form, setForm] = useState({ title: '', slug: '', content: '', category: '', status: 'published' })
  const [recipeForm, setRecipeForm] = useState({ ingredient: '', program: '', episode: '', title: '', summary: '', source_url: '' })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('sf_admin_token')
    if (saved) { setToken(saved); setLoggedIn(true) }
  }, [])

  function flash(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  async function login() {
    const r = await fetch('/api/settings/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) })
    const d = await r.json()
    if (d.ok) { setToken(d.token); setLoggedIn(true); localStorage.setItem('sf_admin_token', d.token) }
    else flash('비밀번호 오류')
  }

  function headers() { return { 'Content-Type': 'application/json', 'x-admin-token': token } }

  async function loadPosts() {
    const d = await fetch('/api/blog/posts?limit=50', { headers: { 'x-admin-token': token } }).then(r => r.json())
    setPosts(Array.isArray(d) ? d : [])
  }
  async function loadRecipes() {
    const d = await fetch('/api/admin/tv-recipes', { headers: { 'x-admin-token': token } }).then(r => r.json())
    setRecipes(Array.isArray(d) ? d : [])
  }

  useEffect(() => { if (loggedIn) { loadPosts(); loadRecipes() } }, [loggedIn])

  async function submitPost(e) {
    e.preventDefault()
    const r = await fetch('/api/blog/posts', { method: 'POST', headers: headers(), body: JSON.stringify(form) })
    const d = await r.json()
    if (d.id) { flash('✅ 발행 완료'); setForm({ title: '', slug: '', content: '', category: '', status: 'published' }); loadPosts() }
    else flash('❌ 오류: ' + d.error)
  }

  async function deletePost(id) {
    if (!confirm('삭제할까요?')) return
    await fetch(`/api/blog/posts?id=${id}`, { method: 'DELETE', headers: headers() })
    loadPosts(); flash('삭제됨')
  }

  async function submitRecipe(e) {
    e.preventDefault()
    const r = await fetch('/api/admin/tv-recipes', { method: 'POST', headers: headers(), body: JSON.stringify(recipeForm) })
    const d = await r.json()
    if (d.ok) { flash('✅ 레시피 등록 완료'); setRecipeForm({ ingredient: '', program: '', episode: '', title: '', summary: '', source_url: '' }); loadRecipes() }
    else flash('❌ 오류: ' + d.error)
  }

  async function deleteRecipe(id) {
    if (!confirm('삭제할까요?')) return
    await fetch(`/api/admin/tv-recipes?id=${id}`, { method: 'DELETE', headers: headers() })
    loadRecipes(); flash('삭제됨')
  }

  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }
  const btnStyle = { padding: '8px 18px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }
  const tabStyle = (t) => ({ padding: '7px 16px', borderRadius: 8, border: `1.5px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`, background: tab === t ? 'rgba(34,197,94,0.1)' : 'var(--surface)', color: tab === t ? 'var(--accent)' : 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' })

  if (!loggedIn) return (
    <>
      <Head><title>관리자 — Fresh Season</title></Head>
      <Header />
      <main className="wrap" style={{ maxWidth: 400, paddingTop: 80 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 24 }}>Fresh Season 관리자 로그인</h1>
        <input type="password" placeholder="관리자 비밀번호" value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()} style={{ ...inputStyle, marginBottom: 10 }} />
        <button onClick={login} style={btnStyle}>로그인</button>
        {msg && <p style={{ marginTop: 10, fontSize: 13, color: 'var(--accent)' }}>{msg}</p>}
      </main>
    </>
  )

  return (
    <>
      <Head><title>관리자 — Fresh Season</title></Head>
      <Header />
      <main className="wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900 }}>관리자</h1>
          <button onClick={() => { setLoggedIn(false); localStorage.removeItem('sf_admin_token') }}
            style={{ ...btnStyle, background: 'var(--surface2)', color: 'var(--text2)' }}>로그아웃</button>
        </div>
        {msg && <p style={{ marginBottom: 16, fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{msg}</p>}

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          <button style={tabStyle('posts')} onClick={() => setTab('posts')}>📝 글 관리</button>
          <button style={tabStyle('write')} onClick={() => setTab('write')}>✏️ 글 쓰기</button>
          <button style={tabStyle('recipes')} onClick={() => setTab('recipes')}>📺 TV 레시피</button>
          <button style={tabStyle('addRecipe')} onClick={() => setTab('addRecipe')}>➕ 레시피 등록</button>
        </div>

        {/* 글 관리 */}
        {tab === 'posts' && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>발행된 글 ({posts.length})</h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {posts.map(p => {
                const r = REGIONS.find(x => x.id === p.category)
                return (
                  <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div>
                      {r && <span className="badge" style={{ fontSize: 10, marginBottom: 4, display: 'inline-block', background: `${r.color}22`, color: r.color }}>{r.icon} {r.name}</span>}
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{p.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{p.slug} · {p.status}</p>
                    </div>
                    <button onClick={() => deletePost(p.id)} style={{ ...btnStyle, background: '#ef444422', color: '#ef4444', padding: '5px 12px', fontSize: 12 }}>삭제</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 글 쓰기 */}
        {tab === 'write' && (
          <form onSubmit={submitPost} style={{ display: 'grid', gap: 12, maxWidth: 680 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>새 글 쓰기</h2>
            <input placeholder="제목" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} required />
            <input placeholder="슬러그 (영문, 하이픈)" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} style={inputStyle} required />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
              <option value="">지역 선택</option>
              {REGIONS.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
              <option value="published">발행</option>
              <option value="draft">임시저장</option>
            </select>
            <textarea placeholder="본문 (HTML 가능)" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              style={{ ...inputStyle, minHeight: 200, resize: 'vertical' }} required />
            <button type="submit" style={btnStyle}>발행하기</button>
          </form>
        )}

        {/* TV 레시피 목록 */}
        {tab === 'recipes' && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>등록된 TV 레시피 ({recipes.length})</h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {recipes.map(r => (
                <div key={r.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <span className="tag" style={{ marginBottom: 4, display: 'inline-block' }}>📺 {r.program}</span>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{r.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>재료: {r.ingredient} {r.episode && `· ${r.episode}`}</p>
                    {r.summary && <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{r.summary.slice(0, 60)}...</p>}
                  </div>
                  <button onClick={() => deleteRecipe(r.id)} style={{ ...btnStyle, background: '#ef444422', color: '#ef4444', padding: '5px 12px', fontSize: 12 }}>삭제</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 레시피 등록 */}
        {tab === 'addRecipe' && (
          <form onSubmit={submitRecipe} style={{ display: 'grid', gap: 12, maxWidth: 680 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>TV 레시피 등록</h2>
            <input placeholder="재료명 (예: 오징어)" value={recipeForm.ingredient} onChange={e => setRecipeForm(f => ({ ...f, ingredient: e.target.value }))} style={inputStyle} required />
            <input placeholder="TV 프로그램 (예: 생활의달인)" value={recipeForm.program} onChange={e => setRecipeForm(f => ({ ...f, program: e.target.value }))} style={inputStyle} required />
            <input placeholder="방영 회차/날짜 (선택)" value={recipeForm.episode} onChange={e => setRecipeForm(f => ({ ...f, episode: e.target.value }))} style={inputStyle} />
            <input placeholder="레시피 제목" value={recipeForm.title} onChange={e => setRecipeForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} required />
            <textarea placeholder="레시피 요약" value={recipeForm.summary} onChange={e => setRecipeForm(f => ({ ...f, summary: e.target.value }))} style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} />
            <input placeholder="출처 URL (선택)" value={recipeForm.source_url} onChange={e => setRecipeForm(f => ({ ...f, source_url: e.target.value }))} style={inputStyle} />
            <button type="submit" style={btnStyle}>등록하기</button>
          </form>
        )}
      </main>
      <Footer />
    </>
  )
}
