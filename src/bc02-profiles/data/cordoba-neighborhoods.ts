// Barrios de Córdoba Capital (+ algunas localidades del Gran Córdoba) para la
// selección asistida de ubicación del Tutor (HU-002).
//
// `lat`/`lng` = centroide APROXIMADO del barrio. Alimenta el punto geográfico
// (locations.coordinates) que la búsqueda por proximidad usa en Fase 2 (HU-016).
// Son valores de referencia; refinar con datos oficiales cuando estén disponibles.

export interface Neighborhood {
  name: string
  lat: number
  lng: number
}

export const CORDOBA_NEIGHBORHOODS: Neighborhood[] = [
  { name: 'Centro', lat: -31.4173, lng: -64.1833 },
  { name: 'Nueva Córdoba', lat: -31.4295, lng: -64.1836 },
  { name: 'Güemes', lat: -31.4265, lng: -64.195 },
  { name: 'Alberdi', lat: -31.411, lng: -64.201 },
  { name: 'Alto Alberdi', lat: -31.411, lng: -64.218 },
  { name: 'Alta Córdoba', lat: -31.394, lng: -64.179 },
  { name: 'Cofico', lat: -31.398, lng: -64.183 },
  { name: 'General Paz', lat: -31.413, lng: -64.168 },
  { name: 'San Vicente', lat: -31.423, lng: -64.154 },
  { name: 'Juniors', lat: -31.426, lng: -64.166 },
  { name: 'Observatorio', lat: -31.423, lng: -64.2 },
  { name: 'Cerro de las Rosas', lat: -31.367, lng: -64.23 },
  { name: 'Villa Belgrano', lat: -31.36, lng: -64.256 },
  { name: 'Villa Cabrera', lat: -31.38, lng: -64.218 },
  { name: 'Urca', lat: -31.356, lng: -64.236 },
  { name: 'Argüello', lat: -31.335, lng: -64.268 },
  { name: 'Barrio Jardín', lat: -31.447, lng: -64.183 },
  { name: 'Jardín Espinosa', lat: -31.452, lng: -64.172 },
  { name: 'Los Boulevares', lat: -31.33, lng: -64.2 },
  { name: 'Villa Allende (Gran Córdoba)', lat: -31.294, lng: -64.295 },
  { name: 'Río Ceballos (Gran Córdoba)', lat: -31.166, lng: -64.32 },
  // Fallback para barrios no listados: usa el centro de la ciudad.
  { name: 'Otro / no listado', lat: -31.4173, lng: -64.1833 },
]

export function findNeighborhood(name: string): Neighborhood | undefined {
  return CORDOBA_NEIGHBORHOODS.find((n) => n.name === name)
}
