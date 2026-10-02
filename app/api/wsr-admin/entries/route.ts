import { adminDb, fetchAllRows } from '@/lib/admin/db'
import { audit, badRequest, json, requireAdmin } from '@/lib/admin/guard'
import { getCategories, validateEntry, type Entry } from '@/lib/admin/data'
import { csvResponse, toCsv } from '@/lib/admin/csv'

export const dynamic = 'force-dynamic'

const SORTABLE = new Set(['year', 'sport', 'rank', 'country', 'points', 'updated_at'])
const COLUMNS = 'id, year, sport, rank, country, country_code, points, updated_at, updated_by'

/**
 * Search the full history ("BY COUNTRY" table).
 *   ?country=LEBANON   exact canonical name     ?q=leb   partial country match
 *   ?sport=FOOTBALL    ?type=TEAM               ?year=2024 | ?yearFrom=&yearTo=
 *   ?sort=points&dir=desc&page=1&pageSize=50    ?format=csv  (all matching rows)
 */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const p = new URL(req.url).searchParams
  let typeSports: string[] | null = null
  const type = p.get('type')
  if (type) typeSports = (await getCategories()).filter((c) => c.type === type).map((c) => c.sport)

  const sort = SORTABLE.has(p.get('sort') ?? '') ? p.get('sort')! : 'year'
  const asc = p.get('dir') === 'asc'

  const build = (count: boolean) => {
    let q = adminDb().from('ds_entries').select(COLUMNS, count ? { count: 'exact' } : undefined)
    const country = p.get('country'), search = p.get('q'), sport = p.get('sport')
    const year = Number(p.get('year')), from = Number(p.get('yearFrom')), to = Number(p.get('yearTo'))
    if (country) q = q.eq('country', country)
    if (search) q = q.ilike('country', `%${search.replace(/[\\%_]/g, (m) => `\\${m}`)}%`)
    if (sport) q = q.eq('sport', sport)
    if (typeSports) q = q.in('sport', typeSports)
    if (year) q = q.eq('year', year)
    if (from) q = q.gte('year', from)
    if (to) q = q.lte('year', to)
    q = q.order(sort, { ascending: asc })
    // Stable secondary order: within a year/sport, show rank order.
    if (sort !== 'rank') q = q.order('sport').order('rank')
    return q.order('id')
  }

  if (p.get('format') === 'csv') {
    const rows = await fetchAllRows<Entry>((from, to) => build(false).range(from, to))
    const type = new Map((await getCategories()).map((c) => [c.sport, c.type]))
    return csvResponse(
      `wsr-entries-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(['Year', 'SPORT', 'RANK', 'COUNTRY', 'POINTS', 'TYPE', 'CODE'],
        rows.map((r) => [r.year, r.sport, r.rank, r.country, r.points, type.get(r.sport) ?? '', r.country_code])),
    )
  }

  const pageSize = Math.min(Math.max(Number(p.get('pageSize')) || 50, 10), 200)
  const page = Math.max(Number(p.get('page')) || 1, 1)
  const start = (page - 1) * pageSize
  const { data, count, error } = await build(true).range(start, start + pageSize - 1)
  if (error) return badRequest(error.message)
  return json({ rows: data ?? [], total: count ?? 0, page, pageSize })
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const v = await validateEntry(await req.json().catch(() => null))
  if (!v.ok) return badRequest(v.error)
  const { data, error } = await adminDb().from('ds_entries')
    .insert({ ...v.value, updated_by: auth.username }).select(COLUMNS).single()
  if (error) return badRequest(error.message)
  await audit(auth, 'create', 'ds_entries', data.id, null, data)
  return json({ row: data }, 201)
}
