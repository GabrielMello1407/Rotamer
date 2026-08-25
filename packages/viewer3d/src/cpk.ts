/**
 * Cor e tamanho do átomo na cena.
 *
 * As cores vêm dos tokens CPK — a única camada do produto que pode usá-las. Os
 * raios são os de van der Waals encolhidos para bola-e-vareta, que é a
 * representação em que dá para ver a ligação.
 */

const CPK_TOKENS: Readonly<Record<string, string>> = {
  H: '--cpk-h',
  C: '--cpk-c',
  N: '--cpk-n',
  O: '--cpk-o',
  F: '--cpk-f',
  P: '--cpk-p',
  S: '--cpk-s',
  Cl: '--cpk-cl',
  Br: '--cpk-br',
  I: '--cpk-i',
};

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

const DEFAULT_RADIUS = 0.38;

export interface Cpk {
  readonly colors: Readonly<Record<string, string>>;
  readonly fallback: string;
  readonly bond: string;
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
  const colors: Record<string, string> = {};
  for (const [symbol, name] of Object.entries(CPK_TOKENS)) {
    colors[symbol] = token(name, ink);
  }

  return {
    colors,
    fallback: ink,
    bond: token('--line-firm', '#CBCEDD'),
    stageTop: token('--stage-top', '#F1F3F9'),
    stageBottom: token('--stage-bot', '#E2E5EF'),
  };
}

export function colorOf(cpk: Cpk, element: string): string {
  return cpk.colors[element] ?? cpk.fallback;
}

export function radiusOf(element: string): number {
  return RADII[element] ?? DEFAULT_RADIUS;
}
