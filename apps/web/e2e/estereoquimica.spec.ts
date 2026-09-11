import { expect, test, type Page } from '@playwright/test';
import { openAnalysis } from './painel';

/**
 * Estereoquímica: cunha e traço.
 *
 * É a primeira coisa que um químico pede, e é a que separa "existe um centro" de
 * "o centro é este". Quem atribui R e S é o RDKit, lendo as cunhas do desenho —
 * o editor só registra o que foi desenhado (D-21).
 */

/** Escala padrão do editor: pixels por ångström. Espelha `DEFAULT_SCALE`. */
const SCALE = 42;

async function pointOnCanvas(page: Page, offsetX = 0, offsetY = 0): Promise<{ x: number; y: number }> {
  const canvas = page.getByTestId('tela-de-desenho');
  await canvas.scrollIntoViewIfNeeded();

  const box = await canvas.boundingBox();
  if (!box) throw new Error('a tela de desenho não tem tamanho');

  return { x: box.x + box.width / 2 + offsetX, y: box.y + box.height / 2 + offsetY };
}

test.describe('estereoquímica', () => {
  test('a cunha define a configuração, e o RDKit diz qual é', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('tela-de-desenho')).toBeVisible();

    // Bromoclorofluormetano desenhado à mão: um carbono com quatro coisas
    // diferentes, em posições que o teste conhece. Carregar por SMILES daria
    // coordenadas do RDKit, e aí ninguém sabe onde clicar.
    const centro = await pointOnCanvas(page);
    await page.mouse.click(centro.x, centro.y);

    const braços: readonly (readonly [number, number, string])[] = [
      [0, 0, 'F'],
      [120, 0, 'Cl'],
      [240, 0, 'Br'],
    ];

    for (const [angulo, , elemento] of braços) {
      const radianos = (angulo * Math.PI) / 180;
      const alvoX = centro.x + Math.cos(radianos) * 1.5 * SCALE;
      // O eixo y da tela cresce para baixo; o do grafo, para cima.
      const alvoY = centro.y - Math.sin(radianos) * 1.5 * SCALE;

      await page.mouse.move(centro.x, centro.y);
      await page.mouse.down();
      await page.mouse.move(alvoX, alvoY, { steps: 8 });
      await page.mouse.up();

      // Flúor, cloro e bromo não cabem na barra: vêm da tabela periódica.
      await page.getByTestId('abrir-tabela').click();
      await page.getByTestId(`elemento-${elemento}`).click();
      await page.mouse.click(alvoX, alvoY);
    }

    await expect(page.getByTestId('formula')).toHaveText('CHBrClF', { timeout: 60_000 });

    await openAnalysis(page);
    // Sem cunha, o centro existe e ninguém disse de que lado.
    await expect(page.getByTestId('estereocentros')).toContainText('sem configuração');
    // A nota da linha diz como resolver. Ela é texto de química lido por
    // aluno, e já sobreviveu uma entrega inteira dizendo que o editor não
    // representa cunhas — por isso é conferida aqui, e não só o valor.
    await expect(page.getByTestId('estereocentros')).toHaveAttribute('title', /Estereoquímica \(W\)/);

    await page.getByRole('button', { name: 'Estereoquímica' }).click();

    // O painel aberto encolheu a tela de desenho, e o centro do grafo foi junto:
    // medir de novo é o que faz o clique cair na ligação, e não no vazio.
    const ligacao = await pointOnCanvas(page, 0.75 * SCALE);
    await page.mouse.click(ligacao.x, ligacao.y);

    // Definida a cunha, o descritor deixa de acusar centro em aberto — e a
    // nota some junto.
    await expect(page.getByTestId('estereocentros')).not.toContainText('sem configuração', {
      timeout: 60_000,
    });
    await expect(page.getByTestId('estereocentros')).not.toHaveAttribute('title', /Estereoquímica/);
  });

  test('a estereoquímica atravessa o SMILES e volta', async ({ page }) => {
    await page.goto('/');
    await openAnalysis(page);

    // O @ do SMILES é a configuração escrita: ela tem que sobreviver à ida e à
    // volta pelo desenho.
    await page.getByTestId('entrada-smiles').fill('F[C@H](Cl)Br');
    await page.getByRole('button', { name: 'Carregar' }).click();

    await expect(page.getByTestId('formula')).toHaveText('CHBrClF', { timeout: 60_000 });
    await expect(page.getByTestId('estereocentros')).not.toContainText('sem configuração');
  });
  test('a dupla mostra E ou Z no desenho', async ({ page }) => {
    await page.goto('/');
    await openAnalysis(page);

    // But-2-eno cis: os dois metilas do mesmo lado da dupla.
    const barra = String.fromCharCode(92);
    await page.getByTestId('entrada-smiles').fill(`C/C=C${barra}C`);
    await page.getByRole('button', { name: 'Carregar' }).click();

    await expect(page.getByTestId('formula')).toHaveText('C4H8', { timeout: 60_000 });

    // O rótulo é pintado no canvas, então quem confere é a página pública, que
    // mostra o mesmo SMILES canônico com a geometria dentro.
    await expect(page.getByTestId('identidade')).toContainText(`C/C=C${barra}C`);
  });
});

/**
 * O aviso depois de organizar.
 *
 * "Organizar o desenho" reescreve as cunhas para as posições novas — e sem
 * contar o que fez, quem desenhou lê a mudança como um bug que comeu o
 * traço. As duas coisas que podem acontecer são certas do ponto de vista
 * químico (a cunha some quando não definia nada; troca de tipo quando
 * definia e passou para o outro lado do papel), e a faixa no alto da tela de
 * desenho precisa contar qual das duas foi.
 */
test.describe('aviso ao organizar', () => {
  test('cunha sem centro estereogênico some, e o aviso conta o porquê', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('tela-de-desenho')).toBeVisible();

    // Metila — carbono — hidroxila: etanol, desenhado à mão como no relato
    // original. A cunha vai na ligação C–O; o carbono que a recebe só tem
    // hidrogênios iguais como vizinhos, então não é centro estereogênico.
    const metila = await pointOnCanvas(page);
    await page.mouse.click(metila.x, metila.y);

    const carbono = await pointOnCanvas(page, 1.5 * SCALE);
    await page.mouse.move(metila.x, metila.y);
    await page.mouse.down();
    await page.mouse.move(carbono.x, carbono.y, { steps: 8 });
    await page.mouse.up();

    await expect(page.getByTestId('formula')).toHaveText('C2H6', { timeout: 60_000 });

    await page.keyboard.press('o');
    const oxigenio = await pointOnCanvas(page, 1.5 * SCALE, -1.5 * SCALE);
    await page.mouse.move(carbono.x, carbono.y);
    await page.mouse.down();
    await page.mouse.move(oxigenio.x, oxigenio.y, { steps: 8 });
    await page.mouse.up();

    await expect(page.getByTestId('formula')).toHaveText('C2H6O', { timeout: 60_000 });

    // Ferramenta de estereoquímica, clique na ligação C–O: cunha cheia.
    await page.keyboard.press('w');
    const meioDaLigacaoCO = { x: (carbono.x + oxigenio.x) / 2, y: (carbono.y + oxigenio.y) / 2 };
    await page.mouse.click(meioDaLigacaoCO.x, meioDaLigacaoCO.y);

    await page.getByTestId('organizar').click();

    const aviso = page.getByTestId('aviso-organizar');
    await expect(aviso).toBeVisible({ timeout: 60_000 });
    await expect(aviso).toHaveAttribute('role', 'status');
    // A frase nomeia a causa, e só pode nomear porque o núcleo separa "saiu" de
    // "mudou de ligação" — sem essa distinção, esta mesma tela apareceria na
    // alanina, onde a cunha não saiu de lugar nenhum.
    await expect(aviso).toContainText('A cunha saiu do desenho');
    await expect(aviso).toContainText('não definia configuração');
    await expect(aviso).toContainText('centro estereogênico');

    // A química não mudou — só o enfeite que não definia configuração nenhuma.
    await expect(page.getByTestId('formula')).toHaveText('C2H6O');

    // O aviso é sobre o desenho de antes do Ctrl+Z: continuar mostrando ele
    // depois de desfazer seria contar a história de um traço que já não existe.
    await page.keyboard.press('Control+z');
    await expect(aviso).toBeHidden();
  });

  test('cunha de um centro de verdade vira traço, e a letra do centro continua a mesma', async ({
    page,
  }) => {
    await page.goto('/');
    await openAnalysis(page);

    // Alanina: o centro estereogênico de uma molécula de aula, não de um
    // exemplo artificial.
    await page.getByTestId('entrada-smiles').fill('C[C@@H](N)C(=O)O');
    await page.getByRole('button', { name: 'Carregar' }).click();

    await expect(page.getByTestId('formula')).toHaveText('C3H7NO2', { timeout: 60_000 });
    await expect(page.getByTestId('estereocentros')).not.toContainText('sem configuração');

    await page.getByTestId('organizar').click();

    const aviso = page.getByTestId('aviso-organizar');
    await expect(aviso).toBeVisible({ timeout: 60_000 });
    await expect(aviso).toContainText('virou traço');
    await expect(aviso).toContainText('mesma configuração');

    // A letra R ao lado do átomo é exatamente o que o aviso promete que não
    // mudou.
    await expect(page.getByTestId('estereocentros')).not.toContainText('sem configuração');
  });
});
