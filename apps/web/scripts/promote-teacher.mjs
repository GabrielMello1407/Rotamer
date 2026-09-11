#!/usr/bin/env node
/**
 * Promover uma conta a professor.
 *
 * Professor não se autodeclara: não existe caminho pela tela para virar
 * professor, porque quem emite código de troca de senha pode tomar a conta de
 * um aluno. A promoção acontece aqui, por quem tem acesso ao servidor (D-19).
 *
 *   cd apps/web
 *   node scripts/promote-teacher.mjs ana@escola.br --escola "EE Dom Pedro II"
 *   node scripts/promote-teacher.mjs ana@escola.br --rebaixar
 *
 * Numa instância que roda com Docker, o mesmo comando dentro do container:
 *
 *   docker compose exec app node scripts/promote-teacher.mjs ana@escola.br --escola "EE Dom Pedro II"
 *
 * Precisa de `DATABASE_URL` no ambiente — o mesmo banco que o app usa.
 *
 * Fala SQL direto, sem Prisma: o cliente gerado é TypeScript e só existe depois
 * do build do Next. Uma promoção é um `UPDATE` de duas colunas, e depender do
 * build para rodar isso deixaria o script indisponível justamente no dia em que
 * o servidor estiver quebrado.
 */

import pg from 'pg';

const args = process.argv.slice(2);
const email = args.find((entry) => !entry.startsWith('--'))?.trim().toLowerCase();
const demote = args.includes('--rebaixar');

const schoolFlag = args.indexOf('--escola');
const school = schoolFlag >= 0 ? args[schoolFlag + 1] : undefined;

if (!email) {
  console.error('uso: node scripts/promote-teacher.mjs <e-mail> [--escola "Nome"] [--rebaixar]');
  process.exit(2);
}

const connectionString = process.env.DATABASE_URL ?? '';
if (connectionString === '') {
  console.error('DATABASE_URL não está definida.');
  process.exit(2);
}

const client = new pg.Client({ connectionString });
await client.connect();

try {
  const found = await client.query(
    'select id, "displayName", role, institution from "Profile" where email = $1',
    [email],
  );

  const existing = found.rows[0];
  if (!existing) {
    console.error(`Não existe conta com o e-mail ${email}.`);
    process.exit(1);
  }

  const role = demote ? 'aluno' : 'professor';
  const institution = school === undefined ? existing.institution : school.trim();

  if (role === 'professor' && (institution ?? '').trim() === '') {
    console.error(
      'Conta sem escola preenchida. Professor sem escola não consegue emitir código —\n' +
        'repita com --escola "Nome da escola".',
    );
    process.exit(1);
  }

  const updated = await client.query(
    'update "Profile" set role = $1, institution = $2 where email = $3 returning "displayName", email, role, institution',
    [role, institution, email],
  );

  const row = updated.rows[0];
  console.log(
    `${row.displayName} <${row.email}> agora é ${row.role}` +
      (row.institution ? ` na escola "${row.institution}".` : '.'),
  );
} finally {
  await client.end();
}
