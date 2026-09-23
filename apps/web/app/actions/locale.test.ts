import { LOCALE_COOKIE } from '@rotamer/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { currentLocale } from '../../lib/locale';
import { signIn } from './account';
import { chooseLocale } from './locale';
import { askTutor } from './tutor';

/**
 * O idioma decidido no servidor, e a recusa que sai nele.
 *
 * A ação renderiza a frase e devolve texto pronto — o cliente não recebe
 * código para traduzir. Então a prova de que o inglês chega até a tela passa
 * por aqui: com o cookie em inglês, a mesma recusa tem de sair em inglês, e
 * sem cookie nenhum tem de valer o que o navegador pede.
 *
 * `cookies()` e `headers()` de `next/headers` são as únicas bordas trocadas,
 * como nos outros testes de ação: elas precisam de um pedido HTTP de verdade
 * para existir. Nenhum caso aqui toca o banco.
 */
const pedido = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  acceptLanguage: null as string | null,
}));

vi.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        pedido.cookies.has(name) ? { name, value: pedido.cookies.get(name) } : undefined,
      set: (name: string, value: string) => {
        pedido.cookies.set(name, value);
      },
      delete: (name: string) => {
        pedido.cookies.delete(name);
      },
    }),
  headers: () =>
    Promise.resolve({
      get: (name: string) => (name === 'accept-language' ? pedido.acceptLanguage : null),
    }),
}));

beforeEach(() => {
  pedido.cookies.clear();
  pedido.acceptLanguage = null;
});

/** O formulário de entrada, com um e-mail que o schema recusa antes de tocar o banco. */
function formularioComEmailInvalido(): FormData {
  const form = new FormData();
  form.set('email', 'isto-nao-e-email');
  form.set('password', 'molecula-com-8');
  return form;
}

describe('qual idioma o servidor usa', () => {
  it('sem cookie e sem pedido do navegador, é o português', async () => {
    expect(await currentLocale()).toBe('pt-BR');
  });

  it('sem cookie, vale o idioma que o navegador pede', async () => {
    pedido.acceptLanguage = 'en-GB,en;q=0.9';
    expect(await currentLocale()).toBe('en');
  });

  /** O navegador pede um idioma; a pessoa escolheu outro. Quem ganha é a pessoa. */
  it('a escolha guardada ganha do navegador', async () => {
    pedido.acceptLanguage = 'en-US';
    pedido.cookies.set(LOCALE_COOKIE, 'pt-BR');
    expect(await currentLocale()).toBe('pt-BR');
  });

  it('escolher inglês grava o cookie que as próximas páginas leem', async () => {
    await chooseLocale('en');

    expect(pedido.cookies.get(LOCALE_COOKIE)).toBe('en');
    expect(await currentLocale()).toBe('en');
  });

  /**
   * O servidor não confia no cliente: um idioma que o produto não fala não
   * vira `lang` inventado no HTML, nem apaga a escolha que já existia.
   */
  it('idioma que o produto não fala é ignorado', async () => {
    pedido.cookies.set(LOCALE_COOKIE, 'en');
    await chooseLocale('klingon');

    expect(pedido.cookies.get(LOCALE_COOKIE)).toBe('en');
  });

  it('cookie adulterado não vira idioma', async () => {
    pedido.cookies.set(LOCALE_COOKIE, '<script>');
    expect(await currentLocale()).toBe('pt-BR');
  });
});

describe('a recusa da ação sai no idioma de quem pediu', () => {
  /**
   * A mensagem de um schema Zod é o texto que a tela mostra. Ela é montada por
   * pedido — fixada na carga do módulo, sairia sempre no mesmo idioma.
   */
  it('o e-mail inválido é recusado em português por padrão', async () => {
    const resposta = await signIn({ error: null }, formularioComEmailInvalido());
    expect(resposta.error).toBe('Esse e-mail não parece válido.');
  });

  it('e em inglês com o cookie em inglês', async () => {
    pedido.cookies.set(LOCALE_COOKIE, 'en');

    const resposta = await signIn({ error: null }, formularioComEmailInvalido());
    expect(resposta.error).toBe('That e-mail doesn’t look valid.');
  });

  it('e em inglês quando é o navegador quem pede, sem escolha guardada', async () => {
    pedido.acceptLanguage = 'en-US,en;q=0.9';

    const resposta = await signIn({ error: null }, formularioComEmailInvalido());
    expect(resposta.error).toBe('That e-mail doesn’t look valid.');
  });

  it('o pedido mal formado ao tutor também muda de idioma', async () => {
    const malFormado = { molblock: '', questSlug: null, kind: 'proximo-passo' } as const;

    expect(await askTutor(malFormado)).toEqual({
      status: 'rejected',
      reason: 'Pedido mal formado.',
    });

    pedido.cookies.set(LOCALE_COOKIE, 'en');

    expect(await askTutor(malFormado)).toEqual({
      status: 'rejected',
      reason: 'Malformed request.',
    });
  });
});
