/**
 * Small presentational helpers with no external dependencies — safe to import
 * into client components without pulling in the Supabase client.
 */

/**
 * A ranking year is "Provisional" while it is still the current (unfinished)
 * season — i.e. the year hasn't ended yet — and "Final" once it's in the past.
 * e.g. during 2026 → "2026 Provisional Ranking"; in 2027 → "2026 Final Ranking".
 */
export function rankingStatus(year: number): 'Provisional' | 'Final' {
  return year >= new Date().getFullYear() ? 'Provisional' : 'Final'
}
