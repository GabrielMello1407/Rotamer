import { expect, test, type Page } from '@playwright/test';

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
    await page.getByTestId('anel-benzeno').click();

    await expect(page.getByTestId('formula')).toHaveText('C6H6', { timeout: 60_000 });
    // O anel do template é kekulé; quem percebe a aromaticidade é o RDKit.
    await expect(page.getByTestId('metricas')).toContainText('anéis aromáticos');
  });

  test('cicloexano fecha o anel sem virar aromático', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('anel-cicloexano').click();

    await expect(page.getByTestId('formula')).toHaveText('C6H12', { timeout: 60_000 });
  });

  test('piridina traz o nitrogênio junto', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('anel-piridina').click();

    await expect(page.getByTestId('formula')).toHaveText('C5H5N', { timeout: 60_000 });
  });

  test('a missão do benzeno é cumprida com o template', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('escolher-missao').selectOption('anel-de-benzeno');
    await page.getByTestId('anel-benzeno').click();

    await expect(page.getByTestId('missao-cumprida')).toBeVisible({ timeout: 60_000 });
  });
});

test.describe('rascunho', () => {
  test('o desenho volta depois de fechar e abrir', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('anel-piridina').click();
    await expect(page.getByTestId('formula')).toHaveText('C5H5N', { timeout: 60_000 });

    // Tempo do silêncio antes de gravar.
    await page.waitForTimeout(1200);
    await page.goto('about:blank');
    await page.goto('/');

    await expect(page.getByTestId('formula')).toHaveText('C5H5N', { timeout: 60_000 });
  });

  test('limpar a tela não deixa rascunho para trás', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('anel-benzeno').click();
    await expect(page.getByTestId('formula')).toHaveText('C6H6', { timeout: 60_000 });

    await page.getByRole('button', { name: 'Limpar' }).click();
    await page.waitForTimeout(1200);
    await page.reload();

    await expect(page.getByTestId('formula')).toBeHidden();
    await expect(page.getByTestId('metricas')).toContainText('Desenhe uma estrutura');
  });

  test('link com molécula ganha do rascunho', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('anel-benzeno').click();
    await expect(page.getByTestId('formula')).toHaveText('C6H6', { timeout: 60_000 });
    await page.waitForTimeout(1200);

    await page.goto(`/?smiles=${encodeURIComponent('CCO')}`);
    await expect(page.getByTestId('formula')).toHaveText('C2H6O', { timeout: 60_000 });
  });
});

test.describe('levar embora', () => {
  test('o SVG que sai é o desenho do RDKit', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('anel-benzeno').click();
    await expect(page.getByTestId('formula')).toHaveText('C6H6', { timeout: 60_000 });

    const baixando = page.waitForEvent('download');
    await page.getByTestId('baixar-svg').click();
    const arquivo = await baixando;

    expect(arquivo.suggestedFilename()).toBe('rotamer-C6H6.svg');
  });

  test('o PNG que sai é a tela como está', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('anel-cicloexano').click();
    await expect(page.getByTestId('formula')).toHaveText('C6H12', { timeout: 60_000 });

    const baixando = page.waitForEvent('download');
    await page.getByTestId('baixar-png').click();
    const arquivo = await baixando;

    expect(arquivo.suggestedFilename()).toBe('rotamer-C6H12.png');
  });
});

test.describe('pinça', () => {
  test('dois dedos afastando aproximam a molécula', async ({ page }) => {
    await abrirEditor(page);
    await page.getByTestId('anel-benzeno').click();
    await expect(page.getByTestId('formula')).toHaveText('C6H6', { timeout: 60_000 });

    const tela = page.getByTestId('tela-de-desenho');
    const antes = await tela.screenshot();

    // Dois toques afastando-se: em celular não existe roda de mouse, e sem isto
    // não há como enquadrar uma molécula que cresceu.
    await tela.evaluate((canvas) => {
      const caixa = canvas.getBoundingClientRect();
      const centroX = caixa.left + caixa.width / 2;
      const centroY = caixa.top + caixa.height / 2;

      const toque = (tipo: string, id: number, x: number, y: number): void => {
        canvas.dispatchEvent(
          new PointerEvent(tipo, {
            pointerId: id,
            pointerType: 'touch',
            clientX: x,
            clientY: y,
            bubbles: true,
          }),
        );
      };

      toque('pointerdown', 1, centroX - 40, centroY);
      toque('pointerdown', 2, centroX + 40, centroY);

      for (let passo = 1; passo <= 6; passo += 1) {
        const distancia = 40 + passo * 18;
        toque('pointermove', 1, centroX - distancia, centroY);
        toque('pointermove', 2, centroX + distancia, centroY);
      }

      toque('pointerup', 1, centroX - 148, centroY);
      toque('pointerup', 2, centroX + 148, centroY);
    });

    await page.waitForTimeout(300);
    const depois = await tela.screenshot();

    expect(Buffer.compare(antes, depois)).not.toBe(0);

    // E a pinça não pode deixar átomo perdido para trás ao soltar os dedos.
    await expect(page.getByTestId('formula')).toHaveText('C6H6');
  });
});
