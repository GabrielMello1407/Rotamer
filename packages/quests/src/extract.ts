import type { Molecule } from '@rotamer/core';
import { countElements } from './conditions';
import type { Condition, MeasurableDescriptor } from './types';

/**
 * Extração de objetivos a partir da molécula que o professor desenhou (D-25).
 *
 * A parte que decide química nunca é digitada: o professor escolhe, entre os
 * candidatos daqui, quais quer cobrar — mas cada candidato, do rótulo à
 * condição, sai do que o RDKit já calculou em `molecule`. Nada aqui lê o
 * desenho, e nada aqui inventa um número.
 */

export type CandidateKind = 'identity' | 'formula' | 'group' | 'count';

/** Um objetivo que dá para cobrar desta molécula. */
export interface CandidateGoal {
  /** Determinístico: `formula`, `inchi-key`, `group:alcohol:1`, `atoms:C:2`, `descriptor:rings:1`. */
  readonly id: string;
  /** Rótulo em pt-BR, **gerado**. Nunca digitado, nunca editável. */
  readonly label: string;
  /** O valor medido, para a coluna da direita da lista: `2`, `C2H6O`. */
  readonly measured: string;
  readonly kind: CandidateKind;
  /** Verdadeiro só no InChIKey: marcado, ele é o único objetivo da missão. */
  readonly exclusive: boolean;
  readonly condition: Condition;
}

/**
 * Concorda o artigo e o plural com a palavra `grupo`/`átomo`/`anel`… — nunca
 * com o nome da coisa contada. `1 grupo álcool` e `2 grupos amida` são as
 * frases certas: o nome do grupo funcional é sempre invariável aqui.
 */
function plural(n: number, singular: string, pluralForm: string): string {
  return n === 1 ? singular : pluralForm;
}

interface DescriptorSpec {
  readonly key: Extract<
    MeasurableDescriptor,
    | 'rings'
    | 'aromaticRings'
    | 'rotatableBonds'
    | 'hbDonors'
    | 'hbAcceptors'
    | 'heavyAtoms'
    | 'heteroatoms'
    | 'stereocenters'
  >;
  readonly label: (n: number) => string;
}

/**
 * Os oito descritores de contagem que viram candidato sempre — inclusive
 * quando o valor é zero, porque "nenhum anel" também é um objetivo
 * verificável. `molarMass`, `exactMass`, `tpsa` e `logP` ficam de fora por
 * serem contínuos: igualdade exata é armadilha, e faixa digitada é o que o
 * D-25 proíbe (§4.1).
 */
const DESCRIPTOR_SPECS: readonly DescriptorSpec[] = [
  {
    key: 'rings',
    label: (n) => `tem exatamente ${n} ${plural(n, 'anel', 'anéis')}`,
  },
  {
    key: 'aromaticRings',
    label: (n) => `tem exatamente ${n} ${plural(n, 'anel aromático', 'anéis aromáticos')}`,
  },
  {
    key: 'rotatableBonds',
    label: (n) => `tem exatamente ${n} ${plural(n, 'ligação rotacionável', 'ligações rotacionáveis')}`,
  },
  {
    key: 'hbDonors',
    label: (n) =>
      `tem exatamente ${n} ${plural(n, 'doador de ligação de hidrogênio', 'doadores de ligação de hidrogênio')}`,
  },
  {
    key: 'hbAcceptors',
    label: (n) =>
      `tem exatamente ${n} ${plural(n, 'aceitador de ligação de hidrogênio', 'aceitadores de ligação de hidrogênio')}`,
  },
  {
    key: 'heavyAtoms',
    label: (n) => `tem exatamente ${n} ${plural(n, 'átomo pesado', 'átomos pesados')}`,
  },
  {
    key: 'heteroatoms',
    label: (n) => `tem exatamente ${n} ${plural(n, 'heteroátomo', 'heteroátomos')}`,
  },
  {
    key: 'stereocenters',
    label: (n) => `tem exatamente ${n} ${plural(n, 'centro estereogênico', 'centros estereogênicos')}`,
  },
];

/**
 * Os objetivos verificáveis desta molécula, para o professor escolher quais
 * cobrar (D-25). `id` é função da condição — nunca um contador — porque é
 * assim que o servidor confere, ao salvar, que o objetivo escolhido saiu
 * mesmo desta molécula e não foi forjado pelo cliente (§4.5, R-1).
 */
export function extractGoals(molecule: Molecule): readonly CandidateGoal[] {
  const candidates: CandidateGoal[] = [];

  candidates.push({
    id: 'inchi-key',
    label: 'é exatamente esta molécula',
    measured: molecule.inchiKey,
    kind: 'identity',
    exclusive: true,
    condition: { kind: 'inchiKey', value: molecule.inchiKey },
  });

  candidates.push({
    id: 'formula',
    label: `a fórmula é ${molecule.formula}`,
    measured: molecule.formula,
    kind: 'formula',
    exclusive: false,
    condition: { kind: 'formula', value: molecule.formula },
  });

  for (const group of molecule.groups) {
    candidates.push({
      id: `group:${group.id}:${group.count}`,
      label: `tem pelo menos ${group.count} ${plural(group.count, 'grupo', 'grupos')} ${group.name}`,
      measured: String(group.count),
      kind: 'group',
      exclusive: false,
      condition: { kind: 'group', group: group.id, min: group.count },
    });
  }

  for (const [element, count] of countElements(molecule.formula)) {
    candidates.push({
      id: `atoms:${element}:${count}`,
      label: `tem exatamente ${count} ${plural(count, 'átomo', 'átomos')} de ${element}`,
      measured: String(count),
      kind: 'count',
      exclusive: false,
      condition: { kind: 'atoms', element, min: count, max: count },
    });
  }

  for (const spec of DESCRIPTOR_SPECS) {
    const value = molecule.descriptors[spec.key];
    candidates.push({
      id: `descriptor:${spec.key}:${value}`,
      label: spec.label(value),
      measured: String(value),
      kind: 'count',
      exclusive: false,
      condition: { kind: 'descriptor', descriptor: spec.key, min: value, max: value },
    });
  }

  // Só faz sentido oferecer "sem centro sem configuração" quando existe
  // algum centro estereogênico para configurar **e** a própria molécula já
  // cumpre isso — do contrário R-2 recusaria a missão pela própria resposta
  // do professor: um candidato que a resposta não cumpre nunca é candidato.
  if (molecule.descriptors.stereocenters > 0 && molecule.descriptors.unspecifiedStereocenters === 0) {
    candidates.push({
      id: 'descriptor:unspecifiedStereocenters:0',
      label: 'nenhum centro estereogênico fica sem configuração',
      measured: String(molecule.descriptors.unspecifiedStereocenters),
      kind: 'count',
      exclusive: false,
      condition: { kind: 'descriptor', descriptor: 'unspecifiedStereocenters', max: 0 },
    });
  }

  return candidates;
}
