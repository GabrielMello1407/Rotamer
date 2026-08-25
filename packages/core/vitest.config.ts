import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
    // O WASM do RDKit leva alguns segundos para inicializar na primeira vez.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
