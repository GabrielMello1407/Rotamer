import { expect, test } from '@playwright/test';

test.describe('página de marca', () => {
  test('mostra o símbolo e o wordmark', async ({ page }) => {
    await page.goto('/marca');

    await expect(page.getByRole('heading', { name: 'Rotamer', level: 1 })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Rotamer' })).toBeVisible();
  });

  test('a regra do produto está na tela, com os dois selos de origem', async ({ page }) => {
    await page.goto('/marca');

    await expect(page.getByText('O núcleo determinístico decide. A IA explica.')).toBeVisible();
    await expect(page.getByText('calculado', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('hipótese da IA').first()).toBeVisible();
  });

  test('o RDKit sobe no worker e sanitiza a aspirina', async ({ page }) => {
    await page.goto('/marca');

    // O WASM carrega depois da primeira pintura: o cabeçalho já está lá antes
    // de a química responder.
    await expect(page.getByRole('heading', { name: 'Rotamer', level: 1 })).toBeVisible();

    await expect(page.getByTestId('formula')).toHaveText('C9H8O4', { timeout: 60_000 });
    await expect(page.getByText('BSYNRYMUTXBXSQ-UHFFFAOYSA-N')).toBeVisible();
    await expect(page.getByText('180,16')).toBeVisible();
    await expect(page.getByText('63,60')).toBeVisible();
  });

  test('troca de tema e lembra a escolha', async ({ page }) => {
    await page.goto('/marca');

    await page.getByRole('button', { name: 'Escuro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.getByRole('button', { name: 'Sistema' }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');
  });
});
