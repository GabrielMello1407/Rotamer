import { expect, test, type Page } from '@playwright/test';

/**
 * O tutor é a única parte da tela que pode estar errada — e por isso é a única
 * marcada em âmbar. Sem chave configurada, ele se desliga e o produto continua
 * inteiro: as dicas da missão são escritas à mão.
 */

async function desenharUmCarbono(page: Page): Promise<void> {
  const canvas = page.getByTestId('tela-de-desenho');
  await canvas.scrollIntoViewIfNeeded();

  const box = await canvas.boundingBox();
  if (!box) throw new Error('a tela de desenho não tem tamanho');

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test.describe('tutor', () => {
  test('só aceita pergunta depois de existir molécula', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('tutor-proximo-passo')).toBeDisabled();
    await expect(
      page.getByText('Desenhe uma estrutura válida e o tutor pode comentar'),
    ).toBeVisible();

    await desenharUmCarbono(page);
    await expect(page.getByTestId('tutor-proximo-passo')).toBeEnabled({ timeout: 60_000 });
  });

  test('sem chave configurada, ele avisa e devolve o aluno para as dicas escritas', async ({
    page,
  }) => {
    await page.goto('/');
    await desenharUmCarbono(page);

    await expect(page.getByTestId('tutor-proximo-passo')).toBeEnabled({ timeout: 60_000 });
    await page.getByTestId('tutor-proximo-passo').click();

    await expect(page.getByTestId('tutor-indisponivel')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('tutor-indisponivel')).toContainText('escritas à mão');

    // O que o motor determinístico calcula continua na tela, intacto.
    await expect(page.getByTestId('formula')).toHaveText('CH4');
  });
});
