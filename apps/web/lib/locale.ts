import 'server-only';
import { cookies, headers } from 'next/headers';
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  negotiateLocale,
  pick,
  type Dictionary,
  type Locale,
  type MessageTree,
} from '@rotamer/i18n';

/**
 * O idioma de quem está lendo, decidido no servidor.
 *
 * Primeiro a escolha guardada no cookie; se não houver nenhuma, o que o
 * navegador pede em `Accept-Language`. Decidir aqui, e não no cliente, é o que
 * faz a página chegar já no idioma certo: metade do produto é renderizada no
 * servidor, e trocar o texto depois da hidratação seria piscar a tela inteira.
 */
export async function currentLocale(): Promise<Locale> {
  const jar = await cookies();
  const chosen = jar.get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;

  try {
    const requested = (await headers()).get('accept-language');
    return negotiateLocale(requested);
  } catch {
    // Contexto sem cabeçalho — geração estática. O padrão serve.
    return DEFAULT_LOCALE;
  }
}

/** O dicionário de um pedaço da interface, no idioma de quem está lendo. */
export async function serverMessages<T extends MessageTree>(entries: Dictionary<T>): Promise<T> {
  return pick(entries, await currentLocale());
}
