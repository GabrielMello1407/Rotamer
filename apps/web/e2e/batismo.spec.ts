import { expect, test, type Page } from '@playwright/test';
import { openAnalysis } from './painel';

/**
 * O batismo: o produto não calcula nome de composto, mas registra autoria.
 * Quem desenha uma estrutura que ninguém desenhou antes pode dar um apelido, e
 * o apelido nunca aparece sem o nome de quem deu.
 */

const SENHA = 'molecula-com-8';

function novoEmail(): string {
  return `batismo-${String(Date.now())}-${String(Math.floor(Math.random() * 10_000))}@rotamer.test`;
}

/**
 * Uma cadeia inédita de verdade.
 *
 * O batismo é único por InChIKey e o banco **guarda para sempre**: sortear entre
 * poucas estruturas faz duas execuções, mesmo em dias diferentes, disputarem a
 * mesma molécula — e a segunda falha dizendo que alguém já batizou.
 *
 * A primeira versão sorteava ramificação com duas opções por posição, o que dá
 * cerca de 2¹⁸ estruturas. Pelo problema do aniversário, isso começa a colidir
 * por volta de quinhentos sorteios — e foi exatamente o que aconteceu depois de
 * algumas dezenas de execuções da suíte. Com três opções por posição, o espaço
 * passa de três bilhões e o problema sai do horizonte.
 */
function cadeiaInedita(): string {
  const ramos = ['C', 'C(C)', 'C(CC)'] as const;
  const partes: string[] = [];
  // Cadeia curta o bastante para a suíte não virar espera: o que precisa ser
  // grande é o espaço de sorteio, não a molécula.
  const carbonos = 10 + Math.floor(Math.random() * 5);

  for (let indice = 0; indice < carbonos; indice += 1) {
    partes.push(ramos[Math.floor(Math.random() * ramos.length)] ?? 'C');
  }

  return `${partes.join('')}O`;
}

async function criarConta(page: Page): Promise<void> {
  await page.goto('/entrar');
  await page.getByTestId('criar-nome').fill('Professora Ana');
  await page.getByTestId('criar-email').fill(novoEmail());
  await page.getByTestId('criar-senha').fill(SENHA);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByTestId('conta')).toBeVisible();
}

async function carregar(page: Page, smiles: string): Promise<void> {
  await openAnalysis(page);
  await page.getByTestId('entrada-smiles').fill(smiles);
  await page.getByRole('button', { name: 'Carregar' }).click();
  await expect(page.getByTestId('formula')).toBeVisible({ timeout: 60_000 });
}

test.describe('batismo', () => {
  test('quem desenha uma estrutura inédita pode batizá-la', async ({ page }) => {
    await criarConta(page);
    await carregar(page, cadeiaInedita());

    await page.getByTestId('entrada-apelido').fill('Molécula da Ana');
    await page.getByRole('button', { name: 'Batizar' }).click();

    const apelido = page.getByTestId('apelido');
    await expect(apelido).toContainText('Molécula da Ana', { timeout: 30_000 });
    await expect(apelido).toContainText('batizada por Professora Ana');
  });

  test('o apelido é da estrutura, e aparece na página pública com a autoria', async ({ page }) => {
    const smiles = cadeiaInedita();

    await criarConta(page);
    await carregar(page, smiles);
    await page.getByTestId('entrada-apelido').fill('Cadeia comprida');
    await page.getByRole('button', { name: 'Batizar' }).click();
    await expect(page.getByTestId('apelido')).toContainText('Cadeia comprida', {
      timeout: 30_000,
    });

    await page.goto(`/m/${encodeURIComponent(smiles)}`);
    const publico = page.getByTestId('apelido');
    await expect(publico).toContainText('Cadeia comprida');
    await expect(publico).toContainText('não é nomenclatura');
  });

  test('batizar também guarda a estrutura em minhas moléculas', async ({ page }) => {
    await criarConta(page);
    await carregar(page, cadeiaInedita());

    await page.getByTestId('entrada-apelido').fill('Guardada de propósito');
    await page.getByRole('button', { name: 'Batizar' }).click();
    await expect(page.getByTestId('apelido')).toContainText('Guardada de propósito', {
      timeout: 30_000,
    });
    await expect(page.getByTestId('batismo-guardado')).toBeVisible();

    // Ninguém dá nome a uma molécula que não quer manter: a estante é a
    // resposta para "onde foi parar o que eu batizei".
    await page.goto('/minhas');
    const lista = page.getByTestId('minhas-moleculas');
    await expect(lista).toContainText('Guardada de propósito', { timeout: 30_000 });
    await expect(lista).toContainText('batizada por Professora Ana');
  });

  test('apelido que se passa por nomenclatura é recusado com explicação', async ({ page }) => {
    await criarConta(page);
    await carregar(page, cadeiaInedita());

    await page.getByTestId('entrada-apelido').fill('butanol');
    await page.getByRole('button', { name: 'Batizar' }).click();

    await expect(page.getByTestId('erro-apelido')).toContainText('nomenclatura', {
      timeout: 30_000,
    });
  });

  test('fórmula também não vale como apelido', async ({ page }) => {
    await criarConta(page);
    await carregar(page, cadeiaInedita());

    await page.getByTestId('entrada-apelido').fill('C9H8O4');
    await page.getByRole('button', { name: 'Batizar' }).click();

    await expect(page.getByTestId('erro-apelido')).toContainText('fórmula', { timeout: 30_000 });
  });

  test('sem conta, o convite é entrar — o apelido leva o nome de quem deu', async ({ page }) => {
    await page.goto('/');
    await carregar(page, cadeiaInedita());

    await page.getByTestId('entrada-apelido').fill('Sem dono');
    await page.getByRole('button', { name: 'Batizar' }).click();

    await expect(page.getByRole('link', { name: 'Entre na sua conta' })).toBeVisible({
      timeout: 30_000,
    });
  });
});
