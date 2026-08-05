<script setup lang="ts">
import { useRoute } from 'vue-router'

// Login — la autenticación real se implementa en Sprint 1 (S1-01, HU-001).
// En Sprint 0 es un placeholder; sirve como destino del guard de rutas privadas.
const route = useRoute()
const redirect = (route.query.redirect as string) ?? '/'
</script>

<template>
  <section>
    <h1>Ingresar</h1>
    <p>La autenticación se implementa en Sprint 1 (HU-001).</p>
    <p v-if="redirect !== '/'" class="muted">Destino tras iniciar sesión: {{ redirect }}</p>

    <nav class="public-links">
      <p>Mientras tanto, secciones públicas (sin cuenta):</p>
      <ul>
        <li><RouterLink to="/mapa">Mapa comunitario</RouterLink></li>
        <li><RouterLink to="/encontrada">Reportar mascota encontrada</RouterLink></li>
      </ul>
    </nav>
  </section>
</template>

<style scoped>
.muted {
  color: var(--color-muted);
}
.public-links {
  margin-top: 16px;
  color: var(--color-muted);
}
</style>
