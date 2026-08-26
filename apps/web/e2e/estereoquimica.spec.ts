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

    await page.getByRole('button', { name: 'Estereoquímica' }).click();

    // O painel aberto encolheu a tela de desenho, e o centro do grafo foi junto:
    // medir de novo é o que faz o clique cair na ligação, e não no vazio.
    const ligacao = await pointOnCanvas(page, 0.75 * SCALE);
    await page.mouse.click(ligacao.x, ligacao.y);

    // Definida a cunha, o descritor deixa de acusar centro em aberto.
    await expect(page.getByTestId('estereocentros')).not.toContainText('sem configuração', {
      timeout: 60_000,
    });
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
