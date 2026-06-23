import Head from 'next/head'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="google-site-verification" content="Zbs0vFqBSKLZDlCi2dcR7SpDWfq7UYsTkYo6Dl_Y4QM" />
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
