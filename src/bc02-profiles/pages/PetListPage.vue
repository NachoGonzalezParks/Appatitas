<script setup lang="ts">
import { onMounted } from 'vue'
import { petStore, loadPets } from '@/stores/pet.store'
import PetCard from '../components/PetCard.vue'

// HU-003/004 — Listado de mascotas del Tutor.
onMounted(loadPets)
</script>

<template>
  <section class="pets">
    <header class="head">
      <h1>Mis mascotas</h1>
      <RouterLink class="add" :to="{ name: 'pet-new' }">+ Agregar</RouterLink>
    </header>

    <p v-if="petStore.loading" class="muted">Cargando…</p>

    <template v-else>
      <p v-if="petStore.pets.length === 0" class="empty">
        Todavía no registraste ninguna mascota.
        <RouterLink :to="{ name: 'pet-new' }">Agregá la primera</RouterLink>.
      </p>

      <div v-else class="list">
        <PetCard v-for="pet in petStore.pets" :key="pet.id" :pet="pet" />
      </div>
    </template>
  </section>
</template>

<style scoped>
.pets {
  max-width: 520px;
  margin: 0 auto;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.add {
  padding: 8px 12px;
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}
.muted,
.empty {
  color: var(--color-muted);
}
.list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}
</style>
