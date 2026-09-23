/**
 * `@rotamer/i18n` — os dois idiomas do produto.
 *
 * Este pacote não depende de nada: roda no navegador, no servidor e em teste de
 * linha de comando. O que ele oferece é o tipo `Locale`, o `dictionary()` que
 * obriga o inglês a acompanhar o português, e a formatação de número e data por
 * idioma. Os textos em si moram **junto da funcionalidade que os usa** —
 * `packages/quests/src/messages.ts`, `apps/web/app/.../messages.ts` — e não num
 * arquivo central que ninguém acha.
 *
 * A exceção é `messages/chemistry.ts`: o `core` não depende de ninguém, então
 * ele devolve código de erro e é aqui que o código vira frase.
 *
 * Os ganchos de React vivem em `@rotamer/i18n/react`, para que o `quests` e as
 * server actions possam importar o resto sem arrastar React junto.
 */
export {
  dictionary,
  pick,
  type Dictionary,
  type MessageNode,
  type MessageTree,
  type Widen,
} from './dictionary';
export {
  DEFAULT_LOCALE,
  isLocale,
  languageTag,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_NAMES,
  LOCALES,
  negotiateLocale,
  type Locale,
} from './locale';
export { formatDate, formatInteger, formatNumber, numberFormat } from './format';
export { list, plural } from './plural';
export { dictionaryDivergences } from './parity';
export {
  chemistryErrorText,
  chemistryMessages,
  functionalGroupName,
  type ChemistryErrorCode,
  type ChemistryErrorLike,
  type OffendingAtomLike,
} from './messages/chemistry';
