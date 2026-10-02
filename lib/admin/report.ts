import 'server-only'
import { getCategories, getCountryHistory } from './data'
import { toCsv } from './csv'

/**
 * Country report — a full-history summary of one country, as CSV (for Excel)
 * or as a print-ready HTML page (browser "Save as PDF").
 */

type History = Awaited<ReturnType<typeof getCountryHistory>>

const fmt = (n: number, digits = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: digits })

const round2 = (n: number) => Math.round(n * 100) / 100

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

function progressLabel(trend: History['trend'], i: number) {
  if (i === 0) return '-'
  const d = trend[i - 1].rank - trend[i].rank
  return d === 0 ? '-' : d > 0 ? `+${d}` : String(d)
}

export async function countryReportCsv(country: string) {
  const [h, cats] = await Promise.all([getCountryHistory(country), getCategories()])
  const type = new Map(cats.map((c) => [c.sport, c.type]))
  const overall = toCsv(
    ['OVERALL', 'Year', 'Rank', 'Points', 'Progress', 'Status'],
    h.trend.map((t, i) => ['', t.year, t.rank, round2(t.points), progressLabel(h.trend, i), t.provisional ? 'Provisional (live)' : 'Final']),
  )
  const bySport = toCsv(
    ['BY SPORT', 'Year', 'Sport', 'Type', 'Rank', 'Points', '% of year total'],
    h.breakdown.flatMap((y) => {
      const ranks = h.entries.filter((e) => e.year === y.year)
      return ranks.map((e) => ['', e.year, e.sport, type.get(e.sport) ?? '', e.rank, round2(e.points),
        y.total ? ((e.points / y.total) * 100).toFixed(2) : '0'])
    }),
  )
  // Second block without its own BOM so Excel reads one file.
  return `${toCsv([`WSR country report — ${country}`, `Generated ${new Date().toISOString().slice(0, 10)}`], [])}${overall.slice(1)}\r\n${bySport.slice(1)}`
}

// ── HTML / PDF ───────────────────────────────────────────────────────────────

/** Static single-series line chart (print has no hover, so endpoints are labelled). */
function lineChartSvg(points: { x: number; y: number; dashed?: boolean }[], opts: { invert?: boolean; label: (v: number) => string }) {
  if (points.length === 0) return '<p class="muted">No data.</p>'
  const W = 640, H = 210, L = 56, R = 24, T = 28, B = 28
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y)
  const x0 = Math.min(...xs), x1 = Math.max(...xs)
  let y0 = Math.min(...ys), y1 = Math.max(...ys)
  if (y0 === y1) { y0 -= 1; y1 += 1 }
  if (!opts.invert) y0 = 0
  const sx = (x: number) => L + (x1 === x0 ? (W - L - R) / 2 : ((x - x0) / (x1 - x0)) * (W - L - R))
  const sy = (y: number) => {
    const t = (y - y0) / (y1 - y0)
    return opts.invert ? T + t * (H - T - B) : H - B - t * (H - T - B)
  }
  const ticks = [0, 0.5, 1].map((t) => y0 + t * (y1 - y0))
  const solid = points.filter((p) => !p.dashed)
  const path = (pts: typeof points) => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('')
  const lastSolid = solid[solid.length - 1]
  const dashed = points.filter((p) => p.dashed)
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">
    ${ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${sy(v)}" y2="${sy(v)}" stroke="#e5e7eb"/>
      <text x="${L - 8}" y="${sy(v) + 4}" text-anchor="end" font-size="11" fill="#6b7280">${esc(opts.label(v))}</text>`).join('')}
    ${xs.map((x) => `<text x="${sx(x)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#6b7280">${x}</text>`).join('')}
    <path d="${path(solid)}" fill="none" stroke="#1a3a6b" stroke-width="2"/>
    ${dashed.length && lastSolid ? `<path d="${path([lastSolid, ...dashed])}" fill="none" stroke="#1a3a6b" stroke-width="2" stroke-dasharray="4 4"/>` : ''}
    ${points.map((p) => `<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="4" fill="${p.dashed ? '#fff' : '#1a3a6b'}" stroke="#1a3a6b" stroke-width="2"/>`).join('')}
    ${[points[0], points[points.length - 1]].map((p) => `<text x="${sx(p.x)}" y="${sy(p.y) - 10}" text-anchor="middle" font-size="11" font-weight="600" fill="#0b1c3d">${esc(opts.label(p.y))}</text>`).join('')}
  </svg>`
}

export async function countryReportHtml(country: string) {
  const [h, cats] = await Promise.all([getCountryHistory(country), getCategories()])
  const type = new Map(cats.map((c) => [c.sport, c.type]))
  const finals = h.trend.filter((t) => !t.provisional)
  const best = finals.length ? finals.reduce((a, b) => (b.rank < a.rank ? b : a)) : null
  const latest = h.trend[h.trend.length - 1]
  const sportsEver = new Set(h.entries.map((e) => e.sport)).size

  // Sport × year rank matrix (best rank per sport per year).
  const years = [...new Set(h.entries.map((e) => e.year))].sort((a, b) => a - b)
  const matrix = new Map<string, Map<number, number>>()
  for (const e of h.entries) {
    const row = matrix.get(e.sport) ?? new Map()
    row.set(e.year, Math.min(row.get(e.year) ?? Infinity, e.rank))
    matrix.set(e.sport, row)
  }
  const sportOrder = [...matrix.keys()].sort()

  const stat = (label: string, value: string, sub = '') =>
    `<div class="stat"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</div>`

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(country)} — WSR country report</title>
<style>
  :root { --navy:#0b1c3d; --blue:#1a3a6b; --accent:#e8a020; --muted:#6b7280; --line:#e5e7eb; }
  * { box-sizing: border-box; }
  body { font-family: Inter, ui-sans-serif, system-ui, sans-serif; color:#111827; margin:0; background:#f4f7fb; }
  main { max-width: 960px; margin: 0 auto; padding: 32px 24px; background:#fff; }
  header { border-bottom: 3px solid var(--accent); padding-bottom: 16px; margin-bottom: 24px; display:flex; justify-content:space-between; align-items:flex-end; gap:16px; }
  h1 { font-size: 28px; margin: 0; color: var(--navy); }
  h2 { font-size: 16px; color: var(--navy); margin: 28px 0 10px; text-transform: uppercase; letter-spacing: .04em; }
  h3 { font-size: 14px; color: var(--blue); margin: 18px 0 6px; }
  .muted { color: var(--muted); font-size: 12px; }
  .stats { display:grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .stat { border:1px solid var(--line); border-radius: 10px; padding: 12px; }
  .stat .label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing:.05em; }
  .stat .value { font-size: 22px; font-weight: 800; color: var(--navy); margin-top: 4px; }
  .stat .sub { font-size: 11px; color: var(--muted); }
  .charts { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  table { width:100%; border-collapse: collapse; font-size: 12px; }
  th { text-align:left; color: var(--muted); font-weight:600; text-transform: uppercase; font-size: 10px; letter-spacing:.05em; border-bottom: 1px solid var(--line); padding: 6px; }
  td { border-bottom: 1px solid #f1f5f9; padding: 5px 6px; }
  td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; }
  .matrix td, .matrix th { text-align:center; padding: 4px; }
  .matrix td:first-child, .matrix th:first-child { text-align:left; }
  .year-block { break-inside: avoid; }
  .toolbar { position: sticky; top: 0; background: var(--navy); padding: 10px 24px; display:flex; justify-content:flex-end; gap: 8px; }
  .toolbar button { background: var(--accent); color:#fff; border:0; border-radius: 8px; padding: 8px 16px; font-weight:600; cursor:pointer; }
  @media (max-width: 700px) { .stats { grid-template-columns: 1fr 1fr; } .charts { grid-template-columns: 1fr; } }
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
      <div class="muted">World Sports Rankings · Country report</div>
      <h1>${esc(country)}</h1>
    </div>
    <div class="muted">Generated ${esc(new Date().toISOString().slice(0, 10))}<br>Internal — not for publication</div>
  </header>

  <section class="stats">
    ${stat('Latest rank', latest ? `#${latest.rank}` : '—', latest ? `${latest.year}${latest.provisional ? ' (provisional)' : ''}` : '')}
    ${stat('Best final rank', best ? `#${best.rank}` : '—', best ? String(best.year) : '')}
    ${stat('Years ranked', String(finals.length), finals.length ? `${finals[0].year}–${finals[finals.length - 1].year}` : '')}
    ${stat('Sports contested', String(sportsEver), `${h.entries.length} results`)}
  </section>

  <h2>Overall trend</h2>
  <div class="charts">
    <div><h3>Overall rank (lower is better)</h3>${lineChartSvg(h.trend.map((t) => ({ x: t.year, y: t.rank, dashed: t.provisional })), { invert: true, label: (v) => `#${Math.round(v)}` })}</div>
    <div><h3>Total points</h3>${lineChartSvg(h.trend.map((t) => ({ x: t.year, y: t.points, dashed: t.provisional })), { label: (v) => fmt(v, 0) })}</div>
  </div>
  <p class="muted">Dashed segment / hollow marker = current season, computed live from entries (provisional).</p>

  <table>
    <thead><tr><th>Year</th><th class="n">Rank</th><th class="n">Points</th><th class="n">Progress</th><th class="n">Sports</th><th>Status</th></tr></thead>
    <tbody>
      ${h.trend.slice().reverse().map((t) => {
        const i = h.trend.indexOf(t)
        const sports = h.breakdown.find((b) => b.year === t.year)?.sports.length ?? 0
        return `<tr><td>${t.year}</td><td class="n">${t.rank}</td><td class="n">${fmt(t.points)}</td><td class="n">${progressLabel(h.trend, i)}</td><td class="n">${sports}</td><td>${t.provisional ? 'Provisional' : 'Final'}</td></tr>`
      }).join('')}
    </tbody>
  </table>

  <h2>Rank by sport and year</h2>
  <div style="overflow-x:auto">
  <table class="matrix">
    <thead><tr><th>Sport</th><th>Type</th>${years.map((y) => `<th>${y}</th>`).join('')}</tr></thead>
    <tbody>
      ${sportOrder.map((s) => `<tr><td>${esc(s)}</td><td>${esc(type.get(s) ?? '')}</td>${years.map((y) => `<td>${matrix.get(s)?.get(y) ?? ''}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>
  </div>

  <h2>Points by sport, per year</h2>
  ${h.breakdown.map((y) => `
    <div class="year-block">
      <h3>${y.year} — ${fmt(y.total)} pts across ${y.sports.length} sports</h3>
      <table>
        <thead><tr><th>Sport</th><th>Type</th><th class="n">Points</th><th class="n">% of total</th><th class="n">Rank</th></tr></thead>
        <tbody>${y.sports.map((s) => `<tr><td>${esc(s.sport)}</td><td>${esc(type.get(s.sport) ?? '')}</td><td class="n">${fmt(s.points)}</td><td class="n">${(s.share * 100).toFixed(1)}%</td><td class="n">${s.entries > 1 ? `avg ${fmt(s.avg_rank, 1)} (${s.entries} entries)` : s.avg_rank}</td></tr>`).join('')}</tbody>
      </table>
    </div>`).join('')}
</main>
</body></html>`
}
