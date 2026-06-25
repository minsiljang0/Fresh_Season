/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: '/api/sitemap.xml' },
      { source: '/robots.txt',  destination: '/api/robots.txt'  },
    ]
  },
}
module.exports = nextConfig
