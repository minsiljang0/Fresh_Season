/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // apex(fsfood.kr) -> www로 통일하되, ads.txt는 애드센스 크롤러가
      // 리다이렉트 없이 바로 읽을 수 있도록 예외로 둔다.
      {
        source: '/:path((?!ads\\.txt$).*)',
        has: [{ type: 'host', value: 'fsfood.kr' }],
        destination: 'https://www.fsfood.kr/:path*',
        permanent: true,
      },
      {
        source: '/',
        has: [{ type: 'host', value: 'fsfood.kr' }],
        destination: 'https://www.fsfood.kr/',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: '/api/sitemap.xml' },
      { source: '/robots.txt',  destination: '/api/robots.txt'  },
    ]
  },
}
module.exports = nextConfig
