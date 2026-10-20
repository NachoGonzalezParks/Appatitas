import { supabase } from '@/lib/supabase'
import type { Database } from '@/shared/types/supabase.types'

export type LostReport = Database['public']['Tables']['lost_reports']['Row']
export type LostReportInsert = Database['public']['Tables']['lost_reports']['Insert']

export interface LostReportWithLocation extends LostReport {
  locations: {
    coordinates: unknown
    address: string | null
  } | null
}

// Crea un reporte de pérdida o de mascota encontrada (HU-012, HU-014).
export async function createLostReport(
  input: LostReportInsert,
): Promise<{ data: LostReport | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('lost_reports')
    .insert(input)
    .select('*')
    .single()
  return { data, error }
}

// Trae reportes activos (status='lost') dentro de un radio en metros (HU-013).
// Las coordenadas del centro se pasan como { lat, lng }.
// El filtrado geoespacial real se hace en una RPC (ver getByRadiusRpc).
// Este método es un fallback sin filtro geoespacial para cuando no hay coordenadas.
export async function getLostReports(filters?: {
  species?: string
  since?: string
}): Promise<{ data: LostReportWithLocation[]; error: Error | null }> {
  let query = supabase
    .from('lost_reports')
    .select('*, locations(coordinates, address)')
    .eq('status', 'lost')
    .eq('type', 'lost')
    .order('created_at', { ascending: false })

  if (filters?.species) query = query.eq('species', filters.species)
  if (filters?.since) query = query.gte('incident_date', filters.since)

  const { data, error } = await query
  return { data: (data as LostReportWithLocation[]) ?? [], error }
}

// Trae un reporte por id (para la pantalla de detalle, HU-015).
export async function getLostReportById(
  id: string,
): Promise<{ data: LostReportWithLocation | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('lost_reports')
    .select('*, locations(coordinates, address)')
    .eq('id', id)
    .maybeSingle()
  return { data: data as LostReportWithLocation | null, error }
}

// Marca el reporte como encontrado (HU-015). Solo el propietario puede hacerlo (RLS).
export async function closeLostReport(
  id: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('lost_reports')
    .update({ status: 'found', updated_at: new Date().toISOString() })
    .eq('id', id)
  return { error }
}
