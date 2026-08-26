import { BOND_LENGTH, type AtomId, type BondId, type MoleculeGraph } from '@rotamer/core';
import type { Camera, Hover, Point, Viewport } from './types';

/**
 * Contas de tela: converter entre grafo e pixel, achar o que está sob o cursor,
 * e prender o traço nos ângulos que a química usa.
 */

/**
 * O quanto se pode errar o alvo, em ångström.
 *
 * São mínimos: o valor de verdade depende do zoom, porque o dedo erra em pixel,
 * não em ångström. Numa molécula afastada, um alvo de 0,45 Å vira um alvo de
 * quatro pixels — impossível de acertar com o polegar.
 */
const ATOM_HIT = 0.45;
const BOND_HIT = 0.28;

/** Alvo mínimo em pixels. Abaixo disto, desenhar no celular vira sorte. */
const ATOM_HIT_PX = 16;
const BOND_HIT_PX = 10;

export interface HitTolerance {
  readonly atom: number;
  readonly bond: number;
}

/** A folga de acerto para o zoom atual. */
export function toleranceFor(camera: Camera): HitTolerance {
  return {
    atom: Math.max(ATOM_HIT, ATOM_HIT_PX / camera.scale),
    bond: Math.max(BOND_HIT, BOND_HIT_PX / camera.scale),
  };
}

/**
 * Ângulos de 30 em 30 graus.
 *
 * Não é enfeite: é o que faz a cadeia sair em zigue-zague de 120°, como químico
 * desenha, em vez de uma linha torta que o aluno acha que representa outra coisa.
 */
const SNAP_STEP = Math.PI / 6;

/** Grafo → pixel. */
export function toScreen(point: Point, camera: Camera, viewport: Viewport): Point {
  return {
    x: viewport.width / 2 + (point.x - camera.x) * camera.scale,
    y: viewport.height / 2 - (point.y - camera.y) * camera.scale,
  };
}

/** Pixel → grafo. */
export function toGraph(point: Point, camera: Camera, viewport: Viewport): Point {
  return {
    x: camera.x + (point.x - viewport.width / 2) / camera.scale,
    y: camera.y - (point.y - viewport.height / 2) / camera.scale,
  };
}

export function distance(first: Point, second: Point): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

/** O átomo sob o ponto, se houver. O último desenhado ganha. */
export function atomAt(graph: MoleculeGraph, point: Point, tolerance = ATOM_HIT): AtomId | null {
  let closest: AtomId | null = null;
  let best = tolerance;

  // Com folga grande, dois átomos podem caber no alvo: vence o mais perto, não
  // o último desenhado.
  for (const atom of graph.atoms) {
    const reach = distance(atom, point);
    if (reach <= best) {
      best = reach;
      closest = atom.id;
    }
  }

  return closest;
}

/** A ligação sob o ponto, se houver — e sem contar as pontas, que são átomos. */
export function bondAt(graph: MoleculeGraph, point: Point, tolerance = BOND_HIT): BondId | null {
  for (let index = graph.bonds.length - 1; index >= 0; index -= 1) {
    const bond = graph.bonds[index];
    if (!bond) continue;

    const from = graph.atoms.find((atom) => atom.id === bond.from);
    const to = graph.atoms.find((atom) => atom.id === bond.to);
    if (!from || !to) continue;

    if (distanceToSegment(point, from, to) <= tolerance) return bond.id;
  }
  return null;
}

/** O que está sob o ponto: átomo tem prioridade sobre ligação. */
export function hoverAt(graph: MoleculeGraph, point: Point, tolerance?: HitTolerance): Hover {
  const atom = atomAt(graph, point, tolerance?.atom);
  if (atom !== null) return { kind: 'atom', id: atom };

  const bond = bondAt(graph, point, tolerance?.bond);
  if (bond !== null) return { kind: 'bond', id: bond };

  return null;
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return distance(point, start);

  const t = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared),
  );

  return distance(point, { x: start.x + t * dx, y: start.y + t * dy });
}

/**
 * Prende o ponto solto ao ângulo e ao comprimento de ligação mais próximos.
 *
 * Enquanto o arrasto é curto, o comprimento fica travado em 1,5 Å — puxar mais
 * longe estica a ligação de propósito, para o caso de precisar abrir espaço.
 */
export function snapFromAtom(origin: Point, pointer: Point): Point {
  const dx = pointer.x - origin.x;
  const dy = pointer.y - origin.y;
  const reach = Math.hypot(dx, dy);

  if (reach < 1e-6) {
    return { x: origin.x + BOND_LENGTH, y: origin.y };
  }

  const angle = Math.round(Math.atan2(dy, dx) / SNAP_STEP) * SNAP_STEP;
  const length = reach < BOND_LENGTH * 1.6 ? BOND_LENGTH : reach;

  return {
    x: origin.x + Math.cos(angle) * length,
    y: origin.y + Math.sin(angle) * length,
  };
}

/**
 * Sugere onde cai a próxima ligação de um átomo: o ângulo mais livre entre os
 * vizinhos que ele já tem. É o que faz clicar duas vezes desenhar zigue-zague.
 */
export function suggestDirection(graph: MoleculeGraph, id: AtomId): Point {
  const atom = graph.atoms.find((candidate) => candidate.id === id);
  if (!atom) return { x: BOND_LENGTH, y: 0 };

  const angles: number[] = [];
  for (const bond of graph.bonds) {
    const otherId = bond.from === id ? bond.to : bond.to === id ? bond.from : null;
    if (otherId === null) continue;

    const other = graph.atoms.find((candidate) => candidate.id === otherId);
    if (other) angles.push(Math.atan2(other.y - atom.y, other.x - atom.x));
  }

  if (angles.length === 0) {
    // Primeira ligação: sobe para a direita, como se começa uma cadeia.
    return direction(atom, SNAP_STEP);
  }

  if (angles.length === 1) {
    const first = angles[0] ?? 0;
    return direction(atom, first + Math.PI - SNAP_STEP * 2);
  }

  // Com dois ou mais vizinhos, procura a maior fresta.
  const sorted = [...angles].sort((a, b) => a - b);
  let best = sorted[0] ?? 0;
  let widest = 0;

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index] ?? 0;
    const next = sorted[(index + 1) % sorted.length] ?? 0;
    const gap = index === sorted.length - 1 ? next + Math.PI * 2 - current : next - current;

    if (gap > widest) {
      widest = gap;
      best = current + gap / 2;
    }
  }

  return direction(atom, best);
}

function direction(origin: Point, angle: number): Point {
  return {
    x: origin.x + Math.cos(angle) * BOND_LENGTH,
    y: origin.y + Math.sin(angle) * BOND_LENGTH,
  };
}

/**
 * Cantos da tela que estão cobertos por outra coisa — barra de ferramentas,
 * faixa de números, cena 3D. Enquadrar sem contar com eles põe metade da
 * molécula atrás de um painel.
 */
export interface Insets {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

const NO_INSETS: Insets = { left: 0, right: 0, top: 0, bottom: 0 };

/**
 * Quanto o enquadramento pode ampliar.
 *
 * Um átomo sozinho, enquadrado sem teto, viraria uma letra de trinta
 * centímetros. O teto é generoso o bastante para molécula pequena aparecer
 * grande e baixo o bastante para o traço continuar parecendo traço.
 */
const FRAME_MAX_SCALE = 52;

/** Câmera que enquadra a molécula inteira com folga. */
export function frameGraph(
  graph: MoleculeGraph,
  viewport: Viewport,
  fallbackScale: number,
  insets: Insets = NO_INSETS,
): Camera {
  if (graph.atoms.length === 0) {
    return { x: 0, y: 0, scale: fallbackScale };
  }

  const xs = graph.atoms.map((atom) => atom.x);
  const ys = graph.atoms.map((atom) => atom.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = Math.max(maxX - minX, BOND_LENGTH * 2);
  const height = Math.max(maxY - minY, BOND_LENGTH * 2);

  // A área que sobra depois de descontar o que está por cima da tela.
  const usableWidth = Math.max(120, viewport.width - insets.left - insets.right);
  const usableHeight = Math.max(120, viewport.height - insets.top - insets.bottom);

  const margin = 2.4;
  const scale = Math.min(
    FRAME_MAX_SCALE,
    usableWidth / (width + margin),
    usableHeight / (height + margin),
  );

  // O centro da molécula vai para o centro da área livre, não para o centro da
  // tela: é a diferença entre a molécula caber e a molécula ficar atrás da cena.
  const centerX = insets.left + usableWidth / 2;
  const centerY = insets.top + usableHeight / 2;

  return {
    x: (minX + maxX) / 2 - (centerX - viewport.width / 2) / scale,
    y: (minY + maxY) / 2 + (centerY - viewport.height / 2) / scale,
    scale,
  };
}
