import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';

/**
 * Criar conta, entrar, sair e virar professor — o que quase todo teste faz
 * antes de chegar ao que ele quer provar.
 *
 * Estas funções viviam copiadas em sete arquivos, com `criarConta` em quatro
 * assinaturas diferentes sob o mesmo nome. O preço aparecia na manutenção:
 * mexer no formulário de cadastro custava seis correções, e a explicação de
 * por que `promover` lê o ambiente antes do `.env` existia em duas cópias e
 * faltava na terceira.
 */

export const SENHA = 'molecula-com-8';
export const ESCOLA = 'EE Dom Pedro II';

/** Um e-mail que não colide com o de outra execução, nem com o de outro worker. */
export function novoEmail(quem: string): string {
  return `${quem}-${String(Date.now())}-${String(Math.floor(Math.random() * 10_000))}@rotamer.test`;
}

export interface ContaNova {
  readonly email: string;
  /** Como a pessoa quer ser chamada. */
  readonly nome: string;
  /**
   * A escola. `null` cria a conta sem preencher o campo, que é o caso de quem
   * não vai emitir código nem publicar no catálogo.
   */
  readonly escola?: string | null;
}

/**
 * Preenche o formulário e envia, sem afirmar nada sobre o que vem depois.
 *
 * É o que um teste de **recusa** precisa — e-mail repetido, por exemplo —, e
 * por isso ele existe separado de `criarConta`: esperar a bancada reconhecer
 * quem entrou é o contrário do que esse teste quer provar.
 */
export async function tentarCriarConta(page: Page, conta: ContaNova): Promise<void> {
  await page.goto('/entrar');
  await page.getByTestId('criar-nome').fill(conta.nome);
  await page.getByTestId('criar-email').fill(conta.email);
  await page.getByTestId('criar-senha').fill(SENHA);

  const escola = conta.escola === undefined ? ESCOLA : conta.escola;
  if (escola !== null) await page.getByTestId('criar-instituicao').fill(escola);

  await page.getByRole('button', { name: 'Criar conta' }).click();
}

/** Cria a conta e espera a bancada reconhecer quem entrou. */
export async function criarConta(page: Page, conta: ContaNova): Promise<void> {
  await tentarCriarConta(page, conta);
  await expect(page.getByTestId('conta')).toBeVisible({ timeout: 30_000 });
}

/**
 * Preenche e envia, sem afirmar que deu certo — para o teste que prova a
 * recusa (senha errada, e-mail que não existe).
 */
export async function tentarEntrar(page: Page, email: string, senha: string = SENHA): Promise<void> {
  await page.goto('/entrar');
  await page.getByTestId('entrar-email').fill(email);
  await page.getByTestId('entrar-senha').fill(senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

/**
 * Entra e **espera a sessão pegar**.
 *
 * A espera não é cerimônia: sem ela, o `goto` seguinte corre com o
 * redirecionamento do login, chega antes do cookie e cai numa página de quem
 * não entrou. Foi assim que o quadro da turma sumiu num teste que só falhava
 * no fim, longe da causa.
 */
export async function entrar(page: Page, email: string, senha: string = SENHA): Promise<void> {
  await tentarEntrar(page, email, senha);
  await expect(page.getByTestId('conta')).toBeVisible({ timeout: 30_000 });
}

/** Sair só existe na bancada, que é de onde se usa o produto. */
export async function sair(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByTestId('entrar')).toBeVisible({ timeout: 30_000 });
}

/**
 * Promove uma conta a professor pelo mesmo caminho que o servidor usa.
 *
 * Não existe caminho pela tela, e é de propósito (D-19) — então o teste do
 * caminho feliz precisa rodar o script, que é como isso acontece de verdade.
 */
export function promover(email: string, escola: string = ESCOLA): void {
  const url = process.env['DATABASE_URL'] ?? urlDoEnv();
  if (url === undefined || url === '') throw new Error('sem DATABASE_URL no ambiente nem no .env');

  execFileSync('node', ['scripts/promote-teacher.mjs', email, '--escola', escola], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });
}

/**
 * A linha `DATABASE_URL` do `.env`, quando existe.
 *
 * O ambiente vem primeiro e o arquivo é o plano B: o `.env` existe na máquina
 * de quem desenvolve e **não existe no CI**, onde o endereço do Postgres vem
 * do próprio trabalho. Ler o arquivo primeiro fazia estes testes falharem lá
 * por não achar um arquivo que nunca esteve lá — erro de ambiente vestido de
 * teste quebrado.
 */
function urlDoEnv(): string | undefined {
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
