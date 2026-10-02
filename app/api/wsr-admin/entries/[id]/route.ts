import { adminDb } from '@/lib/admin/db'
import { audit, badRequest, json, notFound, requireAdmin } from '@/lib/admin/guard'
import { validateEntry } from '@/lib/admin/data'

export const dynamic = 'force-dynamic'

const COLUMNS = 'id, year, sport, rank, country, country_code, points, updated_at, updated_by'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const db = adminDb()
  const { data: before } = await db.from('ds_entries').select(COLUMNS).eq('id', params.id).maybeSingle()
  if (!before) return badRequest('That entry no longer exists.')

  const v = await validateEntry(await req.json().catch(() => null))
  if (!v.ok) return badRequest(v.error)
  const { data, error } = await db.from('ds_entries')
    .update({ ...v.value, updated_by: auth.username, updated_at: new Date().toISOString() })
    .eq('id', params.id).select(COLUMNS).single()
  if (error) return badRequest(error.message)
  await audit(auth, 'update', 'ds_entries', params.id, before, data)
  return json({ row: data })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const db = adminDb()
  const { data: before } = await db.from('ds_entries').select(COLUMNS).eq('id', params.id).maybeSingle()
  if (!before) return notFound()
  const { error } = await db.from('ds_entries').delete().eq('id', params.id)
  if (error) return badRequest(error.message)
  await audit(auth, 'delete', 'ds_entries', params.id, before, null)
  return json({ ok: true })
}
