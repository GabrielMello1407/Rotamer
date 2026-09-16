import { expect, test } from '@playwright/test';
import {
  criarConta,
  entrar,
  ESCOLA,
  novoEmail,
  promover,
  promoverAdministrador,
  sair,
  SENHA,
} from './conta-de-teste';
import { desenharUmCarbono, openQuests } from './bancada';

/**
 * Turmas: o que faz uma escola adotar o produto.
 *
 * O professor abre a turma, escreve o código no quadro, o aluno entra — e o que
 * o professor vê é **onde a turma parou**, não quem foi melhor (D-22).
 */


test.describe('achar o caminho', () => {
  /*
   * A navegação do produto, não o que cada tela faz.
   *
   * `/codigos` existia sem link em lugar nenhum: chegava lá quem digitasse o
   * endereço. E quem dá aula mas ainda não foi promovido via a tela do aluno
   * e nada que explique por quê — a conclusão natural é que o produto está
   * quebrado, quando na verdade o papel é dado por fora da tela (D-19).
   */
  test('quem ainda não é professor lê como o papel é dado, e não vê ferramenta de professor', async ({
    page,
  }) => {
    await criarConta(page, { email: novoEmail('aluno'), nome: 'Aluno Bruno' });

    await page.goto('/turmas');
    await expect(page.getByTestId('como-virar-professor')).toContainText(
      'quem administra o Rotamer da sua escola',
    );
    await expect(page.getByTestId('ir-para-codigos')).toBeHidden();
  });

  test('o professor alcança os códigos de senha pela turma, sem digitar endereço', async ({
    page,
  }) => {
    const professora = novoEmail('professora');
    await criarConta(page, { email: professora, nome: 'Professora Ana' });
    promover(professora);

    await page.goto('/turmas');
    await expect(page.getByTestId('como-virar-professor')).toBeHidden();

    // Da lista de turmas.
    await page.getByTestId('ir-para-codigos').click();
    await expect(page.getByTestId('codigo-email')).toBeVisible({ timeout: 30_000 });

    // E de dentro da turma, que é onde ele está quando o aluno pede.
    await page.goto('/turmas');
    await page.getByTestId('nome-da-turma').fill('3º A — manhã');
    await page.getByRole('button', { name: 'Abrir turma' }).click();
    await expect(page.getByTestId('aviso-turma')).toContainText('aberta', { timeout: 30_000 });

    /*
     * Esperar a **linha da turma**, não só o aviso de que ela foi aberta: o aviso
     * vem do estado da tela e chega antes de a lista recarregar. Sem esta espera,
     * `.first()` dentro da seção pegava o único link que já estava lá — o de
     * códigos de senha — e o teste seguia como se tivesse entrado na turma.
     */
    const turma = page.getByTestId('minhas-turmas').getByRole('link', { name: '3º A — manhã' });
    await expect(turma).toBeVisible({ timeout: 30_000 });
    await turma.click();

    /*
     * E procurar o link por `testid`, não pelo nome: as duas páginas têm um link
     * chamado `Códigos de senha`, e sem a espera acima o clique acontecia no link
     * da página anterior, que se desprendia no meio da navegação.
     */
    await expect(page.getByTestId('codigo-visivel')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('codigos-da-turma').click();
    await expect(page.getByTestId('codigo-email')).toBeVisible({ timeout: 30_000 });
  });

  test('o aluno sem turma tem para onde ir a partir do painel de missões', async ({ page }) => {
    await criarConta(page, { email: novoEmail('aluno'), nome: 'Aluno Bruno' });

    await page.goto('/');
    await openQuests(page);

    await expect(page.getByTestId('da-sua-turma-vazia')).toContainText('nenhuma turma');
    await page.getByTestId('ir-para-turmas').click();
    await expect(page.getByTestId('codigo-da-turma')).toBeVisible({ timeout: 30_000 });
  });
});

test.describe('professores da escola', () => {
  /*
   * O caminho que tira a escola da dependência do terminal (D-29): o primeiro
   * administrador vem de quem instalou, e daí em diante é ele quem promove os
   * professores — pela tela, conferindo o nome, e só até professor.
   */
  test('o administrador promove pela tela, conferindo o nome, e quem foi promovido abre turma', async ({
    page,
  }) => {
    const professora = novoEmail('futura-professora');
    await criarConta(page, { email: professora, nome: 'Professora Ana' });
    await sair(page);

    const coordenacao = novoEmail('coordenacao');
    await criarConta(page, { email: coordenacao, nome: 'Coordenadora Célia' });
    promoverAdministrador(coordenacao);

    await page.goto('/turmas');
    await expect(page.getByTestId('professores-da-escola')).toContainText(
      'Promova só quem você conhece',
    );

    // Confirmar é pelo nome, não pelo e-mail digitado: é o que pega o erro de dedo.
    await page.getByTestId('promover-email').fill(professora);
    await page.getByTestId('conferir-conta').click();
    await expect(page.getByTestId('confirmar-professor')).toContainText('Professora Ana', {
      timeout: 30_000,
    });

    await page.getByTestId('promover-confirmado').click();
    await expect(page.getByTestId('aviso-professores')).toContainText('agora é professor', {
      timeout: 30_000,
    });

    // O papel vale para quem recebeu — e para no professor: ele não promove ninguém.
    await sair(page);
    await entrar(page, professora);
    await page.goto('/turmas');
    await expect(page.getByTestId('minhas-turmas')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('como-virar-professor')).toBeHidden();
    await expect(page.getByTestId('professores-da-escola')).toBeHidden();

    // E o caminho de volta: a coordenação rebaixa, também conferindo quem é.
    await sair(page);
    await entrar(page, coordenacao);
    await page.goto('/turmas');
    await expect(page.getByTestId('professores-da-escola')).toContainText('Professora Ana');

    await page.getByTestId(`rebaixar-${professora}`).click();
    await expect(page.getByTestId('confirmar-rebaixamento')).toContainText('Professora Ana', {
      timeout: 30_000,
    });
    await expect(page.getByTestId('confirmar-rebaixamento')).toContainText('saem do catálogo');

    await page.getByTestId('rebaixar-confirmado').click();
    await expect(page.getByTestId('aviso-professores')).toContainText('voltou a ser conta de aluno', {
      timeout: 30_000,
    });

    await sair(page);
    await entrar(page, professora);
    await page.goto('/turmas');
    await expect(page.getByTestId('como-virar-professor')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('minhas-turmas')).toBeHidden();
  });

  test('conta de outra escola recebe a mesma recusa de conta que não existe', async ({ page }) => {
    const deOutraEscola = novoEmail('de-outra-escola');
    await criarConta(page, {
      email: deOutraEscola,
      nome: 'Aluno de Outra',
      escola: 'EE Outra Escola',
    });
    await sair(page);

    const coordenacao = novoEmail('coordenacao');
    await criarConta(page, { email: coordenacao, nome: 'Coordenadora Célia' });
    promoverAdministrador(coordenacao);

    await page.goto('/turmas');
    await page.getByTestId('promover-email').fill(deOutraEscola);
    await page.getByTestId('conferir-conta').click();

    await expect(page.getByTestId('erro-professores')).toContainText(
      'Não encontrei essa conta na sua escola',
      { timeout: 30_000 },
    );
  });
});

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
