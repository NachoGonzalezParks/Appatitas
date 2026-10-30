// Lógica pura del onboarding OAuth de Mercado Pago (HU-005 · RN-002), sin Deno ni
// red, para poder testearla con Vitest. index.ts (Deno) la usa.

const MP_AUTH_BASE = 'https://auth.mercadopago.com/authorization'

// Arma la URL a la que se envía al proveedor para que autorice a Bafri en MP.
// response_type=code (flujo de código de autorización). El redirect_uri debe
// coincidir EXACTO con el registrado en la app de MP.
export function buildAuthorizationUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  })
  return `${MP_AUTH_BASE}?${params.toString()}`
}

// Cuerpo del intercambio del `code` por tokens (POST /oauth/token).
export function tokenExchangeBody(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string,
): Record<string, string> {
  return {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  }
}

// Vencimiento del access token a partir de expires_in (segundos) que devuelve MP.
export function computeExpiresAt(expiresInSeconds: number, now: Date): string {
  return new Date(now.getTime() + expiresInSeconds * 1000).toISOString()
}
