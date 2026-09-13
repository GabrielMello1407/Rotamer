import { expect, test } from '@playwright/test';
import { criarConta, ESCOLA, novoEmail, promover, sair, SENHA } from './conta-de-teste';
import { desenharUmCarbono, openQuests } from './bancada';

/**
 * Turmas: o que faz uma escola adotar o produto.
 *
 * O professor abre a turma, escreve o código no quadro, o aluno entra — e o que
 * o professor vê é **onde a turma parou**, não quem foi melhor (D-22).
 */


test.describe('turmas', () => {
  test('quem não é professor não abre turma', async ({ page }) => {
    await criarConta(page, { email: novoEmail('aluno'), nome: 'Aluno Bruno' });

    await page.goto('/turmas');
    await expect(page.getByTestId('turmas-que-frequento')).toBeVisible();
    await expect(page.getByTestId('minhas-turmas')).toBeHidden();
  });

  test('código errado não entra em turma nenhuma', async ({ page }) => {
    await criarConta(page, { email: novoEmail('aluno'), nome: 'Aluno Bruno' });

    await page.goto('/turmas');
    await page.getByTestId('codigo-da-turma').fill('ZZZZZZ');
    await page.getByRole('button', { name: 'Entrar na turma' }).click();

    await expect(page.getByTestId('erro-turma')).toContainText('não abre nenhuma turma', {
      timeout: 30_000,
    });
  });

  test('o professor abre a turma, o aluno entra, e o quadro mostra onde ele parou', async ({
    page,
  }) => {
    const professora = novoEmail('professora');
    const aluno = novoEmail('aluno');

    await criarConta(page, { email: professora, nome: 'Professora Ana' });
    promover(professora, ESCOLA);

    await page.goto('/turmas');
    await page.getByTestId('nome-da-turma').fill('3º A — manhã');
    await page.getByRole('button', { name: 'Abrir turma' }).click();

    const aviso = page.getByTestId('aviso-turma');
    await expect(aviso).toContainText('aberta', { timeout: 30_000 });

    const codigo = /[A-Z0-9]{6}/.exec((await aviso.textContent()) ?? '')?.[0] ?? '';
    expect(codigo).toHaveLength(6);

    await sair(page);

    // O aluno entra com o código e cumpre a primeira missão.
    await criarConta(page, { email: aluno, nome: 'Aluno Bruno' });
    await page.goto('/turmas');
    await page.getByTestId('codigo-da-turma').fill(codigo);
    await page.getByRole('button', { name: 'Entrar na turma' }).click();
    await expect(page.getByTestId('aviso-turma')).toContainText('entrou', { timeout: 30_000 });

    await page.goto('/');
    await openQuests(page);
    await page.getByTestId('escolher-missao').selectOption('primeiro-carbono');
    await desenharUmCarbono(page);
    await expect(page.getByTestId('progresso-salvo')).toBeVisible({ timeout: 60_000 });

    // E deixa uma missão pela metade: é isso que o painel precisa mostrar.
    await page.getByTestId('escolher-missao').selectOption('alcool-de-dois-carbonos');
    await desenharUmCarbono(page);
    await expect(page.getByTestId('formula')).toHaveText('CH4', { timeout: 60_000 });
    await page.waitForTimeout(1500);

    await sair(page);

    // O professor volta e vê a turma.
    await page.goto('/entrar');
    await page.getByTestId('entrar-email').fill(professora);
    await page.getByTestId('entrar-senha').fill(SENHA);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByTestId('conta')).toBeVisible({ timeout: 30_000 });

    await page.goto('/turmas');
    await page.getByTestId(`turma-${codigo}`).getByRole('link').click();

    await expect(page.getByTestId('quadro-da-turma')).toContainText('Aluno Bruno', {
      timeout: 30_000,
    });
    await expect(page.getByTestId('quadro-da-turma')).toContainText('1 /');
    await expect(page.getByTestId('onde-travou')).toContainText('O álcool do dia a dia');
  });

  test('turma de outro professor não abre para quem não é dono', async ({ page }) => {
    const dona = novoEmail('professora');
    const outra = novoEmail('professora');

    await criarConta(page, { email: dona, nome: 'Professora Ana' });
    promover(dona, ESCOLA);

    await page.goto('/turmas');
    await page.getByTestId('nome-da-turma').fill('3º B — tarde');
    await page.getByRole('button', { name: 'Abrir turma' }).click();
    await expect(page.getByTestId('aviso-turma')).toContainText('aberta', { timeout: 30_000 });

    const endereco = await page
      .getByTestId('minhas-turmas')
      .getByRole('link')
      .first()
      .getAttribute('href');

    await sair(page);

    await criarConta(page, { email: outra, nome: 'Professor Carlos' });
    promover(outra, ESCOLA);

    await page.goto(endereco ?? '/turmas');
    await expect(page.getByTestId('quadro-da-turma')).toBeHidden();
  });
});
