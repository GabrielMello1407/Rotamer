import type { Locale } from '@rotamer/i18n';
import { questText } from './catalog-text';
import { goalLabel } from './messages';
import type { Quest, QuestSpec } from './types';

/**
 * O catálogo de missões do MVP — só o que decide.
 *
 * Cada missão é conteúdo de aula, mas o conteúdo não está aqui: título,
 * enunciado, dica e rótulo de objetivo vivem em `catalog-text.ts`, nos dois
 * idiomas. O que sobra neste arquivo é o que não muda de idioma — a trilha, a
 * dificuldade e as condições verificáveis por número calculado.
 *
 * A trilha Otimização **não tem missão**: para o usuário avançado ela é
 * ferramenta livre, sem pontuação nem conquista (ver `DECISOES.md` D-09).
 */
export const CATALOG: readonly QuestSpec[] = [
  // ---------------------------------------------------------------- estrutura
  {
    slug: 'primeiro-carbono',
    track: 'structure',
    difficulty: 1,
    goals: [{ id: 'formula', condition: { kind: 'formula', value: 'CH4' } }],
  },
  {
    slug: 'alcool-de-dois-carbonos',
    track: 'structure',
    difficulty: 1,
    goals: [
      { id: 'alcool', condition: { kind: 'group', group: 'alcohol', min: 1 } },
      { id: 'carbonos', condition: { kind: 'atoms', element: 'C', min: 2, max: 2 } },
    ],
  },
  {
    slug: 'acido-do-vinagre',
    track: 'structure',
    difficulty: 1,
    goals: [
      { id: 'acido', condition: { kind: 'group', group: 'carboxylicAcid', min: 1 } },
      { id: 'formula', condition: { kind: 'formula', value: 'C2H4O2' } },
    ],
  },
  {
    slug: 'ester-de-quatro-carbonos',
    track: 'structure',
    difficulty: 2,
    goals: [
      { id: 'ester', condition: { kind: 'group', group: 'ester', min: 1 } },
      { id: 'carbonos', condition: { kind: 'atoms', element: 'C', min: 4, max: 4 } },
      {
        id: 'sem-acido',
        condition: { kind: 'not', of: { kind: 'group', group: 'carboxylicAcid', min: 1 } },
      },
    ],
  },
  {
    slug: 'anel-de-benzeno',
    track: 'structure',
    difficulty: 2,
    goals: [
      { id: 'formula', condition: { kind: 'formula', value: 'C6H6' } },
      { id: 'aromatico', condition: { kind: 'descriptor', descriptor: 'aromaticRings', min: 1 } },
    ],
  },
  {
    slug: 'amida-simples',
    track: 'structure',
    difficulty: 2,
    goals: [
      { id: 'amida', condition: { kind: 'group', group: 'amide', min: 1 } },
      { id: 'carbonos', condition: { kind: 'atoms', element: 'C', min: 1, max: 4 } },
    ],
  },
  {
    slug: 'cetona-de-tres-carbonos',
    track: 'structure',
    difficulty: 2,
    goals: [
      { id: 'cetona', condition: { kind: 'group', group: 'ketone', min: 1 } },
      { id: 'carbonos', condition: { kind: 'atoms', element: 'C', min: 3, max: 3 } },
      {
        id: 'sem-aldeido',
        condition: { kind: 'not', of: { kind: 'group', group: 'aldehyde', min: 1 } },
      },
    ],
  },
  {
    slug: 'amina-primaria',
    track: 'structure',
    difficulty: 2,
    goals: [
      { id: 'amina', condition: { kind: 'group', group: 'primaryAmine', min: 1 } },
      { id: 'carbonos', condition: { kind: 'atoms', element: 'C', min: 3, max: 3 } },
    ],
  },
  {
    slug: 'centro-com-lado',
    track: 'structure',
    difficulty: 3,
    goals: [
      { id: 'centro', condition: { kind: 'descriptor', descriptor: 'stereocenters', min: 1 } },
      {
        id: 'definido',
        condition: { kind: 'descriptor', descriptor: 'unspecifiedStereocenters', max: 0 },
      },
    ],
  },

  // ---------------------------------------------------------------- geometria
  {
    slug: 'ligacao-que-nao-gira',
    track: 'geometry',
    difficulty: 2,
    goals: [
      { id: 'alceno', condition: { kind: 'group', group: 'alkene', min: 1 } },
      { id: 'formula', condition: { kind: 'formula', value: 'C2H4' } },
      {
        id: 'sem-rotacao',
        condition: { kind: 'descriptor', descriptor: 'rotatableBonds', min: 0, max: 0 },
      },
    ],
  },
  {
    slug: 'cadeia-flexivel',
    track: 'geometry',
    difficulty: 2,
    goals: [
      {
        id: 'rotacionaveis',
        condition: { kind: 'descriptor', descriptor: 'rotatableBonds', min: 4 },
      },
    ],
  },
  {
    slug: 'dois-aneis',
    track: 'geometry',
    difficulty: 3,
    goals: [{ id: 'aneis', condition: { kind: 'descriptor', descriptor: 'rings', min: 2 } }],
  },

  // -------------------------------------------------------------- propriedade
  {
    slug: 'regra-de-lipinski',
    track: 'property',
    difficulty: 3,
    goals: [
      { id: 'tamanho', condition: { kind: 'descriptor', descriptor: 'heavyAtoms', min: 12 } },
      { id: 'massa', condition: { kind: 'descriptor', descriptor: 'molarMass', max: 500 } },
      { id: 'logp', condition: { kind: 'descriptor', descriptor: 'logP', max: 5 } },
      { id: 'doadores', condition: { kind: 'descriptor', descriptor: 'hbDonors', max: 5 } },
      { id: 'aceitadores', condition: { kind: 'descriptor', descriptor: 'hbAcceptors', max: 10 } },
    ],
  },
  {
    slug: 'area-polar-pequena',
    track: 'property',
    difficulty: 3,
    goals: [
      {
        id: 'massa',
        condition: { kind: 'descriptor', descriptor: 'molarMass', min: 150, max: 350 },
      },
      { id: 'tpsa', condition: { kind: 'descriptor', descriptor: 'tpsa', max: 60 } },
    ],
  },
  {
    slug: 'polar-e-leve',
    track: 'property',
    difficulty: 3,
    goals: [
      { id: 'massa', condition: { kind: 'descriptor', descriptor: 'molarMass', max: 250 } },
      { id: 'tpsa', condition: { kind: 'descriptor', descriptor: 'tpsa', min: 80 } },
    ],
  },
];

/** A missão guardada de um slug, sem texto nenhum. É o que o servidor avalia. */
export function findSpec(slug: string): QuestSpec | undefined {
  return CATALOG.find((quest) => quest.slug === slug);
}

/**
 * A missão pronta para a tela, num idioma.
 *
 * O rótulo de cada objetivo é o escrito à mão no catálogo — "tem uma hidroxila
 * de álcool" ensina mais do que a frase que `goalLabel` derivaria da condição.
 * Quando falta o texto escrito, a frase derivada entra no lugar: é melhor um
 * rótulo genérico do que um objetivo sem nome na lista.
 */
export function localize(spec: QuestSpec, locale: Locale): Quest {
  const text = questText(locale, spec.slug);

  return {
    ...spec,
    title: text?.title ?? spec.slug,
    brief: text?.brief ?? '',
    hints: text?.hints ?? [],
    goals: spec.goals.map((goal) => ({
      ...goal,
      label: text?.goals[goal.id] ?? goalLabel(locale, goal.condition),
    })),
  };
}

/** O catálogo inteiro, no idioma de quem lê. */
export function catalogFor(locale: Locale): readonly Quest[] {
  return CATALOG.map((spec) => localize(spec, locale));
}

/** A missão de um slug, no idioma de quem lê, se existir. */
export function findQuest(slug: string, locale: Locale): Quest | undefined {
  const spec = findSpec(slug);
  return spec === undefined ? undefined : localize(spec, locale);
}

/** As missões de uma trilha, da mais fácil para a mais difícil. */
export function questsOfTrack(track: QuestSpec['track'], locale: Locale): Quest[] {
  return CATALOG.filter((quest) => quest.track === track)
    .sort((first, second) => first.difficulty - second.difficulty)
    .map((spec) => localize(spec, locale));
}
