import { supabase } from '@/lib/supabase'
import type { Database } from '@/shared/types/supabase.types'

export type Schedule = Database['public']['Tables']['schedules']['Row']
export type ScheduleInsert = Database['public']['Tables']['schedules']['Insert']

export interface TimeSlot {
  start: string // 'HH:MM'
  end: string
}

// Genera los slots de tiempo a partir de start_time, end_time y slot_duration (minutos).
export function generateSlots(startTime: string, endTime: string, slotDuration: number): TimeSlot[] {
  const slots: TimeSlot[] = []
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  let cursor = startH * 60 + startM
  const end = endH * 60 + endM

  while (cursor + slotDuration <= end) {
    const slotEnd = cursor + slotDuration
    slots.push({
      start: `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`,
      end: `${String(Math.floor(slotEnd / 60)).padStart(2, '0')}:${String(slotEnd % 60).padStart(2, '0')}`,
    })
    cursor += slotDuration
  }
  return slots
}

// Trae todos los horarios de un proveedor ordenados por día.
export async function getSchedules(
  providerId: string,
): Promise<{ data: Schedule[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('provider_id', providerId)
    .order('day_of_week', { ascending: true })
  return { data: data ?? [], error }
}

// Crea o reemplaza el horario de un día de la semana.
// Upsert por (provider_id, day_of_week).
export async function upsertDaySchedule(
  input: ScheduleInsert,
): Promise<{ data: Schedule | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('schedules')
    .upsert(input, { onConflict: 'provider_id,day_of_week' })
    .select('*')
    .single()
  return { data, error }
}

// Elimina el horario de un día (el día queda sin turnos).
export async function deleteDaySchedule(
  providerId: string,
  dayOfWeek: number,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('provider_id', providerId)
    .eq('day_of_week', dayOfWeek)
  return { error }
}
