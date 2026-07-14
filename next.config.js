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

const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' е нужен за Next.js JSON-LD scripts и GA inline init;
  // next/script external scripts идват от googletagmanager.com
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  // cf.geekdo-images.com се зарежда директно когато unoptimized=true за BGG thumbnails
  "img-src 'self' data: blob: https://cf.geekdo-images.com",
  // Шрифтовете са self-hosted от next/font/google (свалени при билд)
  "font-src 'self'",
  // Sentry минава през /monitoring tunnel → 'self'; GA изисква своите домейни
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net",
  // YouTube nocookie iframes на страниците на игри
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
  // frame-ancestors 'none' = по-модерен еквивалент на X-Frame-Options: DENY
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const SECURITY_HEADERS = [
  // Clickjacking — стар браузър fallback (frame-ancestors CSP го покрива за модерните)
  { key: 'X-Frame-Options',        value: 'DENY' },
  // Блокира MIME-type sniffing атаки
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Ограничава referrer информацията към cross-origin заявки
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  // Деактивира browser features, които сайтът не използва
  { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Принуждава HTTPS за 1 година (incl. subdomains за images.meeplesbg.com, search.meeplesbg.com)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Content-Security-Policy',   value: CSP },
]

// Sanity Studio изисква достъп до sanity.io API и WebSocket endpoints
const STUDIO_CSP = [
  "default-src 'self' https://*.sanity.io wss://*.sanity.io",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.sanity.io https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.sanity.io wss://*.sanity.io",
  "frame-src https://*.sanity.io",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ')

const STUDIO_HEADERS = [
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Content-Security-Policy',   value: STUDIO_CSP },
]

/** @type {import('next').NextConfig} */
module.exports = {
  serverExternalPackages: ['sharp'],
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
  async headers() {
    return [
      // Studio пътят получава по-разхлабен CSP за Sanity
      {
        source: '/studio',
        headers: STUDIO_HEADERS,
      },
      {
        source: '/studio/(.*)',
        headers: STUDIO_HEADERS,
      },
      // Всички останали пътища — стриктен CSP
      {
        source: '/((?!studio).*)',
        headers: SECURITY_HEADERS,
      },
    ]
  },
}


// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(module.exports, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "meeplesbg",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
