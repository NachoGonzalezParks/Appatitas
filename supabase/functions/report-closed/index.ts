// Edge Function: report-closed (Sprint 3 · HU-015 · RN-026 · GAP-015).
//
// Se dispara cuando el dueño cierra un reporte con éxito (status pasa a 'found').
// Registra un evento comunitario en feed_events. En este sprint no hay UI de feed:
// el evento queda en la tabla.
//
// Cableado (ops/staging): Database Webhook sobre UPDATE en lost_reports (manda
// { record, old_record }). El insert en feed_events usa service_role (la RLS de la
// tabla solo permite insertar por esa vía).

import { createAdminClient } from '../_shared/supabase-client.ts'
import { buildPetFoundEvent } from './payload.ts'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

interface ReportRecord {
  id: string
  status?: string
  name?: string
  location_id?: string | null
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

  // Disparo: webhook { record, old_record } o llamada directa { report_id }.
  // deno-lint-ignore no-explicit-any
  let body: any = {}
  try {
    body = await req.json()
  } catch {
    // body vacío o inválido
  }
  const record: ReportRecord | undefined = body.record
  const oldRecord: ReportRecord | undefined = body.old_record
  const reportId: string | undefined = record?.id ?? body.report_id
  if (!reportId) return json({ ok: false, error: 'falta report_id' }, 400)

  const supabase = createAdminClient()

  let name = record?.name ?? null
  let locationId: string | null = record?.location_id ?? null
  let status = record?.status

  // Llamada directa { report_id }: consultamos el estado actual del reporte.
  if (!record) {
    const { data: lr } = await supabase
      .from('lost_reports')
      .select('name, status, location_id')
      .eq('id', reportId)
      .single()
    if (!lr) return json({ ok: false, error: 'reporte no encontrado' }, 404)
    name = lr.name
    status = lr.status
    locationId = lr.location_id
  }

  // Solo registramos cuando el reporte quedó en 'found' (cierre con éxito).
  if (status !== 'found') return json({ ok: true, skipped: 'status no es found' })
  // En el webhook de UPDATE: solo si recién cambió a 'found' (evita re-disparos).
  if (oldRecord && oldRecord.status === 'found') return json({ ok: true, skipped: 'ya estaba found' })

  const event = buildPetFoundEvent(name)
  const { error } = await supabase.from('feed_events').insert({
    type: event.type,
    location_id: locationId,
    payload: event.payload,
  })
  if (error) return json({ ok: false, error: error.message }, 500)

  return json({ ok: true, feed_event: event.type, report_id: reportId })
})
