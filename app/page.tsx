import Link from 'next/link'
import CountryFlag from '@/components/CountryFlag'
import RankChange from '@/components/RankChange'
import RankingLogo from '@/components/RankingLogo'
import ReviewAvatar from '@/components/ReviewAvatar'
import { getTopCountries, getLatestYear, getHomeStats } from '@/lib/rankings'
import { rankingStatus } from '@/lib/format'
import { PUBLICATIONS } from '@/lib/publications'

const ELECTRIC = '#1F6BFF'
const GOLD = '#e8a020'

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

  // Stat chips (dynamic so they stay current). Sports isn't publicly readable,
  // so it's a fixed figure; the rest come from the live data.
  const stats = await getHomeStats()
  const pubCount = PUBLICATIONS.reduce((n, s) => n + s.items.length, 0)
  const chips = [
    `${stats.countries} Countries`,
    `115 Sports`,
    `${stats.years} Years`,
    `${pubCount} Scientific Publications`,
  ]

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* stadium photo */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/design/hero-stadium.webp)' }} />
        {/* navy gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-wsr-navy/95 via-wsr-navy/80 to-[#0b1c3d]/60" />
        {/* light particles */}
        <div className="absolute inset-0 opacity-30 mix-blend-screen bg-cover bg-center" style={{ backgroundImage: 'url(/design/particles.webp)' }} />
        {/* stadium-floodlight glow */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 80% at 50% -15%, rgba(255,255,255,0.20), transparent 55%), radial-gradient(70% 60% at 85% 115%, rgba(31,107,255,0.22), transparent 60%)' }} />

        <div className="relative max-w-4xl mx-auto px-4 py-24 md:py-28 text-center text-white">
          <span
            className="inline-block text-xs font-semibold tracking-[0.25em] uppercase mb-5 px-3 py-1 rounded-full border"
            style={{ color: GOLD, borderColor: GOLD + '66', background: GOLD + '14' }}
          >
            The Science of Sport
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.1] mb-4">
            The <span style={{ color: ELECTRIC }}>First Scientific Index</span><br />
            Ranking all Countries in Sport
          </h1>
          <p className="text-white/70 text-lg mb-9">
            Find out your country&apos;s stats with just a click of a button!
          </p>

          {/* Search box */}
          <form action="/rankings" method="GET" className="flex max-w-lg mx-auto rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/20">
            <input
              type="text"
              name="q"
              placeholder="Search for a country…"
              className="flex-1 px-5 py-4 text-gray-900 text-sm outline-none bg-white/95"
            />
            <button
              type="submit"
              className="px-7 py-4 font-semibold text-sm text-white transition-all hover:brightness-110"
              style={{ background: GOLD }}
            >
              Search
            </button>
          </form>

          {/* Stat chips */}
          <div className="flex flex-wrap justify-center gap-3 mt-9 text-xs">
            {chips.map((c) => (
              <span key={c} className="px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/85">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOP-5 PREVIEW TABLE ──────────────────────────────────────────── */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 -mt-8 mb-16">
        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between text-white" style={{ background: 'linear-gradient(135deg, #0b1c3d, #15294d)' }}>
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm uppercase tracking-wider">{year} {rankingStatus(year)} Ranking</span>
              {rankingStatus(year) === 'Provisional' && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: ELECTRIC + '33', color: '#bcd2ff' }}>Live</span>
              )}
            </div>
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
                <tr key={row.country_code} className="odd:bg-white even:bg-slate-50 hover:bg-slate-100 transition-colors border-b border-gray-50 last:border-0">
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
                logo: '/rankings/wrces_final_logo_new.svg',
              },
              {
                slug: 'wfcr',
                label: 'WFCR',
                description: "The World's Fittest Countries Ranking — an unrivaled research-based tool to measure the fitness of a country.",
                logo: '/rankings/wfcr_logo_new.svg',
              },
              {
                slug: 'wspi',
                label: 'WSPI',
                description: 'The World Sports Power Index — aims to rank the effect of sports on countries\' geopolitical power.',
                logo: '/rankings/wspi_logo_new.svg',
              },
              {
                slug: 'wrces_merit',
                label: 'WRCES Merit',
                description: 'The WRCES Merit ranking rewards countries that are "punching above their weight" in international sport.',
                logo: '/rankings/wrces_merit_logo_new.svg',
              },
            ].map((r) => (
              <Link
                key={r.slug}
                href={`/rankings?ranking=${r.slug}`}
                className="group relative bg-white rounded-xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-gray-100 flex flex-col items-start gap-3 overflow-hidden"
              >
                <span className="absolute top-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-300" style={{ background: `linear-gradient(90deg, ${ELECTRIC}, #00C2FF)` }} />
                <RankingLogo src={r.logo} alt={r.label} />
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
      <section className="relative overflow-hidden bg-wsr-navy text-white py-16 px-4">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(80% 60% at 80% -10%, rgba(31,107,255,0.18), transparent 60%)' }} />
        <div className="relative max-w-4xl mx-auto">
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
                text: 'Olympic medal counts have several weaknesses. Non-Olympic sports are omitted, and all medals are counted alike, regardless of the popularity of a sport. Nadim Nassif has developed a more innovative ranking system which incorporates factors such as the overall popularity of a sport and events beyond the Olympic Games in order to capture a more holistic view of measuring success in sports. Nassif\'s ranking system should serve as a blueprint for a much needed debate on Olympic medal count reform.',
                name: 'Dr. Danyel Reiche',
                title: 'Associate Professor for Comparative Politics, United Arab Emirates University (UAEU)',
                photo: '/reviews/danyel-reiche.jpg',
                initials: 'DR',
              },
              {
                text: 'The World Ranking of Countries in Elite Sport is to sport what the Shanghai Ranking is to universities.',
                name: 'Hubert Ripoll',
                title: 'Emeritus Professor in Sports Sciences, University of Aix-Marseille',
                photo: '/reviews/hubert-ripoll.jpg',
                initials: 'HR',
              },
              {
                text: 'The outcome of a rigorous methodology with an open mind to further improvement.',
                name: 'Wladimir Andreff',
                title: 'President of the Scientific Council of the Observatory of Sports Economy, French Ministry of Sports',
                photo: '/reviews/wladimir-andreff.jpg',
                initials: 'WA',
              },
              {
                text: 'During my 20 years of working specifically in sport development throughout the Pacific Region and subsequently as an academic in the field of sport management and development I have remained frustrated by the dogmatic adherence to the Olympic Games Medal tally as the key rationale for directing funds and setting priorities for the development of sport. This new ranking system offers hope that there is a better way.',
                name: 'Brian Minikin',
                title: 'Former Regional Manager, Sport Development, Oceania National Olympic Committee',
                photo: '/reviews/brian-minikin.jpg',
                initials: 'BM',
              },
              {
                text: 'The World Ranking of Countries in Elite Sport (WRCES) has helped me to better evaluate France\'s performance in international competitions and write the book "La France n\'est pas un pays de sport?"',
                name: 'Jean-Baptiste Guégan',
                title: 'Editor in Chief, La Géographie — la revue de la Société de Géographie',
                photo: '/reviews/jean-baptiste-guegan.jpg',
                initials: 'JG',
              },
            ].map((r, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col">
                <p className="text-gray-600 text-sm italic leading-relaxed mb-6 flex-1">&ldquo;{r.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <ReviewAvatar photo={r.photo} name={r.name} initials={r.initials} />
                  <div>
                    <p className="font-semibold text-wsr-navy text-sm">{r.name}</p>
                    <p className="text-gray-400 text-xs">{r.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
