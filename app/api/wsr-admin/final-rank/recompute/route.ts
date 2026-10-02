import { adminDb } from '@/lib/admin/db'
import { audit, badRequest, json, requireAdmin } from '@/lib/admin/guard'
import { computeFinalRank, getFinalRankYear } from '@/lib/admin/data'

export const dynamic = 'force-dynamic'

/**
 * Rebuild a year's FINAL RANK from its entries: total = sum of the country's
 * sport points (exactly how the archived totals were produced), rank = Excel
 * RANK(), progress = change vs the previous year's final rank.
 *   { year, preview: true }  → returns the new table without saving
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await req.json().catch(() => null)
  const year = Number(body?.year)
  if (!Number.isInteger(year)) return badRequest('year is required')

  const [rows, before] = await Promise.all([computeFinalRank(year), getFinalRankYear(year)])
  if (rows.length === 0) return badRequest(`There are no ${year} entries to compute from.`)
  if (body?.preview) {
    const old = new Map(before.map((r) => [r.country, r]))
    const changed = rows.filter((r) => {
      const o = old.get(r.country)
      return !o || o.rank !== r.rank || Math.abs(o.points - r.points) > 0.005
    }).length
    return json({ year, rows, changed, removed: before.filter((b) => !rows.some((r) => r.country === b.country)).length })
  }

  const db = adminDb()
  const del = await db.from('ds_final_rank').delete().eq('year', year)
  if (del.error) return badRequest(del.error.message)
  const ins = await db.from('ds_final_rank').insert(rows)
  if (ins.error) {
    // Put the old rows back so the year is never left empty.
    await db.from('ds_final_rank').insert(before.map(({ id, ...r }) => r))
    return badRequest(ins.error.message)
  }
  await audit(auth, 'recompute', 'ds_final_rank', String(year), { rows: before.length }, { rows: rows.length })
  return json({ ok: true, year, rows: rows.length })
}
