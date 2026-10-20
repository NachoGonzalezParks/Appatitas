import { describe, expect, it } from 'vitest'
import { buildFoundMatchPayload } from '../../supabase/functions/found-pet-match/payload'

// Test de la lógica pura de found-pet-match (HU-014): armado del payload de la push.

describe('buildFoundMatchPayload', () => {
  it('arma el payload (type found_match + ambos report ids) con la distancia redondeada', () => {
    const p = buildFoundMatchPayload('f1', 'l1', 'Fido', 'perro', 842.7)
    expect(p.type).toBe('found_match')
    expect(p.body).toBe('Alguien encontró un perro similar a Fido a 843 metros')
    expect(p.data).toEqual({ found_report_id: 'f1', lost_report_id: 'l1' })
  })

  it('usa defaults cuando falta nombre/especie y no deja metros negativos', () => {
    const p = buildFoundMatchPayload('f2', 'l2', null, undefined, -5)
    expect(p.body).toBe('Alguien encontró un animal similar a tu mascota a 0 metros')
  })
})
