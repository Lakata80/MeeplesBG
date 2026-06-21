/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    remotePatterns: [
      // BGG изображения
      { protocol: 'https', hostname: 'cf.geekdo-images.com' },
      // Sanity CMS
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      // Cloudflare R2 снимки
      { protocol: 'https', hostname: 'images.meeplesbg.com' },
      // OAuth аватари
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
}
