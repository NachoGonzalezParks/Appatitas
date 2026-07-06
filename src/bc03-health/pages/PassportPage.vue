<script setup lang="ts">
import { useRoute } from 'vue-router'

// Pasaporte compartido público (HU-011). Ruta: /passport/:hash — sin sesión (RN-009).
// La carga real por hash y su validación de expiración se implementan en Sprint 2 (S2-05).
const route = useRoute()
const hash = route.params.hash as string
</script>

<template>
  <section>
    <h1>Pasaporte de salud</h1>
    <p>Ruta pública sin sesión (HU-011).</p>
    <p class="hash">hash: {{ hash }}</p>
    <p class="todo">Contenido del pasaporte — pendiente de Sprint 2 (S2-05).</p>
  </section>
</template>

<style scoped>
.hash {
  font-family: monospace;
}
.todo {
  color: var(--color-muted);
}
</style>
