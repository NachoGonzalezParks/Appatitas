<script setup lang="ts">
import { ref, computed } from 'vue'

// Formulario reutilizable de email + contraseña (login y registro · HU-001).
const props = defineProps<{
  submitLabel: string
  loading?: boolean
  error?: string | null
  // Muestra la ayuda de longitud mínima (en registro).
  showPasswordHint?: boolean
}>()

const emit = defineEmits<{ submit: [email: string, password: string] }>()

const email = ref('')
const password = ref('')
const touched = ref(false)

const MIN_PASSWORD = 8
const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
const passwordValid = computed(() => password.value.length >= MIN_PASSWORD)
const canSubmit = computed(() => emailValid.value && passwordValid.value && !props.loading)

function onSubmit() {
  touched.value = true
  if (canSubmit.value) emit('submit', email.value.trim(), password.value)
}
</script>

<template>
  <form class="ep-form" novalidate @submit.prevent="onSubmit">
    <label class="field">
      <span>Email</span>
      <input
        v-model="email"
        type="email"
        autocomplete="email"
        placeholder="tu@email.com"
        :aria-invalid="touched && !emailValid"
      />
      <small v-if="touched && !emailValid" class="hint-error">Ingresá un email válido.</small>
    </label>

    <label class="field">
      <span>Contraseña</span>
      <input
        v-model="password"
        type="password"
        :autocomplete="showPasswordHint ? 'new-password' : 'current-password'"
        placeholder="••••••••"
        :aria-invalid="touched && !passwordValid"
      />
      <small v-if="showPasswordHint" class="hint">Mínimo {{ MIN_PASSWORD }} caracteres.</small>
      <small v-if="touched && !passwordValid" class="hint-error">
        La contraseña debe tener al menos {{ MIN_PASSWORD }} caracteres.
      </small>
    </label>

    <p v-if="error" class="form-error" role="alert">{{ error }}</p>

    <button type="submit" class="submit" :disabled="loading">
      {{ loading ? 'Procesando…' : submitLabel }}
    </button>
  </form>
</template>

<style scoped>
.ep-form {
  display: grid;
  gap: 14px;
}
.field {
  display: grid;
  gap: 6px;
}
.field span {
  font-weight: 600;
  font-size: 0.9rem;
}
.field input {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
}
.field input[aria-invalid='true'] {
  border-color: #dc2626;
}
.hint {
  color: var(--color-muted);
}
.hint-error {
  color: #dc2626;
}
.form-error {
  color: #dc2626;
  margin: 0;
}
.submit {
  padding: 11px 14px;
  border: none;
  border-radius: 8px;
  background: var(--color-primary);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}
.submit:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
