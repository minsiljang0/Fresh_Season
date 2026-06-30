import { REGIONS } from '../../lib/regions'
import { SEASONAL_FOODS_SEED } from '../../lib/seasonalFoods'
import { supabase } from '../../lib/supabase'

/** 현재 시각을 KST(UTC+9) 기준 ISO 문자열로 반환 */
function nowKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00')
}

const BASE_URL = 'https://www.fsfood.kr'

/** 발행된 블로그 글 전체 slug + 최종 수정일 조회 (Google 사이트맵 색인용) */
async function getBlogPostPages() {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug, published_at, updated_at, created_at')
      .eq('status', 'published')
      .eq('post_type', 'blog')
      .order('published_at', { ascending: false })

    if (error || !data) return []

    return data
      .filter(p => p.slug)
      .map(p => ({
        url: `/blog/${p.slug}`,
        changefreq: 'weekly',
        priority: '0.7',
        lastmod: (p.updated_at || p.published_at || p.created_at || '').slice(0, 10),
      }))
  } catch (e) {
    console.error('[sitemap] 블로그 글 조회 오류:', e.message)
    return []
  }
}

async function generateSitemap() {
  const staticPages = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/blog', changefreq: 'daily', priority: '0.9' },
    { url: '/privacy', changefreq: 'yearly', priority: '0.3' },
    { url: '/terms', changefreq: 'yearly', priority: '0.3' },
  ]

  const regionPages = REGIONS.map(r => ({
    url: `/region/${r.id}`,
    changefreq: 'weekly',
    priority: '0.8',
  }))

  const ingredientPages = SEASONAL_FOODS_SEED.map(f => ({
    url: `/ingredient/${encodeURIComponent(f.ingredient)}`,
    changefreq: 'monthly',
    priority: '0.7',
  }))

  const blogPages = await getBlogPostPages()

  const allPages = [...staticPages, ...regionPages, ...ingredientPages, ...blogPages]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    page => `  <url>
    <loc>${BASE_URL}${page.url}</loc>
${page.lastmod ? `    <lastmod>${page.lastmod}</lastmod>\n` : ''}    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate')
  const xml = await generateSitemap()
  res.write(xml)
  res.end()
}
