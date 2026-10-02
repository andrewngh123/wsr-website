/**
 * Hidden-admin configuration. Everything comes from server-only env vars so
 * nothing that would locate or unlock the admin is in this (public) repo:
 *
 *   ADMIN_PATH            secret URL segment, e.g. "desk-4f9c2a7e1b" → /desk-4f9c2a7e1b
 *   ADMIN_SESSION_SECRET  ≥32 random chars used to sign session cookies
 *   SUPABASE_SERVICE_KEY  service_role key — reads/writes the private ds_* tables
 *
 * If any is missing the admin is simply switched off (every admin URL 404s).
 */

/** Internal route folder (app/wsr-admin). Never served directly — see middleware.ts. */
export const ADMIN_INTERNAL_PATH = '/wsr-admin'

/** The secret path segment, without slashes, or null when unset/unsafe. */
export function adminPath(): string | null {
  const p = (process.env.ADMIN_PATH ?? '').trim().replace(/^\/+|\/+$/g, '')
  // Require something non-guessable: one URL-safe segment, 12+ chars.
  return /^[A-Za-z0-9_-]{12,}$/.test(p) ? p : null
}

export function isAdminEnabled(): boolean {
  return Boolean(
    adminPath() &&
    (process.env.ADMIN_SESSION_SECRET ?? '').length >= 32 &&
    process.env.SUPABASE_SERVICE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  )
}
