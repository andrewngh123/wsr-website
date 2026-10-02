'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import {
  Button, Card, CountryName, downloadCsv, Empty, ErrorNote, fmtPts, inputCls, Loading, Modal,
  Movement, numCls, rowCls, Select, Stat, tableCls, tdCls, Th, theadCls,
} from '../ui'
import type { Meta, Nav } from '../types'

interface Standing {
  rank: number
  country: string
  country_code: string | null
  points: number
  sports: number
  rank_before: number | null
}

interface StandingsResponse {
  year: number
  rows: Standing[]
  latestSports: string[]
  sportsIncluded: number
}

/**
 * FINALRANKING "Final Ranking" sheet, computed live from the entries
 * (rank = RANK(points), points = SUMIF, sports = COUNTIF), plus the
 * "difference" sheet: rank before vs after the latest sports were added.
 */
export default function StandingsTab({ meta, nav, onMetaChange }: { meta: Meta; nav: Nav; onMetaChange: () => void }) {
  const entryYears = meta.summary.map((s) => s.year)
  const [year, setYear] = useState<number>(meta.currentYear ?? entryYears[0])
  const [data, setData] = useState<StandingsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editingLatest, setEditingLatest] = useState(false)
  const [reload, setReload] = useState(0)
  const countries = useMemo(() => new Map(meta.countries.map((c) => [c.name, c])), [meta.countries])

  useEffect(() => {
    setData(null)
    setError(null)
    api<StandingsResponse>(`/standings?year=${year}`).then(setData).catch((e) => setError(e.message))
  }, [year, reload])

  const summary = meta.summary.find((s) => s.year === year)
  const isFinal = meta.latestFinalYear != null && year <= meta.latestFinalYear
  const rows = (data?.rows ?? []).filter((r) => r.country.includes(search.trim().toUpperCase()))
  const hasBefore = (data?.latestSports.length ?? 0) > 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Select label="Year" value={year} onChange={(v) => setYear(Number(v))}>
          {entryYears.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter countries…" className={`${inputCls} flex-1 min-w-[180px] max-w-xs`} />
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isFinal ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
          {isFinal ? 'Final year — archived ranking is under “Final rankings”' : 'Provisional — updates as entries change'}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Sports included" value={data?.sportsIncluded ?? summary?.sports ?? '—'} sub={`in ${year}`} />
        <Stat label="Results entered" value={summary ? summary.entries.toLocaleString() : '—'} />
        <Stat label="Countries scoring" value={data ? data.rows.filter((r) => r.points > 0).length : '—'} sub={`of ${meta.countries.length}`} />
        <Stat label="Leader" value={data?.rows[0] ? data.rows[0].country : '—'} sub={data?.rows[0] ? `${fmtPts(data.rows[0].points, 0)} pts` : undefined} />
      </div>

      <Card
        title="Latest sports added"
        actions={<Button variant="ghost" onClick={() => setEditingLatest(true)}>Edit list</Button>}
      >
        {hasBefore ? (
          <div className="flex flex-wrap gap-2">
            {data!.latestSports.map((s) => (
              <button key={s} onClick={() => nav.openSport(s, year)} className="text-xs font-semibold rounded-full bg-wsr-light text-wsr-blue px-3 py-1 hover:bg-blue-100">
                {s}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No latest-sports list for {year}. Add one to see each country&apos;s movement since those sports were added.</p>
        )}
      </Card>

      <Card
        title={`${year} combined standings`}
        actions={data && (
          <Button onClick={() => downloadCsv(`WSR-standings-${year}.csv`,
            ['RANK', 'COUNTRY', 'POINTS', 'SPORTS', ...(hasBefore ? ['RANK BEFORE LATEST', 'MOVEMENT'] : [])],
            data.rows.map((r) => [r.rank, r.country, r.points, r.sports,
              ...(hasBefore ? [r.rank_before, r.rank_before != null ? r.rank_before - r.rank : ''] : [])]))}>
            Export CSV
          </Button>
        )}
      >
        <ErrorNote error={error} />
        {!data && !error ? <Loading /> : rows.length === 0 ? <Empty>No countries match.</Empty> : (
          <div className="overflow-x-auto -mx-5">
            <table className={tableCls}>
              <thead className={theadCls}>
                <tr>
                  <Th className="w-16">Rank</Th>
                  <Th>Country</Th>
                  <Th align="right">Points</Th>
                  <Th align="right">Sports</Th>
                  {hasBefore && <Th align="right">Before latest</Th>}
                  {hasBefore && <Th align="center">Move</Th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.country} className={rowCls}>
                    <td className={`${tdCls} font-bold text-wsr-navy tabular-nums`}>{r.rank}</td>
                    <td className={tdCls}><CountryName name={r.country} countries={countries} onClick={() => nav.openCountry(r.country)} /></td>
                    <td className={`${numCls} font-semibold`}>{fmtPts(r.points)}</td>
                    <td className={numCls}>
                      <button className="text-wsr-blue hover:underline" onClick={() => nav.openEntries({ country: r.country, year: String(year) })}>{r.sports}</button>
                    </td>
                    {hasBefore && <td className={`${numCls} text-gray-500`}>{r.rank_before ?? '—'}</td>}
                    {hasBefore && <td className={`${tdCls} text-center`}><Movement value={r.rank_before != null ? r.rank_before - r.rank : null} /></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editingLatest && (
        <LatestSportsModal
          year={year}
          initial={data?.latestSports ?? []}
          sports={meta.categories.map((c) => c.sport)}
          onClose={() => setEditingLatest(false)}
          onSaved={() => { setEditingLatest(false); setReload((n) => n + 1); onMetaChange() }}
        />
      )}
    </div>
  )
}

function LatestSportsModal({ year, initial, sports, onClose, onSaved }: {
  year: number; initial: string[]; sports: string[]; onClose: () => void; onSaved: () => void
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set(initial))
  const [filter, setFilter] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    try {
      await api('/meta', { method: 'PATCH', json: { year, sports: [...picked] } })
      onSaved()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Modal title={`Latest sports added — ${year}`} onClose={onClose} wide>
      <p className="text-sm text-gray-500 mb-3">
        Countries&apos; movement is shown against the standings <em>without</em> these sports (the FINALRANKING &ldquo;difference&rdquo; sheet).
      </p>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter sports…" className={`${inputCls} w-full mb-3`} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-72 overflow-y-auto">
        {sports.filter((s) => s.includes(filter.toUpperCase())).map((s) => (
          <label key={s} className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-gray-50">
            <input type="checkbox" checked={picked.has(s)} onChange={(e) => {
              const next = new Set(picked)
              if (e.target.checked) next.add(s); else next.delete(s)
              setPicked(next)
            }} />
            {s}
          </label>
        ))}
      </div>
      <ErrorNote error={error} />
      <div className="flex justify-between items-center mt-4">
        <span className="text-xs text-gray-500">{picked.size} selected</span>
        <div className="flex gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  )
}
