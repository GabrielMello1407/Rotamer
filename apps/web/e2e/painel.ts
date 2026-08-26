import { expect, type Page } from '@playwright/test';

/**
 * O painel lateral começa fechado: a tela de desenho é o objeto principal, e
 * missão, tutor, batismo e descritores moram atrás de um botão.
 *
 * Estes atalhos existem para o teste dizer o que quer ver — "abre a análise",
 * "abre as missões" — em vez de repetir dois cliques em cada arquivo.
 */
export async function openAnalysis(page: Page): Promise<void> {
  await page.getByTestId('abrir-analise').click();
  await expect(page.getByTestId('painel-analise')).toBeVisible();
}

export async function openQuests(page: Page): Promise<void> {
  await page.getByTestId('abrir-missoes').click();
  await expect(page.getByTestId('escolher-missao')).toBeVisible();
}
