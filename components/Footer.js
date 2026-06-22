import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <p className="footer-text">© 2025 제철밥상. All rights reserved.</p>
        <div className="footer-links">
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관</Link>
          <Link href="/blog">블로그</Link>
        </div>
        <Link href="/admin" className="admin-link">admin</Link>
      </div>
    </footer>
  )
}
