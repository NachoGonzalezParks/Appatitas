import { reactive } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  roles: string[]
  loading: boolean
}

export const authStore = reactive<AuthState>({
  user: null,
  session: null,
  roles: [],
  loading: true,
})

export async function initAuth() {
  const { data } = await supabase.auth.getSession()
  authStore.session = data.session
  authStore.user = data.session?.user ?? null

  if (authStore.user) {
    await loadRoles(authStore.user.id)
  }

  authStore.loading = false

  supabase.auth.onAuthStateChange(async (_event, session) => {
    authStore.session = session
    authStore.user = session?.user ?? null
    authStore.roles = []

    if (authStore.user) {
      await loadRoles(authStore.user.id)
    }
  })
}

async function loadRoles(userId: string) {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)

  authStore.roles = data?.map((r) => r.role) ?? []
}

export function hasRole(role: string): boolean {
  return authStore.roles.includes(role)
}

export function isAuthenticated(): boolean {
  return authStore.user !== null
}
