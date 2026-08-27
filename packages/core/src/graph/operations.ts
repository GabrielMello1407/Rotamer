import type {
  AtomId,
  BondId,
  BondOrder,
  BondWedge,
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
 * Põe, tira ou troca a cunha de uma ligação.
 *
 * A cunha só faz sentido em ligação simples: uma dupla não sai do plano por
 * conta própria, e marcar cunha nela é escrever uma coisa que o RDKit vai
 * descartar. Pedir cunha numa dupla não faz nada.
 */
export function setBondWedge(
  graph: MoleculeGraph,
  id: BondId,
  wedge: BondWedge,
): MoleculeGraph {
  const bond = findBond(graph, id);
  if (!bond || bond.order !== 1) return graph;

  return {
    atoms: graph.atoms,
    bonds: graph.bonds.map((current) => (current.id === id ? withWedge(current, wedge) : current)),
    nextId: graph.nextId,
  };
}

/**
 * A ligação com a cunha trocada.
 *
 * Sem cunha, a propriedade **não existe** em vez de existir valendo `undefined`:
 * é a diferença entre "esta ligação está no plano" e "alguém marcou nada aqui",
 * e o molblock escreve as duas do mesmo jeito só por sorte.
 */
function withWedge(bond: GraphBond, wedge: BondWedge): GraphBond {
  const base = { id: bond.id, from: bond.from, to: bond.to, order: bond.order };
  return wedge === 'none' ? base : { ...base, wedge };
}

/**
 * Plano → cunha cheia → tracejada → plano. É o clique repetido com a ferramenta
 * de estereoquímica.
 */
export function cycleBondWedge(graph: MoleculeGraph, id: BondId): MoleculeGraph {
  const bond = findBond(graph, id);
  if (!bond) return graph;

  const next: BondWedge =
    bond.wedge === 'up' ? 'down' : bond.wedge === 'down' ? 'none' : 'up';

  return setBondWedge(graph, id, next);
}

/**
 * Troca a ponta fina de lado.
 *
 * A cunha é assimétrica: a ponta fina fica no átomo estereogênico, e virá-la
 * troca a configuração do centro. Sem isto, desenhar o enantiômero exigiria
 * apagar a ligação e refazê-la na outra direção.
 */
export function flipBond(graph: MoleculeGraph, id: BondId): MoleculeGraph {
  const bond = findBond(graph, id);
  if (!bond) return graph;

  return {
    atoms: graph.atoms,
    bonds: graph.bonds.map((current) =>
      current.id === id ? { ...current, from: current.to, to: current.from } : current,
    ),
    nextId: graph.nextId,
  };
}

/** Um pedaço do grafo: os átomos e as ligações que a travessia alcançou. */
export interface Fragment {
  readonly atoms: ReadonlySet<AtomId>;
  readonly bonds: ReadonlySet<BondId>;
}

/**
 * Todo átomo e toda ligação alcançáveis a partir de um átomo, andando pelas
 * ligações — o "pedaço inteiro" que o duplo clique da ferramenta Selecionar
 * pega de uma vez.
 *
 * É travessia de grafo, nada mais: não pergunta se é anel, se é aromático nem
 * se é um grupo funcional — quem responde isso é o RDKit, e o editor não fala
 * com ele (regra de dependência do pacote). Duas moléculas desconectadas na
 * mesma tela (dois fragmentos do mesmo desenho) ficam cada uma no seu pedaço.
 */
export function connectedFragment(graph: MoleculeGraph, start: AtomId): Fragment {
  const atoms = new Set<AtomId>();
  const bonds = new Set<BondId>();
  if (!findAtom(graph, start)) return { atoms, bonds };

  // Pilha em vez de recursão: uma cadeia de centenas de átomos não pode
  // estourar o limite de chamadas do motor.
  const pending: AtomId[] = [start];
  atoms.add(start);

  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined) continue;

    for (const bond of graph.bonds) {
      const other = bond.from === current ? bond.to : bond.to === current ? bond.from : null;
      if (other === null) continue;

      bonds.add(bond.id);
      if (!atoms.has(other)) {
        atoms.add(other);
        pending.push(other);
      }
    }
  }

  return { atoms, bonds };
}

/**
 * O mesmo fragmento, partindo de uma ligação em vez de um átomo — o duplo
 * clique em cima do traço pega o mesmo pedaço que o duplo clique num dos
 * átomos das pontas dela.
 */
export function connectedFragmentFromBond(graph: MoleculeGraph, id: BondId): Fragment {
  const bond = findBond(graph, id);
  if (!bond) return { atoms: new Set(), bonds: new Set() };

  return connectedFragment(graph, bond.from);
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
      // A cunha entra na chave: trocar a configuração de um centro é trocar de
      // molécula, e a geometria 3D precisa ser recalculada.
      const wedge = bond.wedge === undefined ? '' : `:${bond.from}${bond.wedge}`;
      return `${String(first)}-${String(second)}:${String(bond.order)}${wedge}`;
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
