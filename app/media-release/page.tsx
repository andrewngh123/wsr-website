import { Metadata } from 'next'
import Link from 'next/link'
import MediaImage from '@/components/MediaImage'
import { getLinkPreview } from '@/lib/og'

export const metadata: Metadata = {
  title: 'Media Release — World Sports Rankings',
}

// Refresh the link previews (titles/images) once a day without a redeploy.
export const revalidate = 86400

// ── Add media releases here — just paste the article URL ─────────────────────
// Newest first. Each entry is EITHER:
//   • a URL string  — e.g. 'https://example.com/article'
//       (title, image and source are pulled from the article automatically)
//   • an object with overrides for sites that don't expose good previews:
//       { url: '...', title?: '...', image?: '...', source?: '...', date?: '...' }
type Release =
  | string
  | { url: string; title?: string; image?: string; source?: string; date?: string }

const MEDIA_RELEASES: Release[] = [
  // This one is a JS-rendered page that doesn't expose a real title, so we set it:
  {
    url: 'https://www.aipsmedia.com/index.html?page=artdetail&art=37663',
    title: 'USA leads 2025 World Ranking of Countries in Elite Sport (WRCES)',
  },
  // The rest expose proper OpenGraph metadata — URL alone is enough:
  'https://www.aipsmedia.com/aips/pages/articles/2025/36258.html',
  'https://www.aipsmedia.com/aips/pages/articles/2024/34985.html',
  'https://www.aipsmedia.com/aips/pages/articles/2022/30767.html',
  'https://www.aipsmedia.com/aips/pages/articles/2018/22254.html',
]
// ─────────────────────────────────────────────────────────────────────────────

export default async function MediaReleasePage() {
  const items = await Promise.all(
    MEDIA_RELEASES.map(async (entry) => {
      const o = typeof entry === 'string' ? { url: entry } : entry
      const preview = await getLinkPreview(o.url)
      // Manual overrides always win over the auto-fetched preview.
      return {
        url: o.url,
        title: o.title ?? preview.title,
        image: o.image ?? preview.image,
        source: o.source ?? preview.source,
        description: preview.description,
        date: o.date,
      }
    })
  )

  return (
    <div className="min-h-screen bg-wsr-light">
      <div className="bg-wsr-navy text-white py-14 px-4 text-center">
        <h1 className="text-3xl font-extrabold">Media Release</h1>
        <p className="text-white/60 text-sm mt-2">Press coverage and announcements about WSR</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-14">
        {items.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No media releases yet. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <MediaImage src={item.image} source={item.source} />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-400 uppercase tracking-wide">
                    <span className="font-semibold text-wsr-blue">{item.source}</span>
                    {item.date && (
                      <>
                        <span>·</span>
                        <span>{item.date}</span>
                      </>
                    )}
                  </div>
                  <h3 className="font-semibold text-wsr-navy leading-snug group-hover:text-wsr-blue transition-colors">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-3">{item.description}</p>
                  )}
                  <span className="mt-3 inline-block text-xs text-wsr-blue">Read article →</span>
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/" className="text-sm text-wsr-blue hover:underline">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
