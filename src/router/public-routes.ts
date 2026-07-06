import type { RouteRecordRaw } from 'vue-router'

// Rutas públicas — accesibles SIN sesión.
// El SDD fija exactamente estas tres (docs/architecture/security.md §2.3):
//   /passport/:hash  → HU-011 (pasaporte compartido)
//   /mapa            → HU-013 (mapa comunitario de alertas)
//   /encontrada      → HU-014 (reporte de mascota encontrada)
export const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/passport/:hash',
    name: 'passport-public',
    component: () => import('@/bc03-health/pages/PassportPage.vue'),
    meta: { public: true },
  },
  {
    path: '/mapa',
    name: 'community-map',
    component: () => import('@/bc04-community/pages/CommunityMapPage.vue'),
    meta: { public: true },
  },
  {
    path: '/encontrada',
    name: 'found-pet',
    component: () => import('@/bc04-community/pages/FoundPetFormPage.vue'),
    meta: { public: true },
  },
]
