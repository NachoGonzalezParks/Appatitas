import { defineConfig, devices } from '@playwright/test'

// Config de Playwright (tests e2e). Levanta la app con `npm run dev` y corre los
// tests contra http://localhost:5173. Ver docs/rfcs/RFC-004 y ADR-007.
//
// Antes de correr por primera vez: `npx playwright install chromium`.
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
