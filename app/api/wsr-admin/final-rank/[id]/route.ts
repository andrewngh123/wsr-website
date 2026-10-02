import { adminDb } from '@/lib/admin/db'
import { audit, badRequest, json, notFound, requireAdmin } from '@/lib/admin/guard'
import { validateFinalRank } from '@/lib/admin/data'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const db = adminDb()
  const { data: before } = await db.from('ds_final_rank').select().eq('id', params.id).maybeSingle()
  if (!before) return badRequest('That row no longer exists.')
  const v = await validateFinalRank(await req.json().catch(() => null))
  if (!v.ok) return badRequest(v.error)
  const { data, error } = await db.from('ds_final_rank').update(v.value).eq('id', params.id).select().single()
  if (error) return badRequest(error.code === '23505' ? 'Another row already exists for that country and year.' : error.message)
  await audit(auth, 'update', 'ds_final_rank', params.id, before, data)
  return json({ row: data })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const db = adminDb()
  const { data: before } = await db.from('ds_final_rank').select().eq('id', params.id).maybeSingle()
  if (!before) return notFound()
  const { error } = await db.from('ds_final_rank').delete().eq('id', params.id)
  if (error) return badRequest(error.message)
  await audit(auth, 'delete', 'ds_final_rank', params.id, before, null)
  return json({ ok: true })
}
