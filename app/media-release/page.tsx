import { Metadata } from 'next'
import Link from 'next/link'
import MediaImage from '@/components/MediaImage'
import MediaCarousel from '@/components/MediaCarousel'
import PageHeader from '@/components/PageHeader'
import { MEDIA_RELEASES } from '@/lib/mediaReleases'

export const metadata: Metadata = {
  title: 'Media Release',
  description: 'Press coverage and media articles about World Sports Rankings from AIPS, Le Figaro, Le Monde and more.',
  alternates: { canonical: '/media-release' },
}

// Generic placeholder image used by the old site — show the branded panel instead.
const isPlaceholder = (src?: string) => !src || /WSR_LOGO/i.test(src)

// Sort newest → oldest by date; items without a date keep their order, after dated ones.
function byDateDesc(a: { date?: string }, b: { date?: string }) {
  if (a.date && b.date) return b.date.localeCompare(a.date)
  if (a.date) return -1
  if (b.date) return 1
  return 0
}

export default function MediaReleasePage() {
  const total = MEDIA_RELEASES.reduce((n, g) => n + g.articles.length, 0)

  return (
    <div className="min-h-screen bg-wsr-light">
      <PageHeader
        title="Media Release"
        subtitle={`Press coverage about WSR — ${total} articles across ${MEDIA_RELEASES.length} sources`}
        bg="/design/headers/crowd.webp"
      />

      <div className="max-w-6xl mx-auto px-4 py-14 space-y-12">
        {MEDIA_RELEASES.map((group) => {
          const articles = [...group.articles].sort(byDateDesc)
          return (
          <section key={group.source}>
            <h2 className="section-title mb-5">
              {group.source}
              <span className="text-gray-400 text-sm font-normal ml-2">({group.articles.length})</span>
            </h2>

            <MediaCarousel>
              {articles.map((article, i) => (
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
          )
        })}

        <div className="text-center pt-2">
          <Link href="/" className="text-sm text-wsr-blue hover:underline">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
