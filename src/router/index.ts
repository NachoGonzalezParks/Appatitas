import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { publicRoutes } from './public-routes'
import { authGuard } from './guards'

// Rutas privadas — requieren sesión (guard real en Sprint 1).
// En Sprint 0 solo dejamos cableada la estructura; las páginas se completan
// en sus sprints correspondientes.
const privateRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/shared/pages/HomePage.vue'),
    meta: { public: false },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/bc01-identity/pages/LoginPage.vue'),
    meta: { public: true },
  },
]

const routes: RouteRecordRaw[] = [
  ...publicRoutes,
  ...privateRoutes,
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/shared/pages/NotFoundPage.vue'),
    meta: { public: true },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(authGuard)
