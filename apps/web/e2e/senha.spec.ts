import { expect, test } from '@playwright/test';
import { criarConta, ESCOLA, entrar, novoEmail, promover, sair, SENHA } from './conta-de-teste';

/**
 * Recuperação de senha sem e-mail (D-19).
 *
 * O professor emite um código, entrega em mãos e o aluno troca a senha com ele.
 * O que estes testes garantem é o que sustenta a regra: só professor emite, só
 * para alguém da mesma escola, e o código morre no primeiro uso.
 */

const NOVA = 'senha-nova-123';

test.describe('recuperação de senha', () => {
  test('quem não é professor não emite código', async ({ page }) => {
    await criarConta(page, { email: novoEmail('aluno'), nome: 'Aluno Bruno' });

    await page.goto('/codigos');
    await expect(page.getByTestId('sem-permissao')).toBeVisible();
    await expect(page.getByTestId('codigo-email')).toBeHidden();
  });

  test('sem conta, a página de códigos manda entrar', async ({ page }) => {
    await page.goto('/codigos');
    await expect(page).toHaveURL(/\/entrar/);
  });

  test('a tela de entrar leva para a troca com código', async ({ page }) => {
    await page.goto('/entrar');
    await page.getByTestId('esqueci-senha').click();

    await expect(page).toHaveURL(/\/senha/);
    await expect(page.getByTestId('senha-codigo')).toBeVisible();
  });

  test('código errado não troca senha nenhuma', async ({ page }) => {
    const email = novoEmail('aluno');
    await criarConta(page, { email: email, nome: 'Aluno Bruno' });
    await sair(page);

    await page.goto('/senha');
    await page.getByTestId('senha-email').fill(email);
    await page.getByTestId('senha-codigo').fill('ZZZZ-ZZZZ');
    await page.getByTestId('senha-nova').fill(NOVA);
    await page.getByRole('button', { name: 'Trocar a senha' }).click();

    await expect(page.getByTestId('erro-senha')).toContainText('não confere', { timeout: 30_000 });

    // E a senha antiga continua valendo.
    await entrar(page, email, SENHA);
    await expect(page.getByTestId('conta')).toBeVisible({ timeout: 30_000 });
  });

  test('o professor emite, o aluno troca — e o código serve uma vez só', async ({ page }) => {
    const professora = novoEmail('professora');
    const aluno = novoEmail('aluno');

    await criarConta(page, { email: aluno, nome: 'Aluno Bruno' });
    await sair(page);

    await criarConta(page, { email: professora, nome: 'Professora Ana' });
    promover(professora, ESCOLA);

    // A sessão continua a mesma; o papel novo vale na próxima leitura.
    await page.goto('/codigos');
    await page.getByTestId('codigo-email').fill(aluno);
    await page.getByRole('button', { name: 'Emitir código' }).click();

    const emitido = page.getByTestId('codigo-emitido');
    await expect(emitido).toBeVisible({ timeout: 30_000 });
    await expect(emitido).toContainText('Aluno Bruno');

    const codigo = (await emitido.locator('p').first().textContent())?.trim() ?? '';
    expect(codigo).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);

    await sair(page);

    await page.goto('/senha');
    await page.getByTestId('senha-email').fill(aluno);
    await page.getByTestId('senha-codigo').fill(codigo);
    await page.getByTestId('senha-nova').fill(NOVA);
    await page.getByRole('button', { name: 'Trocar a senha' }).click();
    await expect(page.getByTestId('senha-trocada')).toBeVisible({ timeout: 30_000 });

    // A senha nova entra.
    await entrar(page, aluno, NOVA);
    await expect(page.getByTestId('conta')).toHaveText('Aluno Bruno', { timeout: 30_000 });
    await sair(page);

    // E o mesmo código não serve de novo.
    await page.goto('/senha');
    await page.getByTestId('senha-email').fill(aluno);
    await page.getByTestId('senha-codigo').fill(codigo);
    await page.getByTestId('senha-nova').fill('outra-senha-9');
    await page.getByRole('button', { name: 'Trocar a senha' }).click();
    await expect(page.getByTestId('erro-senha')).toContainText('já foi usado', { timeout: 30_000 });
  });

  test('professor de outra escola não emite código para quem não é dele', async ({ page }) => {
    const professora = novoEmail('professora');
    const aluno = novoEmail('aluno');

    await criarConta(page, { email: aluno, nome: 'Aluno Bruno', escola: 'EE Machado de Assis' });
    await sair(page);

    await criarConta(page, { email: professora, nome: 'Professora Ana' });
    promover(professora, ESCOLA);

    await page.goto('/codigos');
    await page.getByTestId('codigo-email').fill(aluno);
    await page.getByRole('button', { name: 'Emitir código' }).click();

    await expect(page.getByTestId('erro-codigo')).toContainText('na sua escola', {
      timeout: 30_000,
    });
  });
});
