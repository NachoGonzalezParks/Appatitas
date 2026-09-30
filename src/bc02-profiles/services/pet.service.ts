import { supabase } from '@/lib/supabase'
import { authStore } from '@/stores/auth.store'
import type { Database } from '@/shared/types/supabase.types'

// Servicio de mascotas (HU-003 registro, HU-004 edición/baja).
export type Pet = Database['public']['Tables']['pets']['Row']
export type PetSpecies = Pet['species']

export const PET_SPECIES: { value: PetSpecies; label: string }[] = [
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
  { value: 'otro', label: 'Otro' },
]

export interface PetInput {
  name: string
  species: PetSpecies
  breed: string
  birth_date: string
  sex: string
  weight_kg: number | null
  color_marks: string | null
  microchip_id: string | null
}

export async function getPet(id: string): Promise<{ data: Pet | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
  return { data, error }
}

// Sube la foto (única · RN-024) al bucket `pets` y devuelve la URL pública.
export async function uploadPetPhoto(
  petId: string,
  file: File,
): Promise<{ url: string | null; error: Error | null }> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${petId}/photo.${ext}`
  const { error } = await supabase.storage
    .from('pets')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) return { url: null, error }
  const { data } = supabase.storage.from('pets').getPublicUrl(path)
  return { url: `${data.publicUrl}?v=${Date.now()}`, error: null }
}

function toRow(input: PetInput) {
  return {
    name: input.name.trim(),
    species: input.species,
    breed: input.breed.trim(),
    birth_date: input.birth_date || null,
    sex: input.sex || null,
    weight_kg: input.weight_kg,
    color_marks: input.color_marks?.trim() || null,
    microchip_id: input.microchip_id?.trim() || null,
  }
}

export async function createPet(
  input: PetInput,
  photo: File | null,
): Promise<{ data: Pet | null; error: Error | null }> {
  const uid = authStore.user?.id
  if (!uid) return { data: null, error: new Error('Sin sesión') }

  const { data, error } = await supabase
    .from('pets')
    .insert({ user_id: uid, ...toRow(input) })
    .select('*')
    .single()
  if (error || !data) return { data: null, error }

  if (photo) {
    const { url } = await uploadPetPhoto(data.id, photo)
    if (url) {
      const { data: updated } = await supabase
        .from('pets')
        .update({ photo_url: url })
        .eq('id', data.id)
        .select('*')
        .single()
      return { data: updated ?? data, error: null }
    }
  }
  return { data, error: null }
}

// Baja lógica (HU-004, RN-003). Usa la RPC transaccional de Dev1
// (migración 021_soft_delete_pet): marca deleted_at y cancela los turnos
// futuros (bookings → cancelled_by_tutor). La RPC valida la propiedad por RLS.
//
// La RPC aún no figura en los tipos generados (Database.Functions vacío), por eso
// el cast acotado. Handoff a Dev1: regenerar tipos incluyendo Functions.
export async function softDeletePet(id: string): Promise<{ error: Error | null }> {
  const rpc = supabase.rpc.bind(supabase) as (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ error: Error | null }>
  const { error } = await rpc('soft_delete_pet', { p_pet_id: id })
  return { error }
}

export async function updatePet(
  id: string,
  input: PetInput,
  photo: File | null,
): Promise<{ data: Pet | null; error: Error | null }> {
  let photoUrl: string | undefined
  if (photo) {
    const { url } = await uploadPetPhoto(id, photo)
    if (url) photoUrl = url
  }

  const { data, error } = await supabase
    .from('pets')
    .update({
      ...toRow(input),
      updated_at: new Date().toISOString(),
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    })
    .eq('id', id)
    .select('*')
    .single()
  return { data, error }
}
