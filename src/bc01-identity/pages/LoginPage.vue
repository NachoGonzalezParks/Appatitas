<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loginWithEmail, loginWithGoogle, translateAuthError } from '../services/auth.service'
import EmailPasswordForm from '../components/EmailPasswordForm.vue'
import OAuthButtons from '../components/OAuthButtons.vue'

// HU-001 — Login. Destino del guard de rutas privadas.
const route = useRoute()
const router = useRouter()
const redirect = (route.query.redirect as string) || '/'

const loading = ref(false)
const error = ref<string | null>(null)

async function onSubmit(email: string, password: string) {
  loading.value = true
  error.value = null
  const { data, error: err } = await loginWithEmail(email, password)
  loading.value = false
  if (err) {
    error.value = translateAuthError(err.message)
    return
  }
  // RN-004: sin email verificado no hay acceso completo.
  if (data.user && !data.user.email_confirmed_at) {
    router.push({ name: 'email-verify', query: { email } })
    return
  }
  router.push(redirect)
}

async function onGoogle() {
  error.value = null
  const { error: err } = await loginWithGoogle()
  if (err) error.value = translateAuthError(err.message)
}
</script>

<template>
  <section class="auth">
    <h1>Ingresar</h1>

    <EmailPasswordForm submit-label="Ingresar" :loading="loading" :error="error" @submit="onSubmit" />

    <div class="divider"><span>o</span></div>
    <OAuthButtons @google="onGoogle" />

    <p class="alt">¿No tenés cuenta? <RouterLink to="/registro">Crear cuenta</RouterLink></p>

    <nav class="public-links">
      <p>Secciones públicas (sin cuenta):</p>
      <RouterLink to="/mapa">Mapa comunitario</RouterLink> ·
      <RouterLink to="/encontrada">Reportar mascota encontrada</RouterLink>
    </nav>
  </section>
</template>

<style scoped>
.auth {
  max-width: 420px;
  margin: 0 auto;
}
.divider {
  text-align: center;
  color: var(--color-muted);
  margin: 16px 0;
}
.alt {
  margin-top: 16px;
  text-align: center;
  color: var(--color-muted);
}
.public-links {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  color: var(--color-muted);
  font-size: 0.9rem;
}
</style>
