import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'
export default function Terms() {
  return (<><Head><title>이용약관 — Fresh Season</title></Head><Header /><main className="wrap" style={{maxWidth:720,padding:'48px 20px'}}><h1 style={{fontSize:24,fontWeight:900,marginBottom:24}}>이용약관</h1><p style={{color:'var(--text2)',lineHeight:1.8,fontSize:14}}>Fresh Season 서비스를 이용해 주셔서 감사합니다. 본 사이트의 콘텐츠는 정보 제공 목적으로 작성되었으며, 의료적 조언을 대체하지 않습니다. 콘텐츠의 무단 복제 및 재배포를 금지합니다.</p></main><Footer /></>)
}
