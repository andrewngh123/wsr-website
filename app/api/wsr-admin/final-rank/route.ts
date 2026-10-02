import { adminDb } from '@/lib/admin/db'
import { audit, badRequest, json, requireAdmin } from '@/lib/admin/guard'
import { getFinalRankYear, getStandings, validateFinalRank } from '@/lib/admin/data'

export const dynamic = 'force-dynamic'

/**
 * FINAL RANK for one year, with each country's total recomputed from its
 * entries alongside — so drift after an edit is visible (`entries_points`).
 */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const year = Number(new URL(req.url).searchParams.get('year'))
  if (!Number.isInteger(year)) return badRequest('year is required')
  const [rows, standings] = await Promise.all([getFinalRankYear(year), getStandings(year)])
  const totals = new Map(standings.map((s) => [s.country, s]))
  return json({
    year,
    rows: rows.map((r) => ({
      ...r,
      entries_points: totals.get(r.country)?.points ?? 0,
      entries_rank: totals.get(r.country)?.rank ?? null,
    })),
  })
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const v = await validateFinalRank(await req.json().catch(() => null))
  if (!v.ok) return badRequest(v.error)
  const { data, error } = await adminDb().from('ds_final_rank').insert(v.value).select().single()
  if (error) {
    return badRequest(error.code === '23505' ? `${v.value.country} already has a ${v.value.year} final rank — edit that row instead.` : error.message)
  }
  await audit(auth, 'create', 'ds_final_rank', data.id, null, data)
  return json({ row: data }, 201)
}
