import { randomUUID } from 'crypto'
import { adminDb } from '@/lib/admin/db'
import { badRequest, json, requireAdmin } from '@/lib/admin/guard'
import { getSetting } from '@/lib/admin/data'

export const dynamic = 'force-dynamic'

/**
 * "Upload Excel" — step 0/1.
 *   GET  → when the data was last imported + how many dashboard edits an
 *          upload would overwrite.
 *   POST → start an upload: returns an importId for the chunk/commit calls,
 *          and clears staging rows left behind by abandoned uploads.
 */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const lastImport = await getSetting<{ at: string; source: string; by?: string }>('last_import')
  let q = adminDb().from('ds_audit_log').select('id', { count: 'exact', head: true }).neq('action', 'import')
  if (lastImport?.at) q = q.gt('at', lastImport.at)
  const { count, error } = await q
  if (error) return badRequest(error.message)
  return json({ lastImport, editsSinceImport: count ?? 0 })
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const db = adminDb()
  const stale = new Date(Date.now() - 6 * 3600_000).toISOString()
  await Promise.all(['ds_import_entries', 'ds_import_final_rank', 'ds_import_categories']
    .map((t) => db.from(t).delete().lt('created_at', stale)))
  return json({ importId: randomUUID() })
}
