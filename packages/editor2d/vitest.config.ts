import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // Os testes de template perguntam ao RDKit o que o anel virou.
    setupFiles: ['../core/test/setup.ts'],
    testTimeout: 30_000,
  },
});
