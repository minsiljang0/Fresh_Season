import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'
export default function Privacy() {
  return (<><Head><title>개인정보처리방침 — 제철밥상</title></Head><Header /><main className="wrap" style={{maxWidth:720,padding:'48px 20px'}}><h1 style={{fontSize:24,fontWeight:900,marginBottom:24}}>개인정보처리방침</h1><p style={{color:'var(--text2)',lineHeight:1.8,fontSize:14}}>제철밥상(이하 "사이트")은 이용자의 개인정보를 중요하게 생각합니다. 본 사이트는 별도의 회원가입 없이 이용할 수 있으며, 개인정보를 수집하지 않습니다. 서비스 개선을 위해 구글 애널리틱스 등 분석 도구를 사용할 수 있습니다.</p></main><Footer /></>)
}
