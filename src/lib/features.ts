// Feature flags de la app, controlados por variables de entorno (VITE_*).
// Permiten diferir funciones sin borrar código: el resto de la app lee estos
// flags y muestra/oculta según corresponda. Ver docs/plan-desbloqueo.md.
//
// Uso (ej. en la pantalla de login — dev2):
//   import { features } from '@/lib/features'
//   if (features.facebookLogin) { ... } else { boton deshabilitado "Próximamente" }

export const features = {
  // Login con Facebook: diferido hasta tener nombre de la app + dominio + la app
  // de Meta aprobada. Mientras sea false, el botón se muestra deshabilitado.
  facebookLogin: import.meta.env.VITE_ENABLE_FACEBOOK === 'true',
} as const
