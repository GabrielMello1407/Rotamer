import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/**
 * Recuperação de senha sem e-mail (D-19).
 *
 * O professor emite um código, entrega em mãos e o aluno troca a senha com ele.
 * O que estes testes garantem é o que sustenta a regra: só professor emite, só
 * para alguém da mesma escola, e o código morre no primeiro uso.
 */

const SENHA = 'molecula-com-8';
const NOVA = 'senha-nova-123';
const ESCOLA = 'EE Dom Pedro II';

/**
 * Promove uma conta a professor pelo mesmo caminho que o servidor usa.
 *
 * Não existe caminho pela tela, e é de propósito (D-19) — então o teste do
 * caminho feliz precisa rodar o script, que é como isso acontece de verdade.
 */
function promover(email: string, escola: string): void {
  /*
   * A URL do banco vem do ambiente, e o arquivo é só o plano B.
   *
   * O `.env` existe na máquina de quem desenvolve e **não existe no CI**, onde o
   * endereço do Postgres vem do próprio trabalho. Ler o arquivo primeiro fazia
   * estes testes falharem lá por não achar um arquivo que nunca esteve lá — um
   * erro de ambiente vestido de teste quebrado.
   */
  const url = process.env['DATABASE_URL'] ?? urlFromEnvFile();
  if (url === undefined || url === '') throw new Error('sem DATABASE_URL no ambiente nem no .env');

  execFileSync('node', ['scripts/promote-teacher.mjs', email, '--escola', escola], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });
}

/** A linha `DATABASE_URL` do `.env`, quando existe. */
function urlFromEnvFile(): string | undefined {
  try {
    return readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .find((entry) => entry.startsWith('DATABASE_URL'))
      ?.split('=')
      .slice(1)
      .join('=')
      .trim()
      .replace(/^"|"$/g, '');
  } catch {
    return undefined;
  }
}

function novoEmail(quem: string): string {
  return `${quem}-${String(Date.now())}-${String(Math.floor(Math.random() * 10_000))}@rotamer.test`;
}

async function criarConta(
  page: Page,
  email: string,
  nome: string,
  escola: string | null,
): Promise<void> {
  await page.goto('/entrar');
  await page.getByTestId('criar-nome').fill(nome);
  await page.getByTestId('criar-email').fill(email);
  await page.getByTestId('criar-senha').fill(SENHA);
  if (escola !== null) await page.getByTestId('criar-instituicao').fill(escola);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByTestId('conta')).toBeVisible({ timeout: 30_000 });
}

/** Sair só existe na bancada, que é de onde se usa o produto. */
async function sair(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByTestId('entrar')).toBeVisible({ timeout: 30_000 });
}

async function entrar(page: Page, email: string, senha: string): Promise<void> {
  await page.goto('/entrar');
  await page.getByTestId('entrar-email').fill(email);
  await page.getByTestId('entrar-senha').fill(senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

test.describe('recuperação de senha', () => {
  test('quem não é professor não emite código', async ({ page }) => {
    await criarConta(page, novoEmail('aluno'), 'Aluno Bruno', ESCOLA);

    await page.goto('/codigos');
    await expect(page.getByTestId('sem-permissao')).toBeVisible();
    await expect(page.getByTestId('codigo-email')).toBeHidden();
  });

  test('sem conta, a página de códigos manda entrar', async ({ page }) => {
    await page.goto('/codigos');
    await expect(page).toHaveURL(/\/entrar/);
  });

  test('a tela de entrar leva para a troca com código', async ({ page }) => {
    await page.goto('/entrar');
    await page.getByTestId('esqueci-senha').click();

    await expect(page).toHaveURL(/\/senha/);
    await expect(page.getByTestId('senha-codigo')).toBeVisible();
  });

  test('código errado não troca senha nenhuma', async ({ page }) => {
    const email = novoEmail('aluno');
    await criarConta(page, email, 'Aluno Bruno', ESCOLA);
    await sair(page);

    await page.goto('/senha');
    await page.getByTestId('senha-email').fill(email);
    await page.getByTestId('senha-codigo').fill('ZZZZ-ZZZZ');
    await page.getByTestId('senha-nova').fill(NOVA);
    await page.getByRole('button', { name: 'Trocar a senha' }).click();

    await expect(page.getByTestId('erro-senha')).toContainText('não confere', { timeout: 30_000 });

    // E a senha antiga continua valendo.
    await entrar(page, email, SENHA);
    await expect(page.getByTestId('conta')).toBeVisible({ timeout: 30_000 });
  });

  test('o professor emite, o aluno troca — e o código serve uma vez só', async ({ page }) => {
    const professora = novoEmail('professora');
    const aluno = novoEmail('aluno');

    await criarConta(page, aluno, 'Aluno Bruno', ESCOLA);
    await sair(page);

    await criarConta(page, professora, 'Professora Ana', ESCOLA);
    promover(professora, ESCOLA);

    // A sessão continua a mesma; o papel novo vale na próxima leitura.
    await page.goto('/codigos');
    await page.getByTestId('codigo-email').fill(aluno);
    await page.getByRole('button', { name: 'Emitir código' }).click();

    const emitido = page.getByTestId('codigo-emitido');
    await expect(emitido).toBeVisible({ timeout: 30_000 });
    await expect(emitido).toContainText('Aluno Bruno');

    const codigo = (await emitido.locator('p').first().textContent())?.trim() ?? '';
    expect(codigo).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);

    await sair(page);

    await page.goto('/senha');
    await page.getByTestId('senha-email').fill(aluno);
    await page.getByTestId('senha-codigo').fill(codigo);
    await page.getByTestId('senha-nova').fill(NOVA);
    await page.getByRole('button', { name: 'Trocar a senha' }).click();
    await expect(page.getByTestId('senha-trocada')).toBeVisible({ timeout: 30_000 });

    // A senha nova entra.
    await entrar(page, aluno, NOVA);
    await expect(page.getByTestId('conta')).toHaveText('Aluno Bruno', { timeout: 30_000 });
    await sair(page);

    // E o mesmo código não serve de novo.
    await page.goto('/senha');
    await page.getByTestId('senha-email').fill(aluno);
    await page.getByTestId('senha-codigo').fill(codigo);
    await page.getByTestId('senha-nova').fill('outra-senha-9');
    await page.getByRole('button', { name: 'Trocar a senha' }).click();
    await expect(page.getByTestId('erro-senha')).toContainText('já foi usado', { timeout: 30_000 });
  });

  test('professor de outra escola não emite código para quem não é dele', async ({ page }) => {
    const professora = novoEmail('professora');
    const aluno = novoEmail('aluno');

    await criarConta(page, aluno, 'Aluno Bruno', 'EE Machado de Assis');
    await sair(page);

    await criarConta(page, professora, 'Professora Ana', ESCOLA);
    promover(professora, ESCOLA);

    await page.goto('/codigos');
    await page.getByTestId('codigo-email').fill(aluno);
    await page.getByRole('button', { name: 'Emitir código' }).click();

    await expect(page.getByTestId('erro-codigo')).toContainText('na sua escola', {
      timeout: 30_000,
    });
  });
});
