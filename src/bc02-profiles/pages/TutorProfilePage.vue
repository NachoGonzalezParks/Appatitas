<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import {
  getProfile,
  saveProfile,
  uploadAvatar,
  profileCompleteness,
} from '../services/tutor.service'
import { CORDOBA_NEIGHBORHOODS } from '../data/cordoba-neighborhoods'
import ProfileBanner from '../components/ProfileBanner.vue'
import PhotoUploader from '../components/PhotoUploader.vue'

// HU-002 — Completar perfil de Tutor.
const form = reactive({
  fullName: '',
  phone: '',
  neighborhood: '',
  avatarUrl: null as string | null,
  locationId: null as string | null,
})

const avatarFile = ref<File | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const savedOk = ref(false)

const percent = computed(() =>
  profileCompleteness({
    fullName: form.fullName,
    neighborhood: form.neighborhood,
    // Si eligió una foto nueva aún no subida, ya cuenta para el progreso.
    avatarUrl: avatarFile.value ? 'pending' : form.avatarUrl,
    phone: form.phone,
  }),
)

onMounted(async () => {
  const { data, error: err } = await getProfile()
  if (err) error.value = 'No pudimos cargar tu perfil.'
  else if (data) Object.assign(form, data)
  loading.value = false
})

function onAvatarChange(file: File) {
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'La imagen supera los 5 MB.'
    return
  }
  error.value = null
  avatarFile.value = file
}

async function onSave() {
  saving.value = true
  error.value = null
  savedOk.value = false

  // 1. Sube el avatar si se eligió uno nuevo.
  if (avatarFile.value) {
    const { url, error: upErr } = await uploadAvatar(avatarFile.value)
    if (upErr) {
      saving.value = false
      error.value = 'No se pudo subir la foto. Intentá de nuevo.'
      return
    }
    form.avatarUrl = url
    avatarFile.value = null
  }

  // 2. Guarda el perfil.
  const { error: saveErr } = await saveProfile({
    fullName: form.fullName,
    phone: form.phone,
    neighborhood: form.neighborhood,
    avatarUrl: form.avatarUrl,
    locationId: form.locationId,
  })

  saving.value = false
  if (saveErr) {
    error.value = 'No se pudo guardar el perfil. Intentá de nuevo.'
    return
  }
  savedOk.value = true
  // Recarga para tomar el location_id nuevo.
  const { data } = await getProfile()
  if (data) Object.assign(form, data)
}
</script>

<template>
  <section class="profile">
    <h1>Mi perfil</h1>

    <p v-if="loading" class="muted">Cargando…</p>

    <template v-else>
      <ProfileBanner :percent="percent" />

      <form class="form" @submit.prevent="onSave">
        <div class="avatar-row">
          <PhotoUploader :model-url="form.avatarUrl" rounded label="Foto de perfil" @change="onAvatarChange" />
        </div>

        <label class="field">
          <span>Nombre completo</span>
          <input v-model="form.fullName" type="text" placeholder="Tu nombre y apellido" />
        </label>

        <label class="field">
          <span>Barrio / zona</span>
          <select v-model="form.neighborhood">
            <option value="">Elegí tu barrio…</option>
            <option v-for="n in CORDOBA_NEIGHBORHOODS" :key="n.name" :value="n.name">{{ n.name }}</option>
          </select>
        </label>

        <label class="field">
          <span>Teléfono <small class="muted">(opcional)</small></span>
          <input v-model="form.phone" type="tel" placeholder="351 123 4567" />
        </label>

        <p v-if="error" class="err" role="alert">{{ error }}</p>
        <p v-if="savedOk" class="ok" role="status">Perfil guardado ✓</p>

        <button type="submit" class="save" :disabled="saving">
          {{ saving ? 'Guardando…' : 'Guardar' }}
        </button>
      </form>
    </template>
  </section>
</template>

<style scoped>
.profile {
  max-width: 480px;
  margin: 0 auto;
}
.muted {
  color: var(--color-muted);
}
.form {
  display: grid;
  gap: 16px;
}
.avatar-row {
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
.err {
  color: #dc2626;
  margin: 0;
}
.ok {
  color: #16a34a;
  margin: 0;
}
.save {
  padding: 11px 14px;
  border: none;
  border-radius: 8px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
}
.save:disabled {
  opacity: 0.6;
}
</style>
