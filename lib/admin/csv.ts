/** Minimal RFC-4180 CSV writer (Excel-friendly: BOM + CRLF). */
export function toCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
  const cell = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v)
    // Text starting with = + - @ would run as a formula in Excel — neutralise it,
    // but leave real numbers ("-3", "+15") and the bare "-" progress marker alone.
    const formula = /^[=@\t\r]/.test(s) || (/^[+-]/.test(s) && s !== '-' && Number.isNaN(Number(s)))
    const safe = formula ? `'${s}` : s
    return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }
  return '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n'
}

export function csvResponse(filename: string, body: string) {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename.replace(/[^A-Za-z0-9._-]/g, '_')}"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
