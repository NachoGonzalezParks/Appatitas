import { describe, expect, it } from 'vitest'
import {
  type AlertRow,
  buildNotification,
  daysUntil,
  duePhrase,
  escapeHtml,
  targetDueDates,
} from '../../supabase/functions/health-alerts-cron/alerts'

// Tests de la lógica pura del cron de alertas de salud (HU-009 · RN-006).
// El entrypoint (index.ts) corre en Deno; acá probamos solo lo determinístico.

const TODAY = new Date(Date.UTC(2026, 0, 15)) // 2026-01-15

describe('targetDueDates', () => {
  it('devuelve hoy, +7 y +30 días (RN-006)', () => {
    expect(targetDueDates(TODAY)).toEqual(['2026-01-15', '2026-01-22', '2026-02-14'])
  })
})

describe('daysUntil', () => {
  it('0 cuando vence hoy', () => expect(daysUntil('2026-01-15', TODAY)).toBe(0))
  it('7 cuando vence en una semana', () => expect(daysUntil('2026-01-22', TODAY)).toBe(7))
  it('negativo cuando ya venció', () => expect(daysUntil('2026-01-10', TODAY)).toBe(-5))
})

describe('duePhrase', () => {
  it('distingue hoy / mañana / en X días', () => {
    expect(duePhrase(0)).toBe('vence hoy')
    expect(duePhrase(1)).toBe('vence mañana')
    expect(duePhrase(30)).toBe('vence en 30 días')
  })
  it('un registro ya vencido también avisa como "hoy"', () => {
    expect(duePhrase(-3)).toBe('vence hoy')
  })
})

describe('escapeHtml', () => {
  it('escapa caracteres peligrosos', () => {
    expect(escapeHtml('<b>Fido</b>')).toBe('&lt;b&gt;Fido&lt;/b&gt;')
  })
})

describe('buildNotification', () => {
  const row: AlertRow = {
    record_id: 'r1',
    pet_id: 'p1',
    pet_name: 'Fido',
    type: 'vaccination',
    next_due_date: '2026-01-22',
    user_id: 'u1',
    email: 'tutor@example.com',
  }

  it('arma título y cuerpo de la push', () => {
    const n = buildNotification(row, TODAY)
    expect(n.days).toBe(7)
    expect(n.pushTitle).toBe('Recordatorio de salud — Fido')
    expect(n.pushBody).toBe('Vacunación vence en 7 días')
  })

  it('el HTML del email escapa el nombre de la mascota', () => {
    const n = buildNotification({ ...row, pet_name: '<script>x' }, TODAY)
    expect(n.html).toContain('&lt;script&gt;x')
    expect(n.html).not.toContain('<script>x')
  })
})
