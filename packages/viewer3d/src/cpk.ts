import { atomicNumber } from '@rotamer/core';
/**
 * Cor e tamanho do átomo na cena.
 *
 * As cores vêm dos tokens CPK — a única camada do produto que pode usá-las. Os
 * raios são os de van der Waals encolhidos para bola-e-vareta, que é a
 * representação em que dá para ver a ligação.
 */

/** `--cpk-fe` para o ferro. Todos os 118 existem; não há lista curta aqui. */
function cpkToken(symbol: string): string {
  return `--cpk-${symbol.toLowerCase()}`;
}

/** Raio de desenho em ångström. Proporcional ao real, não igual a ele. */
const RADII: Readonly<Record<string, number>> = {
  H: 0.25,
  C: 0.36,
  N: 0.35,
  O: 0.34,
  F: 0.3,
  P: 0.42,
  S: 0.42,
  Cl: 0.38,
  Br: 0.42,
  I: 0.46,
};

/**
 * Para o resto da tabela, o tamanho vem do período.
 *
 * Descer um período é ganhar uma camada eletrônica, e é isso que a esfera
 * mostra: potássio maior que sódio, sódio maior que lítio. Não é o raio de van
 * der Waals medido — é a proporção que faz a bola-e-vareta ficar legível.
 */
const PERIOD_RADII = [0.25, 0.34, 0.42, 0.48, 0.52, 0.56, 0.58] as const;

const LAST_OF_PERIOD = [2, 10, 18, 36, 54, 86, 118] as const;

const DEFAULT_RADIUS = 0.38;

export interface Cpk {
  readonly colors: Readonly<Record<string, string>>;
  readonly fallback: string;
  readonly bond: string;
  /** O acento da marca, usado no halo do átomo aceso. Nunca é cor de elemento. */
  readonly highlight: string;
  readonly stageTop: string;
  readonly stageBottom: string;
}

/** Lê os tokens já resolvidos pelo tema em vigor. */
export function readCpk(element: Element): Cpk {
  const style = getComputedStyle(element);
  const token = (name: string, fallback: string): string => {
    const value = style.getPropertyValue(name).trim();
    return value === '' ? fallback : value;
  };

  const ink = token('--ink-700', '#2E3140');

  // Leitura sob demanda: são 118 elementos e uma molécula usa meia dúzia.
  const cache = new Map<string, string>();
  const colors = new Proxy<Record<string, string>>(
    {},
    {
      get(_target, key: string): string | undefined {
        if (typeof key !== 'string') return undefined;

        const known = cache.get(key);
        if (known !== undefined) return known;

        const value = style.getPropertyValue(cpkToken(key)).trim();
        if (value === '') return undefined;

        cache.set(key, value);
        return value;
      },
    },
  );

  return {
    colors,
    fallback: ink,
    bond: token('--line-firm', '#CBCEDD'),
    highlight: token('--brand', '#00A98F'),
    stageTop: token('--stage-top', '#F1F3F9'),
    stageBottom: token('--stage-bot', '#E2E5EF'),
  };
}

export function colorOf(cpk: Cpk, element: string): string {
  return cpk.colors[element] ?? cpk.fallback;
}

export function radiusOf(element: string): number {
  const tuned = RADII[element];
  if (tuned !== undefined) return tuned;

  const number = atomicNumber(element);
  if (number === null) return DEFAULT_RADIUS;

  const period = LAST_OF_PERIOD.findIndex((last) => number <= last);
  return PERIOD_RADII[period < 0 ? PERIOD_RADII.length - 1 : period] ?? DEFAULT_RADIUS;
}
