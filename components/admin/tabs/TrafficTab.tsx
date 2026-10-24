'use client'

import { useRef, useState } from 'react'
import { api, apiUrl, qs } from '../api'
import { Button, Card, Empty, ErrorNote, inputCls, LinkButton, Loading, numCls, rowCls, Stat, tableCls, tdCls, Th, theadCls } from '../ui'

type Dimension = 'section' | 'page' | 'country' | 'referrer' | 'device' | 'os' | 'browser'
interface Breakdown { label: string; views: number; share: number }

/** Shape of /api/wsr-admin/traffic (see lib/admin/traffic.ts). */
interface Report {
  start: string
  end: string
  days: { day: string; views: number }[]
  total: number
  avgPerDay: number
  peak: { day: string; views: number } | null
  previous: { start: string; end: string; total: number } | null
  searchShare: number
  directShare: number
  mobileShare: number
  breakdowns: Record<Dimension, Breakdown[]>
}

/** Keep in step with TRACKING_START and RETENTION_DAYS in lib/admin/traffic.ts. */
const TRACKING_START = '2026-10-07'
const RETENTION_DAYS = 31
const DAY_MS = 86_400_000

const isoDay = (d: Date) => d.toISOString().slice(0, 10)
const today = () => isoDay(new Date())
const daysAgo = (n: number) => isoDay(new Date(Date.now() - n * DAY_MS))
const later = (a: string, b: string) => (a > b ? a : b)
/** First day Vercel will still serve. */
const earliest = () => later(daysAgo(RETENTION_DAYS - 1), TRACKING_START)
const fmtDay = (s: string, year = false) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}), timeZone: 'UTC' })
const pct = (v: number, digits = 0) => `${(v * 100).toFixed(digits)}%`

const PRESETS: { label: string; range: () => [string, string] }[] = [
  { label: 'Last 7 days', range: () => [later(daysAgo(6), earliest()), today()] },
  { label: 'Last 14 days', range: () => [later(daysAgo(13), earliest()), today()] },
  { label: 'This month', range: () => [later(today().slice(0, 8) + '01', earliest()), today()] },
  { label: 'All available', range: () => [earliest(), today()] },
]

const BREAKDOWNS: { key: Dimension; title: string; col: string }[] = [
  { key: 'section', title: 'Sections of the site', col: 'Section' },
  { key: 'page', title: 'Top pages', col: 'Page' },
  { key: 'country', title: 'Countries', col: 'Country' },
  { key: 'referrer', title: 'Where visitors came from', col: 'Referrer' },
  { key: 'device', title: 'Devices', col: 'Device' },
  { key: 'os', title: 'Operating systems', col: 'System' },
  { key: 'browser', title: 'Browsers', col: 'Browser' },
]

/** Website traffic (Vercel Web Analytics) for a chosen date range, with a PDF version. */
export default function TrafficTab() {
  const [start, setStart] = useState(earliest)
  const [end, setEnd] = useState(today)
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const request = useRef(0)

  async function generate(s = start, e = end) {
    if (!s || !e) return setError('Choose a start and end date.')
    if (s > e) return setError('The start date must be on or before the end date.')
    const id = ++request.current
    setLoading(true)
    setError(null)
    try {
      const r = await api<Report>(`/traffic?${qs({ start: s, end: e })}`)
      if (id === request.current) setReport(r)
    } catch (err) {
      if (id === request.current) { setReport(null); setError((err as Error).message) }
    } finally {
      if (id === request.current) setLoading(false)
    }
  }

  function preset(range: [string, string]) {
    setStart(range[0])
    setEnd(range[1])
    generate(range[0], range[1])
  }

  // The report on screen may be for a different range than the inputs show.
  const shown = report && report.start === start && report.end === end
  const change = report?.previous && report.previous.total > 0 ? report.total / report.previous.total - 1 : null

  return (
    <div className="space-y-5">
      <Card title="Website traffic report">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => { e.preventDefault(); generate() }}
        >
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500" htmlFor="traffic-start">
            Start date
            <input id="traffic-start" type="date" className={inputCls} value={start} min={earliest()} max={end || today()} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500" htmlFor="traffic-end">
            End date
            <input id="traffic-end" type="date" className={inputCls} value={end} min={start || earliest()} max={today()} onChange={(e) => setEnd(e.target.value)} />
          </label>
          <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Generating…' : 'Generate report'}</Button>
          {shown && (
            <LinkButton href={apiUrl('/traffic', { start: report.start, end: report.end, format: 'html', print: 1 })} newTab>Download PDF</LinkButton>
          )}
        </form>
        <div className="flex flex-wrap gap-2 mt-3">
          {PRESETS.map((p) => (
            <Button key={p.label} type="button" variant="ghost" disabled={loading} onClick={() => preset(p.range())}>{p.label}</Button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Page views from Vercel Web Analytics, counted in UTC days. On the current Vercel plan only the last {RETENTION_DAYS} days are available
          (from {fmtDay(earliest(), true)}); analytics began on {fmtDay(TRACKING_START, true)}.
          Download PDF opens a print-ready copy; choose <strong>Save as PDF</strong> in the print dialog.
        </p>
      </Card>

      <ErrorNote error={error} />
      {loading && !report && <Loading label="Fetching analytics from Vercel…" />}
      {!report && !loading && !error && <Card><Empty>Choose a date range and generate the report.</Empty></Card>}

      {report && (
        <div className={`space-y-5 ${loading ? 'opacity-50 transition-opacity' : ''}`}>
          <h2 className="text-xl font-extrabold text-wsr-navy">
            {fmtDay(report.start, true)} – {fmtDay(report.end, true)}
            {!shown && <span className="ml-2 text-xs font-semibold text-wsr-accent align-middle">Dates changed — generate again to update</span>}
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <Stat label="Page views" value={report.total.toLocaleString()} sub={`${report.days.length} day${report.days.length === 1 ? '' : 's'}`} />
            <Stat label="Average per day" value={report.avgPerDay.toLocaleString()} sub={report.peak ? `Peak ${report.peak.views.toLocaleString()} on ${fmtDay(report.peak.day)}` : undefined} />
            <Stat
              label="Vs previous period"
              value={change == null ? '—' : <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>{change >= 0 ? '+' : '−'}{pct(Math.abs(change))}</span>}
              sub={change == null || !report.previous ? 'No earlier data in range' : `${report.previous.total.toLocaleString()} views, ${fmtDay(report.previous.start)} – ${fmtDay(report.previous.end)}`}
            />
            <Stat label="From search" value={pct(report.searchShare)} sub="Google, Bing and others" />
            <Stat label="No referrer" value={pct(report.directShare)} sub="Typed URL, bookmark or app" />
            <Stat label="On mobile" value={pct(report.mobileShare)} sub="Phones, not tablets" />
          </div>

          <Card title="Page views per day">
            <DailyBars days={report.days} />
          </Card>

          <div className="grid md:grid-cols-2 gap-5">
            {BREAKDOWNS.map((b) => (
              <Card key={b.key} title={b.title}>
                {report.breakdowns[b.key].length === 0 ? <Empty>No page views in this range.</Empty> : (
                  <div className="-mx-5 overflow-x-auto">
                    <table className={tableCls}>
                      <thead className={theadCls}><tr><Th>{b.col}</Th><Th align="right">Views</Th><Th align="right">Share</Th></tr></thead>
                      <tbody>
                        {report.breakdowns[b.key].map((r) => (
                          <tr key={r.label} className={rowCls}>
                            <td className={`${tdCls} break-all`}>{r.label}</td>
                            <td className={numCls}>{r.views.toLocaleString()}</td>
                            <td className={numCls}>{pct(r.share, 1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            A page view is one load of one page, so these figures count views, not people. Breakdowns show the top entries only, so shares don&apos;t add up to 100%.
          </p>
        </div>
      )}
    </div>
  )
}

/** Daily page views as bars; hover a bar for its date and count. */
function DailyBars({ days }: { days: Report['days'] }) {
  const [hover, setHover] = useState<number | null>(null)
  if (days.length === 0) return <Empty>No data.</Empty>
  const W = 900, H = 220, L = 48, R = 8, T = 12, B = 24
  const max = Math.max(1, ...days.map((d) => d.views))
  const mag = 10 ** Math.floor(Math.log10(max / 4 || 1))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= max / 4) ?? max / 4
  const top = Math.ceil(max / step) * step
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
  const bw = (W - L - R) / days.length
  const sy = (v: number) => H - B - (v / top) * (H - T - B)
  const every = Math.max(1, Math.ceil(days.length / 10))
  const h = hover != null ? days[hover] : null

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Page views per day" onMouseLeave={() => setHover(null)}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={sy(v)} y2={sy(v)} stroke={v === 0 ? '#9ca3af' : '#eef2f7'} />
            <text x={L - 8} y={sy(v) + 4} textAnchor="end" fontSize={11} fill="#6b7280">{v.toLocaleString()}</text>
          </g>
        ))}
        {days.map((d, i) => (
          <g key={d.day} onMouseEnter={() => setHover(i)}>
            <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent" />
            <rect
              x={L + i * bw + bw * 0.15} y={sy(d.views)} width={Math.max(1, bw * 0.7)} height={H - B - sy(d.views)}
              rx={Math.min(3, bw * 0.35)} fill={hover === i ? '#e8a020' : '#1a3a6b'}
            />
            {i % every === 0 && <text x={L + i * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="#6b7280">{fmtDay(d.day)}</text>}
          </g>
        ))}
      </svg>
      {h && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg bg-wsr-navy text-white text-xs px-2.5 py-1.5 shadow whitespace-nowrap"
          style={{ left: `${Math.min(90, Math.max(10, ((L + hover! * bw + bw / 2) / W) * 100))}%` }}
        >
          <span className="text-white/70">{fmtDay(h.day, true)}</span> · <strong>{h.views.toLocaleString()}</strong> views
        </div>
      )}
    </div>
  )
}
