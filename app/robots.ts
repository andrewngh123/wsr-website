import type { MetadataRoute } from 'next'
import { SITE_INDEXABLE, SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  // While hidden, block all crawlers entirely.
  if (!SITE_INDEXABLE) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  // Once live on the permanent domain: allow crawling + point to the sitemap.
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
