/**
 * Build-time link-preview fetcher.
 *
 * Given an article URL, fetches the page and extracts its OpenGraph metadata
 * (title, image, description) so the media-release page can render a nice card
 * from just a URL. Runs on the server during build/ISR — never in the browser.
 * Always resolves (never throws): on any failure it returns a minimal preview
 * so a bad link can't break the build.
 */

export type LinkPreview = {
  url: string
  title: string
  image?: string
  description?: string
  source: string
}

// Friendly names for known publishers (by hostname). Anything else falls back
// to the bare domain.
const SOURCE_NAMES: Record<string, string> = {
  'aipsmedia.com': 'AIPS',
  'lefigaro.fr': 'Le Figaro',
  'lemonde.fr': 'Le Monde',
  'insidethegames.biz': 'Inside the Games',
}

function hostname(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&rsquo;/g, '’').replace(/&nbsp;/g, ' ')
    .replace(/[​-‍﻿]/g, '')   // strip zero-width chars
    .trim()
}

function metaContent(html: string, key: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m && m[1]) return decodeEntities(m[1])
  }
  return undefined
}

export async function getLinkPreview(url: string): Promise<LinkPreview> {
  const host = hostname(url)
  const fallbackSource = SOURCE_NAMES[host] ?? host

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WSRBot/1.0; +https://sportsrankings.world)' },
      next: { revalidate: 60 * 60 * 24 },          // cache previews for a day
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    const ogTitle = metaContent(html, 'og:title')
    const titleTag = decodeEntities(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '')
    let title = ogTitle || titleTag || url
    let image = metaContent(html, 'og:image') || undefined

    // Generic site-level shell (e.g. JS-rendered pages return "AIPS Media" with
    // just a logo) — treat as having no usable preview so the caller can
    // override the title and we fall back to the branded placeholder image.
    if (/^aips media\b/i.test(title)) {
      title = url
      image = undefined
    }

    return {
      url,
      title,
      image,
      description: metaContent(html, 'og:description') || undefined,
      source: metaContent(html, 'og:site_name') || fallbackSource,
    }
  } catch {
    return { url, title: url, source: fallbackSource }
  }
}
