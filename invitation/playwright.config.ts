import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const TEST_PORT = 4174
const only = (name: string) => (process.env.PW_BROWSERS ?? 'chromium').split(',').includes(name)

export default defineConfig({
  testDir: '.',
  testMatch: ['e2e/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      // Production build: exactly what visitors get.
      command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // Test-mode build: identical code, but accepts window.__WEDDING_CONFIG__ so tests can inject configurations.
      command: `npm run build:test && npx vite preview --outDir dist-test --port ${TEST_PORT} --strictPort`,
      url: `http://localhost:${TEST_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    ...(only('chromium') ? [{ name: 'chromium', testMatch: ['e2e/**/*.spec.ts'], use: { ...devices['Desktop Chrome'] } }] : []),
    ...(only('firefox') ? [{ name: 'firefox', testMatch: ['e2e/**/*.spec.ts'], use: { ...devices['Desktop Firefox'] } }] : []),
    ...(only('webkit') ? [{ name: 'webkit', testMatch: ['e2e/**/*.spec.ts'], use: { ...devices['Desktop Safari'] } }] : []),
  ],
})
