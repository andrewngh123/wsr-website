import { Metadata } from 'next'
import Link from 'next/link'
import MediaImage from '@/components/MediaImage'
import MediaCarousel from '@/components/MediaCarousel'
import { MEDIA_RELEASES } from '@/lib/mediaReleases'

export const metadata: Metadata = {
  title: 'Media Release — World Sports Rankings',
}

// Generic placeholder image used by the old site — show the branded panel instead.
const isPlaceholder = (src?: string) => !src || /WSR_LOGO/i.test(src)

export default function MediaReleasePage() {
  const total = MEDIA_RELEASES.reduce((n, g) => n + g.articles.length, 0)

  return (
    <div className="min-h-screen bg-wsr-light">
      <div className="bg-wsr-navy text-white py-14 px-4 text-center">
        <h1 className="text-3xl font-extrabold">Media Release</h1>
        <p className="text-white/60 text-sm mt-2">
          Press coverage about WSR — {total} articles across {MEDIA_RELEASES.length} sources
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-14 space-y-12">
        {MEDIA_RELEASES.map((group) => (
          <section key={group.source}>
            <h2 className="section-title mb-5">
              {group.source}
              <span className="text-gray-400 text-sm font-normal ml-2">({group.articles.length})</span>
            </h2>

            <MediaCarousel>
              {group.articles.map((article, i) => (
                <a
                  key={i}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group snap-start shrink-0 w-72 flex flex-col bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <MediaImage
                    src={isPlaceholder(article.image) ? undefined : article.image}
                    source={group.source}
                  />
                  <div className="p-4 flex flex-col flex-1">
                    <h3
                      dir="auto"
                      className="font-semibold text-sm text-wsr-navy leading-snug line-clamp-4 group-hover:text-wsr-blue transition-colors"
                    >
                      {article.title}
                    </h3>
                    <span className="mt-3 inline-block text-xs text-wsr-blue">Read article →</span>
                  </div>
                </a>
              ))}
            </MediaCarousel>
          </section>
        ))}

        <div className="text-center pt-2">
          <Link href="/" className="text-sm text-wsr-blue hover:underline">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
