/**
 * Small presentational helpers with no external dependencies — safe to import
 * into client components without pulling in the Supabase client.
 */

// ─────────────────────────────────────────────────────────────────────────────
//  👇 THE ONLY LINE YOU NEED TO CHANGE WHEN A FINAL RANKING IS RELEASED  👇
//
//  Set this to the most recent year whose ranking is OFFICIAL / FINAL.
//  (Finals can be released in December, before the year actually ends.)
//
//  • Years up to and including this number show as  "<year> Final Ranking"
//  • Any later year (the current in-progress season) shows as "<year> Provisional Ranking"
//
//  Example: when the 2026 final ranking is released, change 2025 to 2026.
// ─────────────────────────────────────────────────────────────────────────────
export const LATEST_FINAL_YEAR = 2025

/**
 * Returns whether a given ranking year should be labelled "Final" or
 * "Provisional", based on LATEST_FINAL_YEAR above.
 */
export function rankingStatus(year: number): 'Provisional' | 'Final' {
  return year <= LATEST_FINAL_YEAR ? 'Final' : 'Provisional'
}
