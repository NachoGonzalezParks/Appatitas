// Edge Function: lost-pet-notify (Sprint 3 · HU-012 · RN-012).
//
// Se dispara al publicarse un reporte de mascota perdida (Database Webhook de
// Supabase con { type, record }, o llamada directa con { report_id }). Notifica por
// Web Push a los tutores con ubicación en 5 km (RPC subscriptions_near_lost_report),
// en batches de 100 y con throttle de 500 destinatarios (GAP-011).
//
// Cableado (ops/staging): configurar un Database Webhook sobre INSERT en
// lost_reports que haga POST acá con el header de secret (WEBHOOK_SECRET).

import { createAdminClient } from '../_shared/supabase-client.ts'
import { isPushConfigured, type PushSubscriptionKeys, sendPush } from '../_shared/web-push.ts'
import { buildLostPetPayload } from './payload.ts'

const RADIUS_M = 5000
const MAX_RECIPIENTS = 500 // throttle GAP-011
const BATCH = 100 // batches para evitar timeout (plan §1.5)

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

interface LostReportRecord {
  id: string
  type?: string
  name?: string
  species?: string
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

  // Disparo: webhook { record } o llamada directa { report_id }.
  // deno-lint-ignore no-explicit-any
  let body: any = {}
  try {
    body = await req.json()
  } catch {
    // body vacío o inválido: seguimos con lo que haya
  }
  const record: LostReportRecord | undefined = body.record
  const reportId: string | undefined = record?.id ?? body.report_id
  if (!reportId) return json({ ok: false, error: 'falta report_id' }, 400)

  // Solo los reportes de tipo 'lost' disparan el aviso masivo.
  if (record?.type && record.type !== 'lost') return json({ ok: true, skipped: 'no es lost' })

  const supabase = createAdminClient()

  // Datos para el texto (si el webhook no los trajo, se consultan).
  let name = record?.name ?? null
  let species = record?.species ?? null
  if (!record?.name || !record?.species) {
    const { data: lr } = await supabase
      .from('lost_reports')
      .select('name, species, type')
      .eq('id', reportId)
      .single()
    if (lr) {
      if (lr.type !== 'lost') return json({ ok: true, skipped: 'no es lost' })
      name = lr.name
      species = lr.species
    }
  }

  // Suscripciones de tutores dentro del radio (ordenadas por cercanía).
  const { data: subs, error } = await supabase.rpc('subscriptions_near_lost_report', {
    p_report_id: reportId,
    p_radius_m: RADIUS_M,
    p_limit: MAX_RECIPIENTS,
  })
  if (error) return json({ ok: false, error: error.message }, 500)

  const payload = buildLostPetPayload(reportId, name, species)
  const list = (subs ?? []) as PushSubscriptionKeys[]

  let sent = 0
  let failed = 0
  let pruned = 0

  for (let i = 0; i < list.length; i += BATCH) {
    const batch = list.slice(i, i + BATCH)
    const results = await Promise.all(batch.map((s) => sendPush(s, payload)))
    for (let j = 0; j < results.length; j++) {
      if (results[j].ok) sent++
      else failed++
      if (results[j].gone) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', batch[j].endpoint)
        pruned++
      }
    }
  }

  return json({ ok: true, recipients: list.length, sent, failed, pruned })
})
