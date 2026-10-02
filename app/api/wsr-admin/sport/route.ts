import { adminDb, fetchAllRows } from '@/lib/admin/db'
import { json, requireAdmin } from '@/lib/admin/guard'
import { getSportPivot, type Entry } from '@/lib/admin/data'

export const dynamic = 'force-dynamic'

/**
 * "BY SPORT" pivot — per-country total points + entry count for a sport and/or
 * year (either may be omitted = "(All)"). With no sport it also returns a
 * sport-by-sport comparison for the year; for a single sport it returns
 * the year-by-year rank matrix and the raw entry list (with real ranks).
 */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const p = new URL(req.url).searchParams
  const sport = p.get('sport') || null
  const year = Number(p.get('year')) || null
  const pivot = await getSportPivot(sport, year)

  if (!sport) {
    const { data } = await adminDb().rpc('ds_sport_summary', { p_year: year })
    const sports = (data ?? []).map((r: any) => ({
      sport: r.sport, type: r.type, entries: Number(r.entries), countries: Number(r.countries),
      points: Number(r.points), leader: r.leader,
    }))
    return json({ sport, year, pivot, sports })
  }

  const entries = await fetchAllRows<Entry>((from, to) =>
    adminDb().from('ds_entries').select('id, year, sport, rank, country, country_code, points')
      .eq('sport', sport).order('year').order('rank').order('id').range(from, to))

  // Rank matrix: country → year → best rank that year (duplicates keep the better one).
  const years = [...new Set(entries.map((e) => e.year))].sort((a, b) => a - b)
  const matrix = new Map<string, Record<number, number>>()
  for (const e of entries) {
    const row = matrix.get(e.country) ?? {}
    row[e.year] = Math.min(row[e.year] ?? Infinity, e.rank)
    matrix.set(e.country, row)
  }

  return json({
    sport, year, pivot, years,
    matrix: [...matrix.entries()].map(([country, ranks]) => ({ country, ranks })),
    entries: year ? entries.filter((e) => e.year === year).map((e) => ({ ...e, points: Number(e.points) })) : [],
  })
}
