// Lógica pura del cron de alertas de salud (HU-009 · RN-006).
//
// Sin dependencias de Deno ni de red a propósito: así se puede testear con
// Vitest, aunque el entrypoint (index.ts) corra en el runtime Deno de las Edge
// Functions. index.ts importa estas funciones.

export type HealthRecordType = 'vaccination' | 'deworming' | 'clinical_visit'

// Preferencias de alertas del Tutor (users.alert_preferences, JSONB · GAP-010).
// Ej.: { vaccination: true, deworming: false }. clinical_visit no está en el panel.
export type AlertPreferences = Partial<Record<HealthRecordType, boolean>>

// Fila del JOIN health_records + pets + users que consume el cron.
export interface AlertRow {
  record_id: string
  pet_id: string
  pet_name: string
  type: HealthRecordType
  next_due_date: string // 'YYYY-MM-DD'
  user_id: string
  email: string
  alert_preferences: AlertPreferences | null
}

export interface Notification {
  days: number
  subject: string
  html: string
  pushTitle: string
  pushBody: string
}

// Formatea una fecha (en UTC) como 'YYYY-MM-DD'.
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// Fechas de vencimiento que dispara el cron: hoy, +7 y +30 días (RN-006).
export function targetDueDates(today: Date): string[] {
  return [0, 7, 30].map((offset) => {
    const d = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + offset),
    )
    return toISODate(d)
  })
}

// Días desde hoy hasta el vencimiento (0 = vence hoy, negativo = ya venció).
export function daysUntil(nextDueDate: string, today: Date): number {
  const due = Date.parse(`${nextDueDate}T00:00:00Z`)
  const base = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  return Math.round((due - base) / 86_400_000)
}

// Escapa caracteres HTML (el nombre de la mascota lo carga el usuario y va al email).
export function escapeHtml(value: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return value.replace(/[&<>"']/g, (c) => map[c])
}

const TYPE_LABEL: Record<HealthRecordType, string> = {
  vaccination: 'Vacunación',
  deworming: 'Desparasitación',
  clinical_visit: 'Control clínico',
}

// Texto legible del plazo. Un registro ya vencido también avisa ("vence hoy").
export function duePhrase(days: number): string {
  if (days <= 0) return 'vence hoy'
  if (days === 1) return 'vence mañana'
  return `vence en ${days} días`
}

// Arma el contenido de email + push para un registro próximo a vencer.
export function buildNotification(row: AlertRow, today: Date): Notification {
  const days = daysUntil(row.next_due_date, today)
  const label = TYPE_LABEL[row.type]
  const phrase = duePhrase(days)
  const safeName = escapeHtml(row.pet_name)

  return {
    days,
    subject: `APPATITAS · ${row.pet_name}: ${label.toLowerCase()} ${phrase}`,
    html:
      `<p>Hola,</p>` +
      `<p>La <strong>${label.toLowerCase()}</strong> de <strong>${safeName}</strong> ${phrase} ` +
      `(fecha de vencimiento: ${row.next_due_date}).</p>` +
      `<p>Ingresá a APPATITAS para ver el detalle.</p>`,
    pushTitle: `Recordatorio de salud — ${row.pet_name}`,
    pushBody: `${label} ${phrase}`,
  }
}

// ¿El Tutor quiere alertas de este tipo? (users.alert_preferences · GAP-010).
// Por defecto se envía; solo se omite si la preferencia está explícitamente en false.
// Los tipos que no están en el panel (clinical_visit) siempre se notifican.
export function shouldNotify(
  type: HealthRecordType,
  prefs: AlertPreferences | null | undefined,
): boolean {
  return prefs?.[type] !== false
}

// Payload de la push, en el formato que espera el Service Worker (src/sw.ts):
// type 'health' + data.record_id habilitan la acción "Posponer 7 días" (RN-007).
export interface PushPayload {
  title: string
  body: string
  type: 'health'
  data: { pet_id: string; record_id: string }
}

export function buildPushPayload(row: AlertRow, note: Notification): PushPayload {
  return {
    title: note.pushTitle,
    body: note.pushBody,
    type: 'health',
    data: { pet_id: row.pet_id, record_id: row.record_id },
  }
}
