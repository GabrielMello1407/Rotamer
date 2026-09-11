import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Ver `test/stubs/server-only.ts`: a guarda é de empacotamento e não
      // resolve fora do Next.
      'server-only': fileURLToPath(new URL('./test/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'app/**/*.test.ts'],
    // `app/actions/assignment.test.ts` fala com o banco de verdade — o `.env`
    // precisa estar carregado antes de `lib/db.ts` ler `DATABASE_URL`.
    setupFiles: ['./test/setup-env.ts'],
    // Com a interceptação ligada (padrão), o reporter
    // "default" engole `console.warn`/`console.log` de qualquer arquivo cujos
    // testes não falharam — inclusive o aviso de "banco indisponível, testes
    // pulados" de `assignment.test.ts`, medido não aparecendo nem com o teste
    // que o emite passando. Só `--reporter=verbose` mostrava. Desligando a
    // interceptação, o `console.*` escreve direto no stdout/stderr do
    // processo, do jeito que `pnpm test` já lê.
    disableConsoleIntercept: true,
  },
});
