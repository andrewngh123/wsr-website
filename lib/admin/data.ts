import 'server-only'
import { adminDb, fetchAllRows } from './db'

/**
 * Data helpers for the admin dashboard — the server-side equivalents of the
 * pivot tables and formulas in "DATA STORAGE & ANALYSIS" / "FINALRANKING".
 * All read the private ds_* tables via the service-role client.
 */

export type SportType = 'IND' | 'TEAM' | 'PART'

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
}

export interface Country { code: string; name: string; iso_2: string | null; continent_code: string | null }
export interface Category { sport: string; type: SportType; note: string | null }

export interface StandingRow {
  rank: number
  country: string
  country_code: string | null
  points: number
  sports: number
}

/** Excel RANK(): ties share a rank and the next rank is skipped (1, 2, 2, 4). */
export function competitionRank<T extends { points: number }>(rows: T[]): (T & { rank: number })[] {
  const sorted = [...rows].sort((a, b) => b.points - a.points)
  let prevPoints = NaN, prevRank = 0
  return sorted.map((r, i) => {
    const rank = r.points === prevPoints ? prevRank : i + 1
    prevPoints = r.points
    prevRank = rank
    return { ...r, rank }
  })
}

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v ?? 0)
}

// ── Lookups ──────────────────────────────────────────────────────────────────
export async function getCountries(): Promise<Country[]> {
  const { data, error } = await adminDb().from('ds_countries')
    .select('code, name, iso_2, continent_code').order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await adminDb().from('ds_categories').select('sport, type, note').order('sport')
  if (error) throw new Error(error.message)
  return (data ?? []) as Category[]
}

export async function getYears(): Promise<number[]> {
  const { data, error } = await adminDb().rpc('ds_years')
  if (error) throw new Error(error.message)
  return (data ?? []).map((y: number | { ds_years: number }) => (typeof y === 'number' ? y : y.ds_years))
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const { data } = await adminDb().from('ds_settings').select('value').eq('key', key).maybeSingle()
  return (data?.value as T) ?? null
}

export interface LatestSports { year: number; sports: string[] }

// ── Standings (FINALRANKING "Final Ranking" sheet) ────────────────────────────
export async function getStandings(year: number, exclude: string[] = []): Promise<StandingRow[]> {
  const { data, error } = await adminDb().rpc('ds_standings', { p_year: year, p_exclude: exclude })
  if (error) throw new Error(error.message)
  return competitionRank((data ?? []).map((r: any) => ({
    country: r.country, country_code: r.country_code, points: num(r.points), sports: num(r.sports),
  })))
}

/**
 * Standings plus the "difference" sheet: each country's rank before vs after
 * the latest sports were added.
 */
export async function getStandingsWithDifference(year: number) {
  const latest = await getSetting<LatestSports>('latest_sports')
  const latestSports = latest && latest.year === year ? latest.sports : []
  const [after, before] = await Promise.all([
    getStandings(year),
    latestSports.length ? getStandings(year, latestSports) : Promise.resolve(null),
  ])
  const beforeRank = new Map(before?.map((r) => [r.country, r.rank]) ?? [])
  const rows = after.map((r) => ({
    ...r,
    rank_before: before ? beforeRank.get(r.country) ?? null : null,
  }))
  const sportsIncluded = await countSports(year)
  return { year, rows, latestSports, sportsIncluded }
}

async function countSports(year: number): Promise<number> {
  const { data } = await adminDb().rpc('ds_year_summary')
  const row = (data ?? []).find((r: any) => r.year === year)
  return row ? num(row.sports) : 0
}

// ── Final rank (archival) ─────────────────────────────────────────────────────
export async function getFinalRankYear(year: number): Promise<FinalRankRow[]> {
  const { data, error } = await adminDb().from('ds_final_rank')
    .select('id, year, rank, country, country_code, points, progress')
    .eq('year', year).order('rank').order('country')
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({ ...r, points: num(r.points) }))
}

/** Rebuild one year's FINAL RANK from its entries (rank by summed points; progress vs previous year). */
export async function computeFinalRank(year: number) {
  const [standings, prev] = await Promise.all([getStandings(year), getFinalRankYear(year - 1)])
  const prevRank = new Map(prev.map((r) => [r.country, r.rank]))
  return standings
    .filter((s) => s.sports > 0)
    .map((s) => {
      const before = prevRank.get(s.country)
      const progress = prev.length === 0 ? '-'
        : before == null ? 'NEW'
        : before === s.rank ? '-'
        : String(before - s.rank)
      return { year, rank: s.rank, country: s.country, country_code: s.country_code, points: s.points, progress }
    })
}

// ── Country history ───────────────────────────────────────────────────────────
export async function getCountryEntries(country: string): Promise<Entry[]> {
  const rows = await fetchAllRows<Entry>((from, to) =>
    adminDb().from('ds_entries')
      .select('id, year, sport, rank, country, country_code, points')
      .eq('country', country)
      .order('year', { ascending: false }).order('points', { ascending: false }).order('id')
      .range(from, to))
  return rows.map((r) => ({ ...r, points: num(r.points) }))
}

export async function getCountryHistory(country: string) {
  const [entries, finalRes, years] = await Promise.all([
    getCountryEntries(country),
    adminDb().from('ds_final_rank')
      .select('id, year, rank, country, country_code, points, progress')
      .eq('country', country).order('year'),
    getYears(),
  ])
  if (finalRes.error) throw new Error(finalRes.error.message)
  const finalRank = (finalRes.data ?? []).map((r) => ({ ...r, points: num(r.points) })) as FinalRankRow[]

  // Years with entries but no archived final rank (the current provisional
  // season) get their rank computed live, like FINALRANKING does.
  const archived = new Set(finalRank.map((r) => r.year))
  const liveYears = years.filter((y) => !archived.has(y) && entries.some((e) => e.year === y))
  const provisional = await Promise.all(liveYears.map(async (y) => {
    const s = (await getStandings(y)).find((r) => r.country === country)
    return s ? { year: y, rank: s.rank, points: s.points, provisional: true } : null
  }))

  // Pivot "BY COUNTRY": per year → per sport PTS, % of total, avg rank, # entries
  const byYear = new Map<number, Map<string, { points: number; rankSum: number; count: number }>>()
  for (const e of entries) {
    const sports = byYear.get(e.year) ?? new Map()
    const cell = sports.get(e.sport) ?? { points: 0, rankSum: 0, count: 0 }
    cell.points += e.points
    cell.rankSum += e.rank
    cell.count += 1
    sports.set(e.sport, cell)
    byYear.set(e.year, sports)
  }
  const breakdown = [...byYear.entries()].sort((a, b) => b[0] - a[0]).map(([year, sports]) => {
    const total = [...sports.values()].reduce((s, c) => s + c.points, 0)
    return {
      year,
      total,
      sports: [...sports.entries()]
        .map(([sport, c]) => ({
          sport, points: c.points, share: total ? c.points / total : 0,
          avg_rank: c.rankSum / c.count, entries: c.count,
        }))
        .sort((a, b) => b.points - a.points),
    }
  })

  const trend = [
    ...finalRank.map((r) => ({ year: r.year, rank: r.rank, points: r.points, provisional: false })),
    ...provisional.filter((p): p is NonNullable<typeof p> => p != null),
  ].sort((a, b) => a.year - b.year)

  return { country, entries, finalRank, trend, breakdown }
}

// ── Sport pivot ("BY SPORT") ──────────────────────────────────────────────────
export async function getSportPivot(sport: string | null, year: number | null) {
  const { data, error } = await adminDb().rpc('ds_sport_pivot', { p_sport: sport, p_year: year })
  if (error) throw new Error(error.message)
  return competitionRank((data ?? []).map((r: any) => ({
    country: r.country, country_code: r.country_code, points: num(r.points),
    entries: num(r.entries), avg_rank: num(r.avg_rank), best_rank: num(r.best_rank),
  })))
}

// ── Validation for edits ─────────────────────────────────────────────────────
export type Validated<T> = { ok: true; value: T } | { ok: false; error: string }

function intIn(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  return typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max ? n : null
}

function finiteNum(v: unknown): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

async function resolveCountry(name: unknown): Promise<Country | null> {
  if (typeof name !== 'string' || !name.trim()) return null
  const { data } = await adminDb().from('ds_countries')
    .select('code, name, iso_2, continent_code').eq('name', name.trim().toUpperCase()).maybeSingle()
  return data ?? null
}

export async function validateEntry(body: any): Promise<Validated<Omit<Entry, 'id'>>> {
  const year = intIn(body?.year, 1900, 2100)
  if (year == null) return { ok: false, error: 'Year must be a whole number (e.g. 2026).' }
  const rank = intIn(body?.rank, 1, 100000)
  if (rank == null) return { ok: false, error: 'Rank must be a whole number of 1 or more.' }
  const points = finiteNum(body?.points)
  if (points == null || points < 0) return { ok: false, error: 'Points must be a number of 0 or more.' }
  const sport = typeof body?.sport === 'string' ? body.sport.trim().toUpperCase() : ''
  const { data: cat } = await adminDb().from('ds_categories').select('sport').eq('sport', sport).maybeSingle()
  if (!cat) return { ok: false, error: `Unknown sport "${sport}". Pick one from the list.` }
  const country = await resolveCountry(body?.country)
  if (!country) return { ok: false, error: 'Country must be one of the 206 names in COUNTRIESLIST.' }
  return { ok: true, value: { year, sport, rank, points, country: country.name, country_code: country.code } }
}

export async function validateFinalRank(body: any): Promise<Validated<Omit<FinalRankRow, 'id'>>> {
  const year = intIn(body?.year, 1900, 2100)
  if (year == null) return { ok: false, error: 'Year must be a whole number.' }
  const rank = intIn(body?.rank, 1, 100000)
  if (rank == null) return { ok: false, error: 'Rank must be a whole number of 1 or more.' }
  const points = finiteNum(body?.points)
  if (points == null || points < 0) return { ok: false, error: 'Points must be a number of 0 or more.' }
  const progressRaw = body?.progress == null ? '-' : String(body.progress).trim().toUpperCase()
  if (!/^(-|NEW|[+-]?\d+)$/.test(progressRaw)) return { ok: false, error: 'Progress must be "-", "NEW" or a whole number.' }
  const progress = progressRaw.replace(/^\+/, '')
  const country = await resolveCountry(body?.country)
  if (!country) return { ok: false, error: 'Country must be one of the 206 names in COUNTRIESLIST.' }
  return { ok: true, value: { year, rank, points, progress, country: country.name, country_code: country.code } }
}
