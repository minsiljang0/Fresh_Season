import Head from 'next/head'
import { useRouter } from 'next/router'
import '../styles/globals.css'
import { AdSlotsProvider, useAdSlot } from '../lib/AdSlotsContext'
import { SidebarAd } from '../components/AdSlot'

const BASE_URL = 'https://www.fsfood.kr'

// 전체 페이지 좌/우 사이드 레일 광고 (넓은 화면에서만 노출, 모든 페이지 공통 적용)
function SideRailAds() {
  const left = useAdSlot('home_left')
  const right = useAdSlot('home_right')
  return (
    <>
      <div className="ad-rail ad-rail-left">
        <SidebarAd slot="home_left" label="좌측 사이드 광고" slotData={left} />
      </div>
      <div className="ad-rail ad-rail-right">
        <SidebarAd slot="home_right" label="우측 사이드 광고" slotData={right} />
      </div>
    </>
  )
}

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const canonical = `${BASE_URL}${router.asPath.split('?')[0]}`

  return (
    <AdSlotsProvider>
      <Head>
        <link rel="canonical" href={canonical} />
        <meta name="google-site-verification" content="Zbs0vFqBSKLZDlCi2dcR7SpDWfq7UYsTkYo6Dl_Y4QM" />
        <meta name="naver-site-verification" content="5e03e027756e4b86169b64785e34e7ac858ab380" />
        <meta name="yandex-verification" content="90aa2aa4b51918aa" />
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2161169464776476"
          crossOrigin="anonymous"
        />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-33DGQKES2B" />
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-33DGQKES2B');
          `
        }} />
      </Head>
      <SideRailAds />
      <Component {...pageProps} />
    </AdSlotsProvider>
  )
}
