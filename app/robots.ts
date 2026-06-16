import type { MetadataRoute } from 'next'

const САЙТ = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://meeplebg.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/profil/'],
      },
    ],
    sitemap: `${САЙТ}/sitemap.xml`,
  }
}
