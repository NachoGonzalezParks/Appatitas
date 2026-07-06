import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Sprint 0 · S0-06 — Scaffold base de la PWA.
// El Service Worker y el Web App Manifest (vite-plugin-pwa) se integran en el Día 2.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
})
