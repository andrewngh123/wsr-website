'use client'

import { useMemo, useState } from 'react'
import type { RankedSport } from '@/lib/rankedSports'

type Filter = 'all' | 'multi' | 'single'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',    label: 'All sports' },
  { key: 'multi',  label: 'Multi-discipline' },
  { key: 'single', label: 'Single discipline' },
]

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// A sport whose only discipline is itself (e.g. Archery → Archery) has nothing
// extra to list, so its card shows a quiet note instead of a duplicate chip.
const isSingle = (s: RankedSport) => s.disciplines.length === 1 && s.disciplines[0] === s.sport

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
  const [query, setQuery]   = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const q = query.trim()

  const sorted = useMemo(
    () => [...sports].sort((a, b) => a.sport.localeCompare(b.sport)),
    [sports],
  )

  // Matches on the sport name or any of its disciplines
  const visible = useMemo(() => {
    const needle = q.toLowerCase()
    return sorted.filter((s) => {
      if (filter === 'multi' && isSingle(s)) return false
      if (filter === 'single' && !isSingle(s)) return false
      if (!needle) return true
      return s.sport.toLowerCase().includes(needle) ||
        s.disciplines.some((d) => d.toLowerCase().includes(needle))
    })
  }, [sorted, filter, q])

  const groups = useMemo(() => {
    const byLetter = new Map<string, RankedSport[]>()
    visible.forEach((s) => {
      const letter = s.sport[0].toUpperCase()
      byLetter.set(letter, [...(byLetter.get(letter) ?? []), s])
    })
    return Array.from(byLetter.entries())
  }, [visible])

  const letters = new Set(groups.map(([l]) => l))
  const disciplineCount = visible.reduce((n, s) => n + s.disciplines.length, 0)

  return (
    <div>
      {/* Toolbar — sticks under the navbar (h-16) while scrolling the list */}
      <div className="sticky top-16 z-30 -mx-4 px-4 py-4 bg-wsr-light/95 backdrop-blur border-b border-gray-200/70">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a sport or discipline — e.g. Futsal, BMX, Snooker…"
              aria-label="Search sports and disciplines"
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-wsr-accent/50 focus:border-wsr-accent"
            />
          </div>
          <div className="flex gap-1.5 bg-white border border-gray-200 rounded-xl p-1 shadow-sm overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === f.key ? 'bg-wsr-navy text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* A–Z jump bar */}
        <nav aria-label="Jump to letter" className="mt-3 flex flex-wrap gap-1">
          {ALPHABET.map((l) =>
            letters.has(l) ? (
              <a
                key={l}
                href={`#letter-${l}`}
                className="w-7 h-7 grid place-items-center rounded-md text-xs font-bold text-wsr-navy bg-white border border-gray-200 hover:bg-wsr-accent hover:border-wsr-accent hover:text-white transition-colors"
              >
                {l}
              </a>
            ) : (
              <span key={l} className="w-7 h-7 grid place-items-center rounded-md text-xs font-bold text-gray-300" aria-hidden>
                {l}
              </span>
            ),
          )}
        </nav>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 mt-5 mb-2">
        <p aria-live="polite">
          Showing <span className="font-semibold text-wsr-navy">{visible.length}</span> sports ·{' '}
          <span className="font-semibold text-wsr-navy">{disciplineCount}</span> disciplines
        </p>
        <p className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-wsr-accent" /> Ranked as a single discipline
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <p className="text-wsr-navy font-semibold">No sport or discipline matches “{q}”.</p>
          <button onClick={() => { setQuery(''); setFilter('all') }} className="mt-3 text-sm text-wsr-blue hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map(([letter, list]) => (
            // scroll-mt clears the navbar plus the sticky toolbar
            <section key={letter} id={`letter-${letter}`} className="scroll-mt-64 md:scroll-mt-48">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-extrabold text-wsr-accent leading-none">{letter}</span>
                <span className="h-px flex-1 bg-gradient-to-r from-wsr-accent/40 to-transparent" />
              </div>
              {/* Multi-discipline sports get a full card listing their disciplines */}
              {list.some((s) => !isSingle(s)) && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
                  {list.filter((s) => !isSingle(s)).map((s) => (
                    <article
                      key={s.sport}
                      className="group relative bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 hover:shadow-md hover:ring-wsr-accent/40 transition-all overflow-hidden"
                    >
                      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-wsr-navy via-wsr-blue to-wsr-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-wsr-navy leading-snug">
                          <Highlight text={s.sport} query={q} />
                        </h3>
                        <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums bg-wsr-navy text-white">
                          {s.disciplines.length} disciplines
                        </span>
                      </div>
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {s.disciplines.map((d) => {
                          const hit = q && d.toLowerCase().includes(q.toLowerCase())
                          return (
                            <li
                              key={d}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                hit
                                  ? 'border-wsr-accent bg-wsr-accent/10 text-wsr-navy font-semibold'
                                  : 'border-gray-200 bg-wsr-light text-gray-600'
                              }`}
                            >
                              <Highlight text={d} query={q} />
                            </li>
                          )
                        })}
                      </ul>
                    </article>
                  ))}
                </div>
              )}

              {/* Single-discipline sports collapse into compact tiles */}
              {list.some(isSingle) && (
                <ul className={`grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${list.some((s) => !isSingle(s)) ? 'mt-4' : ''}`}>
                  {list.filter(isSingle).map((s) => (
                    <li
                      key={s.sport}
                      className="flex items-center gap-2.5 bg-white rounded-xl px-4 py-3 ring-1 ring-gray-100 shadow-sm hover:ring-wsr-accent/40 transition-all"
                      title="Ranked as a single discipline"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-wsr-accent shrink-0" />
                      <span className="text-sm font-semibold text-wsr-navy truncate">
                        <Highlight text={s.sport} query={q} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
