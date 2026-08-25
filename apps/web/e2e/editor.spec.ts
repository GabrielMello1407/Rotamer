import { expect, test, type Page } from '@playwright/test';

/**
 * O caminho inteiro do produto num teste só: traço na tela, RDKit no worker,
 * descritores na faixa e a forma no espaço — sem cadastro e sem servidor de
 * química.
 */

/** Escala padrão do editor: pixels por ångström. */
const SCALE = 26;

/**
 * Um ponto da tela de desenho, medido na hora.
 *
 * O centro é o único ponto estável da tela: ele corresponde sempre à posição da
 * câmera no grafo, mesmo quando a faixa de métricas cresce e encolhe a área de
 * desenho. Fração de altura não serve — o mesmo 0,68 vira outro ponto do grafo
 * quando a caixa muda de tamanho.
 */
async function pointOnCanvas(
  page: Page,
  offsetX = 0,
  offsetY = 0,
): Promise<{ x: number; y: number }> {
  const canvas = page.getByTestId('tela-de-desenho');
  // Em tela estreita a bancada empilha e a página rola: sem trazer a tela de
  // desenho para dentro da janela, o clique cai em outro lugar.
  await canvas.scrollIntoViewIfNeeded();

  const box = await canvas.boundingBox();
  if (!box) throw new Error('a tela de desenho não tem tamanho');

  return {
    x: box.x + box.width / 2 + offsetX,
    y: box.y + box.height / 2 + offsetY,
  };
}

async function drawFirstAtom(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByTestId('tela-de-desenho')).toBeVisible();

  const start = await pointOnCanvas(page);
  await page.mouse.click(start.x, start.y);
}

/** Puxa uma ligação para a direita: o traço trava em 1,5 Å. */
async function dragBondRight(page: Page): Promise<void> {
  const start = await pointOnCanvas(page);

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 60, start.y, { steps: 8 });
  await page.mouse.up();
}

test.describe('editor', () => {
  test('desenhar dois carbonos ligados dá etano', async ({ page }) => {
    await drawFirstAtom(page);
    await dragBondRight(page);

    // O RDKit completa os hidrogênios que o desenho de bastão não mostra.
    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });
    await expect(page.getByText('30,07')).toBeVisible();
  });

  test('trocar o elemento de um átomo muda a molécula', async ({ page }) => {
    await drawFirstAtom(page);
    await dragBondRight(page);
    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });

    await page.getByRole('button', { name: 'O', exact: true }).click();

    // O átomo novo ficou a uma ligação de distância, à direita.
    const target = await pointOnCanvas(page, 1.5 * SCALE);
    await page.mouse.click(target.x, target.y);

    await expect(page.getByTestId('formula')).toHaveText('CH4O', { timeout: 60_000 });
  });

  test('a geometria 3D aparece com a energia do campo de força', async ({ page }) => {
    await drawFirstAtom(page);
    await dragBondRight(page);

    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });
    await expect(page.getByTestId('cena-3d').locator('canvas')).toBeVisible();
    await expect(page.getByTestId('energia')).toBeVisible({ timeout: 30_000 });
  });

  test('valência excedida explica a química, não o código', async ({ page }) => {
    await drawFirstAtom(page);

    // Um carbono central com cinco vizinhos: existe no desenho, não existe na
    // química.
    for (const angle of [0, 72, 144, 216, 288]) {
      const radians = (angle * Math.PI) / 180;
      const center = await pointOnCanvas(page);

      await page.mouse.move(center.x, center.y);
      await page.mouse.down();
      await page.mouse.move(
        center.x + Math.cos(radians) * 2 * SCALE,
        center.y + Math.sin(radians) * 2 * SCALE,
        { steps: 6 },
      );
      await page.mouse.up();
    }

    const erro = page.getByTestId('erro-quimico');
    await expect(erro).toBeVisible({ timeout: 60_000 });
    await expect(erro).toContainText('ligações');
    await expect(erro).not.toContainText('valence');
  });

  test('desfazer devolve o desenho ao passo anterior', async ({ page }) => {
    await drawFirstAtom(page);
    await dragBondRight(page);
    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });

    await page.getByRole('button', { name: 'Desfazer' }).click();

    // Um carbono sozinho é metano: o RDKit completa os quatro hidrogênios.
    await expect(page.getByTestId('formula')).toHaveText('CH4', { timeout: 60_000 });
  });
});
