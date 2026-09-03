import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { openQuests } from './painel';

/**
 * Listas da turma (D-25) e o catálogo compartilhado (D-26, D-27) — o
 * caminho inteiro num teste só, como manda a §8 de `docs/ROTEIROS.md`.
 *
 * O professor monta uma lista misturando catálogo e missão própria, publica
 * para a turma e também no catálogo geral; um aluno da turma resolve a
 * lista inteira; um aluno de **outra** turma encontra a mesma missão pela
 * busca do catálogo, com a autoria visível, resolve e denuncia; e o
 * professor confere o quadro sem nunca ver uma molécula.
 */

const SENHA = 'molecula-com-8';
const ESCOLA = 'EE Dom Pedro II';

/** A InChIKey do etanol — nunca deve aparecer numa tela de aluno antes de ele mesmo desenhar. */
const INCHI_ETANOL = 'LFQSCWFLJHTTHZ-UHFFFAOYSA-N';

function promover(email: string, escola: string): void {
  const url = process.env['DATABASE_URL'] ?? urlFromEnvFile();
  if (url === undefined || url === '') throw new Error('sem DATABASE_URL no ambiente nem no .env');

  execFileSync('node', ['scripts/promote-teacher.mjs', email, '--escola', escola], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });
}

function urlFromEnvFile(): string | undefined {
  try {
    return readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .find((entry) => entry.startsWith('DATABASE_URL'))
      ?.split('=')
      .slice(1)
      .join('=')
      .trim()
      .replace(/^"|"$/g, '');
  } catch {
    return undefined;
  }
}

function novoEmail(quem: string): string {
  return `${quem}-${String(Date.now())}-${String(Math.floor(Math.random() * 10_000))}@rotamer.test`;
}

async function criarConta(page: Page, email: string, nome: string): Promise<void> {
  await page.goto('/entrar');
  await page.getByTestId('criar-nome').fill(nome);
  await page.getByTestId('criar-email').fill(email);
  await page.getByTestId('criar-senha').fill(SENHA);
  await page.getByTestId('criar-instituicao').fill(ESCOLA);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByTestId('conta')).toBeVisible({ timeout: 30_000 });
}

async function entrar(page: Page, email: string): Promise<void> {
  await page.goto('/entrar');
  await page.getByTestId('entrar-email').fill(email);
  await page.getByTestId('entrar-senha').fill(SENHA);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByTestId('conta')).toBeVisible({ timeout: 30_000 });
}

async function sair(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByTestId('entrar')).toBeVisible({ timeout: 30_000 });
}

/** Um clique no meio da tela de desenho: um átomo de carbono, metano com os hidrogênios do RDKit. */
async function desenharUmCarbono(page: Page): Promise<void> {
  const canvas = page.getByTestId('tela-de-desenho');
  await canvas.scrollIntoViewIfNeeded();

  const box = await canvas.boundingBox();
  if (!box) throw new Error('a tela de desenho não tem tamanho');

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/**
 * Etanol pela entrada de SMILES — mais confiável que clicar coordenadas
 * exatas do canvas, e é um caminho do próprio editor (`entrada-smiles`).
 * Espera a aba "Análise" já estar aberta; quem chama decide para qual aba
 * volta depois, porque isso muda entre a tela do professor (autoria) e a do
 * aluno (missões).
 */
async function carregarEtanol(page: Page): Promise<void> {
  await page.getByTestId('entrada-smiles').fill('CCO');
  await page.getByRole('button', { name: 'Carregar' }).click();
  await expect(page.getByTestId('formula')).toHaveText('C2H6O', { timeout: 60_000 });
}

test.describe('listas da turma', () => {
  test('o professor monta a lista, a turma resolve, e o catálogo compartilhado alcança outra turma', async ({
    page,
  }) => {
    const professora = novoEmail('professora');
    const alunoTurma = novoEmail('aluno-turma');
    const alunoOutro = novoEmail('aluno-outro');

    // 1-2. Promover e criar a turma.
    await criarConta(page, professora, 'Professora Ana');
    promover(professora, ESCOLA);

    await page.goto('/turmas');
    await page.getByTestId('nome-da-turma').fill('3º A — manhã');
    await page.getByRole('button', { name: 'Abrir turma' }).click();
    const aviso = page.getByTestId('aviso-turma');
    await expect(aviso).toContainText('aberta', { timeout: 30_000 });
    const codigo = /[A-Z0-9]{6}/.exec((await aviso.textContent()) ?? '')?.[0] ?? '';
    expect(codigo).toHaveLength(6);

    const classroomHref = await page.getByTestId('minhas-turmas').getByRole('link').first().getAttribute('href');
    if (classroomHref === null) throw new Error('sem link para a turma recém-criada');
    await page.goto(classroomHref);

    // 3. Nenhuma lista ainda.
    await expect(page.getByTestId('listas-da-turma')).toContainText('Nenhuma lista ainda.');

    // 4. Nova lista.
    await page.getByTestId('nome-nova-lista').fill('Funções oxigenadas — 3ª série');
    await page.getByTestId('criar-lista').click();
    await expect(page.getByTestId('nome-da-lista')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('status-da-lista')).toContainText('Rascunho · 0 missões · só você vê');

    // 5. Escolher do catálogo → "O primeiro traço".
    await page.getByTestId('escolher-do-catalogo').click();
    await page.getByTestId('catalogo-item-primeiro-carbono').click();
    await page.getByTestId('acrescentar-catalogo').click();
    await expect(page.getByTestId('item-primeiro-carbono')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('origem-primeiro-carbono')).toContainText('catálogo');

    // 6. Criar missão desenhando.
    await page.getByTestId('criar-missao-desenhando').click();
    await expect(page.getByTestId('rotulo-autoria')).toContainText(
      'Criando missão · Funções oxigenadas — 3ª série',
      { timeout: 30_000 },
    );
    await expect(page.getByTestId('painel-autoria')).toBeVisible();

    // 7. Desenhar etanol — a estrutura lida mostra a fórmula e o selo calculado.
    await page.getByRole('tab', { name: 'Análise' }).click();
    await carregarEtanol(page);
    await page.getByRole('tab', { name: 'Autoria' }).click();
    await expect(page.getByTestId('painel-autoria')).toContainText('calculado', { timeout: 30_000 });

    // 8. Marcar os dois objetivos, título, enunciado e uma dica.
    await page.getByTestId('objetivo-group:alcohol:1').click();
    await page.getByTestId('objetivo-atoms:C:2').click();
    await page.getByTestId('titulo-missao').fill('O álcool do dia a dia');
    await page.getByTestId('enunciado-missao').fill('Monte um álcool com dois carbonos.');
    await page.getByTestId('acrescentar-dica').click();
    await page.getByTestId('dica-0').fill('A hidroxila fica presa a um carbono saturado.');

    // 9. Salvar missão → volta à lista com a faixa e a posição 2, origem "sua missão".
    await page.getByTestId('salvar-missao-topbar').click();
    await expect(page.getByTestId('missao-entrou-na-lista')).toContainText(
      '«O álcool do dia a dia» entrou na lista, na posição 2.',
      { timeout: 30_000 },
    );
    await expect(page.getByTestId('itens-da-lista')).toContainText('sua missão');

    const assignmentUrl = new URL(page.url());
    const [, , classroomId, , assignmentId] = assignmentUrl.pathname.split('/');
    if (classroomId === undefined || assignmentId === undefined) {
      throw new Error('não consegui extrair classroomId/assignmentId da URL');
    }

    // O slug `professor:<id>` desta missão — único por execução do teste, ao
    // contrário do nome "Professora Ana", que se repete entre execuções e não
    // serve para distinguir qual missão é a desta rodada no catálogo (D-27).
    const teacherItemTestId = await page
      .getByTestId('itens-da-lista')
      .locator('[data-testid^="item-professor:"]')
      .getAttribute('data-testid');
    const teacherQuestSlug = teacherItemTestId?.replace(/^item-/, '');
    if (teacherQuestSlug === undefined) throw new Error('não achei o slug da missão própria');

    // 10. Publicar para a turma → confirmar.
    await page.getByTestId('publicar-para-turma').click();
    await page.getByTestId('confirmar-publicar').click();
    await expect(page.getByTestId('status-da-lista')).toContainText('Publicado em', { timeout: 30_000 });

    // D-27 — publicar a missão própria no catálogo compartilhado.
    const catalogToggle = page.getByTestId(`alternar-catalogo-${teacherQuestSlug}`);
    await expect(catalogToggle).toContainText('Publicar no catálogo');
    await catalogToggle.click();
    await expect(catalogToggle).toContainText('Retirar do catálogo', { timeout: 30_000 });

    // O chip da lista, na porta de entrada da turma.
    await page.goto(`/turmas/${classroomId}`);
    await expect(page.getByTestId(`estado-lista-${assignmentId}`)).toContainText('publicado');

    await sair(page);

    /*
     * Achado 9 — §8.15 só olhava `page.content()`, que é só o HTML do
     * documento. Next.js manda a resposta da navegação, os payloads RSC das
     * trocas de aba/rota e as respostas das ações de servidor separados — e
     * cada um é uma resposta HTTP própria, que `page.content()` nunca vê.
     * Registrado **antes** do login do aluno, para não perder nada do que a
     * conta dele recebe do primeiro pixel em diante.
     */
    const respostasParaOAluno: Promise<string>[] = [];
    page.on('response', (response) => {
      const tipo = response.request().resourceType();
      if (tipo !== 'document' && tipo !== 'fetch' && tipo !== 'xhr') return;

      const contentType = response.headers()['content-type'] ?? '';
      if (!/text|json|component/i.test(contentType)) return;

      respostasParaOAluno.push(response.text().catch(() => ''));
    });

    // 11-14. O aluno da turma entra, vê "Da sua turma" e resolve as duas missões.
    await criarConta(page, alunoTurma, 'Aluno Bruno');
    await page.goto('/turmas');
    await page.getByTestId('codigo-da-turma').fill(codigo);
    await page.getByRole('button', { name: 'Entrar na turma' }).click();
    await expect(page.getByTestId('aviso-turma')).toContainText('entrou', { timeout: 30_000 });

    await page.goto('/');
    await openQuests(page);

    const daSuaTurma = page.getByTestId('da-sua-turma');
    await expect(daSuaTurma).toBeVisible({ timeout: 30_000 });
    await expect(daSuaTurma).toContainText('Funções oxigenadas — 3ª série');
    await expect(daSuaTurma).toContainText('0 de 2 cumpridas');
    await expect(daSuaTurma).toContainText('O primeiro traço');
    await expect(daSuaTurma).toContainText('O álcool do dia a dia');
    await expect(daSuaTurma).toContainText('missão do seu professor');

    // Resolver o item 1.
    await daSuaTurma.getByText('O primeiro traço').click();
    await desenharUmCarbono(page);
    await expect(page.getByTestId('progresso-salvo')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('faixa-proxima')).toContainText('Próxima: O álcool do dia a dia', {
      timeout: 30_000,
    });

    // Ir para o item 2 e resolvê-lo.
    await page.getByTestId('proxima-missao').click();
    await page.getByRole('tab', { name: 'Análise' }).click();
    await carregarEtanol(page);
    await page.getByTestId('abrir-missoes').click();
    await expect(page.getByTestId('faixa-proxima')).toContainText(
      'Cumprida. Você fechou a lista «Funções oxigenadas — 3ª série».',
      { timeout: 60_000 },
    );

    // §8.15, achado 9 — a InChIKey do etanol e a assinatura `V2000` do
    // molblock não podem aparecer em NENHUMA resposta que o navegador do
    // aluno recebeu na sessão inteira: nem o HTML da navegação, nem o
    // payload RSC de trocar de aba, nem o retorno de `checkQuest`,
    // `saveAttempt` ou `readStudentAssignments` (R-3, R-4) — nenhum deles
    // devolve molblock nem InChIKey, nem quando é o próprio desenho do
    // aluno: essa análise roda inteira no worker, no navegador, e nunca
    // volta do servidor.
    const corpos = await Promise.all(respostasParaOAluno);
    for (const corpo of corpos) {
      expect(corpo).not.toContain(INCHI_ETANOL);
      expect(corpo).not.toContain('V2000');
    }

    await sair(page);

    // D-27 — um aluno de OUTRA turma encontra a mesma missão pela busca do
    // catálogo, com a autoria visível, resolve, e denuncia.
    await criarConta(page, alunoOutro, 'Aluna Diana');
    await page.goto('/catalogo');
    await page.getByTestId('busca-catalogo').fill('álcool');

    const resultado = page.getByTestId('resultado-catalogo');
    await expect(resultado).toContainText('O álcool do dia a dia', { timeout: 30_000 });

    // O título coincide com uma missão do catálogo do produto — o mesmo texto
    // usado no exemplo da especificação — e com missões de mesmo nome criadas
    // em execuções anteriores deste teste. O slug capturado acima (único
    // desta rodada) é o que distingue qual das entradas é a de agora.
    const missaoDoProfessor = page.getByTestId(`catalogo-resultado-${teacherQuestSlug}`);
    await expect(missaoDoProfessor).toContainText('missão de Professora Ana');
    await expect(missaoDoProfessor).toContainText(ESCOLA);
    await missaoDoProfessor.getByRole('link', { name: 'O álcool do dia a dia' }).click();
    await openQuests(page);
    await page.getByRole('tab', { name: 'Análise' }).click();
    await carregarEtanol(page);
    await page.getByTestId('abrir-missoes').click();
    await expect(page.getByTestId('progresso-salvo')).toBeVisible({ timeout: 60_000 });

    await page.getByTestId('denunciar-missao').click();
    await page.getByTestId('motivo-denuncia').fill('Só um teste — a missão está certa.');
    await page.getByTestId('enviar-denuncia').click();
    await expect(page.getByTestId('denuncia-recebida')).toContainText('Recebido.', { timeout: 30_000 });

    await sair(page);

    // 16-17. O professor volta e vê o quadro — progresso, nunca molécula.
    await entrar(page, professora);
    await page.goto(`/turmas/${classroomId}`);

    const quadro = page.getByTestId('quadro-da-lista');
    await expect(quadro).toContainText('Aluno Bruno', { timeout: 30_000 });
    await expect(quadro).toContainText('2 / 2');

    const paginaDoProfessor = await page.content();
    expect(paginaDoProfessor).not.toContain(INCHI_ETANOL);
    expect(paginaDoProfessor).not.toContain('CCO');
    expect(paginaDoProfessor).not.toContain('C2H6O');
    expect(paginaDoProfessor).not.toContain('V2000');
  });
});
