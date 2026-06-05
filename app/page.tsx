import Link from 'next/link'
import CountryFlag from '@/components/CountryFlag'
import RankChange from '@/components/RankChange'
import { getTopCountries, getLatestYear } from '@/lib/rankings'

// ─── Static fallback data (used when Supabase is not yet connected) ─────────
const FALLBACK_TOP5 = [
  { rank: 1, country_code: 'USA', country_name: 'USA',          iso_2: 'us', points: 2129375, change: null },
  { rank: 2, country_code: 'GBR', country_name: 'GREAT BRITAIN', iso_2: 'gb', points: 1303155, change: '+1' },
  { rank: 3, country_code: 'FRA', country_name: 'FRANCE',        iso_2: 'fr', points: 1293343, change: '-1' },
  { rank: 4, country_code: 'ITA', country_name: 'ITALY',         iso_2: 'it', points: 1131761, change: null },
  { rank: 5, country_code: 'JPN', country_name: 'JAPAN',         iso_2: 'jp', points: 984970,  change: null },
]
// ─────────────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  // Try to load live data; fall back silently if Supabase isn't configured yet
  let top5 = FALLBACK_TOP5
  let year = 2025

  try {
    year   = await getLatestYear('wrces')
    const live = await getTopCountries('wrces', year, 5)
    if (live.length > 0) top5 = live
  } catch { /* Supabase not connected yet — use fallback */ }

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-wsr-navy text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
            The First Scientific Index<br />Ranking all Countries in Sport
          </h1>
          <p className="text-white/70 text-lg mb-10">
            Find out your country&apos;s stats with just a click of a button!
          </p>

          {/* Search box */}
          <form action="/rankings" method="GET" className="flex max-w-lg mx-auto">
            <input
              type="text"
              name="q"
              placeholder="Search for a country…"
              className="flex-1 rounded-l-lg px-5 py-3 text-gray-900 text-sm outline-none"
            />
            <button
              type="submit"
              className="bg-wsr-accent hover:brightness-110 px-6 py-3 rounded-r-lg font-semibold text-sm transition-all"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ── TOP-5 PREVIEW TABLE ──────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 -mt-8 mb-16">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-wsr-blue text-white px-6 py-4 flex items-center justify-between">
            <span className="font-bold text-sm uppercase tracking-wider">{year} Final Ranking</span>
            <Link href="/rankings" className="text-white/70 hover:text-white text-xs underline">
              View all →
            </Link>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left w-12">Rank</th>
                <th className="px-6 py-3 text-left w-10">Flag</th>
                <th className="px-6 py-3 text-left">Country</th>
                <th className="px-6 py-3 text-right">Points</th>
                <th className="px-6 py-3 text-center w-16">Change</th>
              </tr>
            </thead>
            <tbody>
              {top5.map((row) => (
                <tr key={row.country_code} className="ranking-row">
                  <td className="px-6 py-3 font-bold text-wsr-navy">{row.rank}</td>
                  <td className="px-6 py-3">
                    <CountryFlag iso2={row.iso_2} name={row.country_name} />
                  </td>
                  <td className="px-6 py-3">
                    <Link
                      href={`/countries/${row.iso_2.toLowerCase()}`}
                      className="text-wsr-blue font-medium hover:underline"
                    >
                      {row.country_name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-gray-700">
                    {row.points.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <RankChange change={row.change} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-6 py-4 border-t border-gray-100 text-center">
            <Link href="/rankings" className="btn-primary inline-block text-sm">
              View Full Rankings
            </Link>
          </div>
        </div>
      </section>

      {/* ── OUR RANKINGS ─────────────────────────────────────────────────── */}
      <section className="bg-wsr-light py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title text-center">OUR RANKINGS</h2>
          <p className="text-center text-gray-500 max-w-2xl mx-auto mb-10 text-sm leading-relaxed">
            The World Ranking of Countries in Elite Sport (WRCES) is a research-based annual ranking,
            started in 2014, aiming at evaluating the performances of all the countries having National
            Olympic Committees (NOCs) in all the sports recognized by SportAccord.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                slug: 'wrces',
                label: 'WRCES',
                description: 'The World Ranking of Countries in Elite Sport — a holistic and precise evaluation of nations in elite sport.',
                logo: 'https://sportsrankings.world/rankings/wrces_final_logo_new.svg',
              },
              {
                slug: 'wfcr',
                label: 'WFCR',
                description: "The World's Fittest Countries Ranking — an unrivaled research-based tool to measure the fitness of a country.",
                logo: 'https://sportsrankings.world/rankings/wfcr_logo_new.svg',
              },
              {
                slug: 'wspi',
                label: 'WSPI',
                description: 'The World Sports Power Index — aims to rank the effect of sports on countries\' geopolitical power.',
                logo: 'https://sportsrankings.world/rankings/wspi_logo_new.svg',
              },
              {
                slug: 'wrces_merit',
                label: 'WRCES Merit',
                description: 'The WRCES Merit ranking rewards countries that are "punching above their weight" in international sport.',
                logo: 'https://sportsrankings.world/rankings/wrces_merit_logo_new.svg',
              },
            ].map((r) => (
              <Link
                key={r.slug}
                href={`/rankings?ranking=${r.slug}`}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col items-start gap-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.logo} alt={r.label} className="h-12 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <h3 className="font-bold text-wsr-navy">{r.label}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{r.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title text-center mb-10">BENEFITS &amp; FEATURES</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '🏅', text: 'Gives credit to each country and takes into account the difficulty of winning in each sport.' },
              { icon: '📊', text: 'Helps International Federations know where their sport stands in terms of popularity and universality.' },
              { icon: '🌍', text: 'Accurately evaluates each country\'s annual performance across all sports it participates in.' },
              { icon: '🏛️', text: 'Helps countries determine and implement effective national sports policies.' },
            ].map((b, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <span className="text-4xl">{b.icon}</span>
                <p className="text-sm text-gray-600 leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT MAKES WRCES DIFFERENT ───────────────────────────────────── */}
      <section className="bg-wsr-navy text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            WHAT MAKES WRCES DIFFERENT
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'All athletes participating in an event, discipline or sport get points',
              'Research-based ranking published in several books and scientific papers',
              'Considers the level of competition in each sport — rewards countries succeeding in popular, universal sports',
              'Ranks all 206 countries with National Olympic Committees',
              'Includes para-sports',
              'Updated annually',
            ].map((item, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="text-wsr-accent mt-0.5">✓</span>
                <span className="text-sm text-white/80 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── REVIEWS ──────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-wsr-light">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title text-center mb-10">Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                text: 'Nassif\'s ranking system should serve as a blueprint for a much needed debate on Olympic medal count reform.',
                name: 'Dr. Danyel Reiche',
                title: 'Associate Professor for Comparative Politics, UAE University',
              },
              {
                text: 'The World Ranking of Countries in Elite Sport is to sport what the Shanghai Ranking is to universities.',
                name: 'Hubert Ripoll',
                title: 'Emeritus Professor in Sports Sciences, University of Aix-Marseille',
              },
              {
                text: 'The outcome of a rigorous methodology with an open mind to further improvement.',
                name: 'Wladimir Andreff',
                title: 'President of the Scientific Council of the Observatory of Sports Economy',
              },
            ].map((r, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <p className="text-gray-600 text-sm italic leading-relaxed mb-4">&ldquo;{r.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-wsr-navy text-sm">{r.name}</p>
                  <p className="text-gray-400 text-xs">{r.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
