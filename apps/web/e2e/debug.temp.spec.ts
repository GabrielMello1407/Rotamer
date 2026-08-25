import { expect, test } from '@playwright/test';

test('SMILES cis sobrevive com o substituto da barra', async ({ page }) => {
  const cis = encodeURIComponent('C/C=C~C');
  await page.goto(`/m/${cis}`);
  console.log('[url]', page.url());
  console.log('[smiles]', await page.locator('p').filter({ hasText: 'C' }).first().textContent());
  await expect(page.getByTestId('formula')).toBeVisible();
  console.log('[formula]', await page.getByTestId('formula').textContent());
});
