import { expect, test } from '@playwright/test';

/**
 * A página que se manda para a escola.
 *
 * O que ela promete precisa ser o que o produto faz — e o que ela **nega**
 * precisa estar lá com o mesmo destaque: é a lista de limites que sustenta a
 * credibilidade de tudo o que está acima dela.
 */

test.describe('para escolas', () => {
  test('conta o que o produto faz, com número calculado na hora', async ({ page }) => {
    await page.goto('/escolas');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('desenha a estrutura');

    // A estrutura da página é desenhada pelo RDKit no servidor: se o motor
    // quebrar, a página não pode mentir com uma imagem antiga.
    await expect(page.locator('svg').first()).toBeVisible();
    await expect(page.getByText('C9H8O4')).toBeVisible();
    await expect(page.getByText('180,16')).toBeVisible();
  });

  test('a lista do que o produto não faz está na página', async ({ page }) => {
    await page.goto('/escolas');

    await expect(page.getByText('Não prevê reação')).toBeVisible();
    await expect(page.getByText('Não afirma atividade biológica')).toBeVisible();
    await expect(page.getByText('Não calcula nome IUPAC')).toBeVisible();
    await expect(page.getByText('Não substitui PyMOL')).toBeVisible();
  });

  test('a regra do produto aparece com os dois selos de origem', async ({ page }) => {
    await page.goto('/escolas');

    await expect(page.getByText('O núcleo determinístico decide. A IA explica.')).toBeVisible();
    await expect(page.getByText('calculado', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('hipótese da IA').first()).toBeVisible();
  });

  test('o editor continua a um clique, e sem cadastro', async ({ page }) => {
    await page.goto('/escolas');
    await page.getByRole('link', { name: 'Abrir o editor — sem cadastro' }).click();

    await expect(page.getByTestId('tela-de-desenho')).toBeVisible();
  });
});
