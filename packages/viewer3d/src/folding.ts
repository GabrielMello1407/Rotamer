import type { DynamicsTrajectory, FoldingFrame, Geometry } from '@rotamer/core';

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
    // Geometria sem quadro nenhum não tem o que mostrar, e sem campo de força
    // não tem energia — zero aqui nunca chega à tela: a faixa da energia só
    // aparece quando a geometria foi relaxada.
    return { positions: [], energy: geometry.energy ?? 0, done: true };
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

/**
 * A vibração, depois que o dobramento termina.
 *
 * A trajetória é percorrida de ida e volta em laço. Não é truque de animação: os
 * quadros são os mesmos instantes simulados, e reproduzir a trajetória ao
 * contrário é tão físico quanto reproduzi-la para a frente — as equações de
 * Newton não distinguem o sentido do tempo.
 */
export function sampleDynamics(
  trajectory: DynamicsTrajectory,
  elapsed: number,
  frameMs = 40,
): readonly number[] {
  const total = trajectory.frames.length;
  if (total === 0) return [];

  const position = elapsed / frameMs;
  const cycle = Math.max(1, (total - 1) * 2);
  const wrapped = ((position % cycle) + cycle) % cycle;
  const forward = wrapped < total - 1;
  const local = forward ? wrapped : cycle - wrapped;

  const index = Math.min(total - 2, Math.floor(local));
  const t = local - index;

  const from = trajectory.frames[index];
  const to = trajectory.frames[index + 1];
  if (!from || !to) return trajectory.frames[0] ?? [];

  const positions = new Array<number>(from.length);
  for (let axis = 0; axis < from.length; axis += 1) {
    const start = from[axis] ?? 0;
    const end = to[axis] ?? 0;
    positions[axis] = start + (end - start) * t;
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

/**
 * O desenho de um modo normal, num instante da tela.
 *
 * O modo é um movimento harmônico: cada átomo vai e volta ao longo do próprio
 * vetor de deslocamento, todos em fase, passando juntos pela geometria de
 * equilíbrio. É por isso que basta uma senoide — não é animação inventada, é a
 * definição de modo normal.
 *
 * Duas coisas são exageradas de propósito, e a interface diz as duas: a
 * **amplitude**, que na realidade é uma fração de ångström invisível na tela, e
 * a **velocidade** — um estiramento C–H completa um ciclo a cada 11 fs, e
 * reproduzir isso em tempo real daria um borrão a 10¹³ Hz. O que está certo é a
 * forma do movimento: quem anda, para onde, e em que proporção.
 */
export function sampleMode(
  equilibrium: readonly number[],
  displacement: readonly number[],
  elapsed: number,
  periodMs = MODE_PERIOD,
  amplitude = MODE_AMPLITUDE,
): readonly number[] {
  const phase = Math.sin((2 * Math.PI * elapsed) / periodMs) * amplitude;

  const positions = new Array<number>(equilibrium.length);
  for (let index = 0; index < equilibrium.length; index += 1) {
    positions[index] = (equilibrium[index] ?? 0) + phase * (displacement[index] ?? 0);
  }

  return positions;
}

/** Quanto tempo um ciclo do modo leva na tela, em milissegundos. */
export const MODE_PERIOD = 1400;

/**
 * Amplitude do modo na tela, em ångström.
 *
 * O deslocamento vem normalizado para o átomo que mais anda valer 1, então este
 * número é literalmente o quanto esse átomo se afasta do equilíbrio no pico.
 * Dois décimos de ångström é o suficiente para o olho ver o movimento sem a
 * molécula parecer que está se desmontando.
 */
export const MODE_AMPLITUDE = 0.22;
