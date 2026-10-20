// Lógica pura de lost-pet-notify (HU-012), sin dependencias de Deno ni red, para
// poder testearla con Vitest. index.ts (Deno) la usa.

// Payload de la push, en el formato que espera el Service Worker (src/sw.ts).
// type 'lost_pet' → la notificación no ofrece acciones (solo abrir).
export interface LostPetPushPayload {
  title: string
  body: string
  type: 'lost_pet'
  data: { lost_report_id: string }
}

export function buildLostPetPayload(
  reportId: string,
  name: string | null | undefined,
  species: string | null | undefined,
): LostPetPushPayload {
  return {
    title: '🐾 Mascota perdida cerca tuyo',
    body: `${name ?? 'Una mascota'} (${species ?? '—'}) perdida en tu zona`,
    type: 'lost_pet',
    data: { lost_report_id: reportId },
  }
}
