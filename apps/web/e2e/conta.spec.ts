import { expect, test } from '@playwright/test';
import { criarConta, entrar, novoEmail, tentarCriarConta, tentarEntrar } from './conta-de-teste';
import { desenharUmCarbono, openQuests } from './bancada';

/**
 * A conta é opcional: o editor inteiro funciona sem ela. O que ela guarda é o
 * progresso — e a nota que vai para o banco é sempre a que o servidor
 * reavaliou, nunca a que o navegador mandou.
 */


test.describe('conta', () => {
  test('criar conta leva direto para a bancada, já identificado', async ({ page }) => {
    const email = novoEmail('conta');
    await criarConta(page, { email, nome: 'Professora Ana' });

    await expect(page.getByTestId('conta')).toHaveText('Professora Ana');
    await expect(page.getByTestId('tela-de-desenho')).toBeVisible();
  });

  test('a missão cumprida vira progresso salvo, com a nota conferida no servidor', async ({
    page,
  }) => {
    await criarConta(page, { email: novoEmail('conta'), nome: 'Turma de Orgânica' });

    await openQuests(page);
    await page.getByTestId('escolher-missao').selectOption('primeiro-carbono');
    await desenharUmCarbono(page);

    await expect(page.getByTestId('missao-cumprida')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('progresso-salvo')).toContainText('100 de 100', {
      timeout: 60_000,
    });
  });

  test('o que já foi cumprido aparece na próxima visita', async ({ page }) => {
    await criarConta(page, { email: novoEmail('conta'), nome: 'Turma de Orgânica' });

    await openQuests(page);
    await page.getByTestId('escolher-missao').selectOption('primeiro-carbono');
    await desenharUmCarbono(page);
    await expect(page.getByTestId('progresso-salvo')).toBeVisible({ timeout: 60_000 });

    // Volta com a tela em branco: o progresso vem do banco, não do desenho.
    await page.reload();

    await openQuests(page);
    await expect(page.getByText('cumpridas')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('escolher-missao')).toContainText('✓ O primeiro traço');
  });

  test('sem conta, a missão cumprida convida a entrar em vez de guardar', async ({ page }) => {
    await page.goto('/');
    await openQuests(page);
    await page.getByTestId('escolher-missao').selectOption('primeiro-carbono');
    await desenharUmCarbono(page);

    await expect(page.getByTestId('missao-cumprida')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('link', { name: 'Entre na sua conta' })).toBeVisible();
    await expect(page.getByTestId('progresso-salvo')).toBeHidden();
  });

  test('sair e entrar de novo com a mesma senha', async ({ page }) => {
    const email = novoEmail('conta');
    await criarConta(page, { email, nome: 'Aluno Bruno' });
    await expect(page.getByTestId('conta')).toHaveText('Aluno Bruno');

    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page.getByTestId('entrar')).toBeVisible();

    await entrar(page, email);
    await expect(page.getByTestId('conta')).toHaveText('Aluno Bruno');
  });

  test('senha errada não diz se o e-mail existe', async ({ page }) => {
    const email = novoEmail('conta');
    await criarConta(page, { email, nome: 'Turma de Orgânica' });
    await page.getByRole('button', { name: 'Sair' }).click();

    await tentarEntrar(page, email, 'senha-errada-mesmo');
    await expect(page.getByTestId('erro-entrar')).toHaveText('E-mail ou senha não conferem.');
  });

  test('e-mail repetido é recusado com mensagem clara', async ({ page }) => {
    const email = novoEmail('conta');
    await criarConta(page, { email, nome: 'Turma de Orgânica' });
    await page.getByRole('button', { name: 'Sair' }).click();

    await tentarCriarConta(page, { email, nome: 'Turma de Orgânica' });
    await expect(page.getByTestId('erro-criar')).toHaveText(
      'Já existe uma conta com esse e-mail.',
    );
  });
  test('sair leva o desenho junto — a máquina do laboratório é compartilhada', async ({
    page,
  }) => {
    await criarConta(page, { email: novoEmail('conta'), nome: 'Turma de Orgânica' });
    await desenharUmCarbono(page);
    await expect(page.getByTestId('formula')).toHaveText('CH4', { timeout: 60_000 });

    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page.getByTestId('entrar')).toBeVisible({ timeout: 30_000 });

    // A tela fica em branco: o rascunho é local e sai junto com a sessão.
    await expect(page.getByTestId('formula')).toBeHidden();
    await expect(page.getByTestId('metricas')).toContainText('Desenhe uma estrutura');

    // E continua em branco depois de recarregar — não é só a tela, é o rascunho.
    await page.reload();
    await expect(page.getByTestId('metricas')).toContainText('Desenhe uma estrutura', {
      timeout: 60_000,
    });
  });
});
