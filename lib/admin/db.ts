import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for the admin (bypasses RLS). Server-only —
 * the `server-only` import makes the build fail if a client component ever
 * pulls this in, so the key can't leak into the browser bundle.
 */
let client: SupabaseClient | null = null

export function adminDb(): SupabaseClient {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) throw new Error('Admin database is not configured')
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Never let Next.js cache admin reads — edits must show immediately.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  })
  return client
}

/** Supabase caps each response at 1000 rows — page through to get them all. */
export async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const PAGE = 1000
  const out: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    out.push(...data)
    if (data.length < PAGE) break
  }
  return out
}
