<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { resendVerificationEmail, translateAuthError } from '../services/auth.service'

// HU-001 — Pantalla de "verificá tu email" (RN-004). El usuario llega acá tras
// registrarse o al intentar ingresar sin haber confirmado el email.
const route = useRoute()
const email = (route.query.email as string) || ''

const sending = ref(false)
const sent = ref(false)
const error = ref<string | null>(null)

async function resend() {
  if (!email) return
  sending.value = true
  error.value = null
  sent.value = false
  const { error: err } = await resendVerificationEmail(email)
  sending.value = false
  if (err) error.value = translateAuthError(err.message)
  else sent.value = true
}
</script>

<template>
  <section class="verify">
    <span class="emoji" aria-hidden="true">📩</span>
    <h1>Revisá tu email</h1>
    <p>
      Te enviamos un enlace de verificación<span v-if="email"> a <strong>{{ email }}</strong></span>.
      Hacé clic en el enlace para activar tu cuenta.
    </p>
    <p class="muted">Si no lo ves, revisá la carpeta de spam.</p>

    <button type="button" class="resend" :disabled="sending || !email" @click="resend">
      {{ sending ? 'Reenviando…' : 'Reenviar email' }}
    </button>

    <p v-if="sent" class="ok" role="status">Listo, te reenviamos el email.</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>

    <p class="alt"><RouterLink to="/login">Volver a ingresar</RouterLink></p>
  </section>
</template>

<style scoped>
.verify {
  max-width: 420px;
  margin: 0 auto;
  text-align: center;
}
.emoji {
  font-size: 40px;
}
.muted {
  color: var(--color-muted);
}
.resend {
  margin-top: 12px;
  padding: 10px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  cursor: pointer;
}
.resend:disabled {
  opacity: 0.6;
  cursor: default;
}
.ok {
  color: #16a34a;
}
.err {
  color: #dc2626;
}
.alt {
  margin-top: 20px;
}
</style>
