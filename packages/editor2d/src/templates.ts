import {
  addAtom,
  addBond,
  BOND_LENGTH,
  type AtomId,
  type BondOrder,
  type MoleculeGraph,
} from '@rotamer/core';
import type { Point } from './types';

/**
 * Anéis prontos.
 *
 * Fechar um hexágono à mão, no celular, com seis toques e um arrasto que precisa
 * grudar no primeiro átomo, é punição — e o produto tem missão que pede
 * exatamente isso. O template entrega o anel montado; o resto do desenho
 * continua sendo do aluno.
 *
 * O anel sai com a geometria certa: polígono regular de lado 1,5 Å. Não é
 * enfeite — é o mesmo comprimento de ligação que o editor usa em todo traço, e é
 * o que faz o RDKit ler ângulos coerentes depois.
 */

export type RingKind = 'benzene' | 'cyclohexane' | 'cyclopentane' | 'pyridine';

interface RingShape {
  /** Quantos vértices. */
  readonly sides: number;
  /** Elemento de cada vértice, na ordem. */
  readonly elements: readonly string[];
  /** Ordem de cada ligação do anel, na ordem. */
  readonly orders: readonly BondOrder[];
  /** Como aparece na barra de ferramentas. */
  readonly label: string;
}

const SHAPES: Readonly<Record<RingKind, RingShape>> = {
  benzene: {
    sides: 6,
    elements: ['C', 'C', 'C', 'C', 'C', 'C'],
    // Kekulé: alternadas. Quem percebe a aromaticidade é o RDKit, depois.
    orders: [2, 1, 2, 1, 2, 1],
    label: 'Benzeno',
  },
  cyclohexane: {
    sides: 6,
    elements: ['C', 'C', 'C', 'C', 'C', 'C'],
    orders: [1, 1, 1, 1, 1, 1],
    label: 'Cicloexano',
  },
  cyclopentane: {
    sides: 5,
    elements: ['C', 'C', 'C', 'C', 'C'],
    orders: [1, 1, 1, 1, 1],
    label: 'Ciclopentano',
  },
  pyridine: {
    sides: 6,
    elements: ['N', 'C', 'C', 'C', 'C', 'C'],
    orders: [2, 1, 2, 1, 2, 1],
    label: 'Piridina',
  },
};

export const RING_KINDS = Object.keys(SHAPES) as readonly RingKind[];

export function ringLabel(kind: RingKind): string {
  return SHAPES[kind].label;
}

/** O raio do polígono regular cujo lado é uma ligação. */
function circumradius(sides: number): number {
  return BOND_LENGTH / (2 * Math.sin(Math.PI / sides));
}

export interface InsertRingResult {
  readonly graph: MoleculeGraph;
  readonly atoms: readonly AtomId[];
}

/**
 * Põe um anel no grafo, centrado no ponto pedido.
 *
 * O primeiro vértice fica no topo: hexágono com vértice para cima é como o anel
 * aparece em livro, e o aluno reconhece.
 */
export function insertRing(
  graph: MoleculeGraph,
  kind: RingKind,
  center: Point,
): InsertRingResult {
  const shape = SHAPES[kind];
  const radius = circumradius(shape.sides);

  let current = graph;
  const created: AtomId[] = [];

  for (let vertex = 0; vertex < shape.sides; vertex += 1) {
    const angle = Math.PI / 2 + (2 * Math.PI * vertex) / shape.sides;
    const element = shape.elements[vertex] ?? 'C';

    const added = addAtom(current, {
      element,
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });

    current = added.graph;
    created.push(added.atomId);
  }

  for (let side = 0; side < shape.sides; side += 1) {
    const from = created[side];
    const to = created[(side + 1) % shape.sides];
    if (from === undefined || to === undefined) continue;

    current = addBond(current, from, to, shape.orders[side] ?? 1).graph;
  }

  return { graph: current, atoms: created };
}
