import { expect, test, type Page } from '@playwright/test';

/**
 * O caminho inteiro do produto num teste só: traço na tela, RDKit no worker,
 * descritores na faixa e a forma no espaço — sem cadastro e sem servidor de
 * química.
 */

/** Escala padrão do editor: pixels por ångström. Espelha `DEFAULT_SCALE`. */
const SCALE = 42;

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

/** O número dentro de "energia 18,9 kcal/mol", em kcal/mol. */
function energiaDe(texto: string | null): number | null {
  if (texto === null) return null;

  const encontrado = /(-?\d+(?:,\d+)?)\s*kcal/.exec(texto);
  if (!encontrado?.[1]) return null;

  return Number(encontrado[1].replace(',', '.'));
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

  test('a molécula continua se mexendo depois de encontrar a forma', async ({ page }) => {
    await drawFirstAtom(page);
    await dragBondRight(page);

    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });
    await expect(page.getByTestId('energia')).toBeVisible({ timeout: 30_000 });

    const cena = page.getByTestId('cena-3d').locator('canvas');

    // Passado o dobramento, a cena entra em vibração — e vibração é movimento:
    // dois instantes separados não podem render o mesmo quadro.
    await page.waitForTimeout(3000);
    const primeiro = await cena.screenshot();
    await page.waitForTimeout(700);
    const segundo = await cena.screenshot();

    expect(Buffer.compare(primeiro, segundo)).not.toBe(0);
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
  test('a tabela periódica alcança elemento que não está na barra', async ({ page }) => {
    await drawFirstAtom(page);
    await expect(page.getByTestId('formula')).toHaveText('CH4', { timeout: 60_000 });

    await page.getByTestId('abrir-tabela').click();
    await expect(page.getByTestId('tabela-periodica')).toBeVisible();

    // Silício não cabe na barra de orgânica, mas é o mesmo desenho.
    await page.getByTestId('elemento-Si').click();
    await expect(page.getByTestId('tabela-periodica')).toBeHidden();

    const center = await pointOnCanvas(page);
    await page.mouse.click(center.x, center.y);

    await expect(page.getByTestId('formula')).toHaveText('H4Si', { timeout: 60_000 });
  });
  test('a ferramenta de mover arrasta o átomo, e o desenho continua a mesma molécula', async ({
    page,
  }) => {
    await drawFirstAtom(page);
    await dragBondRight(page);
    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });

    await page.getByRole('button', { name: 'Mover' }).click();

    // Pega o carbono do centro e leva para cima. Mover átomo não muda a
    // molécula: muda o desenho dela.
    const origem = await pointOnCanvas(page);
    await page.mouse.move(origem.x, origem.y);
    await page.mouse.down();
    await page.mouse.move(origem.x, origem.y - 3 * SCALE, { steps: 10 });
    await page.mouse.up();

    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });

    // E o átomo saiu do lugar: clicar onde ele estava não acha mais nada, então
    // aquele clique cria um átomo novo.
    await page.getByRole('button', { name: 'Desenhar' }).click();
    await page.mouse.click(origem.x, origem.y);
    await expect(page.getByTestId('formula')).toHaveText('C3H10', { timeout: 60_000 });
  });
  test('a segunda molécula também dobra — o relógio da cena volta a zero', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('tela-de-desenho')).toBeVisible();

    // Primeira molécula: dobra, vibra, assenta.
    await page.getByTestId('abrir-exemplos').click();
    await page.getByTestId('exemplo-c1ccccc1').click();
    await expect(page.getByTestId('formula')).toHaveText('C6H6', { timeout: 60_000 });
    await expect(page.getByTestId('energia')).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(3000);

    // Segunda molécula: o embrulho cru do gerador tem energia muito maior que o
    // mínimo. Se o dobramento não acontecer, esse número nunca aparece na tela.
    await page.getByTestId('abrir-exemplos').click();
    await page.getByTestId('exemplo-CC(=O)Oc1ccccc1C(=O)O').click();
    await expect(page.getByTestId('formula')).toHaveText('C9H8O4', { timeout: 60_000 });

    let maior = Number.NEGATIVE_INFINITY;
    for (let leitura = 0; leitura < 40; leitura += 1) {
      const texto = await page.getByTestId('energia').textContent();
      const valor = energiaDe(texto);
      if (valor !== null) maior = Math.max(maior, valor);
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(2500);
    const assentada = energiaDe(await page.getByTestId('energia').textContent());

    expect(assentada).not.toBeNull();
    expect(maior).toBeGreaterThan((assentada ?? 0) + 5);
  });
});
