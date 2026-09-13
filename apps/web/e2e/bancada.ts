import { expect, type Page } from '@playwright/test';

/**
 * Gestos na bancada que vários testes repetem antes de chegar ao que provam:
 * desenhar um carbono, carregar uma estrutura por SMILES.
 *
 * O painel lateral começa fechado — a tela de desenho é o objeto principal, e
 * missão, tutor, batismo e descritores moram atrás de um botão. Estes atalhos
 * existem para o teste dizer o que quer ver, em vez de repetir dois cliques em
 * cada arquivo.
 */
export async function openAnalysis(page: Page): Promise<void> {
  await page.getByTestId('abrir-analise').click();
  await expect(page.getByTestId('painel-analise')).toBeVisible();
}

export async function openQuests(page: Page): Promise<void> {
  await page.getByTestId('abrir-missoes').click();
  await expect(page.getByTestId('escolher-missao')).toBeVisible();
}

/**
 * Um clique no meio da tela: um átomo de carbono — metano, com os hidrogênios
 * que o RDKit acrescenta.
 *
 * O centro é o ponto estável: corresponde sempre à posição da câmera no grafo,
 * mesmo quando a faixa de métricas cresce e encolhe a tela.
 */
export async function desenharUmCarbono(page: Page): Promise<void> {
  const canvas = page.getByTestId('tela-de-desenho');
  await canvas.scrollIntoViewIfNeeded();

  const box = await canvas.boundingBox();
  if (!box) throw new Error('a tela de desenho não tem tamanho');

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/**
 * Carrega uma estrutura pela entrada de SMILES, esperando a fórmula aparecer.
 *
 * Mais confiável que clicar coordenadas exatas do canvas, e é um caminho do
 * próprio editor. Abre o painel de análise se ele ainda não estiver aberto.
 */
export async function carregarSmiles(page: Page, smiles: string, formula?: string): Promise<void> {
  if (!(await page.getByTestId('entrada-smiles').isVisible())) await openAnalysis(page);

  await page.getByTestId('entrada-smiles').fill(smiles);
  await page.getByRole('button', { name: 'Carregar' }).click();

  const alvo = page.getByTestId('formula');
  if (formula === undefined) await expect(alvo).toBeVisible({ timeout: 60_000 });
  else await expect(alvo).toHaveText(formula, { timeout: 60_000 });
}
