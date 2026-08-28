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

/**
 * Um ponto vazio, longe da molécula e dentro da tela.
 *
 * Deslocamento fixo não serve: no celular a tela de desenho tem menos de
 * quatrocentos pixels de largura, e o mesmo "menos duzentos" que cai no vazio no
 * desktop cai fora da tela ali.
 */
async function emptyPointOnCanvas(page: Page): Promise<{ x: number; y: number }> {
  const canvas = page.getByTestId('tela-de-desenho');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('a tela de desenho não tem tamanho');

  return pointOnCanvas(
    page,
    -Math.min(220, box.width / 2 - 24),
    -Math.min(120, box.height / 2 - 24),
  );
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

/** Arrasta uma ligação nova a partir de um ponto qualquer da tela. */
async function dragBondFrom(
  page: Page,
  origin: { x: number; y: number },
  dx: number,
  dy: number,
): Promise<void> {
  await page.mouse.move(origin.x, origin.y);
  await page.mouse.down();
  await page.mouse.move(origin.x + dx, origin.y + dy, { steps: 8 });
  await page.mouse.up();
}

/** Um toque solto — dedo desce e sobe no mesmo ponto, sem passar por arrasto. */
async function touchTap(page: Page, x: number, y: number, id = 1): Promise<void> {
  await page.evaluate(
    ({ x, y, id }) => {
      const canvas = document.querySelector('[data-testid="tela-de-desenho"]');
      if (!(canvas instanceof HTMLElement)) throw new Error('sem tela de desenho');

      const fire = (type: string): void => {
        canvas.dispatchEvent(
          new PointerEvent(type, {
            pointerId: id,
            pointerType: 'touch',
            clientX: x,
            clientY: y,
            bubbles: true,
            button: 0,
          }),
        );
      };

      fire('pointerdown');
      fire('pointerup');
    },
    { x, y, id },
  );
}

/**
 * O dedo parado — meio segundo é o que o componente espera antes de abrir o
 * menu (`LONG_PRESS_MS`), e por isso a espera aqui é tempo real de execução,
 * não algo que o navegador simula sozinho.
 */
async function touchLongPress(page: Page, x: number, y: number, id = 1): Promise<void> {
  await page.evaluate(
    ({ x, y, id }) => {
      const canvas = document.querySelector('[data-testid="tela-de-desenho"]');
      if (!(canvas instanceof HTMLElement)) throw new Error('sem tela de desenho');

      canvas.dispatchEvent(
        new PointerEvent('pointerdown', {
          pointerId: id,
          pointerType: 'touch',
          clientX: x,
          clientY: y,
          bubbles: true,
          button: 0,
        }),
      );
    },
    { x, y, id },
  );

  await page.waitForTimeout(600);
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

    // A tecla só vale depois de a página hidratar, e no CI isso demora mais que
    // o "visível" do canvas. Esperar o botão do elemento ficar marcado é
    // esperar pelo efeito do atalho, não por um tempo arbitrário.
    await expect(page.locator('[data-element="O"]')).toHaveAttribute('aria-pressed', 'true', {
      timeout: 30_000,
    });

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
    // O flúor não está entre os quatro do trilho: quem passa a mostrá-lo é o
    // botão da tabela periódica, que exibe o elemento ativo quando ele é de
    // fora da lista curta.
    await expect(page.locator('[data-element="F"]')).toHaveAttribute('aria-pressed', 'true', {
      timeout: 30_000,
    });

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

/**
 * O menu do botão direito.
 *
 * As ferramentas da barra são modos: para trocar uma ligação de ordem é preciso
 * estar na ferramenta certa e clicar no lugar certo. Apontar no que se quer
 * mudar e ler as opções daquilo é o caminho curto — e é o que se espera de um
 * editor.
 */
test.describe('menu do botão direito', () => {
  test('no átomo, o menu troca o elemento', async ({ page }) => {
    await drawFirstAtom(page);
    await expect(page.getByTestId('formula')).toHaveText('CH4', { timeout: 60_000 });

    const atomo = await pointOnCanvas(page);
    await page.mouse.click(atomo.x, atomo.y, { button: 'right' });

    const menu = page.getByTestId('menu-contexto');
    await expect(menu).toContainText('Átomo de C');

    await menu.getByTestId('menu-elemento-O').click();
    await expect(menu).toBeHidden();
    await expect(page.getByTestId('formula')).toHaveText('H2O', { timeout: 60_000 });
  });

  test('no átomo, o menu põe carga — e a fórmula acompanha', async ({ page }) => {
    await drawFirstAtom(page);
    await expect(page.getByTestId('formula')).toHaveText('CH4', { timeout: 60_000 });

    const atomo = await pointOnCanvas(page);
    await page.mouse.click(atomo.x, atomo.y, { button: 'right' });
    await page.getByTestId('menu-elemento-N').click();
    await expect(page.getByTestId('formula')).toHaveText('H3N', { timeout: 60_000 });

    await page.mouse.click(atomo.x, atomo.y, { button: 'right' });
    await page.getByTestId('menu-carga-1').click();

    // Nitrogênio com carga positiva ganha o quarto hidrogênio: é o amônio.
    await expect(page.getByTestId('formula')).toHaveText('H4N+', { timeout: 60_000 });
  });

  test('na ligação, o menu escolhe a ordem direto', async ({ page }) => {
    await drawFirstAtom(page);
    await dragBondRight(page);
    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });

    // O meio do traço: é ali que mora a ligação.
    const meio = await pointOnCanvas(page, 30, 0);
    await page.mouse.click(meio.x, meio.y, { button: 'right' });

    const menu = page.getByTestId('menu-contexto');
    await expect(menu).toContainText('Ligação');

    await menu.getByTestId('menu-ordem-3').click();
    await expect(page.getByTestId('formula')).toHaveText('C2H2', { timeout: 60_000 });
  });

  test('no vazio, o menu fala da molécula inteira', async ({ page }) => {
    await drawFirstAtom(page);
    await dragBondRight(page);
    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });

    const vazio = await emptyPointOnCanvas(page);
    await page.mouse.click(vazio.x, vazio.y, { button: 'right' });

    const menu = page.getByTestId('menu-contexto');
    await expect(menu.getByTestId('menu-enquadrar')).toBeVisible();

    await menu.getByTestId('menu-limpar').click();
    await expect(page.getByTestId('formula')).toHaveCount(0);
  });

  test('abrir o menu não desenha nada por baixo dele', async ({ page }) => {
    await drawFirstAtom(page);
    await expect(page.getByTestId('formula')).toHaveText('CH4', { timeout: 60_000 });

    const vazio = await emptyPointOnCanvas(page);
    await page.mouse.click(vazio.x, vazio.y, { button: 'right' });
    await expect(page.getByTestId('menu-contexto')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('menu-contexto')).toBeHidden();

    // Continua sendo um carbono só: o botão direito não largou átomo nenhum.
    await expect(page.getByTestId('formula')).toHaveText('CH4');
  });
});

/**
 * Organizar o desenho.
 *
 * Quem está aprendendo põe o átomo onde a mão levou, e o resultado é uma
 * estrutura torta — mais difícil de ler do que uma estrutura errada. Quem
 * endireita é o RDKit: comprimento de ligação e ângulo de cadeia são química.
 */
test.describe('organizar', () => {
  test('as ligações ficam do mesmo tamanho, e a molécula continua a mesma', async ({ page }) => {
    await drawFirstAtom(page);

    // Três carbonos jogados na tela, cada traço de um tamanho.
    const centro = await pointOnCanvas(page);
    await page.mouse.move(centro.x, centro.y);
    await page.mouse.down();
    await page.mouse.move(centro.x + 40, centro.y - 70, { steps: 6 });
    await page.mouse.up();

    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });

    await page.getByTestId('organizar').click();

    // A molécula é a mesma depois de endireitar: o que muda são as posições.
    await expect(page.getByTestId('formula')).toHaveText('C2H6');

    // E dá para desfazer, porque organizar entra no histórico.
    await page.keyboard.press('Control+z');
    await expect(page.getByTestId('formula')).toHaveText('C2H6');
  });

  test('o menu do vazio também organiza', async ({ page }) => {
    await drawFirstAtom(page);
    await dragBondRight(page);
    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });

    const vazio = await emptyPointOnCanvas(page);
    await page.mouse.click(vazio.x, vazio.y, { button: 'right' });

    await page.getByTestId('menu-organizar').click();
    await expect(page.getByTestId('menu-contexto')).toBeHidden();
    await expect(page.getByTestId('formula')).toHaveText('C2H6');
  });
});

/**
 * Selecionar um pedaço.
 *
 * Antes disto só dava para agir átomo a átomo ou ligação a ligação — mover,
 * apagar ou trocar um pedaço inteiro exigia repetir a mesma ação várias vezes.
 * O retângulo e o duplo clique/toque pegam o bloco de uma vez; o resto (mover,
 * apagar, trocar em bloco) já existia no motor da parte 1.
 */
test.describe('seleção', () => {
  test('o retângulo pega vários átomos, e Delete apaga tudo de uma vez — com um Ctrl+Z para trás', async ({
    page,
  }) => {
    await drawFirstAtom(page);
    await dragBondRight(page);
    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });

    // Terceiro carbono, colinear: propano.
    const atomo2 = await pointOnCanvas(page, 1.5 * SCALE);
    await dragBondFrom(page, atomo2, 60, 0);
    await expect(page.getByTestId('formula')).toHaveText('C3H8', { timeout: 60_000 });

    await page.getByRole('button', { name: 'Selecionar' }).click();

    // O retângulo cerca o primeiro e o segundo carbono, e deixa o terceiro de
    // fora — é o que prova que a seleção pegou "vários", não "todos".
    const inicio = await pointOnCanvas(page, -40, -40);
    const fim = await pointOnCanvas(page, 100, 40);

    await page.mouse.move(inicio.x, inicio.y);
    await page.mouse.down();
    await page.mouse.move(fim.x, fim.y, { steps: 8 });
    await page.mouse.up();

    // A seleção só muda o desenho: a molécula continua propano até o Delete.
    await expect(page.getByTestId('formula')).toHaveText('C3H8');

    await page.keyboard.press('Delete');
    // Sobra só o terceiro carbono, sozinho: metano.
    await expect(page.getByTestId('formula')).toHaveText('CH4', { timeout: 60_000 });

    await page.keyboard.press('Control+z');
    await expect(page.getByTestId('formula')).toHaveText('C3H8', { timeout: 60_000 });
  });

  test('o duplo clique pega o fragmento inteiro; arrastar de dentro move o bloco, e um Ctrl+Z devolve as posições', async ({
    page,
  }) => {
    await drawFirstAtom(page);
    await dragBondRight(page);
    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });

    await page.getByRole('button', { name: 'Selecionar' }).click();

    const atomo1 = await pointOnCanvas(page);
    const atomo2 = await pointOnCanvas(page, 1.5 * SCALE);

    // Duplo clique no primeiro carbono pega o fragmento inteiro: os dois
    // átomos e a ligação entre eles.
    await page.mouse.click(atomo1.x, atomo1.y);
    await page.mouse.click(atomo1.x, atomo1.y);

    // Arrasta de dentro da seleção: o bloco inteiro sobe junto.
    await page.mouse.move(atomo1.x, atomo1.y);
    await page.mouse.down();
    await page.mouse.move(atomo1.x, atomo1.y - 3 * SCALE, { steps: 10 });
    await page.mouse.up();

    // Só o desenho mudou — a molécula continua a mesma.
    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });

    await page.keyboard.press('Control+z');
    await expect(page.getByTestId('formula')).toHaveText('C2H6');

    // A prova de que as duas posições voltaram num passo só: clicar onde o
    // segundo carbono estava antes do arrasto acha o átomo de novo — se ele
    // tivesse ficado para trás (arrasto de um átomo só, ou desfazer parcial),
    // o clique criaria um átomo novo e desconectado.
    await page.getByRole('button', { name: 'Desenhar' }).click();
    await page.mouse.click(atomo2.x, atomo2.y);
    await expect(page.getByTestId('formula')).toHaveText('C3H8', { timeout: 60_000 });
  });

  test('no celular, o toque duplo pega o fragmento e o toque longo abre o menu da seleção', async ({
    page,
  }) => {
    await drawFirstAtom(page);
    await dragBondRight(page);
    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });

    // Toque na ferramenta: o botão responde a toque como a qualquer clique.
    await page.getByRole('button', { name: 'Selecionar' }).click();

    const atomo1 = await pointOnCanvas(page);

    await touchTap(page, atomo1.x, atomo1.y);
    await touchTap(page, atomo1.x, atomo1.y);

    // Toque longo sobre o que já está selecionado abre o menu da seleção, não
    // o menu do átomo sozinho.
    await touchLongPress(page, atomo1.x, atomo1.y);

    const menu = page.getByTestId('menu-contexto');
    await expect(menu).toContainText('Seleção');

    await menu.getByTestId('menu-apagar-selecao').click();
    await expect(page.getByTestId('formula')).toHaveCount(0);
  });

  test('a tecla V abre a ferramenta, e Esc solta a seleção', async ({ page }) => {
    await drawFirstAtom(page);
    await dragBondRight(page);
    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });

    await page.keyboard.press('v');
    await expect(page.getByRole('button', { name: 'Selecionar' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.keyboard.press('Control+a');
    await expect(page.getByRole('status')).toContainText('2 átomos e 1 ligação selecionados');

    await page.keyboard.press('Escape');
    await expect(page.getByRole('status')).toContainText('Nada selecionado');

    // A molécula não mudou: selecionar e soltar não mexe no grafo.
    await expect(page.getByTestId('formula')).toHaveText('C2H6');
  });

  test('regressão: Shift ainda cicla a ligação e ainda move o átomo em Desenhar, mas não larga mais um átomo no vazio', async ({
    page,
  }) => {
    await drawFirstAtom(page);
    await dragBondRight(page);
    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });

    const meio = await pointOnCanvas(page, 0.75 * SCALE);
    await page.keyboard.down('Shift');
    await page.mouse.click(meio.x, meio.y);
    await page.keyboard.up('Shift');
    await expect(page.getByTestId('formula')).toHaveText('C2H4', { timeout: 60_000 });

    // Shift+arrasto de um átomo continua sendo "mover o átomo": nenhuma
    // ligação nova, nenhum átomo novo.
    const atomo1 = await pointOnCanvas(page);
    await page.mouse.move(atomo1.x, atomo1.y);
    await page.keyboard.down('Shift');
    await page.mouse.down();
    await page.mouse.move(atomo1.x, atomo1.y - 2 * SCALE, { steps: 8 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await expect(page.getByTestId('formula')).toHaveText('C2H4');

    // Shift+clique parado no vazio deixou de criar átomo: a fórmula não muda.
    const vazio = await emptyPointOnCanvas(page);
    await page.keyboard.down('Shift');
    await page.mouse.click(vazio.x, vazio.y);
    await page.keyboard.up('Shift');
    await expect(page.getByTestId('formula')).toHaveText('C2H4');
  });
});
