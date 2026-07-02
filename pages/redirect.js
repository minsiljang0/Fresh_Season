import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { AdSlot } from '../components/AdSlot'
import { useAdSlot } from '../lib/AdSlotsContext'

// 외부(쿠팡 등) 링크로 나가기 전에 거치는 대기 화면
// - home_cooldown 배너 광고를 노출
// - 관리자 설정(cooldown 초)만큼 카운트다운 후 자동 이동
export default function RedirectPage() {
  const router = useRouter()
  const { url, label } = router.query
  const cooldownSlot = useAdSlot('home_cooldown')

  const [cooldownTotal, setCooldownTotal] = useState(null)
  const [seconds, setSeconds] = useState(null)

  // 사이트 전체 쿨다운 초 설정 로드
  useEffect(() => {
    fetch('/api/settings/get')
      .then(r => (r.ok ? r.json() : {}))
      .then(d => {
        const n = Number(d.cooldown)
        const total = Number.isFinite(n) && n > 0 ? n : 12
        setCooldownTotal(total)
        setSeconds(total)
      })
      .catch(() => { setCooldownTotal(12); setSeconds(12) })
  }, [])

  const targetUrl = typeof url === 'string' && url ? decodeURIComponent(url) : ''

  // 카운트다운
  useEffect(() => {
    if (seconds === null || seconds <= 0) return
    const t = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  // 0초가 되면 자동 이동
  useEffect(() => {
    if (seconds === 0 && targetUrl) {
      window.location.href = targetUrl
    }
  }, [seconds, targetUrl])

  if (!targetUrl) {
    return (
      <>
        <Head><title>잘못된 접근 — Fresh Season</title></Head>
        <main className="wrap" style={{ padding: '80px 0', textAlign: 'center' }}>
          <p style={{ marginBottom: 16, color: 'var(--text2)' }}>이동할 주소가 없습니다.</p>
          <Link href="/" className="back-link">← 홈으로</Link>
        </main>
      </>
    )
  }

  const progress = cooldownTotal ? Math.round(((cooldownTotal - (seconds ?? cooldownTotal)) / cooldownTotal) * 100) : 0

  return (
    <>
      <Head>
        <title>이동 중입니다... — Fresh Season</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="wrap" style={{ maxWidth: 560, padding: '60px 20px', textAlign: 'center' }}>
        <Link href="/" className="logo" style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: 28 }}>
          <div className="logo-icon">🥬</div>
          <span className="logo-text"><span>Fresh</span> Season</span>
        </Link>

        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
          {label ? `${label}(으)로 이동 중입니다` : '외부 사이트로 이동 중입니다'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 28 }}>
          {seconds === null ? '잠시만 기다려주세요...' : seconds > 0 ? `${seconds}초 후 자동으로 이동합니다` : '이동 중...'}
        </p>

        {/* 다운로드 대기 화면 배너 */}
        <div className="ad-banner-slot" style={{ marginBottom: 28 }}>
          <AdSlot slot="home_cooldown" label="대기 화면 광고" tall slotData={cooldownSlot} />
        </div>

        <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 999, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', transition: 'width 1s linear' }} />
        </div>

        <a href={targetUrl} rel="noopener noreferrer sponsored"
          style={{
            display: 'inline-block', padding: '12px 28px', borderRadius: 10,
            background: seconds === 0 ? 'var(--text3)' : 'var(--accent)', color: '#fff',
            fontWeight: 700, fontSize: 14, textDecoration: 'none',
          }}>
          지금 바로 이동하기 →
        </a>

        <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 20, lineHeight: 1.6 }}>
          이 사이트는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.
        </p>
      </main>
    </>
  )
}
