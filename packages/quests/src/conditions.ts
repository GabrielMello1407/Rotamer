import type { Molecule } from '@rotamer/core';
import type { Condition, Range } from './types';

/**
 * A avaliação das condições.
 *
 * Toda condição lê um número que já veio do RDKit. Nenhuma delas olha o
 * desenho, e nenhuma delas decide química: elas comparam.
 */

/** Quantos átomos de cada elemento a fórmula em notação de Hill declara. */
export function countElements(formula: string): Map<string, number> {
  const counts = new Map<string, number>();

  for (const [, symbol, digits] of formula.matchAll(/([A-Z][a-z]?)(\d*)/g)) {
    if (symbol === undefined) continue;
    const amount = digits === undefined || digits === '' ? 1 : Number.parseInt(digits, 10);
    counts.set(symbol, (counts.get(symbol) ?? 0) + amount);
  }

  return counts;
}

function withinRange(value: number, range: Range): boolean {
  if (range.min !== undefined && value < range.min) return false;
  if (range.max !== undefined && value > range.max) return false;

  // Faixa sem mínimo nem máximo quer dizer "existe pelo menos um".
  if (range.min === undefined && range.max === undefined) return value > 0;

  return true;
}

/** A condição foi cumprida por esta molécula? */
export function meets(condition: Condition, molecule: Molecule): boolean {
  switch (condition.kind) {
    case 'formula':
      return molecule.formula === condition.value;

    case 'inchiKey':
      return molecule.inchiKey === condition.value;

    case 'group': {
      const group = molecule.groups.find((candidate) => candidate.id === condition.group);
      return withinRange(group?.count ?? 0, condition);
    }

    case 'descriptor':
      return withinRange(molecule.descriptors[condition.descriptor], condition);

    case 'atoms':
      return withinRange(countElements(molecule.formula).get(condition.element) ?? 0, condition);

    case 'not':
      return !meets(condition.of, molecule);

    case 'every':
      return condition.of.every((inner) => meets(inner, molecule));

    case 'some':
      return condition.of.some((inner) => meets(inner, molecule));
  }
}
