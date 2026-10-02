'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import {
  Button, Card, CountryName, downloadCsv, Empty, ErrorNote, fmtPts, inputCls, Loading, numCls, rowCls,
  Select, Stat, tableCls, tdCls, Th, theadCls, TypeBadge,
} from '../ui'
import type { Country, Entry, Meta, Nav } from '../types'

interface PivotRow { rank: number; country: string; country_code: string | null; points: number; entries: number; avg_rank: number; best_rank: number }
interface SportSummary { sport: string; type: string; entries: number; countries: number; points: number; leader: string | null }
interface SportResponse {
  sport: string | null
  year: number | null
  pivot: PivotRow[]
  sports?: SportSummary[]
  years?: number[]
  matrix?: { country: string; ranks: Record<number, number> }[]
  entries?: Entry[]
}

/**
 * BY SPORT pivot. No sport = compare all sports (and country totals across
 * them); one sport + one year = that sport's full country ranking; one sport +
 * all years = totals plus a year-by-year rank grid.
 */
export default function SportTab({ meta, nav, sport, year, onChange }: {
  meta: Meta; nav: Nav; sport: string; year: number | null
  onChange: (s: { sport: string; year: number | null }) => void
}) {
  const [data, setData] = useState<SportResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [allView, setAllView] = useState<'sports' | 'countries'>('sports')
  const countries = useMemo(() => new Map(meta.countries.map((c) => [c.name, c])), [meta.countries])
  const category = meta.categories.find((c) => c.sport === sport)
  const entryYears = meta.summary.map((s) => s.year)

  useEffect(() => {
    setData(null)
    setError(null)
    const q = new URLSearchParams()
    if (sport) q.set('sport', sport)
    if (year) q.set('year', String(year))
    api<SportResponse>(`/sport?${q}`).then(setData).catch((e) => setError(e.message))
  }, [sport, year])

  const filter = (c: string) => c.includes(search.trim().toUpperCase())
  const label = `${sport || 'All sports'} · ${year ?? 'all years'}`

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Select label="Sport" value={sport} onChange={(v) => onChange({ sport: v, year })} className="min-w-[220px]">
          <option value="">All sports</option>
          {meta.categories.map((c) => <option key={c.sport} value={c.sport}>{c.sport} ({c.type})</option>)}
        </Select>
        <Select label="Year" value={year ?? ''} onChange={(v) => onChange({ sport, year: v ? Number(v) : null })}>
          <option value="">All years</option>
          {entryYears.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter countries…" className={`${inputCls} flex-1 min-w-[160px] max-w-xs`} />
        {sport && <Button variant="ghost" onClick={() => nav.openEntries({ sport, year: year ? String(year) : '' })}>Edit entries →</Button>}
      </div>

      {category && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TypeBadge type={category.type} />
          <span>{{ IND: 'Individual sport', TEAM: 'Team sport', PART: 'Participation-based' }[category.type]}{category.note ? ` · includes ${category.note}` : ''}</span>
        </div>
      )}

      <ErrorNote error={error} />
      {!data && !error && <Loading />}

      {data && !sport && (
        <>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm w-max">
            {(['sports', 'countries'] as const).map((v) => (
              <button key={v} onClick={() => setAllView(v)} className={`px-3 py-1.5 font-semibold ${allView === v ? 'bg-wsr-navy text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {v === 'sports' ? 'Compare sports' : 'Country totals'}
              </button>
            ))}
          </div>
          {allView === 'sports' ? (
            <Card title={`Sports — ${year ?? 'all years'}`}
              actions={<Button onClick={() => downloadCsv(`WSR-sports-${year ?? 'all'}.csv`, ['SPORT', 'TYPE', 'COUNTRIES', 'ENTRIES', 'POINTS', 'LEADER'],
                (data.sports ?? []).map((s) => [s.sport, s.type, s.countries, s.entries, s.points, s.leader]))}>Export CSV</Button>}>
              <div className="overflow-x-auto -mx-5">
                <table className={tableCls}>
                  <thead className={theadCls}>
                    <tr><Th>Sport</Th><Th align="right">Countries</Th><Th align="right">Entries</Th><Th align="right">Total points</Th><Th className="hidden md:table-cell">Leader (most points)</Th></tr>
                  </thead>
                  <tbody>
                    {(data.sports ?? []).map((s) => (
                      <tr key={s.sport} className={rowCls}>
                        <td className={tdCls}>
                          <button onClick={() => onChange({ sport: s.sport, year })} className="inline-flex items-center gap-2 font-medium text-wsr-blue hover:underline">
                            {s.sport} <TypeBadge type={s.type} />
                          </button>
                        </td>
                        <td className={numCls}>{s.countries}</td>
                        <td className={`${numCls} text-gray-500`}>{s.entries.toLocaleString()}</td>
                        <td className={`${numCls} font-semibold`}>{fmtPts(s.points, 0)}</td>
                        <td className={`${tdCls} hidden md:table-cell`}>{s.leader && <CountryName name={s.leader} countries={countries} onClick={() => nav.openCountry(s.leader!)} />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : <PivotCard title={`Country totals — ${label}`} rows={data.pivot.filter((r) => filter(r.country))} countries={countries} nav={nav} csvName={`WSR-by-sport-${year ?? 'all'}.csv`} />}
        </>
      )}

      {data && sport && year && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Countries ranked" value={data.pivot.length} />
            <Stat label="Entries" value={data.entries?.length ?? 0} />
            <Stat label="Winner" value={data.pivot[0]?.country ?? '—'} sub={data.pivot[0] ? `${fmtPts(data.pivot[0].points, 0)} pts` : undefined} />
            <Stat label="Total points" value={fmtPts(data.pivot.reduce((s, r) => s + r.points, 0), 0)} />
          </div>
          <Card title={`${sport} — ${year} ranking`}
            actions={<Button onClick={() => downloadCsv(`WSR-${sport}-${year}.csv`, ['RANK', 'COUNTRY', 'POINTS'],
              (data.entries ?? []).map((e) => [e.rank, e.country, e.points]))}>Export CSV</Button>}>
            {(data.entries ?? []).length === 0 ? <Empty>No {sport} entries in {year}.</Empty> : (
              <div className="overflow-x-auto -mx-5">
                <table className={tableCls}>
                  <thead className={theadCls}><tr><Th className="w-16">Rank</Th><Th>Country</Th><Th align="right">Points</Th></tr></thead>
                  <tbody>
                    {(data.entries ?? []).filter((e) => filter(e.country)).map((e) => (
                      <tr key={e.id} className={rowCls}>
                        <td className={`${tdCls} font-bold text-wsr-navy tabular-nums`}>{e.rank}</td>
                        <td className={tdCls}><CountryName name={e.country} countries={countries} onClick={() => nav.openCountry(e.country)} /></td>
                        <td className={`${numCls} font-semibold`}>{fmtPts(e.points)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {data && sport && !year && (
        <>
          <PivotCard title={`${sport} — all years, totals`} rows={data.pivot.filter((r) => filter(r.country))} countries={countries} nav={nav} csvName={`WSR-${sport}-all-years.csv`} />
          <RankGrid data={data} filter={filter} countries={countries} nav={nav} onYear={(y) => onChange({ sport, year: y })} />
        </>
      )}
    </div>
  )
}

function PivotCard({ title, rows, countries, nav, csvName }: {
  title: string; rows: PivotRow[]; countries: Map<string, Country>; nav: Nav; csvName: string
}) {
  return (
    <Card title={title} actions={<Button onClick={() => downloadCsv(csvName, ['RANK', 'COUNTRY', 'SUM OF POINTS', 'COUNT OF ENTRIES', 'AVG RANK', 'BEST RANK'],
      rows.map((r) => [r.rank, r.country, r.points, r.entries, r.avg_rank.toFixed(1), r.best_rank]))}>Export CSV</Button>}>
      {rows.length === 0 ? <Empty>No results.</Empty> : (
        <div className="overflow-x-auto -mx-5 max-h-[70vh]">
          <table className={tableCls}>
            <thead className={theadCls}>
              <tr><Th className="w-16">#</Th><Th>Country</Th><Th align="right">Sum of points</Th><Th align="right">Entries</Th><Th align="right" className="hidden sm:table-cell">Avg rank</Th><Th align="right" className="hidden sm:table-cell">Best</Th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.country} className={rowCls}>
                  <td className={`${tdCls} font-bold text-wsr-navy tabular-nums`}>{r.rank}</td>
                  <td className={tdCls}><CountryName name={r.country} countries={countries} onClick={() => nav.openCountry(r.country)} /></td>
                  <td className={`${numCls} font-semibold`}>{fmtPts(r.points)}</td>
                  <td className={`${numCls} text-gray-500`}>{r.entries}</td>
                  <td className={`${numCls} text-gray-500 hidden sm:table-cell`}>{r.avg_rank.toFixed(1)}</td>
                  <td className={`${numCls} text-gray-500 hidden sm:table-cell`}>{r.best_rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function RankGrid({ data, filter, countries, nav, onYear }: {
  data: SportResponse; filter: (c: string) => boolean; countries: Map<string, Country>; nav: Nav; onYear: (y: number) => void
}) {
  const [limit, setLimit] = useState(25)
  // Order countries by their all-years total (pivot order).
  const order = new Map(data.pivot.map((r, i) => [r.country, i]))
  const rows = (data.matrix ?? []).filter((m) => filter(m.country)).sort((a, b) => (order.get(a.country) ?? 0) - (order.get(b.country) ?? 0))
  const years = data.years ?? []
  return (
    <Card title="Rank by year" actions={<span className="text-xs text-gray-400">Click a year to open its full ranking</span>}>
      <div className="overflow-x-auto -mx-5">
        <table className="text-xs w-full">
          <thead className={theadCls}>
            <tr>
              <Th className="sticky left-0 bg-gray-50">Country</Th>
              {years.map((y) => <Th key={y} align="center"><button className="hover:underline" onClick={() => onYear(y)}>{y}</button></Th>)}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((m) => (
              <tr key={m.country} className={rowCls}>
                <td className="px-3 py-1.5 sticky left-0 bg-white whitespace-nowrap"><CountryName name={m.country} countries={countries} onClick={() => nav.openCountry(m.country)} /></td>
                {years.map((y) => (
                  <td key={y} className="px-2 py-1.5 text-center tabular-nums">
                    {m.ranks[y] != null ? <span className={m.ranks[y] <= 3 ? 'font-bold text-wsr-navy' : 'text-gray-700'}>{m.ranks[y]}</span> : <span className="text-gray-200">·</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > limit && (
        <div className="text-center mt-3"><Button onClick={() => setLimit((n) => n + 50)}>Show more ({rows.length - limit} left)</Button></div>
      )}
    </Card>
  )
}
