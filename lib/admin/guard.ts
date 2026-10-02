import 'server-only'
import { NextResponse } from 'next/server'
import { getAdminUser, type AdminUser } from './session'
import { adminDb } from './db'

/**
 * Every admin API route starts with:
 *
 *   const auth = await requireAdmin(req)
 *   if (auth instanceof Response) return auth
 *
 * Unauthenticated requests get a plain 404 — the API doesn't admit to existing.
 * State-changing requests must also come from this site (Origin check), on top
 * of the SameSite=Strict cookie, as CSRF protection.
 */
export function notFound() {
  return new NextResponse('Not Found', { status: 404, headers: { 'X-Robots-Tag': 'noindex, nofollow' } })
}

export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function requireAdmin(req: Request): Promise<AdminUser | Response> {
  if (req.method !== 'GET' && !sameOrigin(req)) return notFound()
  const user = await getAdminUser()
  return user ?? notFound()
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } })
}

export function badRequest(message: string) {
  return json({ error: message }, 400)
}

/** Record a dashboard change. Never throws — a failed log must not undo an edit. */
export async function audit(
  user: AdminUser, action: string, table: string, recordId: string | number | null,
  before: unknown, after: unknown,
) {
  try {
    await adminDb().from('ds_audit_log').insert({
      username: user.username, action, table_name: table,
      record_id: recordId == null ? null : String(recordId),
      before: before ?? null, after: after ?? null,
    })
  } catch { /* ignore */ }
}
