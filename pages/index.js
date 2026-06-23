import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { REGIONS } from '../lib/regions'
import { SEASONS, getCurrentSeason, getSeasonByMonth } from '../lib/seasons'
import { getFoodsByMonth } from '../lib/seasonalFoods'

export default function Home() {
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth() + 1)
  const [activeRegion, setActiveRegion] = useState(null)

  const currentSeason = getCurrentSeason()
  const monthFoods = getFoodsByMonth(activeMonth)
  const filteredFoods = activeRegion ? monthFoods.filter(f => f.region === activeRegion) : monthFoods

  return (
    <>
      <Head>
        <title>Fresh Season — 지역별 제철 먹거리 & TV 레시피</title>
        <meta name="description" content="전국 지역별 제철 식재료, 건강 효능, TV 방영 레시피를 한 곳에서 만나보세요." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Fresh Season — 지역별 제철 먹거리 & TV 레시피" />
        <meta property="og:description" content="전국 지역별 제철 식재료, 건강 효능, TV 방영 레시피를 한 곳에서 만나보세요." />
        
        <meta property="og:image" content="https://www.fsfood.kr/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        <meta property="og:url" content="https://www.fsfood.kr/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Fresh Season" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Fresh Season — 지역별 제철 먹거리 & TV 레시피" />
        <meta name="twitter:description" content="전국 지역별 제철 식재료, 건강 효능, TV 방영 레시피를 한 곳에서 만나보세요." />
        <meta name="twitter:image" content="https://www.fsfood.kr/og-image.png" />
      </Head>
      <Header />
      {/* (이하 렌더링 코드 본문 생략 - 기존 코드 유지) */}