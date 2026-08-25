import type {
  AtomId,
  BondId,
  BondOrder,
  GraphAtom,
  GraphBond,
  MoleculeGraph,
  NewAtom,
} from './types';

/**
 * Operações sobre o grafo. Todas são puras: recebem um grafo e devolvem outro.
 *
 * É o que faz o desfazer ser trivial — o histórico do editor é uma pilha de
 * grafos, não uma pilha de comandos com lógica de reversão.
 */

/** Grafo vazio. Tela em branco. */
export function emptyGraph(): MoleculeGraph {
  return { atoms: [], bonds: [], nextId: 1 };
}

export function isEmpty(graph: MoleculeGraph): boolean {
  return graph.atoms.length === 0;
}

export function findAtom(graph: MoleculeGraph, id: AtomId): GraphAtom | undefined {
  return graph.atoms.find((atom) => atom.id === id);
}

export function findBond(graph: MoleculeGraph, id: BondId): GraphBond | undefined {
  return graph.bonds.find((bond) => bond.id === id);
}

/** A ligação entre dois átomos, se existir. A ordem dos argumentos não importa. */
export function bondBetween(
  graph: MoleculeGraph,
  first: AtomId,
  second: AtomId,
): GraphBond | undefined {
  return graph.bonds.find(
    (bond) =>
      (bond.from === first && bond.to === second) || (bond.from === second && bond.to === first),
  );
}

/** Vizinhos de um átomo, na ordem em que as ligações foram criadas. */
export function neighbors(graph: MoleculeGraph, id: AtomId): AtomId[] {
  const found: AtomId[] = [];
  for (const bond of graph.bonds) {
    if (bond.from === id) found.push(bond.to);
    else if (bond.to === id) found.push(bond.from);
  }
  return found;
}

export interface AddAtomResult {
  readonly graph: MoleculeGraph;
  readonly atomId: AtomId;
}

export function addAtom(graph: MoleculeGraph, atom: NewAtom): AddAtomResult {
  const created: GraphAtom = {
    id: graph.nextId,
    element: atom.element,
    x: atom.x,
    y: atom.y,
    charge: atom.charge ?? 0,
  };

  return {
    graph: {
      atoms: [...graph.atoms, created],
      bonds: graph.bonds,
      nextId: graph.nextId + 1,
    },
    atomId: created.id,
  };
}

export interface AddBondResult {
  readonly graph: MoleculeGraph;
  readonly bondId: BondId | null;
}

/**
 * Liga dois átomos. Ligar um átomo a ele mesmo, a um átomo inexistente ou a um
 * vizinho que já tem ligação não faz nada — o grafo volta igual.
 *
 * Note que **nada aqui julga valência**. Quem diz se a molécula existe é o
 * RDKit, depois, com a estrutura inteira na mão.
 */
export function addBond(
  graph: MoleculeGraph,
  from: AtomId,
  to: AtomId,
  order: BondOrder = 1,
): AddBondResult {
  if (from === to) return { graph, bondId: null };
  if (!findAtom(graph, from) || !findAtom(graph, to)) return { graph, bondId: null };
  if (bondBetween(graph, from, to)) return { graph, bondId: null };

  const created: GraphBond = { id: graph.nextId, from, to, order };

  return {
    graph: {
      atoms: graph.atoms,
      bonds: [...graph.bonds, created],
      nextId: graph.nextId + 1,
    },
    bondId: created.id,
  };
}

/** Apaga o átomo e, junto, toda ligação que chegava nele. */
export function removeAtom(graph: MoleculeGraph, id: AtomId): MoleculeGraph {
  return {
    atoms: graph.atoms.filter((atom) => atom.id !== id),
    bonds: graph.bonds.filter((bond) => bond.from !== id && bond.to !== id),
    nextId: graph.nextId,
  };
}

export function removeBond(graph: MoleculeGraph, id: BondId): MoleculeGraph {
  return {
    atoms: graph.atoms,
    bonds: graph.bonds.filter((bond) => bond.id !== id),
    nextId: graph.nextId,
  };
}

export function setElement(graph: MoleculeGraph, id: AtomId, element: string): MoleculeGraph {
  return mapAtoms(graph, (atom) => (atom.id === id ? { ...atom, element } : atom));
}

export function setCharge(graph: MoleculeGraph, id: AtomId, charge: number): MoleculeGraph {
  return mapAtoms(graph, (atom) => (atom.id === id ? { ...atom, charge } : atom));
}

export function moveAtom(graph: MoleculeGraph, id: AtomId, x: number, y: number): MoleculeGraph {
  return mapAtoms(graph, (atom) => (atom.id === id ? { ...atom, x, y } : atom));
}

export function setBondOrder(graph: MoleculeGraph, id: BondId, order: BondOrder): MoleculeGraph {
  return {
    atoms: graph.atoms,
    bonds: graph.bonds.map((bond) => (bond.id === id ? { ...bond, order } : bond)),
    nextId: graph.nextId,
  };
}

/** Simples → dupla → tripla → simples. É o clique repetido na ligação. */
export function cycleBondOrder(graph: MoleculeGraph, id: BondId): MoleculeGraph {
  const bond = findBond(graph, id);
  if (!bond) return graph;

  const next: BondOrder = bond.order === 1 ? 2 : bond.order === 2 ? 3 : 1;
  return setBondOrder(graph, id, next);
}

/**
 * Só a topologia importa para saber se a geometria precisa ser recalculada.
 * Arrastar átomo muda o grafo, mas não muda a molécula — e conformação é cara.
 */
export function topologyKey(graph: MoleculeGraph): string {
  const atoms = graph.atoms
    .map((atom) => `${String(atom.id)}:${atom.element}:${String(atom.charge)}`)
    .sort((a, b) => a.localeCompare(b, 'en'))
    .join(',');

  const bonds = graph.bonds
    .map((bond) => {
      const [first, second] =
        bond.from < bond.to ? [bond.from, bond.to] : [bond.to, bond.from];
      return `${String(first)}-${String(second)}:${String(bond.order)}`;
    })
    .sort((a, b) => a.localeCompare(b, 'en'))
    .join(',');

  return `${atoms}|${bonds}`;
}

function mapAtoms(
  graph: MoleculeGraph,
  transform: (atom: GraphAtom) => GraphAtom,
): MoleculeGraph {
  return {
    atoms: graph.atoms.map(transform),
    bonds: graph.bonds,
    nextId: graph.nextId,
  };
}
