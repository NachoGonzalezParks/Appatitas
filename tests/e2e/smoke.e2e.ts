import { expect, test } from '@playwright/test'

// Test e2e de humo (smoke): la app levanta y responde en la home.
// Los flujos por HU (registro → login, cargar mascota, etc.) se agregan en sus
// sprints correspondientes. Ver docs/rfcs/RFC-004 y ADR-007.

test('la app responde en la home', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.ok()).toBeTruthy()
  await expect(page.locator('#app')).toBeVisible()
})
