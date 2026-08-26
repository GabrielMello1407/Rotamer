import 'server-only';
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

/**
 * O código que o professor entrega em mãos.
 *
 * Não existe e-mail no caminho da recuperação de senha, e é de propósito: em
 * escola pública muito aluno não tem caixa de entrada própria, e a que tem não
 * abre durante a aula. Quem recupera a senha é quem está na sala.
 *
 * O código nunca é guardado — fica só o resumo dele, o mesmo cuidado que se toma
 * com senha e com sessão.
 */

/**
 * Alfabeto sem `0`, `O`, `1`, `I` e `L`.
 *
 * O código vai ser lido de um papel, ou ditado em voz alta, numa sala com trinta
 * pessoas. Zero e letra O trocados fazem o aluno errar três vezes e culpar o
 * produto.
 */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** Oito caracteres: 31⁸ ≈ 8,5 × 10¹¹ combinações, com validade de um dia. */
const LENGTH = 8;

/** Quanto tempo o código vale. Um dia cobre a aula de hoje e a de amanhã. */
export const CODE_HOURS = 24;

/** Gera um código novo, já no formato em que ele aparece na tela. */
export function generateCode(): string {
  let code = '';
  for (let index = 0; index < LENGTH; index += 1) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }

  return code;
}

/**
 * Normaliza o que a pessoa digitou: maiúscula, sem espaço e sem hífen.
 *
 * E nada além disso. Seria tentador "consertar" um zero digitado no lugar de um
 * O, mas nenhum dos dois existe no alfabeto — adivinhar qual letra a pessoa
 * quis dizer trocaria um código errado por outro código errado, e o erro
 * apareceria como "não confere" do mesmo jeito, só que depois de uma
 * substituição inventada pelo produto.
 */
export function normalizeCode(entry: string): string {
  return entry.toUpperCase().replace(/[\s-]/g, '');
}

export function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

/** Comparação em tempo constante — resumo não se compara com `===`. */
export function sameHash(first: string, second: string): boolean {
  const a = Buffer.from(first, 'utf8');
  const b = Buffer.from(second, 'utf8');

  return a.length === b.length && timingSafeEqual(a, b);
}

/** Escrito em dois blocos de quatro: é assim que se lê e se dita sem errar. */
export function formatCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}
