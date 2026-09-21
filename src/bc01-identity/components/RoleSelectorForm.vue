<script setup lang="ts">
import type { AppRole } from '@/stores/auth.store'

// Selección de rol al registrarse (HU-001 / HU-005).
const emit = defineEmits<{ select: [role: AppRole] }>()
</script>

<template>
  <div class="roles">
    <button type="button" class="role-card" @click="emit('select', 'tutor')">
      <span class="role-emoji" aria-hidden="true">🐾</span>
      <h3>Soy dueño de mascota</h3>
      <p>Llevá la salud de tu mascota al día y encontrá servicios cerca tuyo.</p>
    </button>

    <button type="button" class="role-card" @click="emit('select', 'provider')">
      <span class="role-emoji" aria-hidden="true">🧰</span>
      <h3>Ofrezco servicios</h3>
      <p>Publicá tus servicios profesionales para mascotas.</p>
    </button>
  </div>
</template>

<style scoped>
.roles {
  display: grid;
  gap: 12px;
}
.role-card {
  display: block;
  width: 100%;
  text-align: left;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-bg);
  cursor: pointer;
}
.role-card:hover {
  border-color: var(--color-primary);
}
.role-emoji {
  font-size: 24px;
}
.role-card h3 {
  margin: 8px 0 4px;
}
.role-card p {
  margin: 0;
  color: var(--color-muted);
}
</style>
