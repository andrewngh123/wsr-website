'use client'

import { useMemo, useState } from 'react'
import type { RankedSport } from '@/lib/rankedSports'

/** Wraps the part of `text` matching `query` in a gold highlight. */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-wsr-accent/25 text-inherit rounded-sm px-0.5">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  )
}

export default function RankedSportsExplorer({ sports }: { sports: RankedSport[] }) {
  const [query, setQuery] = useState('')
  const q = query.trim()

  // Matches on the sport name or any of its disciplines
  const visible = useMemo(() => {
    const needle = q.toLowerCase()
    if (!needle) return sports
    return sports.filter((s) =>
      s.sport.toLowerCase().includes(needle) ||
      s.disciplines.some((d) => d.toLowerCase().includes(needle)),
    )
  }, [sports, q])

  return (
    <div>
      <div className="relative mb-4">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a sport or discipline…"
          aria-label="Search sports and disciplines"
          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-wsr-accent/50 focus:border-wsr-accent"
        />
      </div>

      <div className="bg-white rounded-2xl shadow ring-1 ring-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-wsr-navy text-white text-xs uppercase tracking-wider border-b-4 border-wsr-accent">
            <tr>
              <th className="px-4 sm:px-6 py-3.5 text-left font-semibold w-[38%] sm:w-1/3">Sports</th>
              <th className="px-4 sm:px-6 py-3.5 text-left font-semibold">Disciplines</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 sm:px-6 py-12 text-center text-gray-400">
                  No sport or discipline matches “{q}”.
                </td>
              </tr>
            ) : visible.map((s) => (
              <tr key={s.sport} className="odd:bg-white even:bg-slate-50 hover:bg-slate-100 transition-colors border-b border-gray-50 last:border-0 align-top">
                <td className="px-4 sm:px-6 py-3 font-bold text-wsr-navy">
                  <Highlight text={s.sport} query={q} />
                </td>
                <td className="px-4 sm:px-6 py-3 text-gray-600 leading-relaxed">
                  {s.disciplines.map((d, i) => (
                    <span key={d}>
                      {i > 0 && ', '}
                      <Highlight text={d} query={q} />
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs text-gray-400 mt-4" aria-live="polite">
        Showing {visible.length} of {sports.length} sports
      </p>
    </div>
  )
}
