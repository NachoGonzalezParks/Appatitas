import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para la PWA.
// - En staging/producción usa las VITE_* del entorno (ver .env.example).
// - En desarrollo local, si no hay .env.local, cae por defecto al proyecto de
//   Supabase CLI (http://localhost:54321) para que la app arranque igual.
//   Ver CONTRIBUTING.md §2 (cada dev corre Supabase local).
//
// TODO(Dev1 · S0-01): para habilitar el cliente TIPADO `createClient<Database>`
// (queries type-safe), src/shared/types/supabase.types.ts debe ser conforme a
// supabase-js: `public` con `Views`/`Functions`/`Enums`/`CompositeTypes` y cada
// tabla con `Relationships: []` (y `Update` como objeto, no `never`). Se obtiene
// con `supabase gen types typescript`. Hasta entonces el cliente queda sin
// genérico; las entidades igual se tipan desde los Row types del mismo archivo.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'local-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
