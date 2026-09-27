import { supabase } from '@/lib/supabase'
import { authStore } from '@/stores/auth.store'
import { findNeighborhood } from '../data/cordoba-neighborhoods'

// Servicio del perfil de Tutor (HU-002). Opera sobre `users` (perfil, RFC-001) y
// `locations` (barrio/coordenadas para proximidad en Fase 2).

export interface TutorProfile {
  fullName: string
  phone: string
  avatarUrl: string | null
  neighborhood: string
  locationId: string | null
}

function currentUserId(): string | null {
  return authStore.user?.id ?? null
}

export async function getProfile(): Promise<{ data: TutorProfile | null; error: Error | null }> {
  const uid = currentUserId()
  if (!uid) return { data: null, error: new Error('Sin sesión') }

  const { data, error } = await supabase
    .from('users')
    .select('full_name, phone, avatar_url, location_id')
    .eq('id', uid)
    .maybeSingle()

  if (error) return { data: null, error }

  let neighborhood = ''
  if (data?.location_id) {
    const { data: loc } = await supabase
      .from('locations')
      .select('neighborhood')
      .eq('id', data.location_id)
      .maybeSingle()
    neighborhood = loc?.neighborhood ?? ''
  }

  return {
    data: {
      fullName: data?.full_name ?? '',
      phone: data?.phone ?? '',
      avatarUrl: data?.avatar_url ?? null,
      neighborhood,
      locationId: data?.location_id ?? null,
    },
    error: null,
  }
}

export interface ProfileInput {
  fullName: string
  phone: string
  neighborhood: string
  avatarUrl: string | null
  locationId: string | null
}

export async function saveProfile(input: ProfileInput): Promise<{ error: Error | null }> {
  const uid = currentUserId()
  if (!uid) return { error: new Error('Sin sesión') }

  // Resuelve la ubicación (barrio → punto geográfico). Inserta una fila en
  // `locations` con el centroide del barrio (EWKT) y usa su id.
  let locationId = input.locationId
  if (input.neighborhood) {
    const nb = findNeighborhood(input.neighborhood)
    if (nb) {
      const { data: loc, error: locErr } = await supabase
        .from('locations')
        .insert({
          neighborhood: input.neighborhood,
          city: 'Córdoba',
          coordinates: `SRID=4326;POINT(${nb.lng} ${nb.lat})`,
        })
        .select('id')
        .single()
      if (locErr) return { error: locErr }
      locationId = loc.id
    }
  }

  const { error } = await supabase
    .from('users')
    .update({
      full_name: input.fullName.trim() || null,
      phone: input.phone.trim() || null,
      avatar_url: input.avatarUrl,
      location_id: locationId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', uid)

  return { error }
}

// Sube el avatar al bucket `avatars` y devuelve la URL pública.
export async function uploadAvatar(file: File): Promise<{ url: string | null; error: Error | null }> {
  const uid = currentUserId()
  if (!uid) return { url: null, error: new Error('Sin sesión') }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${uid}/avatar.${ext}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) return { url: null, error }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  // Cache-busting para ver el cambio inmediatamente tras re-subir.
  return { url: `${data.publicUrl}?v=${Date.now()}`, error: null }
}

// Porcentaje de completitud del perfil (HU-002): nombre 30, ubicación 40,
// avatar 20, teléfono 10.
export function profileCompleteness(p: {
  fullName: string
  neighborhood: string
  avatarUrl: string | null
  phone: string
}): number {
  let pct = 0
  if (p.fullName.trim()) pct += 30
  if (p.neighborhood) pct += 40
  if (p.avatarUrl) pct += 20
  if (p.phone.trim()) pct += 10
  return pct
}
