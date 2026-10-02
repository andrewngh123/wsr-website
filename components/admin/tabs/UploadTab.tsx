'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { api, apiUrl } from '../api'
import { Button, Card, ErrorNote, fmtDate, LinkButton, numCls, rowCls, Stat, tableCls, tdCls, Th, theadCls } from '../ui'
import type { Meta } from '../types'
import {
  crossCheck, FINAL_SHEET, parseFinal, parseStorage, STORAGE_SHEETS,
  type ParsedFinal, type ParsedStorage, type SheetRows,
} from '@/lib/admin/parseWorkbook'

/**
 * Monthly refresh: drop in the updated DATA STORAGE workbook (and optionally
 * FINALRANKING for the "latest sports added" list). The file is read here in
 * the browser, previewed, then sent in batches and swapped in all at once.
 */
const BATCH = 2000
const PARALLEL = 4

interface Status { lastImport: { at: string; source: string; by?: string } | null; editsSinceImport: number }
interface Picked<T> { name: string; data: T }

async function readSheets(file: File, wanted: readonly string[]): Promise<Record<string, SheetRows> | null> {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(await file.arrayBuffer(), {
    type: 'array', sheets: [...wanted], cellFormula: false, cellHTML: false, cellText: false, cellStyles: false,
  })
  if (!wanted.every((s) => wb.SheetNames.includes(s))) return null
  const out: Record<string, SheetRows> = {}
  for (const name of wanted) {
    const ws = wb.Sheets[name]
    if (!ws?.['!ref']) { out[name] = []; continue }
    // Always read from A1 so column letters line up with the workbook (CATEGORIES starts at F).
    const end = XLSX.utils.decode_range(ws['!ref']).e
    out[name] = XLSX.utils.sheet_to_json<SheetRows[number]>(ws, {
      header: 1, raw: true, defval: null, blankrows: true,
      range: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: end }),
    })
  }
  return out
}

export default function UploadTab({ meta, onDone }: { meta: Meta; onDone: () => void }) {
  const [status, setStatus] = useState<Status | null>(null)
  const [storage, setStorage] = useState<Picked<ParsedStorage> | null>(null)
  const [final, setFinal] = useState<Picked<ParsedFinal> | null>(null)
  const [reading, setReading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmEdits, setConfirmEdits] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number; step: string } | null>(null)
  const [result, setResult] = useState<{ entries: number; final_rank: number; categories: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const countryNames = useMemo(() => new Set(meta.countries.map((c) => c.name)), [meta.countries])

  const loadStatus = () => api<Status>('/upload').then(setStatus).catch((e) => setError(e.message))
  useEffect(() => { loadStatus() }, [])

  async function handleFiles(files: FileList | File[]) {
    setError(null)
    setResult(null)
    setReading(true)
    try {
      for (const file of Array.from(files)) {
        if (!/\.xlsx$/i.test(file.name)) { setError(`${file.name} isn't an .xlsx file.`); continue }
        // Work out which workbook this is from its sheets, not its name.
        const s = await readSheets(file, STORAGE_SHEETS)
        if (s) {
          setStorage({ name: file.name, data: parseStorage({ byCountry: s['BY COUNTRY'], finalRank: s['FINAL RANK'], categories: s['CATEGORIES'] }, countryNames) })
          continue
        }
        const f = await readSheets(file, [FINAL_SHEET])
        if (f) { setFinal({ name: file.name, data: parseFinal(f[FINAL_SHEET]) }); continue }
        setError(`${file.name} doesn't look like the DATA STORAGE workbook (needs sheets ${STORAGE_SHEETS.join(', ')}) or FINALRANKING (needs “${FINAL_SHEET}”).`)
      }
    } catch (e) {
      setError(`Couldn't read the file: ${(e as Error).message}. If it's open in Excel, save and close it, then try again.`)
    } finally {
      setReading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const p = storage?.data
  const newYear = p && p.entries.length ? Math.max(...p.entries.map((e) => e.year)) : null
  const checks = p && final ? crossCheck(p, final.data) : []
  const blocked = !p || p.errors.length > 0 || (status?.editsSinceImport ?? 0) > 0 && !confirmEdits

  // Per-year comparison: what's live now vs what's in the file.
  const yearRows = useMemo(() => {
    if (!p) return []
    const next = new Map<number, { entries: number; points: number }>()
    for (const e of p.entries) {
      const y = next.get(e.year) ?? { entries: 0, points: 0 }
      y.entries += 1; y.points += e.points
      next.set(e.year, y)
    }
    const years = new Set([...next.keys(), ...meta.summary.map((s) => s.year)])
    return [...years].sort((a, b) => b - a).map((year) => {
      const cur = meta.summary.find((s) => s.year === year)
      const n = next.get(year)
      return { year, curEntries: cur?.entries ?? 0, newEntries: n?.entries ?? 0, curPoints: cur?.points ?? 0, newPoints: n?.points ?? 0 }
    })
  }, [p, meta.summary])

  async function upload() {
    if (!p) return
    setError(null)
    const batches: { kind: string; rows: unknown[] }[] = []
    const add = (kind: string, rows: unknown[]) => { for (let i = 0; i < rows.length; i += BATCH) batches.push({ kind, rows: rows.slice(i, i + BATCH) }) }
    add('categories', p.categories)
    add('finalRank', p.finalRank)
    add('entries', p.entries)
    try {
      setProgress({ done: 0, total: batches.length, step: 'Starting…' })
      const { importId } = await api<{ importId: string }>('/upload', { method: 'POST', json: {} })
      // A few batches in flight at once — order doesn't matter in staging.
      let next = 0, done = 0
      const worker = async () => {
        while (next < batches.length) {
          const b = batches[next++]
          await api('/upload/chunk', { method: 'POST', json: { importId, ...b } })
          setProgress({ done: ++done, total: batches.length, step: 'Sending rows…' })
        }
      }
      await Promise.all(Array.from({ length: PARALLEL }, worker))
      setProgress({ done: batches.length, total: batches.length, step: 'Replacing data…' })
      const res = await api<{ entries: number; final_rank: number; categories: number }>('/upload/commit', {
        method: 'POST',
        json: {
          importId,
          source: storage!.name,
          latestSports: final && newYear ? { year: newYear, sports: final.data.latestSports } : null,
        },
      })
      setResult(res)
      setStorage(null)
      setFinal(null)
      setConfirmEdits(false)
      loadStatus()
      onDone()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="space-y-5">
      {status && (
        <p className="text-sm text-gray-600">
          {status.lastImport
            ? <>Current data: <strong>{status.lastImport.source}</strong>, loaded {fmtDate(status.lastImport.at)}{status.lastImport.by ? ` by ${status.lastImport.by}` : ''}.</>
            : 'No data loaded yet.'}
        </p>
      )}

      {result && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          ✓ Done — {result.entries.toLocaleString()} entries, {result.final_rank.toLocaleString()} final-rank rows and {result.categories} sports are now live in the dashboard.
        </div>
      )}

      <Card title="Upload the updated workbook">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
          className={`rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${dragging ? 'border-wsr-blue bg-wsr-light' : 'border-gray-200'}`}
        >
          <p className="font-semibold text-wsr-navy">Drop the Excel file(s) here</p>
          <p className="text-sm text-gray-500 mt-1">
            <strong>DATA STORAGE &amp; ANALYSIS</strong> (required) — and optionally <strong>FINALRANKING</strong> to update the &ldquo;latest sports added&rdquo; list.
          </p>
          <input ref={inputRef} type="file" accept=".xlsx" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
          <Button className="mt-4" onClick={() => inputRef.current?.click()} disabled={reading || !!progress}>
            {reading ? 'Reading…' : 'Choose files'}
          </Button>
          <p className="text-xs text-gray-400 mt-3">The file is read on this computer; nothing changes until you press &ldquo;Replace data&rdquo;.</p>
        </div>
        <div className="mt-3 space-y-1 text-sm">
          {storage && <p>📗 {storage.name}</p>}
          {final && <p>📘 {final.name} <span className="text-gray-400">— {final.data.latestSports.length} latest sports</span></p>}
        </div>
        <div className="mt-3"><ErrorNote error={error} /></div>
      </Card>

      {p && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Entries" value={p.entries.length.toLocaleString()} sub={newYear ? `${Math.min(...p.entries.map((e) => e.year))}–${newYear}` : undefined} />
            <Stat label="Final rank rows" value={p.finalRank.length.toLocaleString()} />
            <Stat label="Sports" value={p.categories.length} />
            <Stat label="Latest sports" value={final ? final.data.latestSports.length : '—'} sub={final ? `for ${newYear}` : 'unchanged (no FINALRANKING file)'} />
          </div>

          {(p.errors.length > 0 || p.warnings.length > 0 || checks.length > 0) && (
            <Card title="Checks">
              <ul className="space-y-2 text-sm">
                {p.errors.map((m) => <li key={m} className="text-red-700">✕ {m}</li>)}
                {[...p.warnings, ...checks].map((m) => <li key={m} className="text-amber-800">⚠ {m}</li>)}
              </ul>
              {p.skipped.length > 0 && (
                <details className="mt-3 text-xs text-gray-600">
                  <summary className="cursor-pointer">Show skipped rows</summary>
                  <ul className="mt-2 space-y-0.5 font-mono">
                    {p.skipped.slice(0, 50).map((s) => <li key={`${s.sheet}${s.row}`}>{s.sheet} row {s.row}: {JSON.stringify(s.values)}</li>)}
                  </ul>
                </details>
              )}
            </Card>
          )}

          <Card title="What will change">
            <div className="overflow-x-auto -mx-5">
              <table className={tableCls}>
                <thead className={theadCls}>
                  <tr><Th>Year</Th><Th align="right">Entries now</Th><Th align="right">In file</Th><Th align="right">Change</Th><Th align="right" className="hidden sm:table-cell">Points now</Th><Th align="right" className="hidden sm:table-cell">In file</Th></tr>
                </thead>
                <tbody>
                  {yearRows.map((r) => {
                    const d = r.newEntries - r.curEntries
                    const changed = d !== 0 || Math.abs(r.newPoints - r.curPoints) > 0.01
                    return (
                      <tr key={r.year} className={`${rowCls} ${changed ? 'bg-amber-50/60' : ''}`}>
                        <td className={`${tdCls} font-semibold`}>{r.year}</td>
                        <td className={`${numCls} text-gray-500`}>{r.curEntries.toLocaleString()}</td>
                        <td className={numCls}>{r.newEntries.toLocaleString()}</td>
                        <td className={`${numCls} font-semibold ${d > 0 ? 'text-green-700' : d < 0 ? 'text-red-600' : 'text-gray-300'}`}>{d > 0 ? `+${d}` : d === 0 ? (changed ? 'edited' : '–') : d}</td>
                        <td className={`${numCls} text-gray-500 hidden sm:table-cell`}>{Math.round(r.curPoints).toLocaleString()}</td>
                        <td className={`${numCls} hidden sm:table-cell`}>{Math.round(r.newPoints).toLocaleString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            {(status?.editsSinceImport ?? 0) > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-4 space-y-2">
                <p>
                  <strong>{status!.editsSinceImport}</strong> change(s) were made in this dashboard since the last upload. Uploading replaces everything with
                  the Excel file, so those changes will be lost unless they&apos;re also in your workbook.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <LinkButton href={apiUrl('/entries', { format: 'csv' })}>Download current entries (CSV)</LinkButton>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={confirmEdits} onChange={(e) => setConfirmEdits(e.target.checked)} />
                    I understand — replace them
                  </label>
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                Replaces all dashboard data with <strong>{storage!.name}</strong>. The public website is not affected.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => { setStorage(null); setFinal(null) }} disabled={!!progress}>Cancel</Button>
                <Button variant="primary" onClick={upload} disabled={blocked || !!progress}>
                  {progress ? 'Uploading…' : 'Replace data'}
                </Button>
              </div>
            </div>
            {progress && (
              <div className="mt-4">
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-wsr-blue transition-all" style={{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{progress.step} ({progress.done}/{progress.total})</p>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
