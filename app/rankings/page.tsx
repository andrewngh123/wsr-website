'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import CountryFlag from '@/components/CountryFlag'
import RankChange from '@/components/RankChange'
import PageHeader from '@/components/PageHeader'
import { rankingStatus } from '@/lib/format'

// ── Types ────────────────────────────────────────────────────────────────────
type RankingType = 'wrces' | 'wfcr' | 'wspi' | 'merit'

interface Row {
  rank: number
  country_code: string
  country_name: string
  iso_2: string
  continent_code: string
  points: number
  change: string | null
}

// ── Ranking tab config ────────────────────────────────────────────────────────
const RANKING_TABS: { key: RankingType; label: string; description: string }[] = [
  {
    key: 'wrces',
    label: 'WRCES',
    description: 'World Ranking of Countries in Elite Sport — the only research based index measuring national teams’ performances in all the sports.',
  },
  {
    key: 'wfcr',
    label: 'WFCR',
    description: "World's Fittest Countries Ranking — measures overall national fitness.",
  },
  {
    key: 'wspi',
    label: 'WSPI',
    description: "World Sports Power Index — ranks countries' geopolitical sports power.",
  },
  {
    key: 'merit',
    label: 'WRCES Merit',
    description: 'Merit ranking for countries punching above their weight.',
  },
]

const CONTINENT_OPTIONS = [
  { code: 'all', name: 'All Continents' },
  { code: 'AF', name: 'Africa' },
  { code: 'AM', name: 'Americas' },
  { code: 'AS', name: 'Asia' },
  { code: 'EU', name: 'Europe' },
  { code: 'OC', name: 'Oceania' },
]

// Supabase table backing each ranking type
const TABLE_MAP: Record<RankingType, string> = {
  wrces: 'wrces_rankings',
  wfcr:  'wfcr_rankings',
  wspi:  'wspi_rankings',
  merit: 'merit_rankings',
}

export default function RankingsPage() {
  const [activeTab, setActiveTab]     = useState<RankingType>('wrces')
  const [continent, setContinent]     = useState('all')
  const [year, setYear]               = useState<number | null>(null)
  const [search, setSearch]           = useState('')
  const [rows, setRows]               = useState<Row[]>([])
  const [loading, setLoading]         = useState(false)
  const [availableYears, setAvailableYears] = useState<number[]>([])

  // Load the available years FOR THE ACTIVE RANKING TABLE. Each ranking has its
  // own set of years (e.g. only WRCES has 2026 so far), so this re-runs whenever
  // the ranking tab changes. Keeps the current year if it still exists in the
  // new table, otherwise jumps to that ranking's newest year.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        const seen = new Set<number>()
        const PAGE = 1000
        for (let from = 0; ; from += PAGE) {
          const { data, error } = await supabase
            .from(TABLE_MAP[activeTab])
            .select('year')
            .order('year', { ascending: false })
            .range(from, from + PAGE - 1)
          if (error || !data || data.length === 0) break
          data.forEach((r: { year: number }) => seen.add(r.year))
          if (data.length < PAGE) break
        }
        if (cancelled) return
        const yrs = Array.from(seen).sort((a, b) => b - a)
        setAvailableYears(yrs)
        setYear((prev) => (prev != null && yrs.includes(prev)) ? prev : (yrs[0] ?? null))
      } catch {
        if (!cancelled) { setAvailableYears([]); setYear(null) }
      }
    })()
    return () => { cancelled = true }
  }, [activeTab])

  // Pre-fill the search box from the ?q=... param passed by the homepage search.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q')
    if (q) setSearch(q)
  }, [])

  const fetchData = useCallback(async () => {
    if (year == null) return
    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')

      let query = supabase
        .from(TABLE_MAP[activeTab])
        .select('rank, country_code, points, change, countries!inner(name, iso_2, continent_code)')
        .eq('year', year)
        .order('rank', { ascending: true })

      if (continent !== 'all') {
        query = query.eq('countries.continent_code', continent)
      }

      const { data, error } = await query
      if (!error && data && data.length > 0) {
        setRows(data.map((r: any) => ({
          rank:           r.rank,
          country_code:   r.country_code,
          country_name:   r.countries?.name ?? r.country_code,
          iso_2:          r.countries?.iso_2 ?? '',
          continent_code: r.countries?.continent_code ?? '',
          points:         r.points,
          change:         r.change ?? null,
        })))
      } else {
        setRows([])
      }
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [activeTab, continent, year])

  useEffect(() => { fetchData() }, [fetchData])

  // Client-side search filter
  const filtered = rows.filter((r) =>
    r.country_name.toLowerCase().includes(search.toLowerCase()) ||
    r.country_code.toLowerCase().includes(search.toLowerCase())
  )

  const activeTabInfo = RANKING_TABS.find((t) => t.key === activeTab)!

  return (
    <div className="min-h-screen bg-wsr-light">
      {/* Page header */}
      <PageHeader title="World Sports Rankings" subtitle={activeTabInfo.description} bg="/design/headers/athletics.webp" />

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Ranking type tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {RANKING_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-wsr-navy text-white shadow'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          {/* Year */}
          <select
            value={year ?? ''}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white text-gray-700 shadow-sm"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Continent */}
          <select
            value={continent}
            onChange={(e) => setContinent(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white text-gray-700 shadow-sm"
          >
            {CONTINENT_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country…"
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white text-gray-700 shadow-sm flex-1 min-w-[160px]"
          />

          {loading && <span className="text-xs text-gray-400 italic">Loading…</span>}
        </div>

        {/* Ranking title — "Provisional" for the current season, else "Final" */}
        {year != null && (
          <h2 className="text-xl font-bold text-wsr-navy mb-4">
            {year} {rankingStatus(year)} Ranking
          </h2>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left w-14">Rank</th>
                <th className="px-6 py-3 text-left w-10">Flag</th>
                <th className="px-6 py-3 text-left">Country</th>
                <th className="px-6 py-3 text-right">Points</th>
                <th className="px-6 py-3 text-center w-20">Change</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No results found for this ranking and year.
                  </td>
                </tr>
              ) : filtered.map((row) => (
                <tr key={row.country_code} className="odd:bg-white even:bg-slate-50 hover:bg-slate-100 transition-colors border-b border-gray-50 last:border-0">
                  <td className="px-6 py-3 font-bold text-wsr-navy">{row.rank}</td>
                  <td className="px-6 py-3">
                    <CountryFlag iso2={row.iso_2} name={row.country_name} />
                  </td>
                  <td className="px-6 py-3">
                    <Link
                      href={`/countries/${row.iso_2.toLowerCase()}`}
                      className="text-wsr-blue font-medium hover:underline"
                    >
                      {row.country_name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-gray-700">
                    {Number(row.points).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <RankChange change={row.change} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Showing {filtered.length} of {rows.length} countries
        </p>
      </div>
    </div>
  )
}
