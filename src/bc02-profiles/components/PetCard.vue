<script setup lang="ts">
import { computed } from 'vue'
import { PET_SPECIES, type Pet } from '../services/pet.service'

const props = defineProps<{ pet: Pet }>()

const speciesLabel = computed(
  () => PET_SPECIES.find((s) => s.value === props.pet.species)?.label ?? props.pet.species,
)
</script>

<template>
  <article class="pet-card">
    <div class="photo">
      <img v-if="pet.photo_url" :src="pet.photo_url" alt="" />
      <span v-else aria-hidden="true">🐾</span>
    </div>
    <div class="info">
      <h3>{{ pet.name }}</h3>
      <p class="muted">{{ speciesLabel }}<span v-if="pet.breed"> · {{ pet.breed }}</span></p>
    </div>
    <RouterLink class="edit" :to="{ name: 'pet-edit', params: { id: pet.id } }">Editar</RouterLink>
  </article>
</template>

<style scoped>
.pet-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
.photo {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  background: #f1f5f9;
  display: grid;
  place-items: center;
  font-size: 24px;
  flex-shrink: 0;
}
.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.info {
  flex: 1;
  min-width: 0;
}
.info h3 {
  margin: 0;
}
.muted {
  margin: 2px 0 0;
  color: var(--color-muted);
}
.edit {
  color: var(--color-primary);
  text-decoration: none;
}
</style>
