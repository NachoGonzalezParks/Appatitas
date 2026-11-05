import { describe, expect, it } from 'vitest'
import {
  buildAuthorizationUrl,
  computeExpiresAt,
  tokenExchangeBody,
} from '../../supabase/functions/mp-provider-onboarding/oauth'

// Tests de la lógica pura del onboarding OAuth de Mercado Pago (HU-005).

describe('buildAuthorizationUrl', () => {
  it('arma la URL de autorización con los parámetros correctos', () => {
    const u = new URL(buildAuthorizationUrl('CLIENT123', 'https://app.bafri/callback', 'st-1'))
    expect(u.origin + u.pathname).toBe('https://auth.mercadopago.com/authorization')
    expect(u.searchParams.get('response_type')).toBe('code')
    expect(u.searchParams.get('client_id')).toBe('CLIENT123')
    expect(u.searchParams.get('redirect_uri')).toBe('https://app.bafri/callback')
    expect(u.searchParams.get('state')).toBe('st-1')
  })
})

describe('tokenExchangeBody', () => {
  it('arma el cuerpo del intercambio de code por tokens', () => {
    expect(tokenExchangeBody('cid', 'secret', 'the-code', 'https://cb')).toEqual({
      client_id: 'cid',
      client_secret: 'secret',
      code: 'the-code',
      grant_type: 'authorization_code',
      redirect_uri: 'https://cb',
    })
  })
})

describe('computeExpiresAt', () => {
  it('suma expires_in (segundos) a la fecha actual', () => {
    const now = new Date(Date.UTC(2026, 0, 1, 0, 0, 0))
    expect(computeExpiresAt(3600, now)).toBe('2026-01-01T01:00:00.000Z')
  })
})
