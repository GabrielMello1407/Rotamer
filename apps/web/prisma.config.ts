import { defineConfig, env } from 'prisma/config';

/**
 * Configuração do Prisma.
 *
 * A partir da versão 7 a URL do banco não mora mais no `schema.prisma`: ela vem
 * daqui, e o cliente recebe um adaptador de driver. Na aplicação quem carrega o
 * `.env` é o Next; na linha de comando, é esta linha.
 */
try {
  process.loadEnvFile('.env');
} catch {
  // Sem `.env` local, vale o que já estiver no ambiente — é assim no servidor.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
