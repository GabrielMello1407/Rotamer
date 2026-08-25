import type { FoldingFrame, Geometry } from '@rotamer/core';

/**
 * O dobramento.
 *
 * Cada quadro é uma parada real da minimização de energia — não é interpolação
 * inventada entre um começo e um fim. O que acontece aqui é só a passagem
 * suave de um quadro para o outro, para o olho acompanhar.
 */

/** Duração do dobramento, em milissegundos. Espelha o token `--t-fold`. */
export const FOLD_DURATION = 2000;

export interface FoldingSample {
  /** Posições achatadas `[x0, y0, z0, ...]`, já interpoladas. */
  readonly positions: readonly number[];
  /** Energia daquele instante, em kcal/mol. */
  readonly energy: number;
  readonly done: boolean;
}

/**
 * Onde o dobramento está no instante `elapsed`.
 *
 * Passado o tempo total, devolve o último quadro — a geometria final, que é a
 * que vale.
 */
export function sampleFolding(
  geometry: Geometry,
  elapsed: number,
  duration = FOLD_DURATION,
): FoldingSample {
  const frames = geometry.frames;
  const last = frames[frames.length - 1];

  if (!last) {
    return { positions: [], energy: geometry.energy, done: true };
  }

  if (frames.length === 1 || elapsed >= duration) {
    return { positions: last.positions, energy: last.energy, done: true };
  }

  const progress = Math.max(0, elapsed / duration);
  const position = progress * (frames.length - 1);
  const index = Math.min(frames.length - 2, Math.floor(position));
  const t = position - index;

  const from = frames[index];
  const to = frames[index + 1];
  if (!from || !to) {
    return { positions: last.positions, energy: last.energy, done: true };
  }

  return {
    positions: interpolate(from, to, t),
    energy: from.energy + (to.energy - from.energy) * t,
    done: false,
  };
}

function interpolate(from: FoldingFrame, to: FoldingFrame, t: number): number[] {
  const total = Math.min(from.positions.length, to.positions.length);
  const positions = new Array<number>(total);

  for (let index = 0; index < total; index += 1) {
    const start = from.positions[index] ?? 0;
    const end = to.positions[index] ?? 0;
    positions[index] = start + (end - start) * t;
  }

  return positions;
}

/** Centro da molécula no último quadro — é para lá que a câmera olha. */
export function centerOf(geometry: Geometry): [number, number, number] {
  if (geometry.atoms.length === 0) return [0, 0, 0];

  let x = 0;
  let y = 0;
  let z = 0;
  for (const atom of geometry.atoms) {
    x += atom.x;
    y += atom.y;
    z += atom.z;
  }

  const total = geometry.atoms.length;
  return [x / total, y / total, z / total];
}

/** Raio que a molécula ocupa, para a câmera saber de onde olhar. */
export function radiusOf(geometry: Geometry): number {
  const [cx, cy, cz] = centerOf(geometry);

  let radius = 1.5;
  for (const atom of geometry.atoms) {
    radius = Math.max(radius, Math.hypot(atom.x - cx, atom.y - cy, atom.z - cz));
  }

  return radius;
}
