import type { NavigationGuardWithThis } from 'vue-router'
import { authStore, isAuthenticated } from '@/stores/auth.store'

// Guard de autenticación (S0-06, Día 3).
// - Rutas con meta.public → acceso libre (sin sesión).
// - Rutas privadas → si no hay sesión, redirige a /login conservando el destino.
//
// La sesión ya está inicializada antes de montar la app (initAuth en main.ts),
// por lo que aquí el estado de auth es confiable en la primera navegación.
export const authGuard: NavigationGuardWithThis<undefined> = (to) => {
  if (to.meta.public) return true

  if (!isAuthenticated()) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // RN-004: sin email verificado no hay acceso completo a rutas privadas.
  if (!authStore.user?.email_confirmed_at) {
    return { name: 'email-verify', query: { email: authStore.user?.email ?? '' } }
  }

  return true
}
