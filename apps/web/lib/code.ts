import 'server-only';
import { randomInt } from 'node:crypto';

/**
 * Códigos que vão ser lidos de um papel e ditados em voz alta.
 *
 * Duas coisas no produto funcionam assim: o código de troca de senha, que o
 * professor entrega em mãos (D-19), e o código de entrar numa turma, que ele
 * escreve no quadro. Nos dois casos o inimigo é o mesmo — zero trocado por letra
 * O numa sala com trinta pessoas.
 */

/** Sem `0`, `O`, `1`, `I` e `L`: são os pares que se confundem lidos ou ditados. */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function generateCode(length: number): string {
  let code = '';
  for (let index = 0; index < length; index += 1) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }

  return code;
}

/** Maiúscula, sem espaço e sem hífen. E nada além disso — ver `reset-code.ts`. */
export function normalizeCode(entry: string): string {
  return entry.toUpperCase().replace(/[\s-]/g, '');
}
