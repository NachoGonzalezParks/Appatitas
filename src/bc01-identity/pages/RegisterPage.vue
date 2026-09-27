<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { AppRole } from '@/stores/auth.store'
import { registerWithEmail, loginWithGoogle, translateAuthError } from '../services/auth.service'
import RoleSelectorForm from '../components/RoleSelectorForm.vue'
import EmailPasswordForm from '../components/EmailPasswordForm.vue'
import OAuthButtons from '../components/OAuthButtons.vue'

// HU-001 — Registro de Tutor (y selección de rol compartida con HU-005).
const router = useRouter()
const selectedRole = ref<AppRole | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

function onSelectRole(role: AppRole) {
  selectedRole.value = role
  error.value = null
}

function changeRole() {
  selectedRole.value = null
  error.value = null
}

async function onSubmit(email: string, password: string) {
  if (!selectedRole.value) return
  loading.value = true
  error.value = null
  const { error: err } = await registerWithEmail(email, password, selectedRole.value)
  loading.value = false
  if (err) {
    error.value = translateAuthError(err.message)
    return
  }
  // El acceso completo queda bloqueado hasta verificar el email (RN-004).
  router.push({ name: 'email-verify', query: { email } })
}

async function onGoogle() {
  error.value = null
  const { error: err } = await loginWithGoogle()
  if (err) error.value = translateAuthError(err.message)
}
</script>

<template>
  <section class="auth">
    <h1>Crear cuenta</h1>

    <RoleSelectorForm v-if="!selectedRole" @select="onSelectRole" />

    <template v-else>
      <p class="role-line">
        Te registrás como
        <strong>{{ selectedRole === 'tutor' ? 'dueño de mascota' : 'proveedor de servicios' }}</strong>.
        <button type="button" class="link" @click="changeRole">Cambiar</button>
      </p>

      <EmailPasswordForm
        submit-label="Crear cuenta"
        :loading="loading"
        :error="error"
        show-password-hint
        @submit="onSubmit"
      />

      <!-- OAuth solo para Tutor: por OAuth el rol no se puede fijar y cae a `tutor`. -->
      <template v-if="selectedRole === 'tutor'">
        <div class="divider"><span>o</span></div>
        <OAuthButtons @google="onGoogle" />
      </template>

      <p class="alt">¿Ya tenés cuenta? <RouterLink to="/login">Ingresá</RouterLink></p>
    </template>
  </section>
</template>

<style scoped>
.auth {
  max-width: 420px;
  margin: 0 auto;
}
.role-line {
  color: var(--color-muted);
  margin-bottom: 16px;
}
.link {
  border: none;
  background: none;
  color: var(--color-primary);
  cursor: pointer;
  padding: 0;
  font: inherit;
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
</style>
