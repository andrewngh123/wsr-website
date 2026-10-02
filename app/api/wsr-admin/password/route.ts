import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/admin/db'
import { audit, badRequest, requireAdmin } from '@/lib/admin/guard'
import { hashPassword, verifyPassword } from '@/lib/admin/password'
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/admin/session'

export const dynamic = 'force-dynamic'

const MIN_LENGTH = 12
const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

/**
 * Change your own password: { current, next }. Requires the current password
 * (wrong guesses count towards the login lockout), then bumps token_version so
 * every other session is signed out — this browser gets a fresh cookie.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await req.json().catch(() => null)
  const current = typeof body?.current === 'string' ? body.current : ''
  const next = typeof body?.next === 'string' ? body.next : ''
  if (next.length < MIN_LENGTH) return badRequest(`The new password must be at least ${MIN_LENGTH} characters.`)
  if (next.length > 512) return badRequest('The new password is too long.')
  if (next === current) return badRequest('The new password must be different from the current one.')

  const db = adminDb()
  const { data: user } = await db.from('admin_users')
    .select('id, password_hash, token_version, failed_attempts, locked_until')
    .eq('id', auth.id).single()
  if (!user) return badRequest('Account not found.')

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return badRequest(`Too many wrong attempts. Try again in ${LOCK_MINUTES} minutes.`)
  }
  if (!(await verifyPassword(current, user.password_hash))) {
    const attempts = (user.failed_attempts ?? 0) + 1
    const lock = attempts >= MAX_ATTEMPTS
    await db.from('admin_users').update({
      failed_attempts: lock ? 0 : attempts,
      locked_until: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null,
    }).eq('id', user.id)
    return badRequest('Your current password is incorrect.')
  }

  const tokenVersion = user.token_version + 1
  const { error } = await db.from('admin_users').update({
    password_hash: await hashPassword(next),
    token_version: tokenVersion,
    failed_attempts: 0,
    locked_until: null,
  }).eq('id', user.id)
  if (error) return badRequest(error.message)

  await audit(auth, 'password', 'admin_users', auth.id, null, null)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id, tokenVersion), sessionCookieOptions())
  return res
}
