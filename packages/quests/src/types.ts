import type { Descriptors, FunctionalGroupId } from '@rotamer/core';

/**
 * Missões declarativas.
 *
 * Uma missão é uma lista de condições sobre a **molécula**, nunca sobre o
 * desenho. Isso é o que permite avaliar a mesma `spec` no cliente, para
 * resposta instantânea, e de novo no servidor antes de gravar a tentativa —
 * sem duas implementações que podem discordar.
 *
 * Nenhuma condição aqui é opinião: cada uma lê um número que o RDKit calculou.
 */

/** Descritores que uma missão pode cobrar. */
export type MeasurableDescriptor = Extract<
  keyof Descriptors,
  | 'molarMass'
  | 'exactMass'
  | 'tpsa'
  | 'logP'
  | 'rotatableBonds'
  | 'hbDonors'
  | 'hbAcceptors'
  | 'rings'
  | 'aromaticRings'
  | 'heavyAtoms'
  | 'heteroatoms'
  | 'stereocenters'
  | 'unspecifiedStereocenters'
>;

/** Faixa fechada. Sem mínimo é "até tanto"; sem máximo é "pelo menos tanto". */
export interface Range {
  readonly min?: number;
  readonly max?: number;
}

export type Condition =
  /** A fórmula molecular exata, em notação de Hill. */
  | { readonly kind: 'formula'; readonly value: string }
  /** A molécula exata, por InChIKey. */
  | { readonly kind: 'inchiKey'; readonly value: string }
  /** Quantas vezes um grupo funcional aparece. */
  | ({ readonly kind: 'group'; readonly group: FunctionalGroupId } & Range)
  /** Um descritor dentro de uma faixa. */
  | ({ readonly kind: 'descriptor'; readonly descriptor: MeasurableDescriptor } & Range)
  /** Quantos átomos de um elemento a molécula tem. */
  | ({ readonly kind: 'atoms'; readonly element: string } & Range)
  | { readonly kind: 'not'; readonly of: Condition }
  | { readonly kind: 'every'; readonly of: readonly Condition[] }
  | { readonly kind: 'some'; readonly of: readonly Condition[] };

/** Um objetivo da missão: a condição e como ela é lida na tela. */
export interface Goal {
  readonly id: string;
  /** Texto em português, do jeito que aparece na lista. */
  readonly label: string;
  readonly condition: Condition;
}

export type Track = 'structure' | 'geometry' | 'property';

export interface Quest {
  readonly slug: string;
  readonly track: Track;
  /** 1 é primeira aula; 3 é para quem já pegou o jeito. */
  readonly difficulty: 1 | 2 | 3;
  readonly title: string;
  /** O enunciado. Fala de química, não de interface. */
  readonly brief: string;
  readonly goals: readonly Goal[];
  /**
   * Dicas determinísticas, na ordem em que são liberadas.
   *
   * Não passam por modelo de linguagem: são escritas junto com a missão e
   * revisadas como conteúdo. O tutor de IA entra depois, por cima disto, e
   * sempre marcado como hipótese.
   */
  readonly hints: readonly string[];
}

export interface GoalResult {
  readonly id: string;
  readonly label: string;
  readonly met: boolean;
}

export interface QuestResult {
  readonly slug: string;
  readonly goals: readonly GoalResult[];
  /** Todos os objetivos cumpridos. */
  readonly passed: boolean;
  /** Quantos objetivos foram cumpridos. */
  readonly met: number;
  /** Pontuação de 0 a 100, proporcional aos objetivos cumpridos. */
  readonly score: number;
}
