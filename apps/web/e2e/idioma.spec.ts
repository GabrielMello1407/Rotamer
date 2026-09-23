import { expect, test, type Page } from '@playwright/test';
import { criarConta, novoEmail } from './conta-de-teste';

/**
 * O produto em inglês (D-30).
 *
 * O resto da suíte roda em pt-BR — é o padrão, e é a sala de aula que motivou o
 * Rotamer. Aqui se prova o outro lado: que a tradução chega até a tela, que o
 * botão de idioma está onde a pessoa procura, que a escolha sobrevive à
 * recarga, e que o número troca de separador decimal junto com o texto. 46,07
 * e 46.07 são o mesmo número escrito em dois idiomas, e o errado dos dois,
 * numa tela de química, é erro de química.
 */

/** O botão de idioma da tela — um só por página, com o nome do outro idioma. */
function botaoDeIdioma(page: Page) {
  return page.getByTestId('trocar-idioma');
}

test.describe('o produto em inglês', () => {
  test.use({ locale: 'en-US' });

  /**
   * Sem nenhuma escolha guardada, quem manda é o navegador. É o caso de quem
   * abre a instância pela primeira vez, de fora do Brasil.
   */
  test('navegador que pede inglês recebe inglês, sem ter escolhido nada', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId('abrir-exemplos')).toHaveText('Examples');
    await expect(page.getByTestId('abrir-missoes')).toHaveText('Missions');
    await expect(page.getByTestId('abrir-analise')).toHaveText('Analysis');

    // O botão oferece o caminho de volta, escrito no idioma de destino.
    await expect(botaoDeIdioma(page)).toHaveText('Português');
  });

  /** O número acompanha o texto: ponto decimal para quem lê inglês. */
  test('a massa da aspirina sai com ponto decimal', async ({ page }) => {
    await page.goto('/marca');

    await expect(page.getByTestId('formula')).toHaveText('C9H8O4', { timeout: 60_000 });
    await expect(page.getByText('180.16')).toBeVisible();
    await expect(page.getByText('63.60')).toBeVisible();
  });

  /**
   * A recusa do núcleo também atravessa: o `core` devolve `valence_exceeded` e
   * quem monta a frase é o dicionário. Se o inglês não chegasse até aqui, este
   * é o lugar em que o aluno veria português no meio da tela.
   */
  test('a estrutura impossível é recusada em inglês', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('abrir-analise').click();
    await expect(page.getByTestId('painel-analise')).toBeVisible();

    await page.getByTestId('entrada-smiles').fill('C(C)(C)(C)(C)C');
    await page.getByRole('button', { name: 'Load' }).click();

    await expect(page.getByText(/has 5 bonds/i).first()).toBeVisible({ timeout: 60_000 });
  });
});

test.describe('o botão de idioma', () => {
  /**
   * A primeira versão bilíngue só tinha o seletor no rodapé do painel de
   * análise, que começa fechado — e ninguém achava onde trocar o idioma. O
   * botão agora fica na barra que está sempre na tela.
   */
  test('está na barra do editor, troca para inglês e volta', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByTestId('abrir-exemplos')).toHaveText('Exemplos');

    await expect(botaoDeIdioma(page)).toHaveText('English');
    await botaoDeIdioma(page).click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByTestId('abrir-exemplos')).toHaveText('Examples');
    await expect(botaoDeIdioma(page)).toHaveText('Português');

    await botaoDeIdioma(page).click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByTestId('abrir-exemplos')).toHaveText('Exemplos');
  });

  /**
   * O navegador pede português; a pessoa pede inglês. Quem ganha é a pessoa, e
   * ela não precisa pedir de novo na próxima página.
   */
  test('a escolha sobrevive à recarga e à navegação', async ({ page }) => {
    await page.goto('/');
    await botaoDeIdioma(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // Outra rota, renderizada no servidor: a escolha vale para a instância
    // inteira, não para a página em que foi feita.
    await page.goto('/escolas');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('The student draws');

    await botaoDeIdioma(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('O aluno desenha');
  });

  /** Quem chega por um link, e não pelo editor, também precisa achar o botão. */
  test('está no cabeçalho de toda página aberta', async ({ page }) => {
    for (const caminho of ['/escolas', '/entrar', '/senha', '/m/CCO']) {
      await page.goto(caminho);
      await expect(botaoDeIdioma(page), caminho).toHaveText('English');
    }
  });

  test('está no cabeçalho das páginas de quem tem conta', async ({ page }) => {
    await criarConta(page, { email: novoEmail('idioma'), nome: 'Quem troca o idioma' });

    for (const caminho of ['/turmas', '/minhas', '/catalogo', '/codigos']) {
      await page.goto(caminho);
      await expect(botaoDeIdioma(page), caminho).toHaveText('English');
    }
  });

  /**
   * Nome de idioma não se traduz: quem procura o seletor é justamente quem não
   * está entendendo a tela em que ele está.
   */
  test('o seletor completo chama cada idioma pelo próprio nome, nos dois idiomas', async ({
    page,
  }) => {
    await page.goto('/marca');

    for (const nome of ['Português', 'English']) {
      await expect(page.getByRole('button', { name: nome })).toBeVisible();
    }

    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    for (const nome of ['Português', 'English']) {
      await expect(page.getByRole('button', { name: nome })).toBeVisible();
    }
  });
});
