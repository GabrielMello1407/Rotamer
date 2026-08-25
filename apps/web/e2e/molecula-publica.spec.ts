import { expect, test } from '@playwright/test';

/**
 * A página pública é renderizada no servidor, sem banco: a molécula é função
 * pura do SMILES que está no endereço. É o link que o professor manda no grupo
 * da turma.
 */

const ASPIRINA = encodeURIComponent('CC(=O)Oc1ccccc1C(=O)O');

test.describe('página pública de molécula', () => {
  test('mostra fórmula, descritores e grupos vindos do RDKit', async ({ page }) => {
    await page.goto(`/m/${ASPIRINA}`);

    await expect(page.getByTestId('formula')).toHaveText('C9H8O4');
    await expect(page.getByText('180,16')).toBeVisible();
    await expect(page.getByText('63,60')).toBeVisible();
    await expect(page.getByText('BSYNRYMUTXBXSQ-UHFFFAOYSA-N')).toBeVisible();

    const grupos = page.getByTestId('grupos');
    await expect(grupos).toContainText('éster');
    await expect(grupos).toContainText('ácido carboxílico');
  });

  test('o desenho da estrutura vem do próprio RDKit', async ({ page }) => {
    await page.goto(`/m/${ASPIRINA}`);

    await expect(page.getByTestId('desenho').locator('svg')).toBeVisible();
  });

  test('o conteúdo já vem pronto do servidor, sem depender de JavaScript', async ({ browser }) => {
    // É isto que faz o link colar bonito e o buscador enxergar a página.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto(`/m/${ASPIRINA}`);
    await expect(page.getByTestId('formula')).toHaveText('C9H8O4');

    await context.close();
  });

  test('tem título e Open Graph com a fórmula e a massa', async ({ page }) => {
    await page.goto(`/m/${ASPIRINA}`);

    await expect(page).toHaveTitle('C9H8O4 · Rotamer');
    const og = page.locator('meta[property="og:title"]');
    await expect(og).toHaveAttribute('content', /C9H8O4/);
  });

  test('o link leva imagem própria, gerada com os números calculados', async ({
    page,
    request,
  }) => {
    await page.goto(`/m/${ASPIRINA}`);

    // Sem imagem, o link colado no grupo da turma vira um retângulo cinza.
    const meta = page.locator('meta[property="og:image"]');
    await expect(meta).toHaveAttribute('content', /opengraph-image/);

    const endereco = await meta.getAttribute('content');
    if (endereco === null) throw new Error('faltou o endereço da imagem');

    const imagem = await request.get(endereco);
    expect(imagem.status()).toBe(200);
    expect(imagem.headers()['content-type']).toContain('image/png');
    expect((await imagem.body()).length).toBeGreaterThan(10_000);
  });

  test('geometria cis atravessa a URL inteira', async ({ page }) => {
    // A barra invertida do SMILES não sobrevive num endereço — o navegador a
    // normaliza antes de a requisição sair. Ela viaja como `~`.
    await page.goto(`/m/${encodeURIComponent('C/C=C~C')}`);

    await expect(page.getByTestId('formula')).toHaveText('C4H8');
    await expect(page.getByText('C/C=C\\C')).toBeVisible();
  });

  test('estrutura impossível explica a química, não o código', async ({ page }) => {
    await page.goto(`/m/${encodeURIComponent('C(C)(C)(C)(C)C')}`);

    await expect(page.getByTestId('erro-quimico')).toContainText(
      'O átomo de C tem 5 ligações, mas suporta no máximo 4.',
    );
  });

  test('o link volta para o editor com a molécula carregada', async ({ page }) => {
    await page.goto(`/m/${ASPIRINA}`);
    await page.getByRole('link', { name: /Abrir esta molécula no editor/ }).click();

    await expect(page.getByTestId('formula')).toHaveText('C9H8O4', { timeout: 60_000 });
    await expect(page.getByTestId('cena-3d').locator('canvas')).toBeVisible({ timeout: 60_000 });
  });
});
