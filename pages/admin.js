import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminSidebar from '../components/admin/AdminSidebar'
import BlogAdminPanel from '../components/admin/BlogAdminPanel'
import BlogMenuPanel from '../components/admin/BlogMenuPanel'
import ContentLogPanel from '../components/admin/ContentLogPanel'
import KeywordPanel from '../components/admin/KeywordPanel'
import TvRecipePanel from '../components/admin/TvRecipePanel'
import SeasonalFoodPanel from '../components/admin/SeasonalFoodPanel'
import AdsensePanel from '../components/admin/AdsensePanel'
import BoardAdminPanel from '../components/admin/BoardAdminPanel'
import LegalPanel from '../components/admin/LegalPanel'
import { S, Toast } from '../components/admin/AdminUI'

const TAB_LABELS = {
  blog_write:  '✍️ 글쓰기',
  blog_admin:  '📝 글 관리',
  blog_menu:   '📋 메뉴 관리',
  content_log: '🗂️ 발행 기록',
  keyword:     '🔍 키워드 관리',
  tv_recipes:  '📺 TV 레시피',
  seasonal:    '🌿 제철 식재료',
  board_free:  '💬 자유게시판',
  board_req:   '📬 부탁해요',
  adsense:     '📢 광고 관리',
  legal:       '📜 약관 관리',
  password:    '🔑 비밀번호 변경',
}

function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setErr('')
    try {
      const res = await fetch('/api/settings/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || '비밀번호가 틀렸습니다'); setTimeout(() => setErr(''), 2500) }
      else { sessionStorage.setItem('admin_token', data.token); onLogin(data.token) }
    } catch { setErr('서버 연결 실패') }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0c0c0c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 14, padding: 40, width: 360 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, background: '#22c55e', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>🌿</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f0f0' }}>Admin</h1>
          <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>Fresh Season 관리자</p>
        </div>
        <form onSubmit={submit}>
          <input type="password" placeholder="비밀번호" value={pw} onChange={e => setPw(e.target.value)}
            style={{ ...S.input, borderColor: err ? '#f87171' : '#333', marginBottom: 8 }} />
          {err && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 8 }}>{err}</p>}
          <button type="submit" disabled={loading} style={{ ...S.btn(), width: '100%', marginTop: 8, opacity: loading ? 0.6 : 1 }}>
            {loading ? '확인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [adminToken, setAdminToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTabState] = useState('blog_write')
  const setActiveTab = (tab) => {
    setActiveTabState(tab)
    try { sessionStorage.setItem('admin_active_tab', tab) } catch {}
  }
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newPwConfirm, setNewPwConfirm] = useState('')
  const [pwMsg, setPwMsg] = useState(null)

  // 광고/약관 설정
  const [adSlots, setAdSlots] = useState([])
  const [terms, setTerms] = useState('')
  const [privacy, setPrivacy] = useState('')
  const [termsEn, setTermsEn] = useState('')
  const [privacyEn, setPrivacyEn] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const loadSettings = async (token) => {
    try {
      const res = await fetch('/api/settings/get', { headers: { 'x-admin-token': token } })
      const data = await res.json()
      if (data.adSlots) setAdSlots(data.adSlots)
      if (data.terms) setTerms(data.terms)
      if (data.privacy) setPrivacy(data.privacy)
      if (data.termsEn) setTermsEn(data.termsEn)
      if (data.privacyEn) setPrivacyEn(data.privacyEn)
    } catch {}
  }

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token')
    const savedTab = sessionStorage.getItem('admin_active_tab')
    if (savedTab && TAB_LABELS[savedTab]) setActiveTabState(savedTab)
    if (token) {
      setAuthed(true)
      setAdminToken(token)
      loadSettings(token)
    }
    setLoading(false)
  }, [])

  const changePw = async () => {
    if (!newPw) { setPwMsg({ ok: false, msg: '새 비밀번호를 입력하세요' }); return }
    if (newPw !== newPwConfirm) { setPwMsg({ ok: false, msg: '비밀번호가 일치하지 않습니다' }); return }
    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ newPassword: newPw }),
      })
      if (!res.ok) throw new Error()
      setPwMsg({ ok: true, msg: '✅ 비밀번호가 변경되었습니다' })
      setNewPw(''); setNewPwConfirm('')
    } catch { setPwMsg({ ok: false, msg: '변경 실패' }) }
    setTimeout(() => setPwMsg(null), 3000)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token')
    sessionStorage.removeItem('admin_active_tab')
    setAuthed(false)
  }

  if (loading) return null
  if (!authed) return <LoginScreen onLogin={(t) => { setAuthed(true); setAdminToken(t); loadSettings(t) }} />

  return (
    <>
      <Head>
        <title>Admin — Fresh Season</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#0c0c0c', fontFamily: "'Outfit', sans-serif", color: '#f0f0f0', display: 'flex' }}>

        <div style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: '#161616', borderBottom: '1px solid #2a2a2a', padding: '14px 16px', alignItems: 'center', justifyContent: 'space-between' }} className="admin-mobile-bar">
          <button onClick={() => setMobileNavOpen(true)} style={{ background: 'none', border: 'none', color: '#f0f0f0', fontSize: 20, cursor: 'pointer' }}>☰</button>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{TAB_LABELS[activeTab]}</span>
          <span style={{ width: 20 }} />
        </div>

        <style>{`
          @media (max-width: 880px) {
            .admin-desktop-sidebar { display: none !important; }
            .admin-mobile-bar { display: flex !important; }
            .admin-main { padding-top: 64px !important; }
          }
        `}</style>

        <div className="admin-desktop-sidebar">
          <AdminSidebar activeTab={activeTab} onNav={setActiveTab} onLogout={handleLogout} />
        </div>
        <AdminSidebar activeTab={activeTab} onNav={setActiveTab} onLogout={handleLogout}
          mobile open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        <main className="admin-main" style={{ flex: 1, minWidth: 0, padding: '32px 28px 60px' }}>
          <div style={{ maxWidth: 980, margin: '0 auto' }}>

            {(activeTab === 'blog_write' || activeTab === 'blog_admin') && (
              <BlogAdminPanel key={activeTab} adminToken={adminToken} initialView={activeTab === 'blog_write' ? 'write' : 'list'} />
            )}
            {activeTab === 'blog_menu' && <BlogMenuPanel adminToken={adminToken} />}
            {activeTab === 'content_log' && <ContentLogPanel adminToken={adminToken} />}
            {activeTab === 'keyword' && <KeywordPanel token={adminToken} />}
            {activeTab === 'tv_recipes' && <TvRecipePanel adminToken={adminToken} />}
            {activeTab === 'seasonal' && <SeasonalFoodPanel adminToken={adminToken} />}
            {activeTab === 'board_free' && <BoardAdminPanel adminToken={adminToken} postType="free" />}
            {activeTab === 'board_req' && <BoardAdminPanel adminToken={adminToken} postType="request" />}
            {activeTab === 'adsense' && (
              <AdsensePanel adminToken={adminToken} adSlots={adSlots} setAdSlots={setAdSlots} onSaved={() => showToast('✅ 저장됨')} />
            )}
            {activeTab === 'legal' && (
              <LegalPanel adminToken={adminToken}
                terms={terms} privacy={privacy} setTerms={setTerms} setPrivacy={setPrivacy}
                termsEn={termsEn} privacyEn={privacyEn} setTermsEn={setTermsEn} setPrivacyEn={setPrivacyEn}
                onSaved={() => showToast('✅ 저장됨')} />
            )}
            {activeTab === 'password' && (
              <div style={S.card}>
                <div style={S.cardTitle}>🔑 비밀번호 변경</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 360 }}>
                  <div>
                    <label style={S.label}>새 비밀번호</label>
                    <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>새 비밀번호 확인</label>
                    <input type="password" value={newPwConfirm} onChange={e => setNewPwConfirm(e.target.value)} style={S.input} />
                  </div>
                  {pwMsg && <p style={{ color: pwMsg.ok ? '#4ade80' : '#f87171', fontSize: 13 }}>{pwMsg.msg}</p>}
                  <button onClick={changePw} style={{ ...S.btn(), alignSelf: 'flex-start' }}>변경하기</button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
      <Toast msg={toast} />
    </>
  )
}
