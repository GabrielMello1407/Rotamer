/**
 * Tabelas de elementos usadas apenas para **descrever** o que o RDKit já
 * decidiu: traduzir número atômico em símbolo e montar a fórmula em notação de
 * Hill a partir da contagem de átomos que o próprio RDKit devolve.
 *
 * Nada aqui decide validade. Quem decide se a molécula existe é o RDKit.
 */

/** Símbolo por número atômico. O índice 0 fica vazio de propósito. */
const SYMBOLS = [
  '',
  'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
  'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
  'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
  'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr',
  'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn',
  'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd',
  'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb',
  'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg',
  'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th',
  'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm',
  'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds',
  'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og',
] as const;

/** Símbolo do elemento a partir do número atômico. */
export function elementSymbol(atomicNumber: number): string {
  return SYMBOLS[atomicNumber] ?? `Z${String(atomicNumber)}`;
}

const NUMBERS = new Map<string, number>(
  SYMBOLS.map((symbol, index) => [symbol, index] as const).filter(([symbol]) => symbol !== ''),
);

/**
 * Número atômico a partir do símbolo, ou `null` para o que não é elemento.
 *
 * Serve para descrever — qual período da tabela, que tamanho desenhar a esfera.
 * Nada aqui decide química.
 */
export function atomicNumber(symbol: string): number | null {
  return NUMBERS.get(symbol) ?? null;
}

/**
 * Massa atômica padrão, em u — os pesos atômicos da IUPAC, abreviados.
 *
 * Isto **entra na conta**: a massa pondera a Hessiana dos modos normais e
 * sorteia as velocidades da dinâmica, então errá-la desloca toda frequência em
 * que o átomo se mexe. Por isso não existe valor de reserva. Elemento que não
 * está aqui devolve `null`, e quem calcula recusa vibrar — dizer "não sei" é a
 * única saída honesta quando a alternativa é publicar um número errado com o
 * selo de calculado.
 *
 * A tabela cobre o que o campo de força alcança (ver `PARAMETRIZED`, em
 * `geometry/conformer.ts`), e um teste trava as duas listas juntas: elemento
 * que o MMFF94 parametriza e cuja massa falte aqui reprova.
 */
const ATOMIC_MASSES: Readonly<Record<string, number>> = {
  H: 1.008,
  Li: 6.94,
  B: 10.81,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  Na: 22.99,
  Mg: 24.305,
  Si: 28.085,
  P: 30.974,
  S: 32.06,
  Cl: 35.45,
  K: 39.098,
  Ca: 40.078,
  Fe: 55.845,
  Cu: 63.546,
  Zn: 65.38,
  Br: 79.904,
  I: 126.904,
};

/** A massa atômica padrão, em u, ou `null` para elemento que não está na tabela. */
export function atomicMass(symbol: string): number | null {
  return ATOMIC_MASSES[symbol] ?? null;
}

/**
 * Valência máxima do elemento **neutro**, usada só para escrever a mensagem de
 * erro em português. Quando o átomo tem carga ou o elemento não está aqui, a
 * mensagem cai para a versão genérica em vez de arriscar afirmação errada.
 */
const MAX_VALENCE: Readonly<Record<string, number>> = {
  H: 1,
  B: 3,
  C: 4,
  N: 3,
  O: 2,
  F: 1,
  Si: 4,
  P: 5,
  S: 6,
  Cl: 1,
  Br: 1,
  I: 1,
};

/** Valência máxima conhecida do elemento neutro, ou `null` se não souber. */
export function maxValence(symbol: string): number | null {
  return MAX_VALENCE[symbol] ?? null;
}

/**
 * Fórmula molecular em notação de Hill: carbono primeiro, hidrogênio depois, o
 * resto em ordem alfabética. Sem carbono, tudo em ordem alfabética.
 */
export function hillFormula(counts: ReadonlyMap<string, number>): string {
  const remaining = new Map(counts);
  const parts: string[] = [];

  const leading = remaining.has('C') ? ['C', 'H'] : [];
  for (const symbol of leading) {
    const total = remaining.get(symbol);
    if (total !== undefined && total > 0) parts.push(write(symbol, total));
    remaining.delete(symbol);
  }

  for (const symbol of [...remaining.keys()].sort((a, b) => a.localeCompare(b, 'en'))) {
    const total = remaining.get(symbol);
    if (total !== undefined && total > 0) parts.push(write(symbol, total));
  }

  return parts.join('');
}

function write(symbol: string, count: number): string {
  return count === 1 ? symbol : `${symbol}${String(count)}`;
}
