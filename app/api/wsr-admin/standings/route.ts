import { badRequest, json, requireAdmin } from '@/lib/admin/guard'
import { getStandingsWithDifference } from '@/lib/admin/data'

export const dynamic = 'force-dynamic'

/** Live combined standings for a year (FINALRANKING "Final Ranking" + "difference"). */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const year = Number(new URL(req.url).searchParams.get('year'))
  if (!Number.isInteger(year)) return badRequest('year is required')
  return json(await getStandingsWithDifference(year))
}
