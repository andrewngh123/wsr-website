import 'server-only'
import { adminPath, ADMIN_INTERNAL_PATH } from './config'
import { GA4_START, getGa4Users, isGa4Enabled, type Ga4Users } from './ga4'

/**
 * Site traffic report — page views from Vercel Web Analytics for a date range,
 * as JSON (Traffic tab) or a print-ready HTML page (browser "Save as PDF").
 *
 * Reads Vercel's Observability metrics API with a server-only token:
 *
 *   VERCEL_API_TOKEN   Vercel → Account settings → Tokens (scoped to the WSR team)
 *   VERCEL_TEAM_ID     team_…  (Team settings → General → Team ID)
 *   VERCEL_PROJECT_ID  prj_…   (wsr-website → Settings → General → Project ID)
 *
 * Vercel only gives page views (its API rejects unique-visitor queries), so distinct
 * users come from Google Analytics 4 instead (see ./ga4.ts) when it is configured.
 * Vercel's Hobby plan only serves the latest 31 days, so older ranges are refused.
 * Days are UTC. The hidden admin page is always left out of the breakdowns.
 */

/** Vercel Web Analytics was switched on (commit 70ae826) — nothing exists before this. */
export const TRACKING_START = '2026-10-07'
/** Days of history Vercel serves on the Hobby plan (today counts as one). Raise it on Pro. */
export const RETENTION_DAYS = 31

const METRIC = 'vercel.analytics.page_view.count'
const DAY_MS = 86_400_000

export function isTrafficEnabled(): boolean {
  return Boolean(process.env.VERCEL_API_TOKEN && process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID)
}

export type Dimension = 'section' | 'page' | 'country' | 'referrer' | 'device' | 'os' | 'browser'

/** `users` is null for dimensions GA4 can't match, or when users aren't available. */
export interface Breakdown { label: string; views: number; share: number; users: number | null }

export interface TrafficReport {
  start: string
  end: string
  days: { day: string; views: number; users: number | null }[]
  total: number
  /** Distinct users from GA4, or null with `usersNote` saying why. */
  users: {
    total: number
    avgPerDay: number
    /** First day users are counted from (GA4 began after Vercel). */
    since: string
    /** Same-length period before `start`, when GA4 covers all of it. */
    previous: { start: string; end: string; total: number } | null
  } | null
  usersNote: string | null
  avgPerDay: number
  peak: { day: string; views: number } | null
  /** Same number of days immediately before `start`; null when Vercel no longer serves them. */
  previous: { start: string; end: string; total: number } | null
  searchShare: number
  directShare: number
  mobileShare: number
  breakdowns: Record<Dimension, Breakdown[]>
  generatedAt: string
}

// ── Dates ────────────────────────────────────────────────────────────────────
const isoDay = (d: Date) => d.toISOString().slice(0, 10)
const parseDay = (s: string) => new Date(`${s}T00:00:00Z`)
const addDays = (s: string, n: number) => isoDay(new Date(parseDay(s).getTime() + n * DAY_MS))

/** First day a report can include: analytics start, or the edge of Vercel's retention window. */
export function earliestDay(): string {
  const edge = addDays(isoDay(new Date()), -(RETENTION_DAYS - 1))
  return edge > TRACKING_START ? edge : TRACKING_START
}

/** Validates a requested range; returns an error message or the clean range. */
export function checkRange(start: string | null, end: string | null): { start: string; end: string } | string {
  const re = /^\d{4}-\d{2}-\d{2}$/
  if (!start || !end || !re.test(start) || !re.test(end) || Number.isNaN(parseDay(start).getTime()) || Number.isNaN(parseDay(end).getTime())) {
    return 'Choose a start and end date.'
  }
  if (start > end) return 'The start date must be on or before the end date.'
  const today = isoDay(new Date())
  if (start > today) return 'The start date is in the future.'
  const first = earliestDay()
  if (start < first) {
    return start < TRACKING_START
      ? `Analytics began on ${TRACKING_START}. Choose a start date on or after it.`
      : `Vercel only keeps the last ${RETENTION_DAYS} days of analytics on the current plan. Choose a start date on or after ${first}.`
  }
  return { start, end: end > today ? today : end }
}

// ── Vercel API ───────────────────────────────────────────────────────────────
type Series = { timestamp: string; dimensions?: Record<string, string>; values: { value: number } }[]
type Summary = { dimensions?: Record<string, string>; values: { value: number } }[]

async function query(startDay: string, endDay: string, groupBy?: string, limit = 25): Promise<{ series: Series; summary: Summary }> {
  // Whole UTC days: the API rejects sub-second bounds, and an end in the future is fine.
  const body = {
    scope: { ownerId: process.env.VERCEL_TEAM_ID, projectIds: [process.env.VERCEL_PROJECT_ID] },
    timeRange: { start: parseDay(startDay).toISOString(), end: parseDay(addDays(endDay, 1)).toISOString() },
    bucketSeconds: 86_400,
    ...(groupBy ? { groupBy: [groupBy] } : {}),
    metrics: { value: { metric: METRIC, aggregation: 'count' } },
    outputs: ['value'],
    ...(groupBy ? { seriesSelection: { limit, mode: 'exact', rankBy: [{ metric: 'value', direction: 'desc' }] } } : {}),
  }
  const res = await fetch(`https://api.vercel.com/metrics/v1?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID!)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => null) as { error?: { message?: string; issues?: { message?: string }[] } } | null
    const why = detail?.error?.issues?.[0]?.message ?? detail?.error?.message
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Vercel refused the analytics request (${res.status}${why ? `: ${why}` : ''}). Check VERCEL_API_TOKEN and VERCEL_TEAM_ID.`)
    }
    throw new Error(`Vercel analytics request failed (${res.status}${why ? `: ${why}` : ''}).`)
  }
  const data = await res.json() as { series?: Series; summary?: Summary }
  return { series: data.series ?? [], summary: data.summary ?? [] }
}

// ── Labels ───────────────────────────────────────────────────────────────────
const SECTION_LABEL: Record<string, string> = {
  '/': 'Home',
  '/rankings': 'Rankings index',
  '/rankings/[slug]': 'Individual ranking pages',
  '/rankings/[slug]/sports': 'Ranked sports',
  '/countries/[code]': 'Country profiles',
  '/about': 'About',
  '/scientific-publications': 'Scientific publications',
  '/media-release': 'Media releases',
}

const REFERRER_LABEL: Record<string, string> = {
  '': 'Direct / no referrer',
  'google.com': 'Google',
  'com.google.android.googlequicksearchbox': 'Google app (Android)',
  'bing.com': 'Bing',
  'cn.bing.com': 'Bing',
  'duckduckgo.com': 'DuckDuckGo',
  'noai.duckduckgo.com': 'DuckDuckGo',
  'search.brave.com': 'Brave Search',
  'ecosia.org': 'Ecosia',
  'search.yahoo.com': 'Yahoo',
  'yandex.ru': 'Yandex',
  'qwant.com': 'Qwant',
  'm.facebook.com': 'Facebook',
  'l.facebook.com': 'Facebook',
  'facebook.com': 'Facebook',
  't.co': 'X / Twitter',
  'l.instagram.com': 'Instagram',
  'linkedin.com': 'LinkedIn',
  'reddit.com': 'Reddit',
}

/** Referrers that are search engines, for the "from search" share. */
const SEARCH = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|search\.brave\.com|ecosia\.org|search\.yahoo\.com|yandex\.[a-z]+|qwant\.com|baidu\.com)$|googlequicksearchbox/

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
const countryLabel = (code: string) => {
  try { return (code && regionNames.of(code)) || 'Unknown' } catch { return code || 'Unknown' }
}

const titleCase = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : 'Unknown'

// ── Report ───────────────────────────────────────────────────────────────────
export async function getTrafficReport(start: string, end: string): Promise<TrafficReport> {
  const span = (parseDay(end).getTime() - parseDay(start).getTime()) / DAY_MS + 1
  const prevStart = addDays(start, -span), prevEnd = addDays(start, -1)
  const comparable = prevStart >= earliestDay()

  const ga4 = loadUsers(start, end, { start: prevStart, end: prevEnd })
  const [daily, prev, routes, paths, countries, referrers, devices, oses, browsers] = await Promise.all([
    query(start, end),
    comparable ? query(prevStart, prevEnd) : null,
    query(start, end, 'route', 25),
    query(start, end, 'requestPath', 25),
    query(start, end, 'country', 15),
    query(start, end, 'referrerHostname', 25),
    query(start, end, 'deviceType', 5),
    query(start, end, 'osName', 8),
    query(start, end, 'browserName', 10),
  ])
  const { users, note: usersNote } = await ga4

  // Every day in the range, zero-filled.
  const byDay = new Map(daily.series.map((s) => [s.timestamp.slice(0, 10), s.values.value]))
  const days: TrafficReport['days'] = []
  for (let d = start; d <= end; d = addDays(d, 1)) days.push({ day: d, views: byDay.get(d) ?? 0, users: users && d >= GA4_START ? users.byDay.get(d) ?? 0 : null })
  const total = days.reduce((t, d) => t + d.views, 0)

  // The hidden admin page must never appear in a report.
  const secret = adminPath()
  const hidden = (p: string) =>
    p === ADMIN_INTERNAL_PATH || p.startsWith(`${ADMIN_INTERNAL_PATH}/`) || (secret != null && (p === `/${secret}` || p.startsWith(`/${secret}/`)))

  /** Summary rows → labelled rows, merging rows that share a label. */
  const rows = (s: Summary, key: string, label: (v: string) => string, keep: (v: string) => boolean = () => true, limit = 12, usersBy?: Map<string, number>) => {
    const merged = new Map<string, { views: number; users: number | null }>()
    for (const r of s) {
      const v = r.dimensions?.[key] ?? ''
      if (!keep(v)) continue
      const l = label(v)
      const m = merged.get(l) ?? { views: 0, users: usersBy ? 0 : null }
      m.views += r.values.value
      if (m.users != null) m.users += usersBy!.get(v) ?? 0
      merged.set(l, m)
    }
    return [...merged.entries()]
      .map(([l, m]) => ({ label: l, views: m.views, share: total ? m.views / total : 0, users: m.users }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)
  }

  const referrerRows = referrers.summary.map((r) => ({ host: r.dimensions?.referrerHostname ?? '', views: r.values.value }))
  const sumWhere = (f: (h: string) => boolean) => referrerRows.filter((r) => f(r.host)).reduce((t, r) => t + r.views, 0)
  const mobile = devices.summary.filter((r) => r.dimensions?.deviceType === 'mobile').reduce((t, r) => t + r.values.value, 0)
  const peak = days.reduce<TrafficReport['peak']>((a, d) => (d.views > (a?.views ?? 0) ? d : a), null)

  return {
    start, end, days, total,
    users: users && {
      total: users.total,
      avgPerDay: Math.round(days.filter((d) => d.users != null).reduce((t, d) => t + d.users!, 0) / Math.max(1, days.filter((d) => d.users != null).length)),
      since: start < GA4_START ? GA4_START : start,
      previous: users.previousTotal == null ? null : { start: prevStart, end: prevEnd, total: users.previousTotal },
    },
    usersNote,
    avgPerDay: days.length ? Math.round(total / days.length) : 0,
    peak,
    previous: prev ? { start: prevStart, end: prevEnd, total: prev.series.reduce((t, s) => t + s.values.value, 0) } : null,
    searchShare: total ? sumWhere((h) => SEARCH.test(h)) / total : 0,
    directShare: total ? sumWhere((h) => h === '') / total : 0,
    mobileShare: total ? mobile / total : 0,
    breakdowns: {
      section: rows(routes.summary, 'route', (v) => SECTION_LABEL[v], (v) => v in SECTION_LABEL, 10),
      page: rows(paths.summary, 'requestPath', (v) => v, (v) => !hidden(v), 15, users?.byPage),
      country: rows(countries.summary, 'country', countryLabel, () => true, 15, users?.byCountry),
      referrer: rows(referrers.summary, 'referrerHostname', (v) => REFERRER_LABEL[v] ?? (v.endsWith('search.yahoo.com') ? 'Yahoo' : v), () => true, 12),
      device: rows(devices.summary, 'deviceType', titleCase, (v) => v !== '', 12, users?.byDevice),
      os: rows(oses.summary, 'osName', (v) => v || 'Unknown', (v) => v !== '', 8),
      browser: rows(browsers.summary, 'browserName', (v) => v || 'Unknown', (v) => v !== '', 8),
    },
    generatedAt: new Date().toISOString(),
  }
}

/** GA4 users, or why there are none. Never fails the report: views still show without users. */
async function loadUsers(start: string, end: string, previous: { start: string; end: string } | null): Promise<{ users: Ga4Users | null; note: string | null }> {
  if (!isGa4Enabled()) return { users: null, note: 'Users need Google Analytics: set GA4_PROPERTY_ID, GA4_CLIENT_EMAIL and GA4_PRIVATE_KEY in Vercel.' }
  try {
    const users = await getGa4Users(start, end, previous)
    return users ? { users, note: null } : { users: null, note: `Users are counted from ${GA4_START}, when Google Analytics was added.` }
  } catch (e) {
    return { users: null, note: e instanceof Error ? e.message : 'Could not load users from Google Analytics.' }
  }
}

// ── HTML / PDF ───────────────────────────────────────────────────────────────
const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

const n = (v: number) => v.toLocaleString('en-US')
const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`
const longDay = (s: string) => parseDay(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const shortDay = (s: string) => parseDay(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/** Change vs the previous period, or null when there is nothing to compare with. */
export function periodChange(r: TrafficReport): number | null {
  if (!r.previous || r.previous.total === 0) return null
  return r.total / r.previous.total - 1
}

/** Change in distinct users vs the previous period, or null. */
export function usersChange(r: TrafficReport): number | null {
  if (!r.users?.previous?.total) return null
  return r.users.total / r.users.previous.total - 1
}

/** Static daily bar chart (print has no hover, so the peak is labelled). */
function barChartSvg(days: TrafficReport['days']) {
  if (days.length === 0) return '<p class="muted">No data.</p>'
  const W = 900, H = 230, L = 52, R = 12, T = 22, B = 26
  const max = Math.max(1, ...days.map((d) => d.views))
  const step0 = max / 4, mag = 10 ** Math.floor(Math.log10(step0 || 1))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) ?? step0
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v)
  const bw = (W - L - R) / days.length
  const sy = (v: number) => H - B - (v / top) * (H - T - B)
  const every = Math.max(1, Math.ceil(days.length / 12))
  const peak = days.reduce((a, d) => (d.views > a.views ? d : a))
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Page views per day">
    ${ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${sy(v)}" y2="${sy(v)}" stroke="${v === 0 ? '#9ca3af' : '#e5e7eb'}"/>
      <text x="${L - 8}" y="${sy(v) + 4}" text-anchor="end" font-size="11" fill="#6b7280">${n(v)}</text>`).join('')}
    ${days.map((d, i) => {
      const x = L + i * bw + bw * 0.15, w = Math.max(1, bw * 0.7)
      return `<rect x="${x.toFixed(1)}" y="${sy(d.views).toFixed(1)}" width="${w.toFixed(1)}" height="${(H - B - sy(d.views)).toFixed(1)}" rx="${Math.min(3, w / 2).toFixed(1)}" fill="${d === peak ? '#3f6fb5' : '#1a3a6b'}"/>`
    }).join('')}
    ${days.map((d, i) => i % every ? '' : `<text x="${(L + i * bw + bw / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#6b7280">${esc(shortDay(d.day))}</text>`).join('')}
    <text x="${(L + days.indexOf(peak) * bw + bw / 2).toFixed(1)}" y="${sy(peak.views) - 6}" text-anchor="middle" font-size="11" font-weight="600" fill="#0b1c3d">${n(peak.views)}</text>
    ${usersLine(days, (i) => L + i * bw + bw / 2, sy)}
  </svg>`
}

/** Users per day as a line over the bars (days without GA4 data break the line). */
function usersLine(days: TrafficReport['days'], x: (i: number) => number, y: (v: number) => number) {
  let d = '', pen = false
  days.forEach((day, i) => {
    if (day.users == null) { pen = false; return }
    d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(day.users).toFixed(1)}`
    pen = true
  })
  if (!d) return ''
  const dots = days.map((day, i) => day.users == null ? '' : `<circle cx="${x(i).toFixed(1)}" cy="${y(day.users).toFixed(1)}" r="2.5" fill="#e8a020"/>`).join('')
  return `<path d="${d}" fill="none" stroke="#e8a020" stroke-width="2" stroke-linejoin="round"/>${dots}`
}

const BREAKDOWNS: { key: Dimension; title: string; col: string; note: string }[] = [
  { key: 'section', title: 'Sections of the site', col: 'Section', note: 'Page views grouped by page type.' },
  { key: 'page', title: 'Top pages', col: 'Page', note: 'Individual URLs.' },
  { key: 'country', title: 'Countries', col: 'Country', note: 'Where visitors were browsing from.' },
  { key: 'referrer', title: 'Where visitors came from', col: 'Referrer', note: 'No referrer means a typed URL, a bookmark, or an app that hides its source.' },
  { key: 'device', title: 'Devices', col: 'Device', note: '' },
  { key: 'os', title: 'Operating systems', col: 'System', note: '' },
  { key: 'browser', title: 'Browsers', col: 'Browser', note: '' },
]

export function trafficReportHtml(r: TrafficReport, autoPrint = false) {
  const change = periodChange(r)
  const stat = (label: string, value: string, sub = '') =>
    `<div class="stat"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</div>`
  const uChange = usersChange(r)
  const table = (b: (typeof BREAKDOWNS)[number]) => {
    const rows = r.breakdowns[b.key]
    const max = Math.max(1, ...rows.map((x) => x.views))
    const withUsers = rows.some((x) => x.users != null)
    return `<div class="block">
      <h3>${esc(b.title)}</h3>${b.note ? `<p class="muted">${esc(b.note)}</p>` : ''}
      ${rows.length === 0 ? '<p class="muted">No page views in this range.</p>' : `<table>
        <thead><tr><th>${esc(b.col)}</th>${withUsers ? '<th class="n">Users</th>' : ''}<th class="n">Views</th><th class="n">Share</th></tr></thead>
        <tbody>${rows.map((x) => `<tr><td>${esc(x.label)}<div class="bar" style="width:${((x.views / max) * 100).toFixed(1)}%"></div></td>${withUsers ? `<td class="n">${x.users == null ? '—' : n(x.users)}</td>` : ''}<td class="n">${n(x.views)}</td><td class="n">${pct(x.share)}</td></tr>`).join('')}</tbody>
      </table>`}
    </div>`
  }

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>WSR traffic report ${esc(r.start)} to ${esc(r.end)}</title>
<style>
  :root { --navy:#0b1c3d; --blue:#1a3a6b; --accent:#e8a020; --muted:#6b7280; --line:#e5e7eb; }
  * { box-sizing: border-box; }
  body { font-family: Inter, ui-sans-serif, system-ui, sans-serif; color:#111827; margin:0; background:#f4f7fb; }
  main { max-width: 960px; margin: 0 auto; padding: 32px 24px; background:#fff; }
  header { border-bottom: 3px solid var(--accent); padding-bottom: 16px; margin-bottom: 24px; display:flex; justify-content:space-between; align-items:flex-end; gap:16px; }
  h1 { font-size: 26px; margin: 0; color: var(--navy); }
  h2 { font-size: 16px; color: var(--navy); margin: 28px 0 10px; text-transform: uppercase; letter-spacing: .04em; }
  h3 { font-size: 14px; color: var(--blue); margin: 0 0 2px; }
  .muted { color: var(--muted); font-size: 12px; margin: 0 0 8px; }
  .stats { display:grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .stat { border:1px solid var(--line); border-radius: 10px; padding: 12px; }
  .stat .label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing:.05em; }
  .stat .value { font-size: 22px; font-weight: 800; color: var(--navy); margin-top: 4px; font-variant-numeric: tabular-nums; }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .up { color: #15803d; } .down { color: #b91c1c; }
  .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 24px 28px; }
  .block { break-inside: avoid; }
  table { width:100%; border-collapse: collapse; font-size: 12px; }
  th { text-align:left; color: var(--muted); font-weight:600; text-transform: uppercase; font-size: 10px; letter-spacing:.05em; border-bottom: 1px solid var(--line); padding: 6px; }
  td { border-bottom: 1px solid #f1f5f9; padding: 5px 6px; vertical-align: top; }
  td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .bar { height: 3px; background: var(--blue); border-radius: 2px; margin-top: 3px; opacity: .7; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .foot { margin-top: 28px; border-top: 1px solid var(--line); padding-top: 10px; }
  .toolbar { position: sticky; top: 0; background: var(--navy); padding: 10px 24px; display:flex; justify-content:flex-end; gap: 8px; }
  .toolbar button { background: var(--accent); color:#fff; border:0; border-radius: 8px; padding: 8px 16px; font-weight:600; cursor:pointer; }
  svg rect { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  @media (max-width: 700px) { .stats { grid-template-columns: 1fr 1fr; } .grid { grid-template-columns: 1fr; } }
  @media print {
    body { background:#fff; } main { padding: 0; } .toolbar { display:none; }
    @page { margin: 14mm; }
    h2 { break-after: avoid; }
  }
</style></head>
<body>
<div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>
<main>
  <header>
    <div>
      <div class="muted">World Sports Rankings · Website traffic report</div>
      <h1>${esc(longDay(r.start))} – ${esc(longDay(r.end))}</h1>
    </div>
    <div class="muted">sportsrankings.world<br>Generated ${esc(r.generatedAt.slice(0, 10))} · Internal</div>
  </header>

  <section class="stats">
    ${r.users ? stat('Users', n(r.users.total), r.users.since > r.start ? `Distinct people since ${shortDay(r.users.since)}` : 'Distinct people in this range') : stat('Users', '—', r.usersNote ?? '')}
    ${stat('Average users per day', r.users ? n(r.users.avgPerDay) : '—', r.users ? `${(r.total / Math.max(1, r.users.total)).toFixed(1)} views per user` : '')}
    <div class="stat"><div class="label">Users vs previous period</div><div class="value ${uChange == null ? '' : uChange >= 0 ? 'up' : 'down'}">${uChange == null ? '—' : `${uChange >= 0 ? '+' : '−'}${pct(Math.abs(uChange), 0)}`}</div><div class="sub">${uChange == null || !r.users?.previous ? 'No earlier data to compare' : `${n(r.users.previous.total)} users, ${esc(shortDay(r.users.previous.start))} – ${esc(shortDay(r.users.previous.end))}`}</div></div>
    ${stat('Page views', n(r.total), `${r.days.length} day${r.days.length === 1 ? '' : 's'}`)}
    ${stat('Average per day', n(r.avgPerDay), r.peak ? `Peak ${n(r.peak.views)} on ${shortDay(r.peak.day)}` : '')}
    <div class="stat"><div class="label">Views vs previous period</div><div class="value ${change == null ? '' : change >= 0 ? 'up' : 'down'}">${change == null ? '—' : `${change >= 0 ? '+' : '−'}${pct(Math.abs(change), 0)}`}</div><div class="sub">${change == null || !r.previous ? 'No earlier data to compare' : `${n(r.previous.total)} views, ${esc(shortDay(r.previous.start))} – ${esc(shortDay(r.previous.end))}`}</div></div>
    ${stat('From search engines', pct(r.searchShare, 0), 'Google, Bing, DuckDuckGo and others')}
    ${stat('No referrer', pct(r.directShare, 0), 'Typed URL, bookmark or app')}
    ${stat('On mobile', pct(r.mobileShare, 0), 'Phones, not tablets')}
  </section>

  <h2>Page views${r.users ? ' and users' : ''} per day</h2>
  ${barChartSvg(r.days)}
  <p class="muted">Bars: page views (UTC days), busiest day in lighter blue.${r.users ? ' Orange line: distinct users per day (Google Analytics days).' : ''}</p>

  <h2>Breakdowns</h2>
  <div class="grid">${BREAKDOWNS.map(table).join('')}</div>

  <p class="muted foot">Sources: page views from Vercel Web Analytics; users from Google Analytics 4. A page view is one load of one page; a user is one browser or device, counted once however many pages it views. Ad-blockers hide some visitors from Google Analytics, so users are a slight undercount. Users are counted from ${esc(longDay(GA4_START))}. Breakdowns list the top entries only, so shares do not add up to 100%. Analytics began on ${esc(longDay(TRACKING_START))}.</p>
</main>
${autoPrint ? '<script>window.addEventListener("load", () => setTimeout(() => window.print(), 300))</script>' : ''}
</body></html>`
}
