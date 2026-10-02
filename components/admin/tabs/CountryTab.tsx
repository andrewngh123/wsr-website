'use client'

import { useEffect, useMemo, useState } from 'react'
import CountryFlag from '@/components/CountryFlag'
import { api, apiUrl } from '../api'
import TrendChart from '../TrendChart'
import {
  Button, Card, CountryInput, Empty, ErrorNote, fmtPts, LinkButton, Loading, numCls, rowCls,
  Stat, tableCls, tdCls, Th, theadCls, TypeBadge,
} from '../ui'
import type { Entry, FinalRankRow, Meta, Nav } from '../types'

interface History {
  country: string
  entries: Entry[]
  finalRank: FinalRankRow[]
  trend: { year: number; rank: number; points: number; provisional: boolean }[]
  breakdown: {
    year: number
    total: number
    sports: { sport: string; points: number; share: number; avg_rank: number; entries: number }[]
  }[]
}

/** A country's full history — FINAL RANK pivot + BY COUNTRY pivot in one place. */
export default function CountryTab({ meta, nav, country, setCountry }: {
  meta: Meta; nav: Nav; country: string; setCountry: (c: string) => void
}) {
  const [input, setInput] = useState(country)
  const [data, setData] = useState<History | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [year, setYear] = useState<number | null>(null)
  const [view, setView] = useState<'year' | 'matrix'>('year')
  const types = useMemo(() => new Map(meta.categories.map((c) => [c.sport, c.type])), [meta.categories])
  const info = meta.countries.find((c) => c.name === country)

  useEffect(() => { setInput(country) }, [country])
  useEffect(() => {
    if (!country) return
    setData(null)
    setError(null)
    api<History>(`/country?country=${encodeURIComponent(country)}`)
      .then((d) => { setData(d); setYear(d.breakdown[0]?.year ?? null) })
      .catch((e) => setError(e.message))
  }, [country])

  const pick = (v: string) => {
    setInput(v)
    if (meta.countries.some((c) => c.name === v)) setCountry(v)
  }

  const finals = data?.trend.filter((t) => !t.provisional) ?? []
  const best = finals.length ? finals.reduce((a, b) => (b.rank < a.rank ? b : a)) : null
  const latest = data?.trend[data.trend.length - 1]
  const yearBlock = data?.breakdown.find((b) => b.year === year)

  // sport × year rank matrix
  const matrix = useMemo(() => {
    if (!data) return null
    const years = [...new Set(data.entries.map((e) => e.year))].sort((a, b) => a - b)
    const rows = new Map<string, Map<number, { rank: number; points: number }>>()
    for (const e of data.entries) {
      const r = rows.get(e.sport) ?? new Map()
      const cur = r.get(e.year)
      r.set(e.year, { rank: Math.min(cur?.rank ?? Infinity, e.rank), points: (cur?.points ?? 0) + e.points })
      rows.set(e.sport, r)
    }
    return { years, rows: [...rows.entries()].sort((a, b) => a[0].localeCompare(b[0])) }
  }, [data])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <CountryInput id="country-pick" value={input} onChange={pick} countries={meta.countries} placeholder="Type a country…" className="w-72" autoFocus={!country} />
        {country && (
          <>
            <LinkButton href={apiUrl('/report', { country, format: 'html' })} newTab>Report (PDF / print)</LinkButton>
            <LinkButton href={apiUrl('/report', { country, format: 'csv' })}>Report (CSV)</LinkButton>
            <Button variant="ghost" onClick={() => nav.openEntries({ country })}>Edit entries →</Button>
          </>
        )}
      </div>

      {!country && <Card><Empty>Choose a country to see its full ranking history.</Empty></Card>}
      <ErrorNote error={error} />
      {country && !data && !error && <Loading />}

      {data && (
        <>
          <div className="flex items-center gap-4">
            {info?.iso_2 && <CountryFlag iso2={info.iso_2} name={country} size="lg" />}
            <div>
              <h2 className="text-2xl font-extrabold text-wsr-navy">{country}</h2>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{info?.code} · {info?.continent_code}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Latest rank" value={latest ? `#${latest.rank}` : '—'} sub={latest ? `${latest.year}${latest.provisional ? ' · provisional' : ''}` : undefined} />
            <Stat label="Best final rank" value={best ? `#${best.rank}` : '—'} sub={best ? String(best.year) : undefined} />
            <Stat label="Latest final points" value={finals.length ? fmtPts(finals[finals.length - 1].points, 0) : '—'} sub={finals.length ? String(finals[finals.length - 1].year) : undefined} />
            <Stat label="Sports contested" value={new Set(data.entries.map((e) => e.sport)).size} sub={`${data.entries.length.toLocaleString()} results`} />
          </div>

          <Card title="Overall trend">
            <div className="grid md:grid-cols-2 gap-6">
              <TrendChart title="Overall rank (lower is better)" invert data={data.trend.map((t) => ({ x: t.year, y: t.rank, provisional: t.provisional }))} format={(v) => `#${Math.round(v)}`} />
              <TrendChart title="Total points" data={data.trend.map((t) => ({ x: t.year, y: t.points, provisional: t.provisional }))} format={(v) => fmtPts(v, 0)} />
            </div>
            <p className="text-xs text-gray-400 mt-3">Dashed line / hollow marker: current season, computed live from entries.</p>
            <div className="overflow-x-auto -mx-5 mt-4">
              <table className={tableCls}>
                <thead className={theadCls}>
                  <tr>
                    <Th>Year</Th>
                    {data.trend.map((t) => <Th key={t.year} align="right">{t.year}{t.provisional ? '*' : ''}</Th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr className={rowCls}>
                    <td className={`${tdCls} text-gray-500`}>Rank</td>
                    {data.trend.map((t) => <td key={t.year} className={`${numCls} font-bold text-wsr-navy`}>{t.rank}</td>)}
                  </tr>
                  <tr className={rowCls}>
                    <td className={`${tdCls} text-gray-500`}>Points</td>
                    {data.trend.map((t) => <td key={t.year} className={`${numCls} whitespace-nowrap`}>{fmtPts(t.points, 0)}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card
            title="Points by sport"
            actions={
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                {(['year', 'matrix'] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 font-semibold ${view === v ? 'bg-wsr-navy text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    {v === 'year' ? 'One year' : 'All years (rank)'}
                  </button>
                ))}
              </div>
            }
          >
            {data.breakdown.length === 0 ? <Empty>No entries for this country.</Empty> : view === 'year' ? (
              <>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {data.breakdown.map((b) => (
                    <button key={b.year} onClick={() => setYear(b.year)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${year === b.year ? 'bg-wsr-navy text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {b.year}
                    </button>
                  ))}
                </div>
                {yearBlock && (
                  <div className="overflow-x-auto -mx-5">
                    <table className={tableCls}>
                      <thead className={theadCls}>
                        <tr>
                          <Th>Sport</Th>
                          <Th align="right">Points</Th>
                          <Th className="w-1/4 hidden sm:table-cell">% of total</Th>
                          <Th align="right">Rank</Th>
                          <Th align="right"># Entries</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearBlock.sports.map((s) => (
                          <tr key={s.sport} className={rowCls}>
                            <td className={tdCls}>
                              <button onClick={() => nav.openSport(s.sport, yearBlock.year)} className="inline-flex items-center gap-2 font-medium text-wsr-blue hover:underline">
                                {s.sport} <TypeBadge type={types.get(s.sport)} />
                              </button>
                            </td>
                            <td className={`${numCls} font-semibold`}>{fmtPts(s.points)}</td>
                            <td className={`${tdCls} hidden sm:table-cell`}>
                              <div className="flex items-center gap-2">
                                <div className="h-2 rounded-full bg-gray-100 flex-1 overflow-hidden">
                                  <div className="h-full rounded-full bg-wsr-blue" style={{ width: `${Math.max(s.share * 100, 1)}%` }} />
                                </div>
                                <span className="text-xs tabular-nums text-gray-500 w-12 text-right">{(s.share * 100).toFixed(1)}%</span>
                              </div>
                            </td>
                            <td className={numCls}>{Number.isInteger(s.avg_rank) ? s.avg_rank : s.avg_rank.toFixed(1)}</td>
                            <td className={`${numCls} ${s.entries > 1 ? 'text-amber-700 font-semibold' : 'text-gray-400'}`} title={s.entries > 1 ? 'More than one entry this year — points are summed, rank averaged' : undefined}>{s.entries}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-gray-200 font-bold">
                          <td className={tdCls}>Total · {yearBlock.sports.length} sports</td>
                          <td className={numCls}>{fmtPts(yearBlock.total)}</td>
                          <td className="hidden sm:table-cell" colSpan={3} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </>
            ) : matrix && (
              <div className="overflow-x-auto -mx-5 max-h-[70vh]">
                <table className="text-xs w-full">
                  <thead className={theadCls}>
                    <tr>
                      <Th className="sticky left-0 bg-gray-50">Sport</Th>
                      {matrix.years.map((y) => <Th key={y} align="center">{y}</Th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.rows.map(([sport, years]) => (
                      <tr key={sport} className={rowCls}>
                        <td className="px-3 py-1.5 sticky left-0 bg-white font-medium whitespace-nowrap">
                          <button onClick={() => nav.openSport(sport)} className="text-wsr-blue hover:underline">{sport}</button>
                        </td>
                        {matrix.years.map((y) => {
                          const c = years.get(y)
                          return (
                            <td key={y} className="px-2 py-1.5 text-center tabular-nums" title={c ? `${sport} ${y}: rank ${c.rank}, ${fmtPts(c.points)} pts` : undefined}>
                              {c ? <span className={c.rank <= 3 ? 'font-bold text-wsr-navy' : 'text-gray-700'}>{c.rank}</span> : <span className="text-gray-200">·</span>}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
