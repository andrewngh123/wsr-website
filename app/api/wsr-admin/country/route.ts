import { badRequest, json, requireAdmin } from '@/lib/admin/guard'
import { getCountryHistory } from '@/lib/admin/data'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const country = new URL(req.url).searchParams.get('country')?.trim().toUpperCase()
  if (!country) return badRequest('country is required')
  return json(await getCountryHistory(country))
}
