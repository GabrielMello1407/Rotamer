import { expect, test, type Page } from '@playwright/test';
import { openAnalysis } from './painel';

/**
 * A estante: o que a pessoa guardou.
 *
 * Guardar é deliberado — até então molécula só ia para o banco de raspão, como
 * efeito de missão cumprida. O que é guardado é o grafo; tudo o que a lista
 * mostra é derivado dele.
 */

const SENHA = 'molecula-com-8';

function novoEmail(): string {
  return `estante-${String(Date.now())}-${String(Math.floor(Math.random() * 10_000))}@rotamer.test`;
}

async function criarConta(page: Page): Promise<void> {
  await page.goto('/entrar');
  await page.getByTestId('criar-nome').fill('Professora Ana');
  await page.getByTestId('criar-email').fill(novoEmail());
  await page.getByTestId('criar-senha').fill(SENHA);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByTestId('conta')).toBeVisible({ timeout: 30_000 });
}

async function carregar(page: Page, smiles: string): Promise<void> {
  await openAnalysis(page);
  await page.getByTestId('entrada-smiles').fill(smiles);
  await page.getByRole('button', { name: 'Carregar' }).click();
  await expect(page.getByTestId('formula')).toBeVisible({ timeout: 60_000 });
}

test.describe('estante', () => {
  test('guardar põe a molécula na estante, e de lá ela volta para o editor', async ({ page }) => {
    await criarConta(page);
    await carregar(page, 'CC(=O)Oc1ccccc1C(=O)O');
    await expect(page.getByTestId('formula')).toHaveText('C9H8O4', { timeout: 60_000 });

    await page.getByTestId('guardar-molecula').click();
    await expect(page.getByTestId('molecula-guardada')).toBeVisible({ timeout: 30_000 });

    await page.getByTestId('minhas').click();
    await expect(page.getByTestId('minhas-moleculas')).toBeVisible({ timeout: 30_000 });

    const linha = page.getByTestId('guardada-C9H8O4');
    await expect(linha).toContainText('180,16');

    // Abrir traz o desenho de volta: o grafo é reconstruído a partir do SMILES.
    await linha.getByRole('link').first().click();
    await expect(page.getByTestId('formula')).toHaveText('C9H8O4', { timeout: 60_000 });
  });

  test('guardar a mesma estrutura duas vezes continua sendo uma linha só', async ({ page }) => {
    await criarConta(page);
    await carregar(page, 'CCO');
    await expect(page.getByTestId('formula')).toHaveText('C2H6O', { timeout: 60_000 });

    await page.getByTestId('guardar-molecula').click();
    await expect(page.getByTestId('molecula-guardada')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('guardar-molecula').click();
    await expect(page.getByTestId('molecula-guardada')).toBeVisible({ timeout: 30_000 });

    await page.goto('/minhas');
    await expect(page.getByTestId('guardada-C2H6O')).toHaveCount(1);
  });

  test('tirar da estante pede confirmação e some da lista', async ({ page }) => {
    await criarConta(page);
    await carregar(page, 'CC(=O)O');
    await expect(page.getByTestId('formula')).toHaveText('C2H4O2', { timeout: 60_000 });

    await page.getByTestId('guardar-molecula').click();
    await expect(page.getByTestId('molecula-guardada')).toBeVisible({ timeout: 30_000 });

    await page.goto('/minhas');
    await page.getByTestId('tirar-C2H4O2').click();
    await page.getByTestId('confirmar-tirar-C2H4O2').click();

    await expect(page.getByTestId('guardada-C2H4O2')).toBeHidden({ timeout: 30_000 });
    await expect(page.getByText('Nada guardado ainda')).toBeVisible();
  });

  test('sem conta, guardar convida a entrar — e a estante nem abre', async ({ page }) => {
    await page.goto('/');
    await carregar(page, 'CCO');
    await expect(page.getByTestId('formula')).toHaveText('C2H6O', { timeout: 60_000 });

    await page.getByTestId('guardar-molecula').click();
    await expect(page.getByTestId('guardar-sem-conta')).toBeVisible({ timeout: 30_000 });

    await page.goto('/minhas');
    await expect(page).toHaveURL(/\/entrar/);
  });
});
