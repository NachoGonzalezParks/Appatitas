import { createClient } from '@supabase/supabase-js'
import type { Database } from '../shared/types/supabase.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'local-anon-key'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
