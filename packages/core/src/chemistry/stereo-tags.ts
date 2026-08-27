import type { JSMol } from '@rdkit/rdkit';
import { parseJson } from './rdkit-json';

/**
 * O que o RDKit devolve em `get_stereo_tags()`.
 *
 * As duas listas têm formatos diferentes, e a diferença tem razão de ser: um
 * centro é um átomo (`[1, "(R)"]`), e uma geometria de dupla é uma ligação entre
 * dois (`[1, 2, "(E)"]`).
 *
 * Compartilhado entre a análise e o organizar — os dois perguntam a mesma
 * pergunta ao RDKit, e duplicar a leitura do JSON seria abrir espaço para as
 * duas respostas divergirem por bug de transcrição, não de química.
 */
export interface StereoTags {
  readonly CIP_atoms?: readonly (readonly [number, string])[];
  readonly CIP_bonds?: readonly (readonly [number, number, string])[];
}

/** Lê as tags CIP da molécula tal como o RDKit as calculou. */
export function readStereoTags(mol: JSMol): StereoTags {
  return parseJson<StereoTags>(mol.get_stereo_tags());
}

/** O rótulo vem entre parênteses (`(R)`); aqui ele perde o parêntese. */
export function cleanStereoLabel(label: string): string {
  return label.replace(/[()]/g, '');
}
