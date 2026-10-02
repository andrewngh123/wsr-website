import { adminDb } from '@/lib/admin/db'
import { audit, badRequest, json, requireAdmin } from '@/lib/admin/guard'
import { getCategories, getCountries, getSetting, getYears, type LatestSports } from '@/lib/admin/data'

export const dynamic = 'force-dynamic'

/** Lookups for every dashboard dropdown, plus the overview numbers. */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const db = adminDb()
  const [years, categories, countries, latestSports, lastImport, summary, finalYears] = await Promise.all([
    getYears(),
    getCategories(),
    getCountries(),
    getSetting<LatestSports>('latest_sports'),
    getSetting<{ at: string; source: string; by?: string }>('last_import'),
    db.rpc('ds_year_summary').then((r) => r.data ?? []),
    db.from('ds_final_rank').select('year').order('year', { ascending: false }).limit(1)
      .then((r) => r.data?.[0]?.year ?? null),
  ])

  const entryYears = summary.map((r: any) => r.year as number)
  return json({
    user: auth,
    years,
    currentYear: entryYears.length ? Math.max(...entryYears) : null,
    latestFinalYear: finalYears,
    categories,
    countries,
    latestSports,
    lastImport,
    summary: summary.map((r: any) => ({ ...r, entries: Number(r.entries), sports: Number(r.sports), countries: Number(r.countries), points: Number(r.points) })),
  })
}

/** Update the "latest sports added" list (FINALRANKING column F). */
export async function PATCH(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await req.json().catch(() => null)
  const year = Number(body?.year)
  const sports: unknown = body?.sports
  if (!Number.isInteger(year) || !Array.isArray(sports) || sports.some((s) => typeof s !== 'string')) {
    return badRequest('Expected { year, sports: string[] }.')
  }
  const known = new Set((await getCategories()).map((c) => c.sport))
  const list = [...new Set((sports as string[]).map((s) => s.trim().toUpperCase()))]
  const unknown = list.filter((s) => !known.has(s))
  if (unknown.length) return badRequest(`Unknown sports: ${unknown.join(', ')}`)

  const before = await getSetting<LatestSports>('latest_sports')
  const value = { year, sports: list }
  const { error } = await adminDb().from('ds_settings')
    .upsert({ key: 'latest_sports', value, updated_at: new Date().toISOString() })
  if (error) return badRequest(error.message)
  await audit(auth, 'settings', 'ds_settings', 'latest_sports', before, value)
  return json({ ok: true, latestSports: value })
}
