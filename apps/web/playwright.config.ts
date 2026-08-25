import { defineConfig, devices } from '@playwright/test';

const PORTA = 3100;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] === undefined ? 0 : 2,
  reporter: process.env['CI'] === undefined ? 'list' : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: `http://127.0.0.1:${String(PORTA)}`,
    trace: 'on-first-retry',
    locale: 'pt-BR',
  },

  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // Escola pública em celular fraco é o caso de uso, não o caso extremo.
    { name: 'celular', use: { ...devices['Pixel 5'] } },
  ],

  webServer: {
    command: `pnpm build && pnpm start --port ${String(PORTA)}`,
    url: `http://127.0.0.1:${String(PORTA)}`,
    reuseExistingServer: process.env['CI'] === undefined,
    timeout: 180_000,
  },
});
