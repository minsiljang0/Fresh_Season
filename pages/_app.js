import Head from 'next/head'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="google-site-verification" content="Zbs0vFqBSKLZDlCi2dcR7SpDWfq7UYsTkYo6Dl_Y4QM" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
