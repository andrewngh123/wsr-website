import { NextResponse } from 'next/server'
import { adminPath, isAdminEnabled } from '@/lib/admin/config'
import { adminDb } from '@/lib/admin/db'
import { dummyHash, verifyPassword } from '@/lib/admin/password'
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/admin/session'
import { notFound, sameOrigin } from '@/lib/admin/guard'

export const dynamic = 'force-dynamic'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15
const GENERIC_ERROR = 'Incorrect username or password.'

export async function POST(req: Request) {
  // Only usable from the secret admin page: same origin + it must echo the secret path.
  if (!isAdminEnabled() || !sameOrigin(req) || req.headers.get('x-admin-path') !== adminPath()) {
    return notFound()
  }

  let body: { username?: unknown; password?: unknown }
  try { body = await req.json() } catch { return notFound() }
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!username || !password || password.length > 512) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
  }

  const db = adminDb()
  const { data: user } = await db.from('admin_users')
    .select('id, username, display_name, password_hash, token_version, failed_attempts, locked_until')
    .eq('username', username).maybeSingle()

  if (!user) {
    await verifyPassword(password, await dummyHash()) // equalise timing
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return NextResponse.json({ error: `Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.` }, { status: 429 })
  }

  if (!(await verifyPassword(password, user.password_hash))) {
    const attempts = (user.failed_attempts ?? 0) + 1
    const lock = attempts >= MAX_ATTEMPTS
    await db.from('admin_users').update({
      failed_attempts: lock ? 0 : attempts,
      locked_until: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null,
    }).eq('id', user.id)
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
  }

  await db.from('admin_users')
    .update({ failed_attempts: 0, locked_until: null, last_login_at: new Date().toISOString() })
    .eq('id', user.id)

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id, user.token_version), sessionCookieOptions())
  return res
}
