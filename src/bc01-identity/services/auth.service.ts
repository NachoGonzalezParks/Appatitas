import { supabase } from '@/lib/supabase'
import type { AppRole } from '@/stores/auth.store'

// Servicio de autenticación (HU-001). Envuelve Supabase Auth.
// Contrato con Dev 3 (handoff D3-2): el rol se manda en `options.data.role`;
// el trigger `020_auth_user_trigger` crea `users` + `user_roles` con ese rol
// (default `tutor` si no viene / no es válido).

// A dónde vuelve el usuario tras confirmar el email u OAuth. Debe estar en la
// allowlist de "Redirect URLs" del proyecto Supabase (config de Dev 1/Dev 3).
function redirectUrl(): string {
  return `${window.location.origin}/`
}

export function registerWithEmail(email: string, password: string, role: AppRole) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { role }, emailRedirectTo: redirectUrl() },
  })
}

export function loginWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function loginWithGoogle() {
  // OAuth no permite inyectar el rol como metadata al vuelo: el trigger aplica
  // el default `tutor`. El registro de Proveedor por OAuth se define en Sprint 4.
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUrl() },
  })
}

export function logout() {
  return supabase.auth.signOut()
}

export function resendVerificationEmail(email: string) {
  return supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: redirectUrl() },
  })
}

// Traduce los mensajes de error más comunes de Supabase Auth al español.
export function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Ya existe una cuenta con ese email.'
  }
  if (m.includes('invalid login credentials')) return 'Email o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'Tenés que verificar tu email antes de ingresar.'
  if (m.includes('password should be at least')) return 'La contraseña es demasiado corta.'
  if (
    m.includes('unable to validate email') ||
    m.includes('invalid email') ||
    m.includes('is invalid') ||
    m.includes('email_address_invalid')
  ) {
    return 'El email no es válido.'
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.'
  }
  return 'Ocurrió un error. Intentá de nuevo.'
}
