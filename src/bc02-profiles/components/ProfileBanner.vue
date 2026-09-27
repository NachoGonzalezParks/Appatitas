<script setup lang="ts">
// Banner persistente de progreso del perfil (HU-002). Solo se muestra si el
// perfil está incompleto (< 100%).
defineProps<{ percent: number }>()
</script>

<template>
  <div v-if="percent < 100" class="banner" role="status">
    <div class="head">
      <strong>Perfil {{ percent }}% completo</strong>
      <span class="hint">Completá tu perfil para aprovechar mejor APPATITAS.</span>
    </div>
    <div class="bar"><div class="fill" :style="{ width: percent + '%' }" /></div>
  </div>
</template>

<style scoped>
.banner {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 18px;
  background: #eff6ff;
}
.head {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  align-items: baseline;
  margin-bottom: 8px;
}
.hint {
  color: var(--color-muted);
  font-size: 0.9rem;
}
.bar {
  height: 8px;
  border-radius: 999px;
  background: #dbeafe;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.2s ease;
}
</style>
