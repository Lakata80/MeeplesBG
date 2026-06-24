const os = require('os')

function localNetworkIPs() {
  const ips = []
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address)
    }
  }
  return ips
}

/** @type {import('next').NextConfig} */
module.exports = {
  allowedDevOrigins: localNetworkIPs(),
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
