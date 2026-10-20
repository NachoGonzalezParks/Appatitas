import { describe, expect, it } from 'vitest'
import { buildLostPetPayload } from '../../supabase/functions/lost-pet-notify/payload'

// Test de la lógica pura de lost-pet-notify (HU-012). El entrypoint corre en Deno;
// acá probamos el armado del payload de la push.

describe('buildLostPetPayload', () => {
  it('arma el payload en el formato del Service Worker (type lost_pet + lost_report_id)', () => {
    const p = buildLostPetPayload('r1', 'Fido', 'perro')
    expect(p.type).toBe('lost_pet')
    expect(p.title).toContain('Mascota perdida')
    expect(p.body).toBe('Fido (perro) perdida en tu zona')
    expect(p.data).toEqual({ lost_report_id: 'r1' })
  })

  it('tiene defaults cuando falta nombre o especie', () => {
    const p = buildLostPetPayload('r2', null, undefined)
    expect(p.body).toBe('Una mascota (—) perdida en tu zona')
    expect(p.data.lost_report_id).toBe('r2')
  })
})
