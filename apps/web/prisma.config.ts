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

/*
 * `prisma generate` não conecta em banco nenhum: ele lê o schema e escreve o
 * cliente. Mas este arquivo é carregado antes de qualquer comando, e `env()`
 * lança quando a variável não existe — então gerar o cliente passava a exigir
 * um banco configurado.
 *
 * O efeito aparecia longe da causa: `pnpm install` falhava no CI, que roda
 * lint e teste de núcleo sem banco nenhum, e falharia igual na máquina de quem
 * acabou de clonar o repositório antes de escrever o `.env`.
 *
 * O endereço de reserva aponta para a porta 1, que não é serviço de ninguém:
 * quem tentar conectar de verdade sem configurar o `.env` recebe recusa
 * imediata, em vez de escrever num banco por engano.
 */
process.env['DATABASE_URL'] ??= 'postgresql://sem-banco:sem-banco@127.0.0.1:1/rotamer';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
