// pages/api/sitemap.xml.js  →  저장 후 pages/sitemap.xml.js 로 이동하세요

import { REGIONS } from '../../lib/regions'
import { SEASONAL_FOODS_SEED } from '../../lib/seasonalFoods'

const BASE_URL = 'https://www.fsfood.kr'

function generateSitemap() {
  // 고정 페이지
  const staticPages = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/blog', changefreq: 'daily', priority: '0.9' },
    { url: '/privacy', changefreq: 'yearly', priority: '0.3' },
    { url: '/terms', changefreq: 'yearly', priority: '0.3' },
  ]

  // 지역 페이지 (17개 시도)
  const regionPages = REGIONS.map(r => ({
    url: `/region/${r.id}`,
    changefreq: 'weekly',
    priority: '0.8',
  }))

  // 식재료 페이지
  const ingredientPages = SEASONAL_FOODS_SEED.map(f => ({
    url: `/ingredient/${encodeURIComponent(f.ingredient)}`,
    changefreq: 'monthly',
    priority: '0.7',
  }))

  const allPages = [...staticPages, ...regionPages, ...ingredientPages]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    page => `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`
}

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate')
  res.write(generateSitemap())
  res.end()
}
