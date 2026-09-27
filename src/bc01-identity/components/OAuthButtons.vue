<script setup lang="ts">
import { features } from '@/lib/features'

// Botones de login social (HU-001). Facebook está detrás de un feature flag
// (diferido hasta la aprobación de Meta — ver docs/plan-desbloqueo.md).
const emit = defineEmits<{ google: [] }>()
</script>

<template>
  <div class="oauth">
    <button type="button" class="oauth-btn google" @click="emit('google')">
      <span aria-hidden="true">🔵</span> Continuar con Google
    </button>

    <button
      type="button"
      class="oauth-btn facebook"
      :disabled="!features.facebookLogin"
      :title="features.facebookLogin ? '' : 'Disponible próximamente'"
    >
      <span aria-hidden="true">🔷</span> Continuar con Facebook
      <span v-if="!features.facebookLogin" class="soon">(próximamente)</span>
    </button>
  </div>
</template>

<style scoped>
.oauth {
  display: grid;
  gap: 10px;
}
.oauth-btn {
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  font-size: 0.95rem;
  cursor: pointer;
}
.oauth-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
}
.oauth-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.soon {
  color: var(--color-muted);
  font-size: 0.85rem;
}
</style>
