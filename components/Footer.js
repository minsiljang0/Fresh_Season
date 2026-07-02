import Link from 'next/link'
import { AdSlot } from './AdSlot'
import { useAdSlot } from '../lib/AdSlotsContext'

export default function Footer() {
  const footerSlot = useAdSlot('footer')
  return (
    <footer className="footer">
      <div className="wrap">
        {/* 전체 페이지 하단 푸터 배너 */}
        <div className="ad-banner-slot" style={{ marginBottom: 24 }}>
          <AdSlot slot="footer" label="하단 배너 광고" slotData={footerSlot} />
        </div>

        <p className="footer-text">© 2025 Fresh Season. All rights reserved.</p>
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
