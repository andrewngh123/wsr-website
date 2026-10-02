'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import RecordModal, { emptyRecord, type RecordValues } from '../RecordModal'
import {
  Button, Card, CountryName, downloadCsv, Empty, ErrorNote, fmtPts, inputCls, Loading, Modal,
  Movement, numCls, rowCls, Select, tableCls, tdCls, Th, theadCls,
} from '../ui'
import type { FinalRankRow, Meta, Nav } from '../types'

/** FINAL RANK sheet — the archived combined ranking per year (2014 →). */
export default function FinalRankTab({ meta, nav }: { meta: Meta; nav: Nav }) {
  const finalYears = meta.years.filter((y) => meta.latestFinalYear == null || y <= meta.latestFinalYear)
  const [year, setYear] = useState<number>(finalYears[0] ?? meta.years[0])
  const [rows, setRows] = useState<FinalRankRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<{ row: FinalRankRow | null } | null>(null)
  const [recompute, setRecompute] = useState(false)
  const countries = useMemo(() => new Map(meta.countries.map((c) => [c.name, c])), [meta.countries])

  const load = useCallback(() => {
    setRows(null)
    setError(null)
    api<{ rows: FinalRankRow[] }>(`/final-rank?year=${year}`).then((d) => setRows(d.rows)).catch((e) => setError(e.message))
  }, [year])
  useEffect(load, [load])

  const visible = (rows ?? []).filter((r) => r.country.includes(search.trim().toUpperCase()))
  const drift = (rows ?? []).filter((r) => Math.abs((r.entries_points ?? 0) - r.points) > 1)

  async function save(values: RecordValues) {
    const body = { year: values.year, rank: values.rank, country: values.country, points: values.points, progress: values.progress }
    if (editing?.row) await api(`/final-rank/${editing.row.id}`, { method: 'PATCH', json: body })
    else await api('/final-rank', { method: 'POST', json: body })
    setEditing(null)
    load()
  }

  async function remove(row: FinalRankRow) {
    if (!confirm(`Delete ${row.country}'s ${row.year} final rank (#${row.rank})?`)) return
    try {
      await api(`/final-rank/${row.id}`, { method: 'DELETE' })
      load()
    } catch (e) { alert((e as Error).message) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Select label="Year" value={year} onChange={(v) => setYear(Number(v))}>
          {finalYears.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter countries…" className={`${inputCls} flex-1 min-w-[180px] max-w-xs`} />
      </div>

      {drift.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex flex-wrap items-center justify-between gap-3">
          <span>
            <strong>{drift.length}</strong> {drift.length === 1 ? 'country’s' : 'countries’'} archived {year} total no longer matches the sum of its entries
            (entries were edited since). Rows are marked <span className="font-bold">●</span> below.
          </span>
          <Button onClick={() => setRecompute(true)}>Recompute {year} from entries…</Button>
        </div>
      )}

      <Card
        title={`${year} final ranking`}
        actions={<>
          <Button variant="ghost" onClick={() => setRecompute(true)}>Recompute…</Button>
          {rows && <Button onClick={() => downloadCsv(`WSR-final-rank-${year}.csv`, ['YEAR', 'RANK', 'COUNTRY', 'POINTS', 'PROGRESS'],
            rows.map((r) => [r.year, r.rank, r.country, r.points, r.progress]))}>Export CSV</Button>}
          <Button variant="primary" onClick={() => setEditing({ row: null })}>+ Add row</Button>
        </>}
      >
        <ErrorNote error={error} />
        {!rows && !error ? <Loading /> : visible.length === 0 ? <Empty>No rows.</Empty> : (
          <div className="overflow-x-auto -mx-5">
            <table className={tableCls}>
              <thead className={theadCls}>
                <tr>
                  <Th className="w-16">Rank</Th>
                  <Th>Country</Th>
                  <Th align="right">Points</Th>
                  <Th align="center">Progress</Th>
                  <Th align="right" className="hidden md:table-cell">Sum of entries</Th>
                  <Th align="right"><span className="sr-only">Actions</span></Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const off = Math.abs((r.entries_points ?? 0) - r.points) > 1
                  return (
                    <tr key={r.id} className={rowCls}>
                      <td className={`${tdCls} font-bold text-wsr-navy tabular-nums`}>{r.rank}</td>
                      <td className={tdCls}><CountryName name={r.country} countries={countries} onClick={() => nav.openCountry(r.country)} /></td>
                      <td className={`${numCls} font-semibold`}>{fmtPts(r.points)}</td>
                      <td className={`${tdCls} text-center`}><Movement value={r.progress} /></td>
                      <td className={`${numCls} hidden md:table-cell ${off ? 'text-amber-700 font-semibold' : 'text-gray-400'}`}>
                        {off && <span title="Differs from the archived total" className="mr-1">●</span>}
                        {fmtPts(r.entries_points)}
                      </td>
                      <td className={`${tdCls} text-right whitespace-nowrap`}>
                        <Button variant="ghost" onClick={() => setEditing({ row: r })}>Edit</Button>
                        <Button variant="ghost" className="!text-red-600" onClick={() => remove(r)}>Delete</Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <RecordModal
          kind="final"
          title={editing.row ? `Edit ${editing.row.country} — ${editing.row.year}` : `Add final rank row — ${year}`}
          initial={editing.row
            ? emptyRecord({ year: String(editing.row.year), rank: String(editing.row.rank), country: editing.row.country, points: String(editing.row.points), progress: editing.row.progress ?? '-' })
            : emptyRecord({ year: String(year) })}
          categories={meta.categories}
          countries={meta.countries}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
      {recompute && <RecomputeModal year={year} onClose={() => setRecompute(false)} onDone={() => { setRecompute(false); load() }} />}
    </div>
  )
}

function RecomputeModal({ year, onClose, onDone }: { year: number; onClose: () => void; onDone: () => void }) {
  const [preview, setPreview] = useState<{ rows: unknown[]; changed: number; removed: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api<{ rows: unknown[]; changed: number; removed: number }>('/final-rank/recompute', { method: 'POST', json: { year, preview: true } })
      .then(setPreview).catch((e) => setError(e.message))
  }, [year])

  async function apply() {
    setBusy(true)
    try {
      await api('/final-rank/recompute', { method: 'POST', json: { year } })
      onDone()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Modal title={`Recompute ${year} final ranking`} onClose={onClose}>
      <div className="space-y-3 text-sm text-gray-700">
        <p>
          This rebuilds every {year} row from the entries: points = sum of the country&apos;s sport points, rank = position by points (ties share a rank),
          progress = change vs {year - 1}. The current {year} rows are replaced. The change is recorded in Activity.
        </p>
        <ErrorNote error={error} />
        {!preview && !error && <Loading label="Calculating…" />}
        {preview && (
          <p className="rounded-lg bg-wsr-light px-3 py-2">
            {preview.rows.length} countries · <strong>{preview.changed}</strong> rows would change
            {preview.removed > 0 && <> · <strong>{preview.removed}</strong> removed (no {year} entries)</>}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={apply} disabled={!preview || busy || preview.changed + preview.removed === 0}>
            {busy ? 'Recomputing…' : 'Replace rows'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
