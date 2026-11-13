import 'server-only'
import { createSign } from 'node:crypto'

/**
 * Distinct users from Google Analytics 4 (Data API), for the traffic report.
 * Vercel's API only serves page views, so people are counted by GA4 instead.
 *
 *   GA4_PROPERTY_ID   GA4 → Admin → Property details → Property ID (a number, not the G- tag)
 *   GA4_CLIENT_EMAIL  Google Cloud service account email (Viewer on the GA4 property)
 *   GA4_PRIVATE_KEY   "private_key" from that service account's JSON key
 *
 * GA4 days follow the property's time zone, not UTC. Ad-blockers hide some visitors from GA4.
 */

/** GA4 tag went live (components/GoogleAnalytics.tsx): no users before this. */
export const GA4_START = '2026-10-24'

export function isGa4Enabled(): boolean {
  return Boolean(process.env.GA4_PROPERTY_ID && process.env.GA4_CLIENT_EMAIL && process.env.GA4_PRIVATE_KEY)
}

export interface Ga4Users {
  /** Distinct users across the whole range. */
  total: number
  /** Distinct users across the previous period, or null when it isn't covered. */
  previousTotal: number | null
  byDay: Map<string, number>
  byCountry: Map<string, number>
  byPage: Map<string, number>
  byDevice: Map<string, number>
}

// ── Auth: service-account JWT → OAuth access token (cached until near expiry) ──
let cached: { token: string; expires: number } | null = null

const b64url = (s: string | Buffer) => Buffer.from(s).toString('base64url')

function privateKey() {
  // Pasted keys often keep the JSON's literal "\n"s and sometimes the surrounding quotes.
  return process.env.GA4_PRIVATE_KEY!.trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n')
}

async function accessToken(): Promise<string> {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token
  const now = Math.floor(Date.now() / 1000)
  const unsigned = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(JSON.stringify({
    iss: process.env.GA4_CLIENT_EMAIL!.trim(),
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))}`
  let signature: string
  try {
    signature = createSign('RSA-SHA256').update(unsigned).sign(privateKey(), 'base64url')
  } catch {
    throw new Error('GA4_PRIVATE_KEY is not a valid private key. Paste the whole "private_key" value from the JSON file, including the BEGIN and END lines.')
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
    cache: 'no-store',
  })
  const data = await res.json().catch(() => null) as { access_token?: string; expires_in?: number; error_description?: string } | null
  if (!res.ok || !data?.access_token) {
    throw new Error(`Google refused the sign-in (${res.status}${data?.error_description ? `: ${data.error_description}` : ''}). Check GA4_CLIENT_EMAIL and GA4_PRIVATE_KEY.`)
  }
  cached = { token: data.access_token, expires: Date.now() + (data.expires_in ?? 3600) * 1000 }
  return data.access_token
}

// ── Data API ─────────────────────────────────────────────────────────────────
type Row = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }
type Request = { dateRanges: { startDate: string; endDate: string; name?: string }[]; dimensions?: { name: string }[]; limit?: number }

async function batch(requests: Request[]): Promise<Row[][]> {
  const property = process.env.GA4_PROPERTY_ID!.trim()
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(property)}:batchRunReports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: requests.map((r) => ({ ...r, metrics: [{ name: 'totalUsers' }] })) }),
    cache: 'no-store',
  })
  const data = await res.json().catch(() => null) as { reports?: { rows?: Row[] }[]; error?: { message?: string } } | null
  if (!res.ok) {
    const why = data?.error?.message
    if (res.status === 403) {
      throw new Error(`Google Analytics refused access${why ? ` (${why})` : ''}. Check that the service account is a Viewer on the GA4 property and that GA4_PROPERTY_ID is right.`)
    }
    throw new Error(`Google Analytics request failed (${res.status}${why ? `: ${why}` : ''}).`)
  }
  return (data?.reports ?? []).map((r) => r.rows ?? [])
}

const users = (r: Row) => Number(r.metricValues?.[0]?.value ?? 0)
const toMap = (rows: Row[], key: (v: string) => string = (v) => v) =>
  new Map(rows.map((r) => [key(r.dimensionValues?.[0]?.value ?? ''), users(r)]))

/**
 * Users for [start, end] (YYYY-MM-DD), plus the previous period when given.
 * Days before GA4_START are skipped; returns null when the whole range predates GA4.
 */
export async function getGa4Users(start: string, end: string, previous: { start: string; end: string } | null): Promise<Ga4Users | null> {
  if (end < GA4_START) return null
  const range = { startDate: start < GA4_START ? GA4_START : start, endDate: end }
  const prevCovered = previous && previous.start >= GA4_START
  // batchRunReports takes at most 5 requests. With two date ranges, GA4 tags each row with its range name.
  const [totals, daily, countries, pages, devices] = await batch([
    { dateRanges: [{ ...range, name: 'current' }, ...(prevCovered ? [{ startDate: previous.start, endDate: previous.end, name: 'previous' }] : [])] },
    { dateRanges: [range], dimensions: [{ name: 'date' }], limit: 400 },
    { dateRanges: [range], dimensions: [{ name: 'countryId' }], limit: 250 },
    { dateRanges: [range], dimensions: [{ name: 'pagePath' }], limit: 1000 },
    { dateRanges: [range], dimensions: [{ name: 'deviceCategory' }], limit: 10 },
  ])
  const totalFor = (name: string) => {
    const row = totals.find((r) => (r.dimensionValues?.[0]?.value ?? 'current') === name)
    return row ? users(row) : 0
  }

  return {
    total: totalFor('current'),
    previousTotal: prevCovered ? totalFor('previous') : null,
    // GA4 dates come back as YYYYMMDD.
    byDay: toMap(daily, (v) => `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`),
    byCountry: toMap(countries),
    byPage: toMap(pages),
    byDevice: toMap(devices),
  }
}
