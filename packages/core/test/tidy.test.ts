import { describe, expect, it } from 'vitest';
import { analyze } from '../src/chemistry/analysis';
import { tidy } from '../src/chemistry/tidy';
import { fromMolblock, toMolblock } from '../src/graph/molfile';
import { addAtom, addBond, emptyGraph, setBondWedge } from '../src/graph/operations';
import { BOND_LENGTH } from '../src/graph/types';

/**
 * Organizar o desenho.
 *
 * Quem está aprendendo põe o átomo onde a mão levou, e o resultado é uma
 * estrutura torta: ligações de comprimentos diferentes, ângulos que não existem.
 * Endireitar é do RDKit — o que se verifica aqui é que endireitar não mexe na
 * química.
 */

/** Um propano torto de propósito: três carbonos jogados na tela. */
function torto(): string {
  let graph = emptyGraph();

  const first = addAtom(graph, { element: 'C', x: 0, y: 0 });
  graph = first.graph;
  const second = addAtom(graph, { element: 'C', x: 0.3, y: 2.4 });
  graph = second.graph;
  const third = addAtom(graph, { element: 'C', x: 3.4, y: 3.6 });
  graph = third.graph;

  graph = addBond(graph, first.atomId, second.atomId).graph;
  graph = addBond(graph, second.atomId, third.atomId).graph;

  return toMolblock(graph);
}

describe('organizar o desenho', () => {
  it('as ligações passam todas a medir o mesmo', async () => {
    const antes = fromMolblock(torto());
    const comprimentos = (graph: ReturnType<typeof fromMolblock>): number[] =>
      graph.bonds.map((bond) => {
        const from = graph.atoms.find((atom) => atom.id === bond.from);
        const to = graph.atoms.find((atom) => atom.id === bond.to);
        if (!from || !to) throw new Error('ligação sem ponta');
        return Math.hypot(from.x - to.x, from.y - to.y);
      });

    const [primeiro, segundo] = comprimentos(antes);
    expect(primeiro).toBeDefined();
    expect(segundo).toBeDefined();
    // Torto de verdade: os dois traços têm comprimentos diferentes.
    expect(Math.abs((primeiro ?? 0) - (segundo ?? 0))).toBeGreaterThan(0.3);

    const arrumado = await tidy(torto());
    if (arrumado === null) throw new Error('o RDKit não devolveu o desenho organizado');

    for (const comprimento of comprimentos(fromMolblock(arrumado))) {
      expect(comprimento).toBeCloseTo(BOND_LENGTH, 1);
    }
  });

  it('a molécula continua sendo a mesma', async () => {
    const arrumado = await tidy(torto());
    if (arrumado === null) throw new Error('o RDKit não devolveu o desenho organizado');

    const antes = await analyze(torto());
    const depois = await analyze(arrumado);
    if (!antes.ok || !depois.ok) throw new Error('o propano deixou de ser válido');

    expect(depois.molecule.formula).toBe('C3H8');
    expect(depois.molecule.inchiKey).toBe(antes.molecule.inchiKey);
  });

  it('o anel vira hexágono, e é essa a diferença que se vê', async () => {
    const arrumado = await tidy('c1ccccc1');
    if (arrumado === null) throw new Error('o RDKit não devolveu o desenho organizado');

    const graph = fromMolblock(arrumado);
    const centro = {
      x: graph.atoms.reduce((soma, atom) => soma + atom.x, 0) / graph.atoms.length,
      y: graph.atoms.reduce((soma, atom) => soma + atom.y, 0) / graph.atoms.length,
    };

    // Todo vértice à mesma distância do centro: é a definição de regular.
    const raios = graph.atoms.map((atom) => Math.hypot(atom.x - centro.x, atom.y - centro.y));
    for (const raio of raios) expect(raio).toBeCloseTo(raios[0] ?? 0, 2);
  });

  it('a configuração do centro sobrevive — R continua R', async () => {
    let graph = emptyGraph();

    const center = addAtom(graph, { element: 'C', x: 0, y: 0 });
    graph = center.graph;
    const fluorine = addAtom(graph, { element: 'F', x: 0.2, y: 1.9 });
    graph = fluorine.graph;
    const chlorine = addAtom(graph, { element: 'Cl', x: 1.8, y: -0.4 });
    graph = chlorine.graph;
    const bromine = addAtom(graph, { element: 'Br', x: -1.1, y: -1.6 });
    graph = bromine.graph;

    const first = addBond(graph, center.atomId, fluorine.atomId);
    graph = first.graph;
    graph = addBond(graph, center.atomId, chlorine.atomId).graph;
    graph = addBond(graph, center.atomId, bromine.atomId).graph;
    if (first.bondId === null) throw new Error('a ligação com o flúor não foi criada');

    const molblock = toMolblock(setBondWedge(graph, first.bondId, 'up'));

    const antes = await analyze(molblock);
    if (!antes.ok) throw new Error(antes.error.message);

    const arrumado = await tidy(molblock);
    if (arrumado === null) throw new Error('o RDKit não devolveu o desenho organizado');

    const depois = await analyze(arrumado);
    if (!depois.ok) throw new Error(depois.error.message);

    expect(depois.molecule.stereo.atoms).toEqual(antes.molecule.stereo.atoms);
    expect(depois.molecule.smiles).toBe(antes.molecule.smiles);
  });
});
