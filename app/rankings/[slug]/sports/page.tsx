import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import RankedSportsExplorer from '@/components/RankedSportsExplorer'
import { RANKED_SPORTS } from '@/lib/rankedSports'
import { SITE_URL } from '@/lib/seo'

// Only the WRCES landing page (/rankings/elite-sport) has a sports list
export const dynamicParams = false
export function generateStaticParams() {
  return [{ slug: 'elite-sport' }]
}

const SPORT_COUNT      = RANKED_SPORTS.length
const DISCIPLINE_COUNT = RANKED_SPORTS.reduce((n, s) => n + s.disciplines.length, 0)
const MULTI_COUNT      = RANKED_SPORTS.filter((s) => s.disciplines.length > 1).length
const WIDEST           = RANKED_SPORTS.reduce((a, b) => (b.disciplines.length > a.disciplines.length ? b : a))

const TITLE = `Ranked Sports and their Disciplines — WRCES`
const DESCRIPTION =
  `All ${SPORT_COUNT} sports and ${DISCIPLINE_COUNT} disciplines counted in the World Ranking of Countries in Elite Sport (WRCES) — Olympic and non-Olympic, from Athletics to Esports.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/rankings/elite-sport/sports' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/rankings/elite-sport/sports` },
}

const STATS = [
  { value: SPORT_COUNT,      label: 'Sports ranked' },
  { value: DISCIPLINE_COUNT, label: 'Disciplines' },
  { value: MULTI_COUNT,      label: 'Multi-discipline' },
]

export default function RankedSportsPage({ params }: { params: { slug: string } }) {
  if (params.slug !== 'elite-sport') notFound()

  return (
    <div className="min-h-screen bg-wsr-light">
      <PageHeader bg="/design/headers/cycling.webp">
        <div className="text-center pb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rankings/wrces_final_logo_new.svg" alt="WRCES" className="h-12 mx-auto mb-4 brightness-0 invert opacity-90" />
          <h1 className="text-3xl md:text-4xl font-extrabold drop-shadow-sm">Ranked Sports &amp; their Disciplines</h1>
          <p className="text-white/75 text-sm mt-2 max-w-xl mx-auto">
            Every sport and discipline that counts towards the World Ranking of Countries in Elite Sport.
          </p>
        </div>
      </PageHeader>

      <div className="max-w-6xl mx-auto px-4">
        {/* Headline numbers, overlapping the header */}
        <div className="relative -mt-10 grid grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-100 px-3 py-4 sm:py-5 text-center border-b-4 border-wsr-accent">
              <div className="text-2xl sm:text-4xl font-extrabold text-wsr-navy tabular-nums">{s.value}</div>
              <div className="text-[11px] sm:text-xs uppercase tracking-wider text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Intro */}
        <section className="max-w-3xl mx-auto text-center mt-10 mb-8 space-y-3">
          <p className="text-gray-700 leading-relaxed">
            Unlike the Olympic medal table, the WRCES looks at national teams’ results across{' '}
            <strong className="text-wsr-navy">all sports</strong> — Olympic and non-Olympic alike. Below are the{' '}
            {SPORT_COUNT} sports it ranks and their {DISCIPLINE_COUNT} disciplines, from {WIDEST.sport.toLowerCase()} with{' '}
            {WIDEST.disciplines.length} disciplines to single-discipline sports such as chess, padel and sumo.
          </p>
          <p className="text-sm text-gray-500">Search for a sport or discipline, or jump to a letter.</p>
        </section>

        <RankedSportsExplorer sports={RANKED_SPORTS} />

        {/* CTA back to the ranking itself */}
        <section className="my-14 rounded-3xl bg-wsr-navy text-white px-6 py-10 sm:px-10 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-60"
            style={{ background: 'radial-gradient(60% 80% at 50% 0%, rgba(232,160,32,0.25), transparent 70%)' }}
          />
          <div className="relative">
            <h2 className="text-2xl font-bold">See how countries perform across all of these sports</h2>
            <p className="text-white/70 text-sm mt-2 max-w-lg mx-auto">
              The WRCES combines results in every sport above into one score for each of the 206 countries.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/rankings/elite-sport" className="btn-primary">View the WRCES ranking</Link>
              <Link href="/rankings" className="px-6 py-2.5 rounded-lg font-semibold border border-white/30 hover:bg-white/10 transition-colors">
                All rankings
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
