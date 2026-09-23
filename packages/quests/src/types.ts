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

/**
 * Um objetivo da missão: o identificador e a condição.
 *
 * **Não há texto aqui.** O rótulo que aparece na lista é derivado da condição,
 * no idioma de quem lê — `goalLabel`, em `messages.ts` — ou escrito à mão no
 * catálogo, em `catalog-text.ts`. Guardar a frase junto do objetivo era o que
 * prendia a missão de professor ao idioma em que ela foi montada: quem abrisse
 * a lista em inglês leria os objetivos em português.
 */
export interface Goal {
  readonly id: string;
  readonly condition: Condition;
}

export type Track = 'structure' | 'geometry' | 'property';

/**
 * O que basta para avaliar: um slug e os objetivos.
 *
 * É a interface mínima que `evaluateQuest` pede. Uma missão de professor
 * (`TeacherQuest`) não tem `track`, `difficulty` nem `hints` do catálogo — e
 * fingir esses campos para caber no tipo `Quest` seria dado falso no banco.
 */
export interface Assessable {
  readonly slug: string;
  readonly goals: readonly Goal[];
}

/**
 * A missão do catálogo como ela é guardada: só o que decide.
 *
 * Título, enunciado e dica não estão aqui porque mudam de idioma e a condição
 * não. O texto vive em `catalog-text.ts`, e `catalogFor(locale)` junta os dois.
 */
export interface QuestSpec extends Assessable {
  readonly track: Track;
  /** 1 é primeira aula; 3 é para quem já pegou o jeito. */
  readonly difficulty: 1 | 2 | 3;
}

/** Um objetivo já com a frase que aparece na tela, no idioma de quem lê. */
export interface LocalizedGoal extends Goal {
  readonly label: string;
}

/** A missão do catálogo pronta para a tela, num idioma. */
export interface Quest extends QuestSpec {
  readonly title: string;
  /** O enunciado. Fala de química, não de interface. */
  readonly brief: string;
  /**
   * Dicas determinísticas, na ordem em que são liberadas.
   *
   * Não passam por modelo de linguagem: são escritas junto com a missão, nos
   * dois idiomas, e revisadas como conteúdo. O tutor de IA entra depois, por
   * cima disto, e sempre marcado como hipótese.
   */
  readonly hints: readonly string[];
  readonly goals: readonly LocalizedGoal[];
}

/**
 * O veredito de um objetivo: o identificador e se foi cumprido.
 *
 * Sem frase, de novo de propósito — quem tem a missão em mãos tem o rótulo, e
 * repeti-lo aqui seria gravar texto de um idioma dentro de um resultado que o
 * servidor devolve para qualquer pessoa.
 */
export interface GoalResult {
  readonly id: string;
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
