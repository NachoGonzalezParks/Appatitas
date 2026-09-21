<script setup lang="ts">
import { ref, computed } from 'vue'

// Selector de foto reutilizable (avatar de Tutor HU-002, foto de mascota HU-003).
// Muestra preview y emite el File elegido; el padre decide cuándo/dónde subirlo.
const props = defineProps<{
  modelUrl: string | null
  label?: string
  rounded?: boolean
}>()

const emit = defineEmits<{ change: [file: File] }>()

const localPreview = ref<string | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const preview = computed(() => localPreview.value ?? props.modelUrl)

const MAX_MB = 5

function onPick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > MAX_MB * 1024 * 1024) {
    emit('change', file) // el padre valida/avisa si hace falta
  }
  localPreview.value = URL.createObjectURL(file)
  emit('change', file)
}
</script>

<template>
  <div class="uploader">
    <button
      type="button"
      class="thumb"
      :class="{ rounded }"
      @click="inputEl?.click()"
      aria-label="Elegir foto"
    >
      <img v-if="preview" :src="preview" alt="" />
      <span v-else class="plus" aria-hidden="true">＋</span>
    </button>
    <button type="button" class="pick" @click="inputEl?.click()">
      {{ label ?? 'Elegir foto' }}
    </button>
    <input ref="inputEl" type="file" accept="image/*" hidden @change="onPick" />
  </div>
</template>

<style scoped>
.uploader {
  display: flex;
  align-items: center;
  gap: 12px;
}
.thumb {
  width: 84px;
  height: 84px;
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  background: var(--color-bg);
  cursor: pointer;
  overflow: hidden;
  display: grid;
  place-items: center;
  padding: 0;
}
.thumb.rounded {
  border-radius: 50%;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.plus {
  font-size: 28px;
  color: var(--color-muted);
}
.pick {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px 12px;
  background: var(--color-bg);
  cursor: pointer;
}
</style>
