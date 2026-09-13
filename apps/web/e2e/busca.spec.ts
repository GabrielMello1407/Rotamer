import { expect, test, type APIRequestContext } from '@playwright/test';
import { openAnalysis } from './bancada';

/**
 * Busca por nome e verificação de novidade.
 *
 * Estes dois dependem do PubChem, que é serviço de terceiro e às vezes responde
 * que está ocupado. Quando ele recusa, o teste **se declara pulado** em vez de
 * quebrar vermelho: falha de teste deve apontar defeito nosso, não indisposição
 * alheia. O que não pode passar em branco é a degradação — essa está coberta
 * pelos testes de unidade, com respostas gravadas.
 */
async function pubchemResponde(request: APIRequestContext): Promise<boolean> {
  try {
    const resposta = await request.get(
      'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2244/property/MolecularFormula/JSON',
      { timeout: 8000 },
    );
    return resposta.status() === 200;
  } catch {
    return false;
  }
}

test.describe('busca por nome', () => {
  test('digitar "caffeine" traz a cafeína', async ({ page, request }) => {
    test.skip(!(await pubchemResponde(request)), 'o PubChem não está respondendo agora');

    await page.goto('/');
    await openAnalysis(page);
    await page.getByTestId('entrada-smiles').fill('caffeine');
    await page.getByRole('button', { name: 'Carregar' }).click();

    await expect(page.getByTestId('formula')).toHaveText('C8H10N4O2', { timeout: 60_000 });
    await expect(page.getByTestId('origem-molecula')).toContainText('PubChem');
  });

  test('nome que não existe explica o que houve', async ({ page, request }) => {
    test.skip(!(await pubchemResponde(request)), 'o PubChem não está respondendo agora');

    await page.goto('/');
    await openAnalysis(page);
    await page.getByTestId('entrada-smiles').fill('xyzabcnaoexiste');
    await page.getByRole('button', { name: 'Carregar' }).click();

    await expect(page.getByTestId('erro-smiles')).toContainText('Não encontrei', {
      timeout: 60_000,
    });
  });

  test('composto conhecido não se batiza — ele já tem nome', async ({ page, request }) => {
    test.skip(!(await pubchemResponde(request)), 'o PubChem não está respondendo agora');

    await page.goto('/');
    await openAnalysis(page);
    await page.getByTestId('entrada-smiles').fill('CC(=O)Oc1ccccc1C(=O)O');
    await page.getByRole('button', { name: 'Carregar' }).click();
    await expect(page.getByTestId('formula')).toHaveText('C9H8O4', { timeout: 60_000 });

    await expect(page.getByTestId('composto-conhecido')).toContainText('PubChem CID', {
      timeout: 60_000,
    });
    await expect(page.getByTestId('entrada-apelido')).toBeHidden();
  });
});

test.describe('SMILES continua tendo prioridade', () => {
  test('texto que o RDKit lê como estrutura não vai à rede', async ({ page }) => {
    await page.goto('/');
    await openAnalysis(page);
    await page.getByTestId('entrada-smiles').fill('CCO');
    await page.getByRole('button', { name: 'Carregar' }).click();

    await expect(page.getByTestId('formula')).toHaveText('C2H6O', { timeout: 60_000 });
    // Veio do motor, não da busca: nenhuma origem externa é anunciada.
    await expect(page.getByTestId('origem-molecula')).toBeHidden();
  });
});
