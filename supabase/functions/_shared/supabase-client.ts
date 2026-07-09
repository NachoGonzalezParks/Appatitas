// Cliente Supabase con service_role para uso desde Edge Functions (Sprint 0).
//
// El service_role OMITE Row Level Security: usar exclusivamente en el servidor
// (Edge Functions), nunca exponer esta clave al cliente. Los crons de HU-009,
// HU-012 y HU-014 lo usan para leer push_subscriptions de todos los usuarios.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export function createAdminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
