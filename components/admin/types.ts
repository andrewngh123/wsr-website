/** Shapes returned by /api/wsr-admin/* (see lib/admin/data.ts). */
export type SportType = 'IND' | 'TEAM' | 'PART'

export interface Country { code: string; name: string; iso_2: string | null; continent_code: string | null }
export interface Category { sport: string; type: SportType; note: string | null }

export interface Meta {
  user: { id: number; username: string; display_name: string }
  years: number[]
  currentYear: number | null
  latestFinalYear: number | null
  categories: Category[]
  countries: Country[]
  latestSports: { year: number; sports: string[] } | null
  lastImport: { at: string; source: string; by?: string } | null
  summary: { year: number; entries: number; sports: number; countries: number; points: number }[]
}

export interface Entry {
  id: number
  year: number
  sport: string
  rank: number
  country: string
  country_code: string | null
  points: number
  updated_at?: string
  updated_by?: string | null
}

export interface FinalRankRow {
  id: number
  year: number
  rank: number
  country: string
  country_code: string | null
  points: number
  progress: string | null
  entries_points?: number
  entries_rank?: number | null
}

export type Tab = 'standings' | 'final' | 'country' | 'sport' | 'entries' | 'upload' | 'activity'

/** Cross-tab navigation, e.g. clicking a country anywhere opens its history. */
export interface Nav {
  openCountry: (country: string) => void
  openSport: (sport: string, year?: number | null) => void
  openEntries: (filters: Partial<EntryFilters>) => void
}

export interface EntryFilters {
  q: string
  country: string
  sport: string
  type: string
  year: string
}
