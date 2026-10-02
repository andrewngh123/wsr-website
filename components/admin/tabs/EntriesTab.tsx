'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, apiUrl, qs } from '../api'
import RecordModal, { emptyRecord, type RecordValues } from '../RecordModal'
import {
  Button, Card, CountryName, Empty, ErrorNote, fmtDate, fmtPts, inputCls, LinkButton, Loading,
  numCls, rowCls, Select, tableCls, tdCls, Th, theadCls, TypeBadge,
} from '../ui'
import type { Entry, EntryFilters, Meta, Nav } from '../types'

const EMPTY: EntryFilters = { q: '', country: '', sport: '', type: '', year: '' }

/** The full BY COUNTRY table — search, filter, sort, and add / correct / remove rows. */
export default function EntriesTab({ meta, nav, initialFilters }: { meta: Meta; nav: Nav; initialFilters: Partial<EntryFilters> }) {
  const [filters, setFilters] = useState<EntryFilters>({ ...EMPTY, ...initialFilters })
  const [q, setQ] = useState(filters.country || filters.q) // text box: debounced into filters
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'year', dir: 'desc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [data, setData] = useState<{ rows: Entry[]; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ row: Entry | null } | null>(null)
  const countries = useMemo(() => new Map(meta.countries.map((c) => [c.name, c])), [meta.countries])
  const types = useMemo(() => new Map(meta.categories.map((c) => [c.sport, c.type])), [meta.categories])
  const entryYears = meta.summary.map((s) => s.year)

  useEffect(() => { setFilters({ ...EMPTY, ...initialFilters }); setQ(initialFilters.country || initialFilters.q || '') }, [initialFilters])

  // Typing an exact country name filters on it exactly; anything else is a partial match.
  useEffect(() => {
    const t = setTimeout(() => {
      const v = q.trim().toUpperCase()
      const exact = countries.has(v)
      setFilters((f) => (exact ? { ...f, country: v, q: '' } : { ...f, country: '', q: v }))
      setPage(1)
    }, 250)
    return () => clearTimeout(t)
  }, [q, countries])

  const params = useMemo(() => ({
    country: filters.country, q: filters.q, sport: filters.sport, type: filters.type, year: filters.year,
    sort: sort.key, dir: sort.dir,
  }), [filters, sort])

  const load = useCallback(() => {
    setError(null)
    api<{ rows: Entry[]; total: number }>(`/entries?${qs({ ...params, page, pageSize })}`)
      .then(setData).catch((e) => setError(e.message))
  }, [params, page, pageSize])
  useEffect(load, [load])

  const set = (k: keyof EntryFilters) => (v: string) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1) }
  const onSort = (key: string) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'country' || key === 'sport' || key === 'rank' ? 'asc' : 'desc' }))
    setPage(1)
  }
  const pages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1
  const active = Object.values(filters).some(Boolean)

  async function save(v: RecordValues) {
    const body = { year: v.year, sport: v.sport, rank: v.rank, country: v.country, points: v.points }
    if (editing?.row) await api(`/entries/${editing.row.id}`, { method: 'PATCH', json: body })
    else await api('/entries', { method: 'POST', json: body })
    setEditing(null)
    load()
  }

  async function remove(row: Entry) {
    if (!confirm(`Delete this entry?\n\n${row.year} · ${row.sport} · #${row.rank} ${row.country} · ${fmtPts(row.points)} pts`)) return
    try {
      await api(`/entries/${row.id}`, { method: 'DELETE' })
      load()
    } catch (e) { alert((e as Error).message) }
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_2fr_1fr_1fr_auto] gap-3 items-center">
          <div>
            <input list="entries-country-list" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Country (exact or partial)…" className={`${inputCls} w-full`} />
            <datalist id="entries-country-list">{meta.countries.map((c) => <option key={c.code} value={c.name} />)}</datalist>
          </div>
          <Select label="Sport" value={filters.sport} onChange={set('sport')} className="w-full">
            <option value="">All sports</option>
            {meta.categories.map((c) => <option key={c.sport} value={c.sport}>{c.sport}</option>)}
          </Select>
          <Select label="Type" value={filters.type} onChange={set('type')} className="w-full">
            <option value="">All types</option>
            <option value="IND">Individual</option>
            <option value="TEAM">Team</option>
            <option value="PART">Participation</option>
          </Select>
          <Select label="Year" value={filters.year} onChange={set('year')} className="w-full">
            <option value="">All years</option>
            {entryYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Button onClick={() => { setFilters(EMPTY); setQ(''); setPage(1) }} disabled={!active}>Clear</Button>
        </div>
      </Card>

      <Card
        title={data ? `${data.total.toLocaleString()} entries` : 'Entries'}
        actions={<>
          <LinkButton href={apiUrl('/entries', { ...params, format: 'csv' })}>Export CSV</LinkButton>
          <Button variant="primary" onClick={() => setEditing({ row: null })}>+ Add entry</Button>
        </>}
      >
        <ErrorNote error={error} />
        {!data && !error ? <Loading /> : data && data.rows.length === 0 ? <Empty>No entries match these filters.</Empty> : data && (
          <>
            <div className="overflow-x-auto -mx-5">
              <table className={tableCls}>
                <thead className={theadCls}>
                  <tr>
                    <Th sortKey="year" sort={sort} onSort={onSort}>Year</Th>
                    <Th sortKey="sport" sort={sort} onSort={onSort}>Sport</Th>
                    <Th sortKey="rank" sort={sort} onSort={onSort} align="right">Rank</Th>
                    <Th sortKey="country" sort={sort} onSort={onSort}>Country</Th>
                    <Th sortKey="points" sort={sort} onSort={onSort} align="right">Points</Th>
                    <Th sortKey="updated_at" sort={sort} onSort={onSort} className="hidden lg:table-cell">Last change</Th>
                    <Th align="right"><span className="sr-only">Actions</span></Th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.id} className={rowCls}>
                      <td className={`${tdCls} tabular-nums`}>{r.year}</td>
                      <td className={tdCls}>
                        <button onClick={() => nav.openSport(r.sport, r.year)} className="inline-flex items-center gap-2 text-wsr-blue hover:underline whitespace-nowrap">
                          {r.sport} <TypeBadge type={types.get(r.sport)} />
                        </button>
                      </td>
                      <td className={`${numCls} font-bold text-wsr-navy`}>{r.rank}</td>
                      <td className={tdCls}>
                        <CountryName name={r.country} countries={countries} onClick={() => nav.openCountry(r.country)} />
                        {!r.country_code && <span title="Not in COUNTRIESLIST" className="ml-2 text-[10px] font-bold text-amber-700">UNLISTED</span>}
                      </td>
                      <td className={`${numCls} font-semibold`}>{fmtPts(r.points)}</td>
                      <td className={`${tdCls} hidden lg:table-cell text-xs text-gray-400 whitespace-nowrap`}>
                        {r.updated_by && r.updated_by !== 'import' ? `${r.updated_by} · ${fmtDate(r.updated_at!)}` : 'import'}
                      </td>
                      <td className={`${tdCls} text-right whitespace-nowrap`}>
                        <Button variant="ghost" onClick={() => setEditing({ row: r })}>Edit</Button>
                        <Button variant="ghost" className="!text-red-600" onClick={() => remove(r)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span>Rows per page</span>
                <Select label="Rows per page" value={pageSize} onChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
                  {[25, 50, 100, 200].map((n) => <option key={n} value={n}>{n}</option>)}
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setPage(1)} disabled={page === 1} aria-label="First page">«</Button>
                <Button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>Prev</Button>
                <span className="tabular-nums">Page {page} of {pages.toLocaleString()}</span>
                <Button onClick={() => setPage((p) => p + 1)} disabled={page >= pages}>Next</Button>
                <Button onClick={() => setPage(pages)} disabled={page >= pages} aria-label="Last page">»</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {editing && (
        <RecordModal
          kind="entry"
          title={editing.row ? `Edit entry #${editing.row.id}` : 'Add entry'}
          initial={editing.row
            ? emptyRecord({ year: String(editing.row.year), sport: editing.row.sport, rank: String(editing.row.rank), country: editing.row.country, points: String(editing.row.points) })
            : emptyRecord({ year: filters.year || String(meta.currentYear ?? ''), sport: filters.sport, country: filters.country })}
          categories={meta.categories}
          countries={meta.countries}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
