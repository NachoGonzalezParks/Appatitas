// Lógica pura del cron de alertas de salud (HU-009 · RN-006).
//
// Sin dependencias de Deno ni de red a propósito: así se puede testear con
// Vitest, aunque el entrypoint (index.ts) corra en el runtime Deno de las Edge
// Functions. index.ts importa estas funciones.

export type HealthRecordType = 'vaccination' | 'deworming' | 'clinical_visit'

// Fila del JOIN health_records + pets + users que consume el cron.
export interface AlertRow {
  record_id: string
  pet_id: string
  pet_name: string
  type: HealthRecordType
  next_due_date: string // 'YYYY-MM-DD'
  user_id: string
  email: string
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
