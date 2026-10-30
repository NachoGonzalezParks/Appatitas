// Edge Function: mp-provider-onboarding (Sprint 4 · HU-005 · RN-002).
//
// Vincula la cuenta de Mercado Pago de un proveedor con Bafri (OAuth, flujo de
// código de autorización). Dos pasos:
//   1) INICIO (el proveedor logueado la llama): devuelve la URL de autorización de MP.
//   2) CALLBACK (MP redirige el navegador con ?code&state): intercambia el code por
//      los tokens del proveedor, los guarda en provider_mp_credentials (solo
//      service_role), marca el onboarding como 'active' y redirige al front.
//
// Nota de deploy: esta función NO verifica el JWT de Supabase automáticamente
// (verify_jwt=false en config.toml), porque el callback lo dispara MP sin sesión.
// El paso de inicio valida el JWT del proveedor a mano; el callback se protege con
// el `state`.
//
// ⚠️ Pendiente de ops/staging: registrar el redirect_uri en la app de MP y cargar
// los secrets (MP_CLIENT_ID, MP_CLIENT_SECRET, MP_REDIRECT_URI, FRONTEND_URL). La
// prueba e2e del OAuth se hace en sandbox (requiere interacción real con MP).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createAdminClient } from '../_shared/supabase-client.ts'
import { buildAuthorizationUrl, computeExpiresAt, tokenExchangeBody } from './oauth.ts'

const MP_TOKEN_URL = 'https://api.mercadopago.com/oauth/token'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function frontendRedirect(result: 'ok' | 'error'): Response {
  const base = Deno.env.get('FRONTEND_URL') ?? 'http://localhost:5173'
  return new Response(null, { status: 302, headers: { Location: `${base}/proveedor/onboarding?mp=${result}` } })
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  // MP vuelve con ?code&state → es el callback. Si no, es el inicio.
  if (url.searchParams.has('code')) return handleCallback(url)
  return handleStart(req)
})

// --- Paso 1: inicio (proveedor logueado) -----------------------------------
async function handleStart(req: Request): Promise<Response> {
  const clientId = Deno.env.get('MP_CLIENT_ID')
  const redirectUri = Deno.env.get('MP_REDIRECT_URI')
  if (!clientId || !redirectUri) return json({ ok: false, error: 'MP no configurado' }, 500)

  // Identificamos al proveedor por su JWT (verify_jwt está apagado, lo validamos acá).
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
  )
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return json({ ok: false, error: 'No autenticado' }, 401)

  const admin = createAdminClient()
  const { data: provider } = await admin
    .from('providers')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!provider) return json({ ok: false, error: 'El usuario no tiene perfil de proveedor' }, 400)

  // Generamos y guardamos el `state` (anti-CSRF + correlación).
  const state = crypto.randomUUID()
  const { error: stateErr } = await admin
    .from('mp_oauth_states')
    .insert({ state, provider_id: provider.id })
  if (stateErr) return json({ ok: false, error: stateErr.message }, 500)

  await admin.from('providers').update({ onboarding_status: 'mp_pending' }).eq('id', provider.id)

  return json({ ok: true, authorization_url: buildAuthorizationUrl(clientId, redirectUri, state) })
}

// --- Paso 2: callback (lo dispara MP) --------------------------------------
async function handleCallback(url: URL): Promise<Response> {
  const code = url.searchParams.get('code')!
  const state = url.searchParams.get('state')
  const clientId = Deno.env.get('MP_CLIENT_ID')
  const clientSecret = Deno.env.get('MP_CLIENT_SECRET')
  const redirectUri = Deno.env.get('MP_REDIRECT_URI')
  if (!state || !clientId || !clientSecret || !redirectUri) return frontendRedirect('error')

  const admin = createAdminClient()

  // Validamos el `state` (existe y no venció).
  const { data: stateRow } = await admin
    .from('mp_oauth_states')
    .select('provider_id, expires_at')
    .eq('state', state)
    .single()
  if (!stateRow || new Date(stateRow.expires_at) < new Date()) return frontendRedirect('error')

  // Intercambiamos el code por los tokens del proveedor (server-side).
  let tokens: { access_token?: string; refresh_token?: string; user_id?: number; expires_in?: number }
  try {
    const res = await fetch(MP_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(tokenExchangeBody(clientId, clientSecret, code, redirectUri)),
    })
    if (!res.ok) return frontendRedirect('error')
    tokens = await res.json()
  } catch {
    return frontendRedirect('error')
  }
  if (!tokens.access_token || !tokens.user_id) return frontendRedirect('error')

  const mpUserId = String(tokens.user_id)
  const expiresAt = tokens.expires_in ? computeExpiresAt(tokens.expires_in, new Date()) : null

  // Guardamos las credenciales (tabla service-role-only) y activamos el onboarding.
  const { error: credErr } = await admin.from('provider_mp_credentials').upsert({
    provider_id: stateRow.provider_id,
    mp_user_id: mpUserId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  })
  if (credErr) return frontendRedirect('error')

  await admin
    .from('providers')
    .update({ mp_user_id: mpUserId, onboarding_status: 'active' })
    .eq('id', stateRow.provider_id)

  // El `state` es de un solo uso.
  await admin.from('mp_oauth_states').delete().eq('state', state)

  return frontendRedirect('ok')
}
