// Edge Function: health-alerts-cron (Sprint 2 · HU-009 · RN-006).
//
// Cron diario (0 9 * * *): busca los health_records que vencen hoy / +7 / +30 días
// y notifica al Tutor por email (Resend) y —Incremento 2— por Web Push.
//
// Incremento 1 (este archivo): consulta + email + búsqueda de suscripciones push.
// El envío cifrado de Web Push (VAPID + @negrel/webpush) llega en el Incremento 2
// (ver TODO más abajo). El email nunca falla el cron: es el canal de respaldo.

import { createAdminClient } from '../_shared/supabase-client.ts'
import { sendEmail } from '../_shared/resend-client.ts'
import { type AlertRow, buildNotification, targetDueDates } from './alerts.ts'

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
  // TODO(HU-009): cuando Dev1 agregue users.alert_preferences (JSONB), filtrar
  // por tipo (vaccination/deworming) según las preferencias del Tutor.
  const { data, error } = await supabase
    .from('health_records')
    .select(
      'id, pet_id, type, next_due_date, pets!inner(name, user_id, deleted_at, users!inner(email))',
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
    }
  })

  let emailsSent = 0
  let emailsFailed = 0
  let pushSubscriptions = 0

  for (const row of rows) {
    const note = buildNotification(row, today)

    // Canal email (siempre; RN-006 lo exige como respaldo obligatorio).
    const res = await sendEmail({ to: row.email, subject: note.subject, html: note.html })
    if (res.success) emailsSent++
    else emailsFailed++

    // Canal push: buscamos las suscripciones del Tutor (RFC-001). El envío
    // cifrado real llega en el Incremento 2.
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', row.user_id)
    pushSubscriptions += subs?.length ?? 0
    // TODO(Incremento 2 · HU-009): por cada sub, enviar Web Push con
    // note.pushTitle / note.pushBody y data { pet_id, record_id, action: 'snooze' }.
  }

  return json({ ok: true, evaluated: rows.length, emailsSent, emailsFailed, pushSubscriptions })
})
