import { expect, test, type Page } from '@playwright/test';
import { openAnalysis, openQuests } from './bancada';

/**
 * Os itens da v0.2 que existem para tirar pedra do caminho: anel pronto,
 * rascunho que sobrevive a fechar a aba, e a molécula saindo em arquivo para o
 * slide da aula.
 */

async function abrirEditor(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByTestId('tela-de-desenho')).toBeVisible();
}

test.describe('anéis prontos', () => {
  test('um clique entrega benzeno aromático', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('anel-benzene').click();

    await expect(page.getByTestId('formula')).toHaveText('C6H6', { timeout: 60_000 });
    // O anel do template é kekulé; quem percebe a aromaticidade é o RDKit.
    await expect(page.getByTestId('metricas')).toContainText('1 arom.');
  });

  test('cicloexano fecha o anel sem virar aromático', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('anel-cyclohexane').click();

    await expect(page.getByTestId('formula')).toHaveText('C6H12', { timeout: 60_000 });
  });

  test('piridina traz o nitrogênio junto', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('anel-pyridine').click();

    await expect(page.getByTestId('formula')).toHaveText('C5H5N', { timeout: 60_000 });
  });

  test('a missão do benzeno é cumprida com o template', async ({ page }) => {
    await abrirEditor(page);
    await openQuests(page);
    await page.getByTestId('escolher-missao').selectOption('anel-de-benzeno');
    await page.getByTestId('anel-benzene').click();

    await expect(page.getByTestId('missao-cumprida')).toBeVisible({ timeout: 60_000 });
  });
});

test.describe('rascunho', () => {
  test('o desenho volta depois de fechar e abrir', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('anel-pyridine').click();
    await expect(page.getByTestId('formula')).toHaveText('C5H5N', { timeout: 60_000 });

    // Tempo do silêncio antes de gravar.
    await page.waitForTimeout(1200);
    await page.goto('about:blank');
    await page.goto('/');

    await expect(page.getByTestId('formula')).toHaveText('C5H5N', { timeout: 60_000 });
  });

  test('limpar a tela não deixa rascunho para trás', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('anel-benzene').click();
    await expect(page.getByTestId('formula')).toHaveText('C6H6', { timeout: 60_000 });

    await page.getByRole('button', { name: 'Nova molécula' }).click();
    await page.waitForTimeout(1200);
    await page.reload();

    await expect(page.getByTestId('formula')).toBeHidden();
    await expect(page.getByTestId('metricas')).toContainText('Desenhe uma estrutura');
  });

  test('link com molécula ganha do rascunho', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('anel-benzene').click();
    await expect(page.getByTestId('formula')).toHaveText('C6H6', { timeout: 60_000 });
    await page.waitForTimeout(1200);

    await page.goto(`/?smiles=${encodeURIComponent('CCO')}`);
    await expect(page.getByTestId('formula')).toHaveText('C2H6O', { timeout: 60_000 });
  });
});

test.describe('levar embora', () => {
  test('o SVG que sai é o desenho do RDKit', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('anel-benzene').click();
    await expect(page.getByTestId('formula')).toHaveText('C6H6', { timeout: 60_000 });

    const baixando = page.waitForEvent('download');
    await openAnalysis(page);
    await page.getByTestId('baixar-svg').click();
    const arquivo = await baixando;

    expect(arquivo.suggestedFilename()).toBe('rotamer-C6H6.svg');
  });

  test('o PNG que sai é a tela como está', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('anel-cyclohexane').click();
    await expect(page.getByTestId('formula')).toHaveText('C6H12', { timeout: 60_000 });

    const baixando = page.waitForEvent('download');
    await openAnalysis(page);
    await page.getByTestId('baixar-png').click();
    const arquivo = await baixando;

    expect(arquivo.suggestedFilename()).toBe('rotamer-C6H12.png');
  });
});

test.describe('pinça', () => {
  test('dois dedos afastando aproximam a molécula', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('anel-benzene').click();
    await expect(page.getByTestId('formula')).toHaveText('C6H6', { timeout: 60_000 });

    const moldura = page.getByRole('application', { name: 'Tela de desenho da molécula' });
    const caixa = await page.getByTestId('tela-de-desenho').boundingBox();
    if (!caixa) throw new Error('a tela de desenho não tem tamanho');

    const antes = Number(await moldura.getAttribute('data-camera-scale'));
    expect(antes).toBeGreaterThan(0);

    /*
     * O gesto vai pelo protocolo do navegador, não por `dispatchEvent`.
     *
     * Evento sintético não cria ponteiro de verdade: `setPointerCapture` lança e
     * o gesto morre na primeira linha. Pior, o teste passava assim mesmo, porque
     * comparava duas capturas de tela que diferiam por outro motivo qualquer —
     * teste verde que nunca executou o gesto é pior que teste nenhum, porque
     * ocupa o lugar dele. Por isso agora são dedos de verdade, e o que se mede é
     * a escala da câmera, não a imagem.
     */
    const centro = { x: caixa.x + caixa.width / 2, y: caixa.y + caixa.height / 2 };
    const cdp = await page.context().newCDPSession(page);
    const dedos = (distancia: number): { x: number; y: number; id: number }[] => [
      { x: centro.x - distancia, y: centro.y, id: 1 },
      { x: centro.x + distancia, y: centro.y, id: 2 },
    ];

    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: dedos(40) });
    for (let passo = 1; passo <= 6; passo += 1) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: dedos(40 + passo * 18),
      });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    // Dedos afastando aproximam a molécula: a escala cresce na proporção da
    // distância entre eles, que aqui triplicou.
    await expect
      .poll(async () => Number(await moldura.getAttribute('data-camera-scale')), {
        timeout: 10_000,
      })
      .toBeGreaterThan(antes * 1.5);

    // E a pinça não pode deixar átomo perdido para trás ao soltar os dedos.
    await expect(page.getByTestId('formula')).toHaveText('C6H6');
  });
});
