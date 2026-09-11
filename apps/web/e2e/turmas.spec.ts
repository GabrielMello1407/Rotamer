import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { openQuests } from './painel';

/**
 * Turmas: o que faz uma escola adotar o produto.
 *
 * O professor abre a turma, escreve o código no quadro, o aluno entra — e o que
 * o professor vê é **onde a turma parou**, não quem foi melhor (D-22).
 */

const SENHA = 'molecula-com-8';
const ESCOLA = 'EE Dom Pedro II';

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

async function criarConta(page: Page, email: string, nome: string): Promise<void> {
  await page.goto('/entrar');
  await page.getByTestId('criar-nome').fill(nome);
  await page.getByTestId('criar-email').fill(email);
  await page.getByTestId('criar-senha').fill(SENHA);
  await page.getByTestId('criar-instituicao').fill(ESCOLA);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByTestId('conta')).toBeVisible({ timeout: 30_000 });
}

async function sair(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByTestId('entrar')).toBeVisible({ timeout: 30_000 });
}

async function desenharUmCarbono(page: Page): Promise<void> {
  const canvas = page.getByTestId('tela-de-desenho');
  await canvas.scrollIntoViewIfNeeded();

  const box = await canvas.boundingBox();
  if (!box) throw new Error('a tela de desenho não tem tamanho');

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test.describe('turmas', () => {
  test('quem não é professor não abre turma', async ({ page }) => {
    await criarConta(page, novoEmail('aluno'), 'Aluno Bruno');

    await page.goto('/turmas');
    await expect(page.getByTestId('turmas-que-frequento')).toBeVisible();
    await expect(page.getByTestId('minhas-turmas')).toBeHidden();
  });

  test('código errado não entra em turma nenhuma', async ({ page }) => {
    await criarConta(page, novoEmail('aluno'), 'Aluno Bruno');

    await page.goto('/turmas');
    await page.getByTestId('codigo-da-turma').fill('ZZZZZZ');
    await page.getByRole('button', { name: 'Entrar na turma' }).click();

    await expect(page.getByTestId('erro-turma')).toContainText('não abre nenhuma turma', {
      timeout: 30_000,
    });
  });

  test('o professor abre a turma, o aluno entra, e o quadro mostra onde ele parou', async ({
    page,
  }) => {
    const professora = novoEmail('professora');
    const aluno = novoEmail('aluno');

    await criarConta(page, professora, 'Professora Ana');
    promover(professora, ESCOLA);

    await page.goto('/turmas');
    await page.getByTestId('nome-da-turma').fill('3º A — manhã');
    await page.getByRole('button', { name: 'Abrir turma' }).click();

    const aviso = page.getByTestId('aviso-turma');
    await expect(aviso).toContainText('aberta', { timeout: 30_000 });

    const codigo = /[A-Z0-9]{6}/.exec((await aviso.textContent()) ?? '')?.[0] ?? '';
    expect(codigo).toHaveLength(6);

    await sair(page);

    // O aluno entra com o código e cumpre a primeira missão.
    await criarConta(page, aluno, 'Aluno Bruno');
    await page.goto('/turmas');
    await page.getByTestId('codigo-da-turma').fill(codigo);
    await page.getByRole('button', { name: 'Entrar na turma' }).click();
    await expect(page.getByTestId('aviso-turma')).toContainText('entrou', { timeout: 30_000 });

    await page.goto('/');
    await openQuests(page);
    await page.getByTestId('escolher-missao').selectOption('primeiro-carbono');
    await desenharUmCarbono(page);
    await expect(page.getByTestId('progresso-salvo')).toBeVisible({ timeout: 60_000 });

    // E deixa uma missão pela metade: é isso que o painel precisa mostrar.
    await page.getByTestId('escolher-missao').selectOption('alcool-de-dois-carbonos');
    await desenharUmCarbono(page);
    await expect(page.getByTestId('formula')).toHaveText('CH4', { timeout: 60_000 });
    await page.waitForTimeout(1500);

    await sair(page);

    // O professor volta e vê a turma.
    await page.goto('/entrar');
    await page.getByTestId('entrar-email').fill(professora);
    await page.getByTestId('entrar-senha').fill(SENHA);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByTestId('conta')).toBeVisible({ timeout: 30_000 });

    await page.goto('/turmas');
    await page.getByTestId(`turma-${codigo}`).getByRole('link').click();

    await expect(page.getByTestId('quadro-da-turma')).toContainText('Aluno Bruno', {
      timeout: 30_000,
    });
    await expect(page.getByTestId('quadro-da-turma')).toContainText('1 /');
    await expect(page.getByTestId('onde-travou')).toContainText('O álcool do dia a dia');
  });

  test('turma de outro professor não abre para quem não é dono', async ({ page }) => {
    const dona = novoEmail('professora');
    const outra = novoEmail('professora');

    await criarConta(page, dona, 'Professora Ana');
    promover(dona, ESCOLA);

    await page.goto('/turmas');
    await page.getByTestId('nome-da-turma').fill('3º B — tarde');
    await page.getByRole('button', { name: 'Abrir turma' }).click();
    await expect(page.getByTestId('aviso-turma')).toContainText('aberta', { timeout: 30_000 });

    const endereco = await page
      .getByTestId('minhas-turmas')
      .getByRole('link')
      .first()
      .getAttribute('href');

    await sair(page);

    await criarConta(page, outra, 'Professor Carlos');
    promover(outra, ESCOLA);

    await page.goto(endereco ?? '/turmas');
    await expect(page.getByTestId('quadro-da-turma')).toBeHidden();
  });
});
