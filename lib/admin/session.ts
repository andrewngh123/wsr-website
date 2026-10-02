import 'server-only'
import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { adminDb } from './db'
import { isAdminEnabled } from './config'

/**
 * Stateless signed session cookie: base64url(JSON payload) + "." + HMAC-SHA256.
 * The payload carries the user's token_version, which is re-checked against the
 * database on every request — bumping it (password reset, "log out everywhere")
 * kills existing sessions immediately.
 */
export const SESSION_COOKIE = 'wsr_admin_session'
export const SESSION_MAX_AGE = 12 * 60 * 60 // seconds

interface Payload { uid: number; v: number; exp: number }

export interface AdminUser {
  id: number
  username: string
  display_name: string
}

function sign(data: string): string {
  return createHmac('sha256', process.env.ADMIN_SESSION_SECRET!).update(data).digest('base64url')
}

export function createSessionToken(uid: number, tokenVersion: number): string {
  const payload: Payload = { uid, v: tokenVersion, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

function readToken(token: string | undefined): Payload | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = Buffer.from(sign(body))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString()) as Payload
    return typeof p.uid === 'number' && p.exp > Date.now() / 1000 ? p : null
  } catch {
    return null
  }
}

/** The logged-in admin for this request, or null. */
export async function getAdminUser(): Promise<AdminUser | null> {
  if (!isAdminEnabled()) return null
  const payload = readToken(cookies().get(SESSION_COOKIE)?.value)
  if (!payload) return null
  const { data } = await adminDb()
    .from('admin_users')
    .select('id, username, display_name, token_version')
    .eq('id', payload.uid)
    .maybeSingle()
  if (!data || data.token_version !== payload.v) return null
  return { id: data.id, username: data.username, display_name: data.display_name }
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge,
  }
}
