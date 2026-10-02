import { adminDb } from '@/lib/admin/db'
import { badRequest, json, requireAdmin } from '@/lib/admin/guard'

export const dynamic = 'force-dynamic'

/**
 * "Upload Excel" — step 3: swap the staged rows into the live ds_* tables in a
 * single transaction (ds_commit_import). If anything fails, nothing changes.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await req.json().catch(() => null)
  if (typeof body?.importId !== 'string') return badRequest('importId is required')
  const source = typeof body?.source === 'string' ? body.source.slice(0, 200) : 'upload'

  let latest: { year: number; sports: string[] } | null = null
  if (body?.latestSports != null) {
    const { year, sports } = body.latestSports
    if (!Number.isInteger(year) || !Array.isArray(sports) || sports.some((s: unknown) => typeof s !== 'string')) {
      return badRequest('latestSports must be { year, sports: string[] }')
    }
    latest = { year, sports: sports.map((s: string) => s.trim().toUpperCase()) }
  }

  const { data, error } = await adminDb().rpc('ds_commit_import', {
    p_import: body.importId, p_username: auth.username, p_source: source, p_latest_sports: latest,
  })
  if (error) return badRequest(`Upload not applied — the existing data is unchanged. ${error.message}`)
  return json({ ok: true, ...data })
}
