import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'
import { getAllCountryCodes } from '@/lib/rankings'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ['', '/about', '/rankings', '/scientific-publications', '/media-release']
  const base: MetadataRoute.Sitemap = paths.map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: 'monthly',
    priority: p === '' ? 1 : 0.7,
  }))

  let countries: MetadataRoute.Sitemap = []
  try {
    const codes = await getAllCountryCodes()
    countries = codes.map((c) => ({
      url: `${SITE_URL}/countries/${c}`,
      changeFrequency: 'monthly',
      priority: 0.5,
    }))
  } catch {
    /* ignore — sitemap still lists the main pages */
  }

  return [...base, ...countries]
}
