import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para la PWA.
// Lee la URL y la anon key de las variables de entorno (VITE_*). Ver .env.example.
// Los valores reales del proyecto staging los provee Dev 1 (S0-01).
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
