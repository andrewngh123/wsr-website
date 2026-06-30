import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import CountryFlag from '@/components/CountryFlag'
import RankChange from '@/components/RankChange'
import { getRankings, getLatestYear, type RankingType } from '@/lib/rankings'
import { rankingStatus } from '@/lib/format'
import { SITE_URL } from '@/lib/seo'

export const revalidate = 86400 // refresh data daily

type SlugConfig = {
  type: RankingType
  bg: string
  h1: string
  lead: string            // the ranking's name, woven into copy
  title: string           // <title>
  description: string     // meta description
  intro: string[]         // keyword-rich paragraphs
  faq: { q: string; a: (year: number, top: string) => string }[]
}

// ── Keyword-targeted landing pages, one per ranking ──────────────────────────
const PAGES: Record<string, SlugConfig> = {
  'elite-sport': {
    type: 'wrces',
    bg: '/design/headers/athletics.webp',
    h1: 'Best Countries in Sport',
    lead: 'World Ranking of Countries in Elite Sport (WRCES)',
    title: 'Best Countries in Sport — World Ranking of Countries in Elite Sport (WRCES)',
    description:
      'Which countries are the best at sport? The World Ranking of Countries in Elite Sport (WRCES) is the first scientific index ranking all 206 nations across every sport — far beyond the Olympic medal table.',
    intro: [
      'Which countries are the best in sport? The World Ranking of Countries in Elite Sport (WRCES) is the first research-based index to answer that scientifically — ranking the 206 countries with National Olympic Committees across every sport, Olympics and non-Olympics.',
      'Unlike the Olympic medal table, the WRCES weights each sport by its level of competition, giving a true picture of national sporting performance.',
    ],
    faq: [
      { q: 'Which country is the best at sport?', a: (y, t) => `In the ${y} World Ranking of Countries in Elite Sport (WRCES), ${t} ranks as the best country in sport.` },
      { q: 'How are countries ranked in sport?', a: () => 'The WRCES scores every country across all sports recognised by SportAccord, weighting each sport by how popular and universal it is — so success in widely practised, widely followed sports counts for more.' },
    ],
  },
  'fittest-countries': {
    type: 'wfcr',
    bg: '/design/headers/swimming.webp',
    h1: 'Fittest Countries in the World',
    lead: "World's Fittest Countries Ranking (WFCR)",
    title: "Fittest Countries in the World — World's Fittest Countries Ranking (WFCR)",
    description:
      "Which is the fittest country in the world? The World's Fittest Countries Ranking (WFCR) is a research-based national fitness ranking measuring the overall fitness of every country.",
    intro: [
      "Which is the fittest country in the world? The World's Fittest Countries Ranking (WFCR) is a research-based fitness ranking that measures the overall fitness of nations — the only index of its kind.",
      'The WFCR combines elite sport performance with national health indicators to produce a complete fitness ranking by country. Explore the full list of the world’s fittest countries below.',
    ],
    faq: [
      { q: 'Which is the fittest country in the world?', a: (y, t) => `In the ${y} World’s Fittest Countries Ranking (WFCR), ${t} is the fittest country in the world.` },
      { q: 'What is the WFCR?', a: () => "The World's Fittest Countries Ranking (WFCR) is a research-based index that measures and ranks the fitness of countries by combining their elite sport results with population health and nutrition data." },
    ],
  },
  'sports-power-index': {
    type: 'wspi',
    bg: '/design/headers/crowd.webp',
    h1: 'Sports Power Rankings',
    lead: 'World Sports Power Index (WSPI)',
    title: 'Sports Power Rankings by Country — World Sports Power Index (WSPI)',
    description:
      'Sports power rankings of countries. The World Sports Power Index (WSPI) measures each nation’s power and influence in global sport — from elite results to hosting major events.',
    intro: [
      'The World Sports Power Index (WSPI) ranks the sports power of countries — measuring how each nation uses sport as an instrument of global influence and soft power.',
      'These sports power rankings combine elite sporting results, the hosting of major events and the strength of professional leagues. See the full sports power index by country below.',
    ],
    faq: [
      { q: 'What is the World Sports Power Index?', a: () => 'The World Sports Power Index (WSPI) is a research-based ranking of how much power and influence each country holds in global sport, combining elite results, event hosting and professional-league strength.' },
      { q: 'Which country has the most sports power?', a: (y, t) => `In the ${y} World Sports Power Index (WSPI), ${t} ranks first for sports power.` },
    ],
  },
  'merit': {
    type: 'merit',
    bg: '/design/headers/tennis.webp',
    h1: 'Sports Merit Ranking',
    lead: 'WRCES Merit ranking',
    title: 'Sports Merit Ranking by Country — WRCES Merit',
    description:
      'The WRCES Merit ranking rewards the countries punching above their weight in sport — those achieving the most relative to their population and economic resources.',
    intro: [
      'The WRCES Merit ranking highlights the countries that punch above their weight in elite sport — the nations achieving the most relative to their population and economic resources.',
      'It re-scores the World Ranking of Countries in Elite Sport against each country’s GDP, surfacing the real over-performers. See the full sports merit ranking by country below.',
    ],
    faq: [
      { q: 'What is the WRCES Merit ranking?', a: () => 'The WRCES Merit ranking adjusts elite-sport performance for a country’s economic resources, rewarding nations that achieve more than their GDP would predict.' },
      { q: 'Which country punches above its weight in sport?', a: (y, t) => `In the ${y} WRCES Merit ranking, ${t} tops the list of countries punching above their weight in sport.` },
    ],
  },
}

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const cfg = PAGES[params.slug]
  if (!cfg) return {}
  return {
    title: cfg.title,
    description: cfg.description,
    alternates: { canonical: `/rankings/${params.slug}` },
    openGraph: { title: cfg.title, description: cfg.description, url: `${SITE_URL}/rankings/${params.slug}` },
  }
}

export default async function RankingLandingPage({ params }: { params: { slug: string } }) {
  const cfg = PAGES[params.slug]
  if (!cfg) notFound()

  let year = new Date().getFullYear() - 1
  let rows: Awaited<ReturnType<typeof getRankings>> = []
  try {
    year = await getLatestYear(cfg.type)
    rows = await getRankings(cfg.type, year)
  } catch { /* render copy even if data is unavailable */ }

  const status = rankingStatus(year)
  const topCountry = rows[0]?.country_name ?? ''

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: cfg.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a(year, topCountry || 'the leading country') },
    })),
  }

  return (
    <div className="min-h-screen bg-wsr-light">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <PageHeader title={`${cfg.h1} ${year}`} subtitle={cfg.lead} bg={cfg.bg} />

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        {/* Intro copy */}
        <section className="space-y-4">
          {cfg.intro.map((p, i) => (
            <p key={i} className="text-gray-700 leading-relaxed">{p}</p>
          ))}
        </section>

        {/* Ranking table */}
        {rows.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-wsr-navy mb-4">
              {year} {status} Ranking
            </h2>
            <div className="bg-white rounded-2xl shadow ring-1 ring-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-100">
                    <th className="text-left font-semibold px-5 py-3 w-14">Rank</th>
                    <th className="text-left font-semibold px-2 py-3">Country</th>
                    <th className="text-right font-semibold px-5 py-3">Points</th>
                    <th className="text-center font-semibold px-5 py-3 w-20">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.country_code} className="odd:bg-white even:bg-slate-50 hover:bg-slate-100 transition-colors border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3 font-bold text-wsr-navy tabular-nums">{r.rank}</td>
                      <td className="px-2 py-3">
                        <Link href={`/countries/${r.iso_2.toLowerCase()}`} className="flex items-center gap-3 group">
                          <CountryFlag iso2={r.iso_2} name={r.country_name} />
                          <span className="font-medium text-wsr-navy group-hover:text-wsr-blue group-hover:underline">{r.country_name}</span>
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-700 tabular-nums">{Math.round(Number(r.points)).toLocaleString()}</td>
                      <td className="px-5 py-3 text-center"><RankChange change={r.change} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-center mt-4">
              <Link href="/rankings" className="text-sm text-wsr-blue hover:underline">Explore all years &amp; filters in the full rankings →</Link>
            </p>
          </section>
        )}

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-bold text-wsr-navy mb-4">Frequently asked questions</h2>
          <div className="space-y-4">
            {cfg.faq.map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-wsr-navy">{f.q}</h3>
                <p className="text-gray-600 text-sm mt-1 leading-relaxed">{f.a(year, topCountry || 'the leading country')}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-links to the other rankings (internal linking) */}
        <section className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500 mb-3">Explore the other World Sports Rankings:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PAGES)
              .filter(([slug]) => slug !== params.slug)
              .map(([slug, c]) => (
                <Link key={slug} href={`/rankings/${slug}`} className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-gray-200 text-wsr-navy hover:border-wsr-blue hover:text-wsr-blue transition-colors">
                  {c.h1}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </div>
  )
}
