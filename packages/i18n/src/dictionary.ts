import type { Locale } from './locale';

/**
 * Um dicionário é um objeto comum, com chave em inglês e texto no idioma.
 *
 * Nada de caminho em string — `t('quests.title')` não é verificado por ninguém e
 * a chave errada só aparece na tela. Aqui o texto é lido como propriedade,
 * `messages.quests.title`, e o TypeScript recusa a chave que não existe.
 *
 * Texto com número ou nome dentro é **função**, não modelo com `{chave}`: a
 * concordância de plural não é a mesma em português e em inglês, e uma função
 * por idioma resolve isso sem gramática inventada no meio do caminho.
 */
export type MessageNode =
  | string
  | readonly string[]
  | ((...args: never[]) => string)
  | { readonly [key: string]: MessageNode };

export type MessageTree = { readonly [key: string]: MessageNode };

/**
 * Alarga o que o TypeScript estreitou demais.
 *
 * Numa função escrita direto no objeto, o tipo inferido do retorno é a união
 * dos literais que ela devolve — `(n) => n === 1 ? 'anel' : 'anéis'` vira
 * `(n: number) => 'anel' | 'anéis'`. O inglês nunca caberia nisso, e a mensagem
 * de erro falaria de literais em vez de dizer o que falta. Aqui todo retorno de
 * função e todo texto viram `string`, e o que sobra para conferir é o que
 * importa: as mesmas chaves, com os mesmos parâmetros, nos dois idiomas.
 */
export type Widen<T> = T extends (...args: infer A) => unknown
  ? (...args: A) => string
  : T extends string
    ? string
    : T extends readonly (infer U)[]
      ? readonly Widen<U>[]
      : { readonly [K in keyof T]: Widen<T[K]> };

export interface Dictionary<T extends MessageTree> {
  readonly 'pt-BR': T;
  readonly en: T;
}

/**
 * Declara os dois idiomas de um pedaço da interface, lado a lado.
 *
 * O tipo do inglês é o do português, sem inferência própria: **chave nova sem
 * tradução não compila**. É o que faz a regra "toda funcionalidade nova chega
 * traduzida" ser verificada pelo `pnpm typecheck`, e não lembrada na revisão.
 */
export function dictionary<T extends MessageTree>(entries: {
  readonly 'pt-BR': T;
  readonly en: NoInfer<Widen<T>>;
}): Dictionary<Widen<T> & MessageTree> {
  return entries as unknown as Dictionary<Widen<T> & MessageTree>;
}

/** O lado do dicionário que este idioma lê. */
export function pick<T extends MessageTree>(entries: Dictionary<T>, locale: Locale): T {
  return entries[locale];
}
