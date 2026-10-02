/**
 * Reads the DATA STORAGE / FINALRANKING workbooks into rows — the browser-side
 * twin of scripts/import_admin_data.py (same sheets, columns and clean-up
 * rules; keep them in step). Pure: takes sheets as arrays of rows, so it runs
 * in the browser (Upload Excel tab) and in Node alike.
 */
import ALIASES_JSON from './countryAliases.json'

type Cell = string | number | boolean | null | undefined
export type SheetRows = Cell[][]

const ALIASES: Record<string, string> = Object.fromEntries(
  Object.entries(ALIASES_JSON as Record<string, string>).filter(([k]) => !k.startsWith('_')),
)

export interface UploadCategory { sport: string; type: string; note: string | null }
export interface UploadEntry { year: number; sport: string; rank: number; country: string; points: number }
export interface UploadFinalRank { year: number; rank: number; country: string; points: number; progress: string | null }

export interface ParsedStorage {
  categories: UploadCategory[]
  entries: UploadEntry[]
  finalRank: UploadFinalRank[]
  skipped: { sheet: string; row: number; values: Cell[] }[]
  unmatched: Record<string, number>
  /** Blocking — the upload can't go ahead. */
  errors: string[]
  /** Worth a look, but the upload can go ahead. */
  warnings: string[]
}

export interface ParsedFinal {
  latestSports: string[]
  sportsIncluded: number | null
  /** canonical country → points in the "Final Ranking" sheet (cross-check only) */
  snapshot: Map<string, number>
}

export const STORAGE_SHEETS = ['BY COUNTRY', 'FINAL RANK', 'CATEGORIES'] as const
export const FINAL_SHEET = 'Final Ranking'

const clean = (v: Cell) => String(v ?? '').trim().split(/\s+/).join(' ').toUpperCase()

function toInt(v: Cell): number | null {
  if (v == null || v === '') return null
  const n = Number(String(v).trim())
  return Number.isFinite(n) ? Math.trunc(n) : null
}

function toNum(v: Cell): number | null {
  if (v == null || v === '' || typeof v === 'boolean') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

export function canonicalCountry(raw: Cell): string {
  const name = clean(raw)
  return ALIASES[name] ?? name
}

export function parseStorage(
  sheets: { byCountry: SheetRows; finalRank: SheetRows; categories: SheetRows },
  countryNames: Set<string>,
): ParsedStorage {
  const errors: string[] = []
  const warnings: string[] = []
  const skipped: ParsedStorage['skipped'] = []
  const unmatched: Record<string, number> = {}
  const resolve = (raw: Cell) => {
    const name = canonicalCountry(raw)
    if (!countryNames.has(name)) unmatched[name] = (unmatched[name] ?? 0) + 1
    return name
  }

  // CATEGORIES: columns F (sport), G (type), H (optional note)
  const categories: UploadCategory[] = []
  for (const r of sheets.categories) {
    if (!r[5] || !r[6]) continue
    categories.push({ sport: clean(r[5]), type: clean(r[6]), note: r[7] ? String(r[7]).trim() : null })
  }
  const badTypes = categories.filter((c) => !['IND', 'TEAM', 'PART'].includes(c.type))
  if (badTypes.length) errors.push(`CATEGORIES: unknown type for ${badTypes.map((c) => `${c.sport} (“${c.type}”)`).join(', ')} — must be IND, TEAM or PART.`)
  const dupCats = categories.map((c) => c.sport).filter((s, i, a) => a.indexOf(s) !== i)
  if (dupCats.length) errors.push(`CATEGORIES: sport listed twice: ${[...new Set(dupCats)].join(', ')}.`)

  // BY COUNTRY: columns A–E (Year, SPORT, RANK, COUNTRY, POINTS), header in row 1.
  const entries: UploadEntry[] = []
  sheets.byCountry.slice(1).forEach((r, i) => {
    const [y, s, rk, c, p] = r
    if ([y, s, rk, c, p].every((v) => v == null || v === '')) return
    const year = toInt(y), rank = toInt(rk), points = toNum(p)
    if (year == null || !s || rank == null || !c || points == null) {
      skipped.push({ sheet: 'BY COUNTRY', row: i + 2, values: r.slice(0, 5) })
      return
    }
    entries.push({ year, sport: clean(s), rank, country: resolve(c), points })
  })

  // FINAL RANK: columns A–E (year, rank, country, points, progress)
  const finalRank: UploadFinalRank[] = []
  sheets.finalRank.slice(1).forEach((r, i) => {
    const [y, rk, c, p, prog] = r
    if (y == null || y === '') return
    const year = toInt(y), rank = toInt(rk), points = toNum(p)
    if (year == null || rank == null || !c || points == null) {
      skipped.push({ sheet: 'FINAL RANK', row: i + 2, values: r.slice(0, 5) })
      return
    }
    finalRank.push({ year, rank, country: resolve(c), points, progress: prog == null || prog === '' ? null : String(prog).trim() })
  })

  if (entries.length === 0) errors.push('BY COUNTRY: no rows found — is this the DATA STORAGE workbook?')
  if (finalRank.length === 0) errors.push('FINAL RANK: no rows found.')
  if (categories.length === 0) errors.push('CATEGORIES: no sports found.')

  const catNames = new Set(categories.map((c) => c.sport))
  const missing = [...new Set(entries.map((e) => e.sport))].filter((s) => !catNames.has(s))
  if (missing.length) errors.push(`BY COUNTRY uses sports missing from CATEGORIES: ${missing.join(', ')}. Add them to CATEGORIES first.`)

  const seen = new Map<string, number>()
  for (const f of finalRank) {
    const k = `${f.year}|${f.country}`
    seen.set(k, (seen.get(k) ?? 0) + 1)
  }
  const dupFinal = [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k.replace('|', ' '))
  if (dupFinal.length) errors.push(`FINAL RANK: country listed twice in the same year: ${dupFinal.slice(0, 8).join(', ')}${dupFinal.length > 8 ? '…' : ''}.`)

  if (skipped.length) warnings.push(`${skipped.length} row(s) skipped because a value is missing or not a number.`)
  const unknown = Object.keys(unmatched)
  if (unknown.length) warnings.push(`Names not in COUNTRIESLIST (kept, but without a flag/code): ${unknown.map((n) => `${n} (${unmatched[n]})`).join(', ')}. If one is a typo, fix it in Excel or add it to lib/admin/countryAliases.json.`)

  return { categories, entries, finalRank, skipped, unmatched, errors, warnings }
}

export function parseFinal(rows: SheetRows): ParsedFinal {
  const latestSports: string[] = []
  let sportsIncluded: number | null = null
  const snapshot = new Map<string, number>()
  for (const r of rows.slice(1)) {
    const pts = toNum(r[2])
    if (r[1] && pts != null) snapshot.set(canonicalCountry(r[1]), pts)
    if (r[5]) latestSports.push(clean(r[5]))
    if (r[6] != null && r[6] !== '' && sportsIncluded == null) sportsIncluded = toInt(r[6])
  }
  return { latestSports, sportsIncluded, snapshot }
}

/** Cross-check FINALRANKING against the current year's BY COUNTRY entries. */
export function crossCheck(storage: ParsedStorage, final: ParsedFinal): string[] {
  const out: string[] = []
  const year = Math.max(...storage.entries.map((e) => e.year))
  const cur = storage.entries.filter((e) => e.year === year)
  const sports = new Set(cur.map((e) => e.sport)).size
  if (final.sportsIncluded != null && final.sportsIncluded !== sports) {
    out.push(`FINALRANKING says ${final.sportsIncluded} sports are included, but BY COUNTRY has ${sports} sports for ${year}.`)
  }
  const totals = new Map<string, number>()
  for (const e of cur) totals.set(e.country, (totals.get(e.country) ?? 0) + e.points)
  const drift = [...final.snapshot.entries()].filter(([c, p]) => Math.abs(p - (totals.get(c) ?? 0)) > 0.01)
  if (drift.length) {
    out.push(`${drift.length} countries' ${year} totals differ between FINALRANKING and BY COUNTRY (e.g. ${drift.slice(0, 3).map(([c, p]) => `${c} ${p.toFixed(2)} vs ${(totals.get(c) ?? 0).toFixed(2)}`).join('; ')}). Is FINALRANKING up to date?`)
  }
  const catNames = new Set(storage.categories.map((c) => c.sport))
  const badLatest = final.latestSports.filter((s) => !catNames.has(s))
  if (badLatest.length) out.push(`Latest-sports list has sports not in CATEGORIES: ${badLatest.join(', ')}.`)
  return out
}
