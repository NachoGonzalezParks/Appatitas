// Edge Function: found-pet-match (Sprint 3 · HU-014 · RN-014).
//
// Se dispara al publicarse un reporte de mascota ENCONTRADA (Database Webhook con
// { type, record }, o llamada directa con { report_id }). Motor de coincidencias
// (GAP-012): busca reportes 'lost' compatibles (especie exacta + color ILIKE +
// 3 km) y avisa por Web Push a sus dueños. Las coincidencias son sugerencias.
//
// Cableado (ops/staging): Database Webhook sobre INSERT en lost_reports.

import { createAdminClient } from '../_shared/supabase-client.ts'
import { isPushConfigured, sendPush } from '../_shared/web-push.ts'
import { buildFoundMatchPayload } from './payload.ts'

const RADIUS_M = 3000
const MAX_MATCHES = 500
const BATCH = 100

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

interface FoundReportRecord {
  id: string
  type?: string
  species?: string
}

interface MatchRow {
  lost_report_id: string
  lost_name: string | null
  distance_m: number
  endpoint: string
  p256dh: string
  auth: string
}

Deno.serve(async (req: Request) => {
  // Auth: el webhook (o el disparo manual) debe traer el secret.
  const secret = Deno.env.get('WEBHOOK_SECRET')
  if (
    secret &&
    req.headers.get('Authorization') !== `Bearer ${secret}` &&
    req.headers.get('x-webhook-secret') !== secret
  ) {
    return json({ ok: false, error: 'Unauthorized' }, 401)
  }

  if (!isPushConfigured()) return json({ ok: false, error: 'push no configurado' }, 200)

  // deno-lint-ignore no-explicit-any
  let body: any = {}
  try {
    body = await req.json()
  } catch {
    // body vacío o inválido
  }
  const record: FoundReportRecord | undefined = body.record
  const reportId: string | undefined = record?.id ?? body.report_id
  if (!reportId) return json({ ok: false, error: 'falta report_id' }, 400)

  // Solo los reportes de tipo 'found' disparan el motor de coincidencias.
  if (record?.type && record.type !== 'found') return json({ ok: true, skipped: 'no es found' })

  const supabase = createAdminClient()

  // Especie del reporte encontrado (para el texto). Si el webhook no la trajo, se consulta.
  let species = record?.species ?? null
  if (!species) {
    const { data: fr } = await supabase
      .from('lost_reports')
      .select('species, type')
      .eq('id', reportId)
      .single()
    if (fr) {
      if (fr.type !== 'found') return json({ ok: true, skipped: 'no es found' })
      species = fr.species
    }
  }

  // Reportes perdidos compatibles + suscripciones de sus dueños.
  const { data, error } = await supabase.rpc('matches_for_found_report', {
    p_found_id: reportId,
    p_radius_m: RADIUS_M,
    p_limit: MAX_MATCHES,
  })
  if (error) return json({ ok: false, error: error.message }, 500)

  const rows = (data ?? []) as MatchRow[]

  let sent = 0
  let failed = 0
  let pruned = 0

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const results = await Promise.all(
      batch.map((row) => {
        const payload = buildFoundMatchPayload(
          reportId,
          row.lost_report_id,
          row.lost_name,
          species,
          row.distance_m,
        )
        return sendPush(row, payload)
      }),
    )
    for (let j = 0; j < results.length; j++) {
      if (results[j].ok) sent++
      else failed++
      if (results[j].gone) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', batch[j].endpoint)
        pruned++
      }
    }
  }

  return json({ ok: true, matches: rows.length, sent, failed, pruned })
})
