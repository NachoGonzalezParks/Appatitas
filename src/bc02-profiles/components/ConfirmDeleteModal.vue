<script setup lang="ts">
// Modal de confirmación de baja (HU-004).
defineProps<{ petName: string; loading?: boolean }>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <div class="overlay" @click.self="emit('cancel')">
    <div class="modal" role="dialog" aria-modal="true">
      <h2>Dar de baja a {{ petName }}</h2>
      <p>
        La mascota dejará de aparecer en tu lista. No se elimina de forma
        definitiva (se conserva el historial) y se cancelan sus turnos futuros.
      </p>
      <div class="actions">
        <button type="button" class="cancel" :disabled="loading" @click="emit('cancel')">
          Cancelar
        </button>
        <button type="button" class="danger" :disabled="loading" @click="emit('confirm')">
          {{ loading ? 'Procesando…' : 'Dar de baja' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 50;
}
.modal {
  background: var(--color-bg);
  border-radius: 14px;
  padding: 20px;
  max-width: 380px;
  width: 100%;
}
.modal h2 {
  margin-top: 0;
}
.modal p {
  color: var(--color-muted);
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}
.cancel {
  padding: 9px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  cursor: pointer;
}
.danger {
  padding: 9px 14px;
  border: none;
  border-radius: 8px;
  background: #dc2626;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.danger:disabled,
.cancel:disabled {
  opacity: 0.6;
}
</style>
