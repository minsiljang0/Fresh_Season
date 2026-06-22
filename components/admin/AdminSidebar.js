const NAV = [
  { id: 'settings',    label: '서비스 설정',       icon: '🔧' },
  { id: 'blog_write',  label: '글쓰기',           icon: '✍️' },
  { id: 'blog_admin',  label: '글 관리',           icon: '📝' },
  { id: 'blog_menu',   label: '메뉴 관리',         icon: '📋' },
  { id: 'content_log', label: '발행 기록',         icon: '🗂️' },
  { id: 'keyword',     label: '키워드 관리',       icon: '🔍' },
  { id: 'tv_recipes',  label: 'TV 레시피',         icon: '📺' },
  { id: 'seasonal',    label: '제철 식재료',       icon: '🌿' },
  { id: 'board_free',  label: '자유게시판',        icon: '💬' },
  { id: 'board_req',   label: '부탁해요',          icon: '📬' },
  { id: 'adsense',     label: '광고 관리',         icon: '📢' },
  { id: 'legal',       label: '약관 관리',         icon: '📜' },
  { id: 'password',    label: '비밀번호 변경',     icon: '🔑' },
]

function NavItem({ item, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 20px', background: active ? '#22c55e18' : 'none',
      border: 'none', borderLeft: active ? '3px solid #22c55e' : '3px solid transparent',
      color: active ? '#22c55e' : '#a1a1aa',
      fontSize: 14, fontWeight: active ? 700 : 500,
      cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
      fontFamily: "'Outfit', sans-serif",
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = '#27272a' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.background = 'none' } }}
    >
      <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
    </button>
  )
}

export default function AdminSidebar({ activeTab, onNav, onLogout, mobile, open, onClose }) {
  const renderNav = () => (
    <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
      {NAV.map(item => (
        <NavItem key={item.id} item={item} active={activeTab === item.id}
          onClick={() => { onNav(item.id); if (mobile) onClose?.() }} />
      ))}
    </nav>
  )

  const Header = (
    <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, background: '#22c55e', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌿</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Admin Panel</div>
          <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>Fresh Season</div>
        </div>
      </div>
      {mobile && <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', fontSize: 22, cursor: 'pointer' }}>✕</button>}
    </div>
  )

  const Footer = (
    <div style={{ padding: '12px 20px', borderTop: '1px solid #27272a', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <a href="/" style={{ color: '#71717a', fontSize: 13, textDecoration: 'none', padding: '6px 0' }}>← 사이트로</a>
      <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', fontSize: 14, padding: '6px 0', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Outfit', sans-serif" }}>
        <span>🚪</span> 로그아웃
      </button>
    </div>
  )

  if (mobile) {
    return (
      <>
        {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)' }} />}
        <aside style={{
          position: 'fixed', top: 0, left: open ? 0 : '-260px', zIndex: 1100,
          width: 240, height: '100vh', background: '#18181b',
          display: 'flex', flexDirection: 'column', transition: 'left .25s ease',
          boxShadow: open ? '4px 0 24px rgba(0,0,0,0.35)' : 'none',
        }}>
          {Header}{renderNav()}{Footer}
        </aside>
      </>
    )
  }

  return (
    <aside style={{
      width: 220, minWidth: 220, background: '#18181b',
      display: 'flex', flexDirection: 'column', height: '100vh',
      position: 'sticky', top: 0, overflow: 'hidden',
    }}>
      {Header}{renderNav()}{Footer}
    </aside>
  )
}
