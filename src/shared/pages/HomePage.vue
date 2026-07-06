<script setup lang="ts">
// Home / dashboard — se desarrolla en Sprint 1. Placeholder de scaffold (S0-06).
</script>

<template>
  <section>
    <h1>APPATITAS</h1>
    <p>Scaffold inicial de la PWA (Sprint 0 · S0-06).</p>
    <nav class="links">
      <p>Rutas públicas disponibles:</p>
      <ul>
        <li><RouterLink to="/mapa">/mapa</RouterLink> — Mapa comunitario (HU-013)</li>
        <li><RouterLink to="/encontrada">/encontrada</RouterLink> — Reporte de encontrada (HU-014)</li>
        <li><RouterLink to="/passport/demo">/passport/:hash</RouterLink> — Pasaporte compartido (HU-011)</li>
      </ul>
    </nav>
  </section>
</template>

<style scoped>
.links {
  margin-top: 16px;
  color: var(--color-muted);
}
</style>
