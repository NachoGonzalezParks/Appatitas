import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './styles/base.css'

// Punto de entrada de la PWA (S0-06).
// Estado global vía stores `reactive` (patrón de Dev1, ver src/stores/).
// La inicialización de sesión (initAuth) se cablea en Sprint 1 (S1-01).
// El registro del Service Worker se agrega en el Día 2.
const app = createApp(App)

app.use(router)

app.mount('#app')
