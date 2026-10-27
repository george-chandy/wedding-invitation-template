import { defineConfig } from '@playwright/test'

// Pure-function tests (time, calendar/ICS, config validation). No browser or server needed.
export default defineConfig({
  testDir: 'tests',
  testMatch: ['**/*.spec.ts'],
  reporter: [['list']],
})
