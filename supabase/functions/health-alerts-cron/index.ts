// Edge Function: health-alerts-cron (Sprint 2 · HU-009 · RN-006).
//
// Cron diario (0 9 * * *): busca los health_records que vencen hoy / +7 / +30 días
// y notifica al Tutor por email (Resend) y por Web Push.
//
// Incremento 1: consulta + email. Incremento 2 (este archivo): filtro por
// alert_preferences + envío real de Web Push (web-push-sender.ts) + pruning de
// suscripciones muertas. El email nunca falla el cron: es el canal de respaldo.

import { createAdminClient } from '../_shared/supabase-client.ts'
import { sendEmail } from '../_shared/resend-client.ts'
import {
  type AlertRow,
  buildNotification,
  buildPushPayload,
  shouldNotify,
  targetDueDates,
} from './alerts.ts'
import { isPushConfigured, sendPush } from './web-push-sender.ts'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  // Solo el scheduler (o un disparo manual autorizado) puede ejecutarlo.
  const secret = Deno.env.get('CRON_SECRET')
  if (secret && req.headers.get('Authorization') !== `Bearer ${secret}`) {
    return json({ ok: false, error: 'Unauthorized' }, 401)
  }

  const supabase = createAdminClient()
  const today = new Date()
  const targets = targetDueDates(today)

  // JOIN health_records -> pets -> users vía embedding de PostgREST.
  // pets!inner + filtro deleted_at IS NULL excluye mascotas dadas de baja.
  const { data, error } = await supabase
    .from('health_records')
    .select(
      'id, pet_id, type, next_due_date, pets!inner(name, user_id, deleted_at, users!inner(email, alert_preferences))',
    )
    .in('next_due_date', targets)
    .is('pets.deleted_at', null)
    .limit(100) // batch por ejecución para evitar timeout (plan §1.5)

  if (error) return json({ ok: false, error: error.message }, 500)

  const rows: AlertRow[] = (data ?? []).map((r) => {
    // deno-lint-ignore no-explicit-any
    const rec = r as any
    return {
      record_id: rec.id,
      pet_id: rec.pet_id,
      type: rec.type,
      next_due_date: rec.next_due_date,
      pet_name: rec.pets.name,
      user_id: rec.pets.user_id,
      email: rec.pets.users.email,
      alert_preferences: rec.pets.users.alert_preferences ?? null,
    }
  })

  let emailsSent = 0
  let emailsFailed = 0
  let pushSent = 0
  let pushFailed = 0
  let pruned = 0
  let skippedByPrefs = 0

  const pushOn = isPushConfigured()

  for (const row of rows) {
    // Preferencias del Tutor (GAP-010): si apagó este tipo, no se notifica por ningún canal.
    if (!shouldNotify(row.type, row.alert_preferences)) {
      skippedByPrefs++
      continue
    }

    const note = buildNotification(row, today)

    // Canal email (siempre; RN-006 lo exige como respaldo obligatorio).
    const res = await sendEmail({ to: row.email, subject: note.subject, html: note.html })
    if (res.success) emailsSent++
    else emailsFailed++

    // Canal push: a cada suscripción del Tutor (RFC-001).
    if (!pushOn) continue
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', row.user_id)

    const payload = buildPushPayload(row, note)
    for (const sub of subs ?? []) {
      const s = sub as { endpoint: string; p256dh: string; auth: string }
      const r = await sendPush(s, payload)
      if (r.ok) pushSent++
      else pushFailed++
      // Suscripción muerta (404/410): se borra para no reintentar siempre.
      if (r.gone) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
        pruned++
      }
    }
  }

  return json({
    ok: true,
    evaluated: rows.length,
    skippedByPrefs,
    emailsSent,
    emailsFailed,
    pushSent,
    pushFailed,
    pruned,
  })
})
