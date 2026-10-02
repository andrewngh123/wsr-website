import type { MetadataRoute } from 'next'
import { SITE_INDEXABLE, SITE_URL } from '@/lib/seo'

// Admin routes are kept out of crawlers. The secret admin URL itself is NOT
// listed — robots.txt is public, so naming it here would advertise it. It is
// instead served with `X-Robots-Tag: noindex` + a noindex meta tag (see
// middleware.ts), and /wsr-admin (its internal path) always 404s.
const PRIVATE = ['/wsr-admin', '/api/']

export default function robots(): MetadataRoute.Robots {
  // While hidden, block all crawlers entirely.
  if (!SITE_INDEXABLE) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  // Once live on the permanent domain: allow crawling + point to the sitemap.
  return {
    rules: { userAgent: '*', allow: '/', disallow: PRIVATE },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
