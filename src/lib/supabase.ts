import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para la PWA.
// - En staging/producción usa las VITE_* del entorno (ver .env.example).
// - En desarrollo local, si no hay .env.local, cae por defecto al proyecto de
//   Supabase CLI (http://localhost:54321) para que la app arranque igual.
//   Ver CONTRIBUTING.md §2 (cada dev corre Supabase local).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'local-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
