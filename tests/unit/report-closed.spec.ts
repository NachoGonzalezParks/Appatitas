import { describe, expect, it } from 'vitest'
import { buildPetFoundEvent } from '../../supabase/functions/report-closed/payload'

// Test de la lógica pura de report-closed (HU-015): armado del evento de feed.

describe('buildPetFoundEvent', () => {
  it('arma el evento pet_found con el mensaje', () => {
    const e = buildPetFoundEvent('Fido')
    expect(e.type).toBe('pet_found')
    expect(e.payload).toEqual({ pet_name: 'Fido', message: '¡Fido fue encontrada! 🎉' })
  })

  it('usa un default cuando falta el nombre', () => {
    const e = buildPetFoundEvent(null)
    expect(e.payload.pet_name).toBe('La mascota')
    expect(e.payload.message).toBe('¡La mascota fue encontrada! 🎉')
  })
})
