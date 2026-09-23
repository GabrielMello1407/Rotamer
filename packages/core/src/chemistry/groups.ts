import type { JSMol, RDKitModule } from '@rdkit/rdkit';
import { parseJson } from './rdkit-json';

/**
 * Grupos funcionais.
 *
 * Quem faz o reconhecimento é o RDKit, casando SMARTS na estrutura já
 * sanitizada. O que existe aqui é a lista de padrões e o identificador de cada
 * um — nenhuma perícia química escrita à mão, nenhum palpite.
 *
 * O nome que aparece na tela não mora aqui: o núcleo não fala idioma nenhum. É
 * `functionalGroupName` em `@rotamer/i18n` que transforma `carboxylicAcid` em
 * "ácido carboxílico" ou "carboxylic acid".
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
  /** Quantas vezes o grupo aparece na molécula. */
  readonly count: number;
}

interface GroupPattern {
  readonly id: FunctionalGroupId;
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
    smarts: '[CX3](=[OX1])[OX2H1]',
    key: 0,
  },
  {
    id: 'anhydride',
    smarts: '[CX3](=[OX1])[OX2][CX3](=[OX1])',
    key: 0,
  },
  {
    // O carbono que segura o oxigênio não pode ser outra carbonila, senão todo
    // anidrido seria lido como dois ésteres.
    id: 'ester',
    smarts: '[CX3](=[OX1])[OX2H0][#6;!$([CX3]=[OX1])]',
    key: 0,
  },
  {
    // Vale para a amida aromática também: na cafeína a carbonila está dentro do
    // anel, e continua sendo amida.
    id: 'amide',
    smarts: '[NX3,nX3][CX3,c](=[OX1])',
    key: 1,
  },
  {
    id: 'aldehyde',
    smarts: '[CX3H1](=[OX1])[#6]',
    key: 0,
  },
  {
    id: 'ketone',
    smarts: '[#6][CX3](=[OX1])[#6]',
    key: 1,
  },
  {
    id: 'phenol',
    smarts: '[c][OX2H]',
    key: 1,
  },
  {
    id: 'alcohol',
    smarts: '[CX4;!$([CX3]=[OX1])][OX2H]',
    key: 1,
  },
  {
    id: 'ether',
    smarts: '[OD2;!$(O[CX3,c]=[OX1])]([#6])[#6]',
    key: 0,
  },
  {
    id: 'primaryAmine',
    smarts: '[NX3;H2;!$(N[CX3,c]=[OX1]);!$([N+]);!$(N=*)]',
    key: 0,
  },
  {
    id: 'secondaryAmine',
    smarts: '[NX3;H1;!$(N[CX3,c]=[OX1]);!$([N+]);!$(N=*)]',
    key: 0,
  },
  {
    id: 'tertiaryAmine',
    smarts: '[NX3;H0;!$(N[CX3,c]=[OX1]);!$([N+]);!$(N=*);!$(n)]',
    key: 0,
  },
  {
    id: 'nitrile',
    smarts: '[NX1]#[CX2]',
    key: 0,
  },
  {
    id: 'nitro',
    smarts: '[$([NX3](=[OX1])=[OX1]),$([NX3+](=[OX1])[O-])]',
    key: 0,
  },
  {
    id: 'haloalkane',
    smarts: '[#6;!$([CX3]=[OX1])][F,Cl,Br,I]',
    key: 1,
  },
  {
    id: 'alkene',
    smarts: '[CX3]=[CX3]',
    key: 0,
  },
  {
    id: 'alkyne',
    smarts: '[CX2]#[CX2]',
    key: 0,
  },
  {
    id: 'thiol',
    smarts: '[#16X2H]',
    key: 0,
  },
  {
    id: 'sulfide',
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
      found.push({ id: pattern.id, count: occurrences.size });
    }
  }

  return found;
}
