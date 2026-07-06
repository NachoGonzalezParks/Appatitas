import { reactive } from 'vue'
import { supabase } from '../lib/supabase'
import { authStore } from './auth.store'

interface Pet {
  id: string
  user_id: string
  name: string
  species: string
  breed: string
  birth_date: string | null
  sex: string | null
  weight_kg: number | null
  color_marks: string | null
  microchip_id: string | null
  photo_url: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

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
  if (!authStore.user) return

  petStore.loading = true

  const { data } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', authStore.user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  petStore.pets = data ?? []
  petStore.loading = false
}

export function setActivePet(pet: Pet | null) {
  petStore.activePet = pet
}
