import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// Sprint 0 · S0-06 — PWA: Web App Manifest + Service Worker (Día 2).
// Estrategia injectManifest con un SW propio (src/sw.ts) para poder cablear
// el receptor de Web Push (HU-009/012/014), no solo el cache offline.
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // El SW propio no usa el precache de Workbox en Sprint 0 (cachea el shell
      // a mano), por eso deshabilitamos el injection point de __WB_MANIFEST.
      injectManifest: {
        injectionPoint: undefined,
      },
      devOptions: {
        enabled: false, // SW desactivado en dev para evitar caché durante el desarrollo
      },
      manifest: {
        name: 'APPATITAS',
        short_name: 'APPATITAS',
        description: 'Servicios y cuidado para tu mascota en Córdoba.',
        lang: 'es',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: '#2563eb', // provisional — a definir por diseño
        background_color: '#ffffff', // provisional — a definir por diseño
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
})
