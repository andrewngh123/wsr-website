import { NextResponse, type NextRequest } from 'next/server'

/**
 * Hidden admin routing.
 *
 * The admin UI lives in app/wsr-admin, but it is only reachable through the
 * secret path in the ADMIN_PATH env var (set in Vercel, never committed — this
 * repo is public). /<ADMIN_PATH> is rewritten to /wsr-admin; requesting
 * /wsr-admin directly returns the normal 404 page. With ADMIN_PATH unset the
 * admin is switched off entirely.
 *
 * (Duplicates adminPath()/ADMIN_INTERNAL_PATH from lib/admin/config.ts, since
 * middleware runs on the edge runtime and must stay import-light.)
 */
const INTERNAL = '/wsr-admin'

function secretPath(): string | null {
  const p = (process.env.ADMIN_PATH ?? '').trim().replace(/^\/+|\/+$/g, '')
  return /^[A-Za-z0-9_-]{12,}$/.test(p) ? `/${p}` : null
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const secret = secretPath()

  if (secret && (pathname === secret || pathname === `${secret}/`)) {
    const url = req.nextUrl.clone()
    url.pathname = INTERNAL
    const res = NextResponse.rewrite(url)
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    res.headers.set('Cache-Control', 'no-store')
    res.headers.set('Referrer-Policy', 'no-referrer') // don't leak the secret URL to flag CDNs etc.
    return res
  }

  if (pathname === INTERNAL || pathname.startsWith(`${INTERNAL}/`)) {
    const url = req.nextUrl.clone()
    url.pathname = '/404'
    return NextResponse.rewrite(url, { status: 404 })
  }

  return NextResponse.next()
}

export const config = {
  // Every page route (the secret path can be anything), but not static files or Next internals.
  matcher: ['/((?!_next/|api/|.*\\..*).*)'],
}
