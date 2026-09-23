import type { Locale } from './locale';

/**
 * Concordância de número, por idioma.
 *
 * Português e inglês concordam no que interessa aqui — um é singular, o resto é
 * plural, e o zero é plural nos dois ("nenhuma tentativa", "no attempts"). O
 * que muda é a palavra, e é por isso que a escolha fica com quem escreve o
 * texto: `plural(n, 'tentativa', 'tentativas')`.
 *
 * Existe para que nenhuma tela volte a escrever `${n} aluno(s)`.
 */
export function plural(count: number, one: string, other: string): string {
  return count === 1 ? one : other;
}

/**
 * Lista falada: "A, B e C" em português, "A, B and C" em inglês.
 *
 * O `Intl.ListFormat` já faz isso e conhece a vírgula de Oxford de cada idioma,
 * que nós não temos por que conhecer.
 */
export function list(locale: Locale, items: readonly string[]): string {
  return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(items);
}
