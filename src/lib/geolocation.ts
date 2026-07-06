// Wrapper de la Geolocation API — se implementa cuando lo consuman los módulos
// geoespaciales (Sprint 1 HU-002, Sprint 3 HU-013, Sprint 5 HU-016).
// Incluirá el fallback documentado (GAP-018): centrar en Córdoba Capital si el
// usuario deniega el permiso.
export const CORDOBA_CAPITAL = { lat: -31.4135, lng: -64.1811 } as const
