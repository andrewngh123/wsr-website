import { adminDb } from '@/lib/admin/db'
import { badRequest, json, requireAdmin } from '@/lib/admin/guard'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { data, error } = await adminDb().from('ds_audit_log')
    .select('id, at, username, action, table_name, record_id, before, after')
    .order('at', { ascending: false }).limit(200)
  if (error) return badRequest(error.message)
  return json({ rows: data ?? [] })
}
