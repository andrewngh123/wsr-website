/**
 * Client helper for the admin API. The API answers 404 to anything without a
 * valid session, so a 404 here means the session expired → back to login.
 */
export const API = '/api/wsr-admin'

export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {}
  const res = await fetch(`${API}${path}`, {
    ...rest,
    cache: 'no-store',
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...rest.headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
  if (res.status === 404) {
    window.location.reload()
    throw new Error('Your session has expired — please sign in again.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`)
  return data as T
}

type Params = Record<string, string | number | null | undefined>

/** Query string from params, skipping empty values. */
export function qs(params: Params): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v != null && v !== '') q.set(k, String(v))
  return q.toString()
}

/** Download/CSV links carry the session cookie, so a plain URL is enough. */
export function apiUrl(path: string, params: Params) {
  return `${API}${path}?${qs(params)}`
}
