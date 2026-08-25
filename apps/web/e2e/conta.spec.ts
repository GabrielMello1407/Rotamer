import { expect, test, type Page } from '@playwright/test';

/**
 * A conta é opcional: o editor inteiro funciona sem ela. O que ela guarda é o
 * progresso — e a nota que vai para o banco é sempre a que o servidor
 * reavaliou, nunca a que o navegador mandou.
 */

function novoEmail(): string {
  return `teste-${String(Date.now())}-${String(Math.floor(Math.random() * 10_000))}@rotamer.test`;
}

const SENHA = 'molecula-com-8';

async function criarConta(page: Page, email: string, nome = 'Turma de Orgânica'): Promise<void> {
  await page.goto('/entrar');
  await page.getByTestId('criar-nome').fill(nome);
  await page.getByTestId('criar-email').fill(email);
  await page.getByTestId('criar-senha').fill(SENHA);
  await page.getByRole('button', { name: 'Criar conta' }).click();
}

async function desenharUmCarbono(page: Page): Promise<void> {
  const canvas = page.getByTestId('tela-de-desenho');
  await canvas.scrollIntoViewIfNeeded();

  const box = await canvas.boundingBox();
  if (!box) throw new Error('a tela de desenho não tem tamanho');

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test.describe('conta', () => {
  test('criar conta leva direto para a bancada, já identificado', async ({ page }) => {
    const email = novoEmail();
    await criarConta(page, email, 'Professora Ana');

    await expect(page.getByTestId('conta')).toHaveText('Professora Ana');
    await expect(page.getByTestId('tela-de-desenho')).toBeVisible();
  });

  test('a missão cumprida vira progresso salvo, com a nota conferida no servidor', async ({
    page,
  }) => {
    await criarConta(page, novoEmail());

    await page.getByTestId('escolher-missao').selectOption('primeiro-carbono');
    await desenharUmCarbono(page);

    await expect(page.getByTestId('missao-cumprida')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('progresso-salvo')).toContainText('100 de 100', {
      timeout: 60_000,
    });
  });

  test('o que já foi cumprido aparece na próxima visita', async ({ page }) => {
    await criarConta(page, novoEmail());

    await page.getByTestId('escolher-missao').selectOption('primeiro-carbono');
    await desenharUmCarbono(page);
    await expect(page.getByTestId('progresso-salvo')).toBeVisible({ timeout: 60_000 });

    // Volta com a tela em branco: o progresso vem do banco, não do desenho.
    await page.reload();

    await expect(page.getByText('cumpridas')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('escolher-missao')).toContainText('✓ O primeiro traço');
  });

  test('sem conta, a missão cumprida convida a entrar em vez de guardar', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('escolher-missao').selectOption('primeiro-carbono');
    await desenharUmCarbono(page);

    await expect(page.getByTestId('missao-cumprida')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('link', { name: 'Entre na sua conta' })).toBeVisible();
    await expect(page.getByTestId('progresso-salvo')).toBeHidden();
  });

  test('sair e entrar de novo com a mesma senha', async ({ page }) => {
    const email = novoEmail();
    await criarConta(page, email, 'Aluno Bruno');
    await expect(page.getByTestId('conta')).toHaveText('Aluno Bruno');

    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page.getByTestId('entrar')).toBeVisible();

    await page.goto('/entrar');
    await page.getByTestId('entrar-email').fill(email);
    await page.getByTestId('entrar-senha').fill(SENHA);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();

    await expect(page.getByTestId('conta')).toHaveText('Aluno Bruno');
  });

  test('senha errada não diz se o e-mail existe', async ({ page }) => {
    const email = novoEmail();
    await criarConta(page, email);
    await page.getByRole('button', { name: 'Sair' }).click();

    await page.goto('/entrar');
    await page.getByTestId('entrar-email').fill(email);
    await page.getByTestId('entrar-senha').fill('senha-errada-mesmo');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();

    await expect(page.getByTestId('erro-entrar')).toHaveText('E-mail ou senha não conferem.');
  });

  test('e-mail repetido é recusado com mensagem clara', async ({ page }) => {
    const email = novoEmail();
    await criarConta(page, email);
    await page.getByRole('button', { name: 'Sair' }).click();

    await criarConta(page, email);
    await expect(page.getByTestId('erro-criar')).toHaveText(
      'Já existe uma conta com esse e-mail.',
    );
  });
});
