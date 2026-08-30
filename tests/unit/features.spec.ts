import { afterEach, describe, expect, it, vi } from 'vitest'

// Test unitario de ejemplo (lógica pura): el feature flag de Facebook.
// Muestra cómo testear una función que lee variables de entorno (VITE_*).

describe('features — feature flags', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('facebookLogin es false cuando VITE_ENABLE_FACEBOOK no es "true"', async () => {
    vi.stubEnv('VITE_ENABLE_FACEBOOK', 'false')
    const { features } = await import('@/lib/features')
    expect(features.facebookLogin).toBe(false)
  })

  it('facebookLogin es true solo cuando VITE_ENABLE_FACEBOOK === "true"', async () => {
    vi.stubEnv('VITE_ENABLE_FACEBOOK', 'true')
    const { features } = await import('@/lib/features')
    expect(features.facebookLogin).toBe(true)
  })
})
