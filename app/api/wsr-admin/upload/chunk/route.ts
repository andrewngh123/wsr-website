import { adminDb } from '@/lib/admin/db'
import { badRequest, json, requireAdmin } from '@/lib/admin/guard'

export const dynamic = 'force-dynamic'

/**
 * "Upload Excel" — step 2: one batch of parsed rows into staging. Nothing
 * live changes until /upload/commit. Every value is re-checked here — the
 * browser's parsing is a convenience, not trusted.
 */
const MAX_ROWS = 5000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const int = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : null)
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const str = (v: unknown, max = 120) => (typeof v === 'string' && v.trim() && v.length <= max ? v.trim().toUpperCase() : null)

type Row = Record<string, unknown>
const SHAPES: Record<string, { table: string; map: (r: Row) => Row | null }> = {
  categories: {
    table: 'ds_import_categories',
    map: (r) => {
      const sport = str(r.sport), type = str(r.type)
      if (!sport || !type || !['IND', 'TEAM', 'PART'].includes(type)) return null
      return { sport, type, note: typeof r.note === 'string' ? r.note.slice(0, 200) : null }
    },
  },
  entries: {
    table: 'ds_import_entries',
    map: (r) => {
      const year = int(r.year), rank = int(r.rank), points = num(r.points), sport = str(r.sport), country = str(r.country)
      if (year == null || year < 1900 || year > 2100 || rank == null || points == null || !sport || !country) return null
      return { year, rank, points, sport, country }
    },
  },
  finalRank: {
    table: 'ds_import_final_rank',
    map: (r) => {
      const year = int(r.year), rank = int(r.rank), points = num(r.points), country = str(r.country)
      if (year == null || year < 1900 || year > 2100 || rank == null || points == null || !country) return null
      return { year, rank, points, country, progress: r.progress == null ? null : String(r.progress).slice(0, 20) }
    },
  },
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await req.json().catch(() => null)
  const shape = SHAPES[body?.kind]
  if (!shape || typeof body?.importId !== 'string' || !UUID.test(body.importId) || !Array.isArray(body?.rows)) {
    return badRequest('Expected { importId, kind, rows }.')
  }
  if (body.rows.length > MAX_ROWS) return badRequest(`At most ${MAX_ROWS} rows per batch.`)

  const rows: Row[] = []
  for (let i = 0; i < body.rows.length; i++) {
    const r = shape.map(body.rows[i] ?? {})
    if (!r) return badRequest(`Batch row ${i + 1} (${body.kind}) is invalid: ${JSON.stringify(body.rows[i]).slice(0, 200)}`)
    rows.push({ ...r, import_id: body.importId })
  }
  const { error } = await adminDb().from(shape.table).insert(rows)
  if (error) return badRequest(error.message)
  return json({ ok: true, received: rows.length })
}
