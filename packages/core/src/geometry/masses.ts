import { atomicMass } from '../chemistry/elements';
import type { Geometry } from './types';

/**
 * As massas dos átomos da geometria, ou `null` se alguma for desconhecida.
 *
 * Recusar é deliberado. A massa **entra na conta** dos dois lados: ela pondera
 * a Hessiana dos modos normais e sorteia as velocidades da dinâmica. Um valor
 * de reserva não deixaria o resultado aproximado, deixaria errado com selo de
 * calculado — e uma frequência errada não parece errada para ninguém.
 *
 * Sem vibração a tela já sabe o que dizer, e diz.
 */
export function massesOf(geometry: Geometry): number[] | null {
  const masses: number[] = [];

  for (const atom of geometry.atoms) {
    const mass = atomicMass(atom.element);
    if (mass === null) return null;
    masses.push(mass);
  }

  return masses;
}
