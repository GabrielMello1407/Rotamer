import type { JSMol, RDKitModule } from '@rdkit/rdkit';
import { parseJson } from './rdkit-json';

/**
 * Grupos funcionais.
 *
 * Quem faz o reconhecimento é o RDKit, casando SMARTS na estrutura já
 * sanitizada. O que existe aqui é a lista de padrões e o nome em português de
 * cada um — nenhuma perícia química escrita à mão, nenhum palpite.
 */

export type FunctionalGroupId =
  | 'alcohol'
  | 'phenol'
  | 'ether'
  | 'aldehyde'
  | 'ketone'
  | 'carboxylicAcid'
  | 'ester'
  | 'anhydride'
  | 'amide'
  | 'primaryAmine'
  | 'secondaryAmine'
  | 'tertiaryAmine'
  | 'nitrile'
  | 'nitro'
  | 'haloalkane'
  | 'alkene'
  | 'alkyne'
  | 'thiol'
  | 'sulfide';

export interface FunctionalGroup {
  readonly id: FunctionalGroupId;
  /** Nome em português, do jeito que aparece na tela. */
  readonly name: string;
  /** Quantas vezes o grupo aparece na molécula. */
  readonly count: number;
}

interface GroupPattern {
  readonly id: FunctionalGroupId;
  readonly name: string;
  readonly smarts: string;
  /**
   * Índice, dentro do padrão, do átomo que identifica uma ocorrência.
   *
   * Sem isto a contagem sai errada: na cafeína o mesmo carbono de carbonila
   * casa com dois nitrogênios diferentes e o padrão bate três vezes para duas
   * amidas. Contando por átomo-chave, cada grupo aparece uma vez só.
   */
  readonly key: number;
}

/**
 * A ordem importa na leitura: o mais específico primeiro, porque é assim que a
 * pessoa lê a molécula — "isto aqui é um éster" antes de "isto aqui tem um
 * oxigênio no meio".
 */
const PATTERNS: readonly GroupPattern[] = [
  {
    id: 'carboxylicAcid',
    name: 'ácido carboxílico',
    smarts: '[CX3](=[OX1])[OX2H1]',
    key: 0,
  },
  {
    id: 'anhydride',
    name: 'anidrido',
    smarts: '[CX3](=[OX1])[OX2][CX3](=[OX1])',
    key: 0,
  },
  {
    // O carbono que segura o oxigênio não pode ser outra carbonila, senão todo
    // anidrido seria lido como dois ésteres.
    id: 'ester',
    name: 'éster',
    smarts: '[CX3](=[OX1])[OX2H0][#6;!$([CX3]=[OX1])]',
    key: 0,
  },
  {
    // Vale para a amida aromática também: na cafeína a carbonila está dentro do
    // anel, e continua sendo amida.
    id: 'amide',
    name: 'amida',
    smarts: '[NX3,nX3][CX3,c](=[OX1])',
    key: 1,
  },
  {
    id: 'aldehyde',
    name: 'aldeído',
    smarts: '[CX3H1](=[OX1])[#6]',
    key: 0,
  },
  {
    id: 'ketone',
    name: 'cetona',
    smarts: '[#6][CX3](=[OX1])[#6]',
    key: 1,
  },
  {
    id: 'phenol',
    name: 'fenol',
    smarts: '[c][OX2H]',
    key: 1,
  },
  {
    id: 'alcohol',
    name: 'álcool',
    smarts: '[CX4;!$([CX3]=[OX1])][OX2H]',
    key: 1,
  },
  {
    id: 'ether',
    name: 'éter',
    smarts: '[OD2;!$(O[CX3,c]=[OX1])]([#6])[#6]',
    key: 0,
  },
  {
    id: 'primaryAmine',
    name: 'amina primária',
    smarts: '[NX3;H2;!$(N[CX3,c]=[OX1]);!$([N+]);!$(N=*)]',
    key: 0,
  },
  {
    id: 'secondaryAmine',
    name: 'amina secundária',
    smarts: '[NX3;H1;!$(N[CX3,c]=[OX1]);!$([N+]);!$(N=*)]',
    key: 0,
  },
  {
    id: 'tertiaryAmine',
    name: 'amina terciária',
    smarts: '[NX3;H0;!$(N[CX3,c]=[OX1]);!$([N+]);!$(N=*);!$(n)]',
    key: 0,
  },
  {
    id: 'nitrile',
    name: 'nitrila',
    smarts: '[NX1]#[CX2]',
    key: 0,
  },
  {
    id: 'nitro',
    name: 'nitro',
    smarts: '[$([NX3](=[OX1])=[OX1]),$([NX3+](=[OX1])[O-])]',
    key: 0,
  },
  {
    id: 'haloalkane',
    name: 'haleto',
    smarts: '[#6;!$([CX3]=[OX1])][F,Cl,Br,I]',
    key: 1,
  },
  {
    id: 'alkene',
    name: 'alceno',
    smarts: '[CX3]=[CX3]',
    key: 0,
  },
  {
    id: 'alkyne',
    name: 'alcino',
    smarts: '[CX2]#[CX2]',
    key: 0,
  },
  {
    id: 'thiol',
    name: 'tiol',
    smarts: '[#16X2H]',
    key: 0,
  },
  {
    id: 'sulfide',
    name: 'sulfeto',
    smarts: '[#16X2H0]([#6])[#6]',
    key: 0,
  },
];

interface SubstructMatch {
  readonly atoms: readonly number[];
}

/** As consultas compiladas vivem enquanto o worker viver. */
const compiled = new WeakMap<RDKitModule, Map<FunctionalGroupId, JSMol>>();

function queryFor(rdkit: RDKitModule, pattern: GroupPattern): JSMol | null {
  let cache = compiled.get(rdkit);
  if (!cache) {
    cache = new Map();
    compiled.set(rdkit, cache);
  }

  const existing = cache.get(pattern.id);
  if (existing) return existing;

  const query = rdkit.get_qmol(pattern.smarts);
  if (query === null) return null;

  cache.set(pattern.id, query);
  return query;
}

/** Os grupos funcionais que o RDKit encontra na molécula. */
export function detectFunctionalGroups(rdkit: RDKitModule, mol: JSMol): FunctionalGroup[] {
  const found: FunctionalGroup[] = [];

  for (const pattern of PATTERNS) {
    const query = queryFor(rdkit, pattern);
    if (!query) continue;

    const raw = parseJson<SubstructMatch[] | Record<string, never>>(
      mol.get_substruct_matches(query),
    );
    if (!Array.isArray(raw) || raw.length === 0) continue;

    const occurrences = new Set<number>();
    for (const match of raw) {
      const atom = match.atoms[pattern.key];
      if (atom !== undefined) occurrences.add(atom);
    }

    if (occurrences.size > 0) {
      found.push({ id: pattern.id, name: pattern.name, count: occurrences.size });
    }
  }

  return found;
}
