'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import CountryFlag from '@/components/CountryFlag'
import RankChange from '@/components/RankChange'

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
    description: 'World Ranking of Countries in Elite Sport — the primary comprehensive ranking.',
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

// ── Fallback data (2025, top-206 from CSV) ────────────────────────────────────
// This is used if Supabase is not yet connected.
// Once you connect Supabase the live data replaces this automatically.
const FALLBACK_DATA: Row[] = [
  { rank: 1,   country_code:'USA', country_name:'USA',                   iso_2:'us', continent_code:'AM', points:2129375, change:null   },
  { rank: 2,   country_code:'GBR', country_name:'GREAT BRITAIN',          iso_2:'gb', continent_code:'EU', points:1303155, change:'+1'  },
  { rank: 3,   country_code:'FRA', country_name:'FRANCE',                 iso_2:'fr', continent_code:'EU', points:1293343, change:'-1'  },
  { rank: 4,   country_code:'ITA', country_name:'ITALY',                  iso_2:'it', continent_code:'EU', points:1131761, change:null   },
  { rank: 5,   country_code:'JPN', country_name:'JAPAN',                  iso_2:'jp', continent_code:'AS', points:984970,  change:null   },
  { rank: 6,   country_code:'AUS', country_name:'AUSTRALIA',              iso_2:'au', continent_code:'OC', points:924743,  change:'+3'  },
  { rank: 7,   country_code:'CHN', country_name:'CHINA',                  iso_2:'cn', continent_code:'AS', points:922625,  change:'-1'  },
  { rank: 8,   country_code:'ESP', country_name:'SPAIN',                  iso_2:'es', continent_code:'EU', points:896420,  change:'-1'  },
  { rank: 9,   country_code:'GER', country_name:'GERMANY',                iso_2:'de', continent_code:'EU', points:857681,  change:'-1'  },
  { rank: 10,  country_code:'BRA', country_name:'BRAZIL',                 iso_2:'br', continent_code:'AM', points:742828,  change:null   },
  { rank: 11,  country_code:'CAN', country_name:'CANADA',                 iso_2:'ca', continent_code:'AM', points:671755,  change:'+1'  },
  { rank: 12,  country_code:'KOR', country_name:'SOUTH KOREA',            iso_2:'kr', continent_code:'AS', points:643059,  change:'-1'  },
  { rank: 13,  country_code:'NED', country_name:'NETHERLANDS',            iso_2:'nl', continent_code:'EU', points:552234,  change:null   },
  { rank: 14,  country_code:'POL', country_name:'POLAND',                 iso_2:'pl', continent_code:'EU', points:538208,  change:'+8'  },
  { rank: 15,  country_code:'ARG', country_name:'ARGENTINA',              iso_2:'ar', continent_code:'AM', points:533742,  change:'-1'  },
  { rank: 16,  country_code:'IND', country_name:'INDIA',                  iso_2:'in', continent_code:'AS', points:528391,  change:null   },
  { rank: 17,  country_code:'CZE', country_name:'CZECH REPUBLIC',         iso_2:'cz', continent_code:'EU', points:485559,  change:'+1'  },
  { rank: 18,  country_code:'NZL', country_name:'NEW ZEALAND',            iso_2:'nz', continent_code:'OC', points:483901,  change:'-3'  },
  { rank: 19,  country_code:'BEL', country_name:'BELGIUM',                iso_2:'be', continent_code:'EU', points:474879,  change:'+4'  },
  { rank: 20,  country_code:'DEN', country_name:'DENMARK',                iso_2:'dk', continent_code:'EU', points:469564,  change:'+5'  },
]

export default function RankingsPage() {
  const [activeTab, setActiveTab]     = useState<RankingType>('wrces')
  const [continent, setContinent]     = useState('all')
  const [year, setYear]               = useState(2025)
  const [search, setSearch]           = useState('')
  const [rows, setRows]               = useState<Row[]>(FALLBACK_DATA)
  const [loading, setLoading]         = useState(false)

  // Available years — extend this list as new ranking years are added
  const availableYears = [2025, 2024, 2023, 2022]

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const tableMap: Record<RankingType, string> = {
        wrces: 'wrces_rankings',
        wfcr:  'wfcr_rankings',
        wspi:  'wspi_rankings',
        merit: 'merit_rankings',
      }

      let query = supabase
        .from(tableMap[activeTab])
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
        setRows(FALLBACK_DATA)
      }
    } catch {
      setRows(FALLBACK_DATA)
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
      <div className="bg-wsr-navy text-white py-12 px-4 text-center">
        <h1 className="text-3xl font-extrabold mb-2">World Sports Rankings</h1>
        <p className="text-white/60 text-sm max-w-xl mx-auto">{activeTabInfo.description}</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

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
            value={year}
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No results found.
                  </td>
                </tr>
              ) : filtered.map((row) => (
                <tr key={row.country_code} className="ranking-row">
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
