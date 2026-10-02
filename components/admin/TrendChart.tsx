'use client'

import { useMemo, useRef, useState } from 'react'

/**
 * Single-series line chart (one measure per chart — rank and points are never
 * put on a dual axis). Hover anywhere for a crosshair + tooltip on the nearest
 * year. Provisional points (current season) are drawn dashed with hollow markers.
 */
export interface TrendPoint { x: number; y: number; provisional?: boolean }

const W = 560, H = 220, L = 60, R = 18, T = 22, B = 30
const INK = '#1a3a6b' // wsr-blue

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) return [min]
  const step0 = (max - min) / count
  const mag = 10 ** Math.floor(Math.log10(step0))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) ?? step0
  const start = Math.ceil(min / step) * step
  const out: number[] = []
  for (let v = start; v <= max + 1e-9; v += step) out.push(Number(v.toFixed(6)))
  return out
}

export default function TrendChart({ title, data, invert, format, emptyLabel = 'No data' }: {
  title: string
  data: TrendPoint[]
  invert?: boolean               // rank charts: 1 at the top
  format: (v: number) => string
  emptyLabel?: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  const geo = useMemo(() => {
    if (data.length === 0) return null
    const xs = data.map((d) => d.x), ys = data.map((d) => d.y)
    const x0 = Math.min(...xs), x1 = Math.max(...xs)
    let y0 = invert ? Math.max(1, Math.min(...ys)) : 0
    let y1 = Math.max(...ys)
    if (invert) { y0 = Math.max(1, y0 - 2); y1 = y1 + 2 }
    if (y0 === y1) y1 = y0 + 1
    const sx = (x: number) => L + (x1 === x0 ? (W - L - R) / 2 : ((x - x0) / (x1 - x0)) * (W - L - R))
    const sy = (y: number) => {
      const t = (y - y0) / (y1 - y0)
      return invert ? T + t * (H - T - B) : H - B - t * (H - T - B)
    }
    const ticks = invert ? niceTicks(y0, y1).filter((v) => Number.isInteger(v)) : niceTicks(0, y1)
    return { sx, sy, ticks, xs }
  }, [data, invert])

  if (!geo) {
    return (
      <figure>
        <figcaption className="text-sm font-semibold text-gray-700 mb-2">{title}</figcaption>
        <p className="text-sm text-gray-400 py-12 text-center">{emptyLabel}</p>
      </figure>
    )
  }

  const { sx, sy, ticks, xs } = geo
  const solid = data.filter((d) => !d.provisional)
  const lastSolid = solid[solid.length - 1]
  const dashed = data.filter((d) => d.provisional)
  const toPath = (pts: TrendPoint[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x)},${sy(p.y)}`).join('')

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    let best = 0
    data.forEach((d, i) => { if (Math.abs(sx(d.x) - px) < Math.abs(sx(data[best].x) - px)) best = i })
    setHover(best)
  }

  const h = hover != null ? data[hover] : null
  const prev = hover != null && hover > 0 ? data[hover - 1] : null
  const delta = h && prev ? (invert ? prev.y - h.y : h.y - prev.y) : null

  // Label first + last points only (selective direct labels).
  const labelled = data.length > 1 ? [data[0], data[data.length - 1]] : data

  return (
    <figure className="relative">
      <figcaption className="text-sm font-semibold text-gray-700 mb-2">{title}</figcaption>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto touch-none select-none"
        role="img"
        aria-label={`${title}: ${data.map((d) => `${d.x} ${format(d.y)}`).join(', ')}`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={sy(v)} y2={sy(v)} stroke="#eef0f3" />
            <text x={L - 8} y={sy(v) + 4} textAnchor="end" fontSize="11" fill="#9ca3af">{format(v)}</text>
          </g>
        ))}
        {xs.map((x) => (
          <text key={x} x={sx(x)} y={H - 9} textAnchor="middle" fontSize="11" fill="#9ca3af">
            {data.length > 8 ? `'${String(x).slice(2)}` : x}
          </text>
        ))}

        {h && <line x1={sx(h.x)} x2={sx(h.x)} y1={T - 6} y2={H - B} stroke="#cbd5e1" strokeDasharray="3 3" />}

        <path d={toPath(solid)} fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {dashed.length > 0 && (
          <path d={toPath(lastSolid ? [lastSolid, ...dashed] : dashed)} fill="none" stroke={INK} strokeWidth={2} strokeDasharray="5 4" />
        )}

        {data.map((d, i) => (
          <circle
            key={d.x}
            cx={sx(d.x)} cy={sy(d.y)} r={hover === i ? 5.5 : 4}
            fill={d.provisional ? '#fff' : INK} stroke={d.provisional ? INK : '#fff'} strokeWidth={2}
          />
        ))}
        {labelled.map((d) => (
          <text key={`l${d.x}`} x={sx(d.x)} y={sy(d.y) - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill="#0b1c3d">
            {format(d.y)}
          </text>
        ))}
      </svg>

      {h && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg bg-wsr-navy text-white text-xs px-3 py-2 shadow-lg"
          style={{
            left: `${(sx(h.x) / W) * 100}%`,
            top: 28,
            transform: `translateX(${sx(h.x) > W * 0.7 ? 'calc(-100% - 10px)' : '10px'})`,
          }}
        >
          <p className="font-semibold">{h.x}{h.provisional ? ' · provisional' : ''}</p>
          <p className="tabular-nums">{format(h.y)}</p>
          {delta != null && delta !== 0 && (
            <p className={delta > 0 ? 'text-green-300' : 'text-red-300'}>
              {delta > 0 ? '▲' : '▼'} {format(Math.abs(delta)).replace('#', '')} vs {prev!.x}
            </p>
          )}
        </div>
      )}
    </figure>
  )
}
