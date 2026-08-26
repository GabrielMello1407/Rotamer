import { expect, test, type Page } from '@playwright/test';

/**
 * A missão fecha o laço do produto: o aluno lê o enunciado, desenha, e o
 * veredito vem do motor determinístico — sem nenhum modelo de linguagem no
 * caminho.
 */

async function drawOneCarbon(page: Page): Promise<void> {
  const canvas = page.getByTestId('tela-de-desenho');
  await canvas.scrollIntoViewIfNeeded();

  const box = await canvas.boundingBox();
  if (!box) throw new Error('a tela de desenho não tem tamanho');

  // O centro é o ponto estável: corresponde sempre à posição da câmera no
  // grafo, mesmo quando a faixa de métricas cresce e encolhe a tela.
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test.describe('missões', () => {
  test('a primeira missão é cumprida com um átomo', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('escolher-missao').selectOption('primeiro-carbono');

    await expect(page.getByTestId('objetivos')).toContainText('a fórmula é CH4');
    await expect(page.getByTestId('missao-cumprida')).toBeHidden();

    await drawOneCarbon(page);

    await expect(page.getByTestId('missao-cumprida')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('formula')).toHaveText('CH4');
  });

  test('objetivo não cumprido mantém a missão em aberto', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('escolher-missao').selectOption('alcool-de-dois-carbonos');

    await drawOneCarbon(page);

    // Metano não é álcool nem tem dois carbonos: nada de tique.
    await expect(page.getByTestId('formula')).toHaveText('CH4', { timeout: 60_000 });
    await expect(page.getByTestId('missao-cumprida')).toBeHidden();
  });

  test('a dica aparece só quando pedida, e é escrita à mão', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('escolher-missao').selectOption('acido-do-vinagre');

    await expect(page.getByText('Um clique, um átomo.')).toBeHidden();
    await page.getByRole('button', { name: 'Ver dica' }).click();

    await expect(page.getByText('clique na ligação para girar')).toBeVisible();
  });

  test('sem missão, a tela vira ferramenta livre', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Desenhe o que quiser')).toBeVisible();
    await expect(page.getByTestId('objetivos')).toBeHidden();
  });
});

test.describe('colar SMILES', () => {
  test('carrega a aspirina inteira na tela', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('entrada-smiles').fill('CC(=O)Oc1ccccc1C(=O)O');
    await page.getByRole('button', { name: 'Carregar' }).click();

    await expect(page.getByTestId('formula')).toHaveText('C9H8O4', { timeout: 60_000 });
    await expect(page.getByText('BSYNRYMUTXBXSQ-UHFFFAOYSA-N')).toBeVisible();
  });

  test('estrutura impossível explica a química — e não vira busca por nome', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('entrada-smiles').fill('C(C)(C)(C)(C)C');
    await page.getByRole('button', { name: 'Carregar' }).click();

    const erro = page.getByTestId('erro-smiles');
    await expect(erro).toBeVisible({ timeout: 60_000 });
    await expect(erro).toContainText('O átomo de C tem 5 ligações');
  });
});
