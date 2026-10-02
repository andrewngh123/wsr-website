import { badRequest, requireAdmin } from '@/lib/admin/guard'
import { csvResponse } from '@/lib/admin/csv'
import { countryReportCsv, countryReportHtml } from '@/lib/admin/report'

export const dynamic = 'force-dynamic'

/** ?country=LEBANON&format=csv|html  (html = print-ready page → "Save as PDF") */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const p = new URL(req.url).searchParams
  const country = p.get('country')?.trim().toUpperCase()
  if (!country) return badRequest('country is required')
  const stamp = new Date().toISOString().slice(0, 10)

  if (p.get('format') === 'csv') {
    return csvResponse(`WSR-report-${country}-${stamp}.csv`, await countryReportCsv(country))
  }
  return new Response(await countryReportHtml(country), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
    },
  })
}
