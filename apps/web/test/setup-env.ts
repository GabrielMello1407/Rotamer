/**
 * Carrega o `.env` antes de qualquer teste que precise de banco.
 *
 * Testes de ação (`app/actions/*.test.ts`) importam `lib/db`, que lê
 * `DATABASE_URL` do processo assim que o módulo carrega. Fora do Next,
 * ninguém faz isso sozinho — é o Next quem lê o `.env` em desenvolvimento
 * (`prisma.config.ts` faz o mesmo, pela mesma razão, para a linha de comando).
 */
try {
  process.loadEnvFile('.env');
} catch {
  // Sem `.env` local, vale o que já estiver no ambiente — é assim no CI.
}
