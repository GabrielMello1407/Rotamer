import { expect, test } from '@playwright/test';
import { desenharUmCarbono, openQuests } from './bancada';

/**
 * O tutor é a única parte da tela que pode estar errada — e por isso é a única
 * marcada em âmbar. Sem chave configurada, ele se desliga e o produto continua
 * inteiro: as dicas da missão são escritas à mão.
 */

/**
 * O ambiente tem chave do Gemini?
 *
 * Vem do `.env`, carregado na configuração da suíte. Não é preferência de quem
 * roda: é o que decide qual dos dois comportamentos existe para ser verificado.
 */
const comChave = (process.env['GEMINI_API_KEY'] ?? '') !== '';

test.describe('tutor', () => {
  test('só aceita pergunta depois de existir molécula', async ({ page }) => {
    await page.goto('/');
    await openQuests(page);

    await expect(page.getByTestId('tutor-proximo-passo')).toBeDisabled();
    await expect(
      page.getByText('Desenhe uma estrutura válida e o tutor pode comentar'),
    ).toBeVisible();

    await desenharUmCarbono(page);
    await expect(page.getByTestId('tutor-proximo-passo')).toBeEnabled({ timeout: 60_000 });
  });

  test('sem chave configurada, ele avisa e devolve o aluno para as dicas escritas', async ({
    page,
  }) => {
    test.skip(comChave, 'há chave configurada — o tutor responde de verdade.');

    await page.goto('/');
    await desenharUmCarbono(page);
    await openQuests(page);

    await expect(page.getByTestId('tutor-proximo-passo')).toBeEnabled({ timeout: 60_000 });
    await page.getByTestId('tutor-proximo-passo').click();

    await expect(page.getByTestId('tutor-indisponivel')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('tutor-indisponivel')).toContainText('escritas à mão');

    // O que o motor determinístico calcula continua na tela, intacto.
    await expect(page.getByTestId('formula')).toHaveText('CH4');
  });

  test('com chave configurada, ele responde — e a resposta vem marcada como hipótese', async ({
    page,
  }) => {
    test.skip(!comChave, 'sem chave, o tutor se desliga e não há resposta para verificar.');

    await page.goto('/');
    await desenharUmCarbono(page);
    await openQuests(page);

    await expect(page.getByTestId('tutor-proximo-passo')).toBeEnabled({ timeout: 60_000 });
    await page.getByTestId('tutor-proximo-passo').click();

    // O modelo é de terceiro e responde em segundos, não em milissegundos.
    const resposta = page.getByTestId('tutor-resposta');
    await expect(resposta).toBeVisible({ timeout: 45_000 });

    // O que sai do modelo nunca aparece sem dizer o que é.
    await expect(resposta).toContainText('hipótese');

    // E o que o motor determinístico calculou continua ali, do lado, intacto.
    await expect(page.getByTestId('formula')).toHaveText('CH4');
  });
});