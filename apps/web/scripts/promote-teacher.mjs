#!/usr/bin/env node
/**
 * Dar (ou tirar) o papel de professor e de administrador.
 *
 * Ninguém se autodeclara: quem emite código de troca de senha pode tomar a conta
 * de um aluno, então o papel vem de fora da tela do próprio interessado (D-19).
 * Este script é o caminho de quem tem acesso ao servidor, e é a **raiz da
 * confiança**: administrador só nasce aqui. Um administrador promove os
 * professores da própria escola pela tela (D-29), e é assim que uma escola deixa
 * de depender do terminal para o dia a dia — sem que o terminal deixe de ser o
 * único jeito de criar outro administrador.
 *
 *   cd apps/web
 *   node scripts/promote-teacher.mjs ana@escola.br --escola "EE Dom Pedro II"
 *   node scripts/promote-teacher.mjs ana@escola.br --escola "EE Dom Pedro II" --administrador
 *   node scripts/promote-teacher.mjs ana@escola.br --rebaixar
 *
 * Numa instância que roda com Docker, o mesmo comando dentro do container:
 *
 *   docker compose exec app node scripts/promote-teacher.mjs ana@escola.br --escola "EE Dom Pedro II"
 *
 * Precisa de `DATABASE_URL`: do ambiente, ou do `.env` de `apps/web` em
 * desenvolvimento — o mesmo banco que o app usa. O ambiente ganha do arquivo.
 *
 * Fala SQL direto, sem Prisma: o cliente gerado é TypeScript e só existe depois
 * do build do Next. Uma promoção é um `UPDATE` de duas colunas, e depender do
 * build para rodar isso deixaria o script indisponível justamente no dia em que
 * o servidor estiver quebrado.
 */

import { randomUUID } from 'node:crypto';
import pg from 'pg';

// O ambiente ganha do arquivo: `process.loadEnvFile` não sobrescreve o que já
// está definido, mas ler antes deixa isso explícito. Sem `.env` — no
// container, por exemplo — vale só o ambiente.
const fromEnvironment = process.env.DATABASE_URL;
try {
  process.loadEnvFile('.env');
} catch {
  // Sem `.env`, vale o que já estiver no ambiente.
}

const args = process.argv.slice(2);
const email = args.find((entry) => !entry.startsWith('--'))?.trim().toLowerCase();
const demote = args.includes('--rebaixar');
const administrator = args.includes('--administrador');

const schoolFlag = args.indexOf('--escola');
const school = schoolFlag >= 0 ? args[schoolFlag + 1] : undefined;

// A escola é a fronteira de quem alcança quem: um administrador só promove na
// escola dele (D-29). Engolir a opção seguinte como se fosse o nome da escola
// mudaria isso em silêncio — `--escola --administrador` criaria uma escola
// chamada "--administrador".
if (schoolFlag >= 0 && (school === undefined || school.startsWith('--'))) {
  console.error('--escola precisa do nome da escola logo depois. Entre aspas, se tiver espaço.');
  process.exit(2);
}

const usage =
  'uso: node scripts/promote-teacher.mjs <e-mail> [--escola "Nome"] [--administrador] [--rebaixar]';

if (!email) {
  console.error(usage);
  process.exit(2);
}

if (demote && administrator) {
  console.error('--rebaixar e --administrador pedem coisas opostas. Escolha um.');
  process.exit(2);
}

const connectionString = fromEnvironment ?? process.env.DATABASE_URL ?? '';
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

  const role = demote ? 'aluno' : administrator ? 'administrador' : 'professor';
  const institution = school === undefined ? existing.institution : school.trim();

  if (role !== 'aluno' && (institution ?? '').trim() === '') {
    console.error(
      'Conta sem escola preenchida. Quem dá aula sem escola não consegue emitir código —\n' +
        'repita com --escola "Nome da escola".',
    );
    process.exit(1);
  }

  const updated = await client.query(
    'update "Profile" set role = $1, institution = $2 where email = $3 returning "displayName", email, role, institution',
    [role, institution, email],
  );

  // O rastro de quem dá acesso a quem é pergunta de escola, e mudança pelo
  // terminal conta igual: `changedById` nulo é exatamente "veio de quem tem
  // acesso ao servidor", não uma conta pedindo (D-29). O `id` é um UUID porque
  // aqui não existe o cliente do Prisma que geraria o cuid — a coluna é texto e
  // não é chave de nada além dela mesma.
  if (existing.role !== role) {
    await client.query(
      'insert into "RoleChange" (id, "profileId", "changedById", "fromRole", "toRole") values ($1, $2, null, $3, $4)',
      [randomUUID(), existing.id, existing.role, role],
    );
  }

  // Tirar o papel tira do catálogo o que a conta publicou, igual à tela (D-29):
  // revogar o papel é a mitigação que o D-19 promete para conteúdo lido por menor
  // de idade, e ela não vale nada se o texto continuar público. Sem o papel, a
  // própria autora também já não conseguiria retirá-lo.
  if (role === 'aluno') {
    await client.query(
      'update "TeacherQuest" set "catalogedAt" = null where "teacherId" = $1 and "catalogedAt" is not null',
      [existing.id],
    );
  }

  const row = updated.rows[0];
  console.log(
    `${row.displayName} <${row.email}> agora é ${row.role}` +
      (row.institution ? ` na escola "${row.institution}".` : '.'),
  );

  if (role === 'administrador') {
    console.log(
      'Administrador promove os professores da própria escola em /turmas, e só até professor.',
    );
  }
} finally {
  await client.end();
}
