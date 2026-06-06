/**
 * Data-fetching helpers for WSR rankings.
 *
 * All functions query Supabase tables that mirror the CSV files in /databasefiles/.
 * Each function is async and can be called directly from Next.js Server Components.
 *
 * Tables expected in Supabase:
 *   - countries       (code, name, iso_2, iso_3, continent_code)
 *   - continents      (code, name)
 *   - wrces_rankings  (id, year, rank, country_code, points, change)
 *   - wfcr_rankings   (id, year, rank, country_code, points, change)
 *   - wspi_rankings   (id, year, rank, country_code, points, change)
 *   - merit_rankings  (id, year, rank, country_code, points, change)
 */

import { supabase, isSupabaseConfigured } from './supabase'

export type RankingType = 'wrces' | 'wfcr' | 'wspi' | 'merit'

export interface RankingRow {
  rank: number
  country_code: string
  country_name: string
  iso_2: string
  continent_code: string
  points: number
  change: string | null
}

export interface CountrySummary {
  code: string
  name: string
  iso_2: string
  continent_code: string
}

// Map ranking type to Supabase table name
const TABLE: Record<RankingType, string> = {
  wrces:  'wrces_rankings',
  wfcr:   'wfcr_rankings',
  wspi:   'wspi_rankings',
  merit:  'merit_rankings',
}

/**
 * Fetch a full ranking table for a given type and year.
 * Optionally filter by continent code.
 */
export async function getRankings(
  type: RankingType,
  year: number,
  continent?: string,
): Promise<RankingRow[]> {
  if (!isSupabaseConfigured) return []

  let query = supabase
    .from(TABLE[type])
    .select(`
      rank,
      country_code,
      points,
      change,
      countries!inner ( name, iso_2, continent_code )
    `)
    .eq('year', year)
    .order('rank', { ascending: true })

  if (continent && continent !== 'all') {
    query = query.eq('countries.continent_code', continent)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data ?? []).map((row: any) => ({
    rank:           row.rank,
    country_code:   row.country_code,
    country_name:   row.countries?.name ?? row.country_code,
    iso_2:          row.countries?.iso_2 ?? '',
    continent_code: row.countries?.continent_code ?? '',
    points:         row.points,
    change:         row.change ?? null,
  }))
}

/**
 * Fetch the latest available year for a ranking type.
 */
export async function getLatestYear(type: RankingType): Promise<number> {
  if (!isSupabaseConfigured) return new Date().getFullYear() - 1

  const { data, error } = await supabase
    .from(TABLE[type])
    .select('year')
    .order('year', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return new Date().getFullYear() - 1
  return data.year
}

/**
 * Fetch all available years for a ranking type (for the year dropdown).
 */
export async function getAvailableYears(type: RankingType): Promise<number[]> {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from(TABLE[type])
    .select('year')
    .order('year', { ascending: false })

  if (error || !data) return []
  const years = [...new Set(data.map((r: any) => r.year as number))]
  return years
}

/**
 * Counts for the homepage stat chips: number of countries and the number of
 * distinct ranking years (so "12 years" becomes "13" automatically when a new
 * season is added). Falls back to sensible defaults if the DB is unavailable.
 */
export async function getHomeStats(): Promise<{ countries: number; years: number }> {
  if (!isSupabaseConfigured) return { countries: 206, years: 12 }
  try {
    const { count } = await supabase
      .from('countries')
      .select('*', { count: 'exact', head: true })

    // Distinct ranking years — paginate, since Supabase caps each request.
    const seen = new Set<number>()
    const PAGE = 1000
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('wrces_rankings')
        .select('year')
        .order('year', { ascending: false })
        .range(from, from + PAGE - 1)
      if (error || !data || data.length === 0) break
      data.forEach((r: { year: number }) => seen.add(r.year))
      if (data.length < PAGE) break
    }
    return { countries: count ?? 206, years: seen.size || 12 }
  } catch {
    return { countries: 206, years: 12 }
  }
}

/**
 * Fetch all continents for the filter dropdown.
 */
export async function getContinents(): Promise<{ code: string; name: string }[]> {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('continents')
    .select('code, name')
    .order('name')

  if (error || !data) return []
  return data
}

/**
 * Fetch a single country's data across all rankings for the most recent year.
 */
export async function getCountryProfile(iso2: string): Promise<{
  country: CountrySummary | null
  rankings: Record<RankingType, RankingRow | null>
}> {
  if (!isSupabaseConfigured) {
    return {
      country: null,
      rankings: { wrces: null, wfcr: null, wspi: null, merit: null },
    }
  }

  // Get country info
  const { data: countryData } = await supabase
    .from('countries')
    .select('code, name, iso_2, continent_code')
    .ilike('iso_2', iso2)
    .single()

  const country: CountrySummary | null = countryData ?? null
  const rankings: Record<RankingType, RankingRow | null> = {
    wrces: null, wfcr: null, wspi: null, merit: null,
  }

  if (!country) return { country, rankings }

  // Fetch this country's latest row in each ranking
  for (const type of ['wrces', 'wfcr', 'wspi', 'merit'] as RankingType[]) {
    const latestYear = await getLatestYear(type)
    const { data } = await supabase
      .from(TABLE[type])
      .select('rank, country_code, points, change')
      .eq('country_code', country.code)
      .eq('year', latestYear)
      .single()

    if (data) {
      rankings[type] = {
        rank: data.rank,
        country_code: data.country_code,
        country_name: country.name,
        iso_2: country.iso_2,
        continent_code: country.continent_code,
        points: data.points,
        change: data.change,
      }
    }
  }

  return { country, rankings }
}

/**
 * Get the top N countries for the homepage preview.
 */
export async function getTopCountries(
  type: RankingType = 'wrces',
  year: number,
  limit = 5,
): Promise<RankingRow[]> {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from(TABLE[type])
    .select(`
      rank, country_code, points, change,
      countries!inner ( name, iso_2, continent_code )
    `)
    .eq('year', year)
    .order('rank', { ascending: true })
    .limit(limit)

  if (error) return []

  return (data ?? []).map((row: any) => ({
    rank:           row.rank,
    country_code:   row.country_code,
    country_name:   row.countries?.name ?? row.country_code,
    iso_2:          row.countries?.iso_2 ?? '',
    continent_code: row.countries?.continent_code ?? '',
    points:         row.points,
    change:         row.change ?? null,
  }))
}
