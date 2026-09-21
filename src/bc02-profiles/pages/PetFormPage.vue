<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createPet,
  updatePet,
  getPet,
  PET_SPECIES,
  type PetInput,
  type PetSpecies,
} from '../services/pet.service'
import PhotoUploader from '../components/PhotoUploader.vue'

// HU-003 (alta) / HU-004 (edición) — Formulario de mascota.
const route = useRoute()
const router = useRouter()
const petId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => Boolean(petId.value))

const form = reactive<PetInput>({
  name: '',
  species: 'perro',
  breed: '',
  birth_date: '',
  sex: '',
  weight_kg: null,
  color_marks: '',
  microchip_id: '',
})

const photoUrl = ref<string | null>(null)
const photoFile = ref<File | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const canSubmit = computed(
  () =>
    form.name.trim() !== '' &&
    form.breed.trim() !== '' &&
    form.birth_date !== '' &&
    form.sex !== '' &&
    form.weight_kg !== null &&
    form.weight_kg > 0,
)

onMounted(async () => {
  if (!isEdit.value) return
  loading.value = true
  const { data, error: err } = await getPet(petId.value as string)
  loading.value = false
  if (err || !data) {
    error.value = 'No se pudo cargar la mascota.'
    return
  }
  form.name = data.name
  form.species = data.species as PetSpecies
  form.breed = data.breed
  form.birth_date = data.birth_date ?? ''
  form.sex = data.sex ?? ''
  form.weight_kg = data.weight_kg
  form.color_marks = data.color_marks ?? ''
  form.microchip_id = data.microchip_id ?? ''
  photoUrl.value = data.photo_url
})

function onPhoto(file: File) {
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'La imagen supera los 5 MB.'
    return
  }
  error.value = null
  photoFile.value = file
}

function markMestizo() {
  form.breed = 'Mestizo'
}

async function onSubmit() {
  if (!canSubmit.value) return
  saving.value = true
  error.value = null

  const result = isEdit.value
    ? await updatePet(petId.value as string, form, photoFile.value)
    : await createPet(form, photoFile.value)

  saving.value = false
  if (result.error) {
    error.value = 'No se pudo guardar la mascota. Intentá de nuevo.'
    return
  }
  router.push({ name: 'pets' })
}
</script>

<template>
  <section class="pet-form">
    <h1>{{ isEdit ? 'Editar mascota' : 'Nueva mascota' }}</h1>

    <p v-if="loading" class="muted">Cargando…</p>

    <form v-else class="form" @submit.prevent="onSubmit">
      <div class="photo-row">
        <PhotoUploader :model-url="photoUrl" label="Foto de la mascota" @change="onPhoto" />
      </div>

      <label class="field">
        <span>Nombre *</span>
        <input v-model="form.name" type="text" placeholder="Nombre de tu mascota" />
      </label>

      <label class="field">
        <span>Especie *</span>
        <select v-model="form.species">
          <option v-for="s in PET_SPECIES" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
      </label>

      <label class="field">
        <span>Raza *</span>
        <input v-model="form.breed" type="text" placeholder="Raza" />
        <button type="button" class="mestizo" @click="markMestizo">Es mestizo/a</button>
      </label>

      <div class="grid2">
        <label class="field">
          <span>Fecha de nacimiento *</span>
          <input v-model="form.birth_date" type="date" />
        </label>
        <label class="field">
          <span>Sexo *</span>
          <select v-model="form.sex">
            <option value="">—</option>
            <option value="macho">Macho</option>
            <option value="hembra">Hembra</option>
          </select>
        </label>
      </div>

      <label class="field">
        <span>Peso aproximado (kg) *</span>
        <input v-model.number="form.weight_kg" type="number" min="0" step="0.1" placeholder="0.0" />
      </label>

      <label class="field">
        <span>Color / marcas <small class="muted">(opcional)</small></span>
        <input v-model="form.color_marks" type="text" placeholder="Ej: atigrado, mancha blanca" />
      </label>

      <label class="field">
        <span>Chip / microchip ID <small class="muted">(opcional)</small></span>
        <input v-model="form.microchip_id" type="text" placeholder="Número de chip" />
      </label>

      <p v-if="error" class="err" role="alert">{{ error }}</p>

      <div class="actions">
        <RouterLink class="cancel" :to="{ name: 'pets' }">Cancelar</RouterLink>
        <button type="submit" class="save" :disabled="saving || !canSubmit">
          {{ saving ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.pet-form {
  max-width: 480px;
  margin: 0 auto;
}
.muted {
  color: var(--color-muted);
}
.form {
  display: grid;
  gap: 14px;
}
.photo-row {
  display: flex;
  justify-content: center;
}
.field {
  display: grid;
  gap: 6px;
}
.field span {
  font-weight: 600;
  font-size: 0.9rem;
}
.field input,
.field select {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
}
.mestizo {
  justify-self: start;
  border: none;
  background: none;
  color: var(--color-primary);
  cursor: pointer;
  padding: 0;
  font-size: 0.85rem;
}
.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.err {
  color: #dc2626;
  margin: 0;
}
.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}
.cancel {
  color: var(--color-muted);
  text-decoration: none;
}
.save {
  padding: 11px 18px;
  border: none;
  border-radius: 8px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.save:disabled {
  opacity: 0.6;
}
</style>
