import { expect, test, type Page } from '@playwright/test';
import { openAnalysis } from './painel';

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
  test('os modos normais são 3N − 6, e a cena mostra um deles sozinho', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('tela-de-desenho')).toBeVisible();

    // Água: três átomos, três modos — uma deformação angular e dois
    // estiramentos O–H.
    await openAnalysis(page);
    await page.getByTestId('entrada-smiles').fill('O');
    await page.getByRole('button', { name: 'Carregar' }).click();
    await expect(page.getByTestId('formula')).toHaveText('H2O', { timeout: 60_000 });

    const conta = page.getByTestId('conta-de-modos');
    await expect(conta).toContainText('3N − 6', { timeout: 60_000 });
    await expect(conta).toContainText('3 modos');

    // O primeiro é o mais lento: dobrar o ângulo H–O–H.
    const primeiro = page.getByTestId('modo-1');
    await expect(primeiro).toContainText('cm⁻¹');
    await expect(primeiro).toContainText('dobramento');

    await primeiro.click();

    const exibindo = page.getByTestId('modo-em-exibicao');
    await expect(exibindo).toContainText('modo 1');
    await expect(exibindo).toContainText('cm⁻¹');

    // E dá para voltar para a vibração térmica.
    await page.getByTestId('sair-do-modo').click();
    await expect(exibindo).toBeHidden();
    await expect(page.getByTestId('energia')).toBeVisible();
  });
  test('elemento fora do campo de força não derruba a tela', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('tela-de-desenho')).toBeVisible();

    // Tetrametilestanho existe e o RDKit a aceita; o MMFF94 é que não tem
    // parâmetro para o estanho. Isso é limitação nossa, não erro do desenho.
    await openAnalysis(page);
    await page.getByTestId('entrada-smiles').fill('C[Sn](C)(C)C');
    await page.getByRole('button', { name: 'Carregar' }).click();

    await expect(page.getByTestId('formula')).toHaveText('C4H12Sn', { timeout: 60_000 });

    // Os números continuam na tela, e a forma no espaço também: o gerador de
    // conformações monta o arranjo mesmo sem campo de força.
    await expect(page.getByTestId('metricas')).toContainText('massa');
    await expect(page.getByTestId('cena-3d').locator('canvas')).toBeVisible({ timeout: 30_000 });

    // O que falta é dito onde ficaria a energia, e a vibração fica desligada.
    await expect(page.getByTestId('forma-sem-campo')).toContainText('Sn', { timeout: 30_000 });
    await expect(page.getByTestId('alternar-vibracao')).toBeDisabled();
    await expect(page.getByTestId('energia')).toBeHidden();

    // O painel explica a mesma coisa no lugar dos modos normais.
    await expect(page.getByTestId('modos-normais')).toContainText('não tem parâmetros para Sn');

    // E nenhum erro de programa vazou para a tela.
    await expect(page.getByTestId('erro-quimico')).toBeHidden();
    await expect(page.getByText('atom type')).toBeHidden();
  });
  test('clicar na ligação troca a ordem: simples, dupla, tripla', async ({ page }) => {
    await drawFirstAtom(page);
    await dragBondRight(page);
    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });

    // O meio da ligação, que é onde a dica manda clicar.
    const meio = await pointOnCanvas(page, 0.75 * SCALE);

    await page.mouse.click(meio.x, meio.y);
    await expect(page.getByTestId('formula')).toHaveText('C2H4', { timeout: 60_000 });

    await page.mouse.click(meio.x, meio.y);
    await expect(page.getByTestId('formula')).toHaveText('C2H2', { timeout: 60_000 });

    // E fecha o ciclo: tripla volta para simples.
    await page.mouse.click(meio.x, meio.y);
    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });
  });

  test('a dica ensina a dupla quando o cursor está na ligação', async ({ page }) => {
    await drawFirstAtom(page);
    await dragBondRight(page);
    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });

    const meio = await pointOnCanvas(page, 0.75 * SCALE);
    await page.mouse.move(meio.x, meio.y);

    await expect(page.getByText('simples → dupla → tripla')).toBeVisible();
  });
});

/**
 * Os atalhos.
 *
 * Uma missão diz "tecle O", e por muito tempo isso só era verdade depois de
 * clicar na tela de desenho — quem vinha do painel teclava no vazio.
 */
test.describe('atalhos', () => {
  test('teclar o elemento funciona sem clicar na tela antes', async ({ page }) => {
    await page.goto('/');

    const canvas = page.getByTestId('tela-de-desenho');
    await expect(canvas).toBeVisible();

    // Nenhum clique na tela: o foco está onde a página o deixou.
    await page.keyboard.press('o');

    const box = await canvas.boundingBox();
    if (!box) throw new Error('a tela de desenho não tem tamanho');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    await expect(page.getByTestId('formula')).toHaveText('H2O', { timeout: 60_000 });
  });

  test('o flúor tem atalho — a letra F não é mais do enquadrar', async ({ page }) => {
    await page.goto('/');

    const canvas = page.getByTestId('tela-de-desenho');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('a tela de desenho não tem tamanho');

    await page.keyboard.press('f');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    await expect(page.getByTestId('formula')).toHaveText('FH', { timeout: 60_000 });
  });

  test('escrevendo num campo, letra é letra — não vira átomo', async ({ page }) => {
    await page.goto('/');
    await openAnalysis(page);

    const entrada = page.getByTestId('entrada-smiles');
    await entrada.fill('');
    await entrada.type('CCO');
    await expect(entrada).toHaveValue('CCO');

    // Nada foi desenhado: as três letras ficaram no campo.
    await expect(page.getByTestId('formula')).toHaveCount(0);
  });

  test('a folha de atalhos abre pela interrogação e lista as teclas', async ({ page }) => {
    await page.goto('/');
    // A tecla só vale depois de a página hidratar: antes disso não há ouvinte.
    await expect(page.getByTestId('tela-de-desenho')).toBeVisible();

    await page.keyboard.press('?');

    const folha = page.getByRole('dialog', { name: 'Atalhos' });
    await expect(folha).toBeVisible();
    await expect(folha).toContainText('oxigênio');
    await expect(folha).toContainText('enquadrar a molécula');

    await page.keyboard.press('Escape');
    await expect(folha).toBeHidden();
  });
});
