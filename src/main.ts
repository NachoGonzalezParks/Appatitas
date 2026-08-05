import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { initAuth } from './stores/auth.store'
import './styles/base.css'

// Punto de entrada de la PWA (S0-06).
// Estado global vía stores `reactive` (patrón de Dev1, ver src/stores/).
// El Service Worker lo registra vite-plugin-pwa (S0-06, Día 2).
const app = createApp(App)

app.use(router)

// Inicializa la sesión de Supabase Auth ANTES de montar, para que los guards
// del router tengan el estado de autenticación disponible en el primer render.
// getSession() lee el almacenamiento local (sin red), así que no bloquea el
// arranque aunque no haya conexión al backend.
initAuth().finally(() => {
  app.mount('#app')
})
