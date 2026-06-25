import Head from 'next/head'
import { useRouter } from 'next/router'
import '../styles/globals.css'

const BASE_URL = 'https://www.fsfood.kr'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const canonical = `${BASE_URL}${router.asPath.split('?')[0]}`

  return (
    <>
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
      <Component {...pageProps} />
    </>
  )
}
