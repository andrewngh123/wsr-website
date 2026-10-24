import { badRequest, json, requireAdmin } from '@/lib/admin/guard'
import { checkRange, getTrafficReport, isTrafficEnabled, trafficReportHtml } from '@/lib/admin/traffic'

export const dynamic = 'force-dynamic'

/** ?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|html[&print=1]  (html = print-ready page → "Save as PDF") */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth
  if (!isTrafficEnabled()) {
    return badRequest('Traffic reports are not set up yet: VERCEL_API_TOKEN, VERCEL_TEAM_ID and VERCEL_PROJECT_ID must be set in Vercel.')
  }

  const p = new URL(req.url).searchParams
  const range = checkRange(p.get('start'), p.get('end'))
  if (typeof range === 'string') return badRequest(range)

  let report
  try {
    report = await getTrafficReport(range.start, range.end)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Could not load analytics from Vercel.' }, 502)
  }

  if (p.get('format') === 'html') {
    return new Response(trafficReportHtml(report, p.get('print') === '1'), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
        'Referrer-Policy': 'no-referrer',
      },
    })
  }
  return json(report)
}
