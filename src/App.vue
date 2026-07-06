<script setup lang="ts">
// Layout raíz de la PWA. En Sprint 0 solo enmarca el router-view.
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <RouterLink to="/" class="brand">APPATITAS</RouterLink>
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border, #e5e5e5);
}

.brand {
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-text, #1a1a1a);
  text-decoration: none;
}

.app-main {
  flex: 1;
  padding: 16px;
}
</style>
