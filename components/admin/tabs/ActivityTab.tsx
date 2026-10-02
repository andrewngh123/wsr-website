'use client'

import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Empty, ErrorNote, fmtDate, Loading, rowCls, tableCls, tdCls, Th, theadCls } from '../ui'

interface LogRow {
  id: number
  at: string
  username: string
  action: string
  table_name: string
  record_id: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}

const TABLE_LABEL: Record<string, string> = {
  ds_entries: 'Entry', ds_final_rank: 'Final rank', ds_settings: 'Setting', 'ds_*': 'All data',
}
const FIELDS = ['year', 'sport', 'rank', 'country', 'points', 'progress']

function describe(r: LogRow): string {
  const row = r.after ?? r.before
  if (r.action === 'import') return `Loaded ${r.after?.source ?? 'workbook'} (${r.after?.entries ?? '?'} entries, ${r.after?.final_rank ?? '?'} final-rank rows)`
  if (r.action === 'recompute') return `Rebuilt ${r.record_id} final ranking from entries (${r.before?.rows ?? '?'} → ${r.after?.rows ?? '?'} rows)`
  if (r.table_name === 'ds_settings') return `Latest sports ${r.after ? `set to ${((r.after as { sports?: string[] }).sports ?? []).join(', ') || 'none'}` : 'cleared'}`
  if (!row) return ''
  const label = [row.year, row.sport, row.country].filter(Boolean).join(' · ')
  if (r.action === 'update' && r.before && r.after) {
    const changes = FIELDS.filter((f) => String(r.before![f] ?? '') !== String(r.after![f] ?? ''))
      .map((f) => `${f} ${r.before![f] ?? '—'} → ${r.after![f] ?? '—'}`)
    return `${label}: ${changes.join(', ') || 'no field changes'}`
  }
  return `${label} · #${row.rank} · ${row.points} pts`
}

const ACTION_STYLE: Record<string, string> = {
  create: 'bg-green-50 text-green-700', update: 'bg-blue-50 text-blue-700', delete: 'bg-red-50 text-red-700',
  recompute: 'bg-amber-50 text-amber-700', settings: 'bg-gray-100 text-gray-600', import: 'bg-violet-50 text-violet-700',
}

/** Who changed what — the last 200 dashboard changes. */
export default function ActivityTab() {
  const [rows, setRows] = useState<LogRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { api<{ rows: LogRow[] }>('/activity').then((d) => setRows(d.rows)).catch((e) => setError(e.message)) }, [])

  return (
    <Card title="Recent activity">
      <ErrorNote error={error} />
      {!rows && !error ? <Loading /> : rows && rows.length === 0 ? <Empty>No changes yet.</Empty> : rows && (
        <div className="overflow-x-auto -mx-5">
          <table className={tableCls}>
            <thead className={theadCls}><tr><Th>When</Th><Th>Who</Th><Th>Action</Th><Th>Details</Th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={rowCls}>
                  <td className={`${tdCls} whitespace-nowrap text-gray-500 text-xs`}>{fmtDate(r.at)}</td>
                  <td className={`${tdCls} font-medium capitalize`}>{r.username}</td>
                  <td className={tdCls}>
                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${ACTION_STYLE[r.action] ?? 'bg-gray-100 text-gray-600'}`}>
                      {r.action}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">{TABLE_LABEL[r.table_name] ?? r.table_name}</span>
                  </td>
                  <td className={`${tdCls} text-gray-700`}>{describe(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
