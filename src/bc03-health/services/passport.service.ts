import { supabase } from '@/lib/supabase'
import type { Database } from '@/shared/types/supabase.types'
import type { HealthRecord } from './health.service'

export type PassportShare = Database['public']['Tables']['passport_shares']['Row']
export type Pet = Database['public']['Tables']['pets']['Row']

export interface PassportData {
  share: PassportShare
  pet: Pet
  healthRecords: HealthRecord[]
}

// Genera un enlace de pasaporte compartido para una mascota (HU-011, RN-008).
// durationDays: 1-7 días. Default 7. El hash lo genera la DB con pgcrypto (migración 027).
export async function createPassportShare(
  petId: string,
  durationDays: 1 | 2 | 3 | 4 | 5 | 6 | 7 = 7,
): Promise<{ data: PassportShare | null; error: Error | null }> {
  const { data: shareId, error: rpcError } = await supabase.rpc('create_passport_share', {
    p_pet_id: petId,
    p_duration_days: durationDays,
  })
  if (rpcError || !shareId) return { data: null, error: rpcError }

  const { data, error } = await supabase
    .from('passport_shares')
    .select('*')
    .eq('id', shareId)
    .single()

  return { data, error }
}

// Carga el pasaporte público por hash (RN-009). No requiere sesión.
// Devuelve null si el hash no existe o ya expiró.
export async function getPassportByHash(
  hash: string,
): Promise<{ data: PassportData | null; error: Error | null }> {
  const { data: share, error: shareError } = await supabase
    .from('passport_shares')
    .select('*')
    .eq('hash', hash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (shareError) return { data: null, error: shareError }
  if (!share) return { data: null, error: null }

  const { data: pet, error: petError } = await supabase
    .from('pets')
    .select('*')
    .eq('id', share.pet_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (petError) return { data: null, error: petError }
  if (!pet) return { data: null, error: null }

  const { data: healthRecords, error: hrError } = await supabase
    .from('health_records')
    .select('*')
    .eq('pet_id', share.pet_id)
    .order('applied_date', { ascending: false })

  if (hrError) return { data: null, error: hrError }

  return {
    data: { share, pet, healthRecords: healthRecords ?? [] },
    error: null,
  }
}

// Elimina un share existente (el tutor revoca el enlace antes de que expire).
export async function deletePassportShare(shareId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('passport_shares').delete().eq('id', shareId)
  return { error }
}

// Lista todos los shares activos de una mascota (no expirados).
export async function getActiveShares(
  petId: string,
): Promise<{ data: PassportShare[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('passport_shares')
    .select('*')
    .eq('pet_id', petId)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })

  return { data: data ?? [], error }
}
