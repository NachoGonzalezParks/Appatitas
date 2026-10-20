// Lógica pura de found-pet-match (HU-014), sin dependencias de Deno ni red, para
// poder testearla con Vitest. index.ts (Deno) la usa.

// Payload de la push, en el formato que espera el Service Worker (src/sw.ts).
export interface FoundMatchPushPayload {
  title: string
  body: string
  type: 'found_match'
  data: { found_report_id: string; lost_report_id: string }
}

export function buildFoundMatchPayload(
  foundReportId: string,
  lostReportId: string,
  lostName: string | null | undefined,
  species: string | null | undefined,
  distanceM: number,
): FoundMatchPushPayload {
  const meters = Math.max(0, Math.round(distanceM))
  return {
    title: '🔍 Posible coincidencia encontrada',
    body: `Alguien encontró un ${species ?? 'animal'} similar a ${lostName ?? 'tu mascota'} a ${meters} metros`,
    type: 'found_match',
    data: { found_report_id: foundReportId, lost_report_id: lostReportId },
  }
}
