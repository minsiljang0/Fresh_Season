import Link from 'next/link'
import { useRouter } from 'next/router'
import { REGIONS } from '../lib/regions'

export default function Header() {
  const router = useRouter()
  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="logo">
          <div className="logo-icon">🥬</div>
          <span className="logo-text"><span>제철</span>밥상</span>
        </Link>
        <nav className="header-nav">
          <Link href="/" className={`nav-link${router.pathname === '/' ? ' active' : ''}`}>홈</Link>
          {REGIONS.map(r => (
            <Link key={r.id} href={`/region/${r.id}`}
              className={`nav-link${router.pathname === `/region/${r.id}` ? ' active' : ''}`}>
              {r.icon} {r.name}
            </Link>
          ))}
          <Link href="/blog" className={`nav-link${router.pathname.startsWith('/blog') ? ' active' : ''}`}>
            📝 블로그
          </Link>
        </nav>
      </div>
    </header>
  )
}
