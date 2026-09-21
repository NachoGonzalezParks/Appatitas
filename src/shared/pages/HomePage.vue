<script setup lang="ts">
import { useRouter } from 'vue-router'
import { authStore } from '@/stores/auth.store'
import { logout } from '@/bc01-identity/services/auth.service'

// Home / dashboard del usuario autenticado. Se enriquece en HU-002 (perfil) y
// HU-003 (mascotas). En HU-001 solo confirma sesión + salida.
const router = useRouter()

async function onLogout() {
  await logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <section class="home">
    <h1>Hola 👋</h1>
    <p v-if="authStore.user" class="muted">
      {{ authStore.user.email }}
      <span v-if="authStore.activeRole"> · {{ authStore.activeRole }}</span>
    </p>

    <nav class="tiles">
      <RouterLink class="tile" to="/mapa">🗺️ Mapa comunitario</RouterLink>
      <RouterLink class="tile" to="/encontrada">🐕 Reportar encontrada</RouterLink>
    </nav>

    <button type="button" class="logout" @click="onLogout">Cerrar sesión</button>
  </section>
</template>

<style scoped>
.home {
  max-width: 520px;
  margin: 0 auto;
}
.muted {
  color: var(--color-muted);
}
.tiles {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;
  margin: 20px 0;
}
.tile {
  display: block;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  text-decoration: none;
  color: var(--color-text);
}
.tile:hover {
  border-color: var(--color-primary);
}
.logout {
  padding: 9px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  cursor: pointer;
}
</style>
