import { z } from 'zod';

/**
 * O schema fechado da saída do tutor.
 *
 * **Nenhum campo numérico.** O modelo devolve texto e *referências* a chaves —
 * `{{tpsa}}`, `{{formula}}` — e quem troca a referência pelo número é a
 * interface, com o valor que o RDKit calculou. Assim o tutor não tem por onde
 * inventar, arredondar ou contradizer um número.
 *
 * A validação abaixo é a fronteira de verdade: texto com dígito solto é
 * recusado, não corrigido. Explicação confiante e errada é o único jeito de
 * perder um químico, e ele testa um caso limite nos primeiros trinta segundos.
 */

/** As chaves que o tutor pode citar. Cada uma vira um número calculado na tela. */
export const REFERENCE_KEYS = [
  'formula',
  'molarMass',
  'tpsa',
  'logP',
  'rotatableBonds',
  'hbDonors',
  'hbAcceptors',
  'rings',
  'aromaticRings',
  'heavyAtoms',
  'inchiKey',
] as const;

export type ReferenceKey = (typeof REFERENCE_KEYS)[number];

const PLACEHOLDER = /\{\{([a-zA-Z]+)\}\}/g;

/** Texto sem número solto: só letras, pontuação e referências entre chaves. */
const guardedText = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => unknownReferences(value).length === 0, {
      message: 'referência desconhecida',
    })
    .refine((value) => !hasLooseDigits(value), {
      message: 'o tutor não escreve número: use uma referência entre chaves',
    });

export const tutorHintSchema = z.object({
  /** O que está acontecendo com a molécula, em uma ou duas frases. */
  diagnosis: guardedText(400),
  /** O que tentar em seguida. No máximo três, cada uma acionável. */
  suggestions: z.array(guardedText(240)).min(1).max(3),
  /** A armadilha que costuma pegar quem está nessa situação. */
  watchOut: guardedText(240).optional(),
});

export type TutorHint = z.infer<typeof tutorHintSchema>;

/** Referências citadas que não existem na lista fechada. */
export function unknownReferences(text: string): string[] {
  const found: string[] = [];

  for (const [, key] of text.matchAll(PLACEHOLDER)) {
    if (key !== undefined && !(REFERENCE_KEYS as readonly string[]).includes(key)) {
      found.push(key);
    }
  }

  return found;
}

/** Dígito fora de uma referência — é o que não pode existir. */
export function hasLooseDigits(text: string): boolean {
  return /\d/.test(text.replace(PLACEHOLDER, ''));
}

/**
 * Troca as referências pelos valores calculados.
 *
 * Referência que chega sem valor correspondente vira texto vazio em vez de
 * aparecer crua na tela — mas isso não deveria acontecer: a validação já
 * recusou o que não está na lista.
 */
export function fillReferences(
  text: string,
  values: Readonly<Partial<Record<ReferenceKey, string>>>,
): string {
  return text.replace(PLACEHOLDER, (_match, key: string) => {
    return values[key as ReferenceKey] ?? '';
  });
}
