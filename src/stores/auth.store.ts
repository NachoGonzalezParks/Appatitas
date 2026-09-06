import { reactive } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// Roles de la app (RFC-002). Un usuario puede acumular varios roles; viven en la
// tabla `user_roles`, no en `users.role`.
// Nota: en los tipos generados, `UserRole` es el Row de user_roles y la columna
// `role` se tipa como `string` (nace de un CHECK, no de un enum de Postgres).
// Para el "rol activo" de la UI usamos este union semántico propio.
export type AppRole = 'tutor' | 'provider' | 'admin'

interface AuthState {
  user: User | null
  session: Session | null
  roles: string[]
  activeRole: AppRole | null
  loading: boolean
}

export const authStore = reactive<AuthState>({
  user: null,
  session: null,
  roles: [],
  activeRole: null,
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
    authStore.activeRole = null

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

  // Rol activo por defecto: el primero disponible. El usuario puede cambiarlo
  // con setActiveRole() si tiene más de un rol.
  if (!authStore.activeRole && authStore.roles.length > 0) {
    authStore.activeRole = authStore.roles[0] as AppRole
  }
}

export function hasRole(role: string): boolean {
  return authStore.roles.includes(role)
}

// Aporte Dev2 (RFC-002): selector de "rol activo" para cuentas con varios roles.
export function setActiveRole(role: AppRole): void {
  if (authStore.roles.includes(role)) {
    authStore.activeRole = role
  }
}

export function isAuthenticated(): boolean {
  return authStore.user !== null
}
