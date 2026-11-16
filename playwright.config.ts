import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  timeout: 45_000,
  use: {
    baseURL: 'http://127.0.0.1:4175/longtan-street/',
    actionTimeout: 8_000,
    ...(process.env.PLAYWRIGHT_EDGE === '1' ? { channel: 'msedge' } : {}),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', testMatch: '**/desktop.spec.ts', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', testMatch: '**/mobile.spec.ts', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node tests/serve-pages.mjs',
    url: 'http://127.0.0.1:4175/longtan-street/',
    reuseExistingServer: false,
  },
})
