import { reactive } from 'vue'
import { supabase } from '../lib/supabase'
import { authStore } from './auth.store'
import type { Database } from '../shared/types/supabase.types'

// Tipo de mascota derivado de los tipos generados (única fuente de verdad).
type Pet = Database['public']['Tables']['pets']['Row']

interface PetState {
  pets: Pet[]
  activePet: Pet | null
  loading: boolean
}

export const petStore = reactive<PetState>({
  pets: [],
  activePet: null,
  loading: false,
})

export async function loadPets() {
  const user = authStore.user
  if (!user) return

  petStore.loading = true

  const { data } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  petStore.pets = data ?? []
  petStore.loading = false
}

export function setActivePet(pet: Pet | null) {
  petStore.activePet = pet
}
