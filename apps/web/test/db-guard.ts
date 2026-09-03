import { db, hasDatabase } from '../lib/db';

/** Tempo dado a cada tentativa antes de considerá-la falha. */
const ATTEMPT_TIMEOUT_MS = 10_000;

/** Quantas vezes tentar antes de desistir — uma falha isolada não derruba o job com banco de pé. */
const ATTEMPTS = 2;

async function pingOnce(): Promise<boolean> {
  try {
    await Promise.race([
      db.$queryRaw`SELECT 1`,
      new Promise((_resolve, reject) => {
        setTimeout(() => reject(new Error('tempo esgotado ao checar o banco')), ATTEMPT_TIMEOUT_MS);
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Se o banco está de pé e alcançável **agora** — não só configurado.
 *
 * `hasDatabase()` só confere se `DATABASE_URL` foi definida; um Postgres fora
 * do ar com a variável setada passaria por essa checagem e quebraria a
 * primeira consulta. Os testes de ação (`app/actions/*.test.ts`) falam com o
 * banco de verdade, e o CI tem um trabalho sem Postgres (achado 1 do
 * `reviewer`) — sem isso, `pnpm test` ali falharia, em vez de pular com um
 * aviso claro.
 *
 * **Achado 3 do `reviewer`.** O timeout de 2 s podia derrubar um banco que
 * estava só devagar para responder à primeira consulta (container acabando
 * de subir, disco lento) — e o job "navegador" do CI, que **tem** Postgres de
 * pé, ficaria verde pulando tudo, em vez de rodar os testes de verdade. Duas
 * mudanças: o timeout de cada tentativa sobe para 10 s, e são duas tentativas
 * antes de desistir — uma falha isolada de rede não é o mesmo que "não tem
 * banco".
 *
 * **`REQUIRE_DATABASE=1`** inverte o resultado de "sem banco": em vez de
 * `false` (que os `describe.skip` deste arquivo leem como "pule com aviso"),
 * lança. É a variável que o job "navegador" do `ci.yml` liga — lá o Postgres
 * está de pé por `services:`, e um banco inalcançável ali é defeito de
 * infraestrutura do job, não motivo para pular em silêncio e ficar verde.
 * Sem a variável (job "lint · tipos · testes", sem Postgres; máquina de quem
 * clonou o repositório sem subir o `docker compose`), o comportamento
 * continua sendo pular com aviso.
 */
export async function isDatabaseReachable(): Promise<boolean> {
  if (!hasDatabase()) {
    if (process.env['REQUIRE_DATABASE'] === '1') {
      throw new Error(
        'REQUIRE_DATABASE=1 exige DATABASE_URL configurada, e não há nenhuma — corrija o ambiente do job.',
      );
    }
    return false;
  }

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    if (await pingOnce()) return true;
  }

  if (process.env['REQUIRE_DATABASE'] === '1') {
    throw new Error(
      `REQUIRE_DATABASE=1 exige um banco alcançável, e ele não respondeu em ${String(ATTEMPTS)} tentativas de ${String(ATTEMPT_TIMEOUT_MS)} ms.`,
    );
  }

  return false;
}
