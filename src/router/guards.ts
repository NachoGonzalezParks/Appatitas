import type { NavigationGuardWithThis } from 'vue-router'

// Guard de autenticación — PLACEHOLDER de Sprint 0.
//
// La lógica real se implementa en Sprint 1 (S1-01, HU-001):
//   1. session existe (usuario autenticado vía Supabase Auth)
//   2. email_verified = true (RN-004)
//   3. si no cumple → redirect a /login o /verificar-email
//
// Hoy solo dejamos el punto de extensión cableado en el router. Mientras no
// haya integración de Auth, las rutas privadas se dejan pasar en desarrollo.
export const authGuard: NavigationGuardWithThis<undefined> = (to) => {
  if (to.meta.public) return true

  // TODO(Sprint 1 · S1-01): validar sesión + email_verified con el auth store.
  // Ejemplo previsto (usa la API reactive de src/stores/auth.store.ts):
  //   import { authStore, isAuthenticated } from '@/stores/auth.store'
  //   if (!isAuthenticated()) return { name: 'login', query: { redirect: to.fullPath } }
  //   if (!authStore.user?.email_confirmed_at) return { name: 'email-verify' }
  return true
}
