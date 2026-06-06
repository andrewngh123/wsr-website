import { Metadata } from 'next'
import { getCountryProfile, getCountryName } from '@/lib/rankings'
import CountryFlag from '@/components/CountryFlag'
import RankChange from '@/components/RankChange'
import Link from 'next/link'

interface Props {
  params: { code: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const iso2 = params.code.toLowerCase()
  const name = await getCountryName(iso2).catch(() => null)
  const label = name ?? iso2.toUpperCase()
  return {
    title: `${label} — Sports Ranking`,
    description: `${label}'s position in the World Ranking of Countries in Elite Sport (WRCES), plus its WFCR, WSPI and WRCES Merit rankings.`,
    alternates: { canonical: `/countries/${iso2}` },
  }
}

const RANKING_LABELS = {
  wrces: 'WRCES — Elite Sport',
  wfcr:  "WFCR — Fittest Countries",
  wspi:  'WSPI — Sports Power Index',
  merit: 'WRCES Merit',
}

export default async function CountryPage({ params }: Props) {
  const iso2 = params.code.toLowerCase()
  let profile: Awaited<ReturnType<typeof getCountryProfile>>

  try {
    profile = await getCountryProfile(iso2)
  } catch {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Country not found</h1>
        <p className="text-gray-500 mb-6">We couldn&apos;t find data for &ldquo;{iso2.toUpperCase()}&rdquo;.</p>
        <Link href="/rankings" className="btn-primary">← Back to Rankings</Link>
      </div>
    )
  }

  const { country, rankings } = profile

  if (!country) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Country not found</h1>
        <p className="text-gray-500 mb-6">We couldn&apos;t find &ldquo;{iso2.toUpperCase()}&rdquo; in our database.</p>
        <Link href="/rankings" className="btn-primary">← Back to Rankings</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wsr-light">
      {/* Header */}
      <div className="bg-wsr-navy text-white py-14 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <CountryFlag iso2={country.iso_2} name={country.name} size="lg" />
          <div>
            <h1 className="text-3xl font-extrabold">{country.name}</h1>
            <p className="text-white/60 text-sm mt-1 uppercase tracking-wide">
              {country.continent_code} &bull; ISO: {country.iso_2.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Rankings cards */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="section-title mb-6">Rankings Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.entries(rankings) as [keyof typeof rankings, typeof rankings.wrces][]).map(([type, data]) => (
            <div key={type} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                {RANKING_LABELS[type]}
              </p>
              {data ? (
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-4xl font-extrabold text-wsr-navy">#{data.rank}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {Number(data.points).toLocaleString()} pts
                    </p>
                  </div>
                  <div className="text-right">
                    <RankChange change={data.change} />
                    <p className="text-xs text-gray-400 mt-1">vs prev. year</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">No data available</p>
              )}
              <Link
                href={`/rankings?ranking=${type}`}
                className="mt-4 inline-block text-xs text-wsr-blue hover:underline"
              >
                View full {type.toUpperCase()} ranking →
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/rankings" className="text-sm text-wsr-blue hover:underline">
            ← Back to all rankings
          </Link>
        </div>
      </div>
    </div>
  )
}
