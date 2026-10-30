// Lógica pura de report-closed (HU-015), sin dependencias de Deno ni red, para
// poder testearla con Vitest. index.ts (Deno) la usa.

// Evento comunitario que se registra en feed_events al cerrar un reporte con éxito.
export interface PetFoundEvent {
  type: 'pet_found'
  payload: { pet_name: string; message: string }
}

export function buildPetFoundEvent(name: string | null | undefined): PetFoundEvent {
  const petName = name ?? 'La mascota'
  return {
    type: 'pet_found',
    payload: { pet_name: petName, message: `¡${petName} fue encontrada! 🎉` },
  }
}
