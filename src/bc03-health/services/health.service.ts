import { supabase } from '@/lib/supabase'
import type { Database } from '@/shared/types/supabase.types'

export type HealthRecord = Database['public']['Tables']['health_records']['Row']
export type HealthRecordInsert = Database['public']['Tables']['health_records']['Insert']
export type HealthRecordType = 'vaccination' | 'deworming' | 'clinical_visit'

// Devuelve todos los registros de salud de una mascota ordenados por fecha descendente.
export async function getHealthRecords(
  petId: string,
  type?: HealthRecordType,
): Promise<{ data: HealthRecord[]; error: Error | null }> {
  let query = supabase
    .from('health_records')
    .select('*')
    .eq('pet_id', petId)
    .order('applied_date', { ascending: false })

  if (type) query = query.eq('type', type)

  const { data, error } = await query
  return { data: data ?? [], error }
}

export async function createHealthRecord(
  input: HealthRecordInsert,
): Promise<{ data: HealthRecord | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('health_records')
    .insert(input)
    .select('*')
    .single()
  return { data, error }
}

export async function updateHealthRecord(
  id: string,
  input: Partial<HealthRecordInsert>,
): Promise<{ data: HealthRecord | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('health_records')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  return { data, error }
}

export async function deleteHealthRecord(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('health_records').delete().eq('id', id)
  return { error }
}

// Pospone 7 días el vencimiento de un registro (RN-007).
export async function snoozeHealthRecord(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.rpc('snooze_health_record', { p_record_id: id })
  return { error }
}
