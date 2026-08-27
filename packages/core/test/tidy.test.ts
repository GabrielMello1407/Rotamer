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
 * química, e que quando a cunha muda de cara, `tidy` conta o que aconteceu em
 * vez de mudar em silêncio.
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

/**
 * Etanol com uma cunha na ligação C–O.
 *
 * O carbono que recebe a cunha só tem dois hidrogênios implícitos: não há
 * centro estereogênico ali, e a cunha não define configuração nenhuma —
 * enfeite que o RDKit tem todo o direito de não recopiar.
 */
function etanolComCunhaSemSentido(): string {
  let graph = emptyGraph();

  const methyl = addAtom(graph, { element: 'C', x: 0, y: 0 });
  graph = methyl.graph;
  const carbon = addAtom(graph, { element: 'C', x: 1.5, y: 0 });
  graph = carbon.graph;
  const oxygen = addAtom(graph, { element: 'O', x: 1.5, y: 1.5 });
  graph = oxygen.graph;

  graph = addBond(graph, methyl.atomId, carbon.atomId).graph;
  const hydroxyl = addBond(graph, carbon.atomId, oxygen.atomId);
  graph = hydroxyl.graph;
  if (hydroxyl.bondId === null) throw new Error('a ligação com o oxigênio não foi criada');

  return toMolblock(setBondWedge(graph, hydroxyl.bondId, 'up'));
}

/** Um centro estereogênico de verdade: carbono com flúor, cloro e bromo. */
function centroComCunha(): string {
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

  return toMolblock(setBondWedge(graph, first.bondId, 'up'));
}

/**
 * Alanina: o centro estereogênico de uma molécula de aula, não de um exemplo
 * artificial. Parte do SMILES com estereoquímica definida para que o próprio
 * RDKit desenhe as coordenadas e a cunha de partida — é o molblock que o
 * editor recebe de verdade quando alguém cola ou carrega essa molécula.
 */
async function alanina(): Promise<string> {
  const antes = await analyze('C[C@@H](N)C(=O)O');
  if (!antes.ok) throw new Error(antes.error.message);
  return antes.molecule.molblock;
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

    for (const comprimento of comprimentos(fromMolblock(arrumado.molblock))) {
      expect(comprimento).toBeCloseTo(BOND_LENGTH, 1);
    }
  });

  it('a molécula continua sendo a mesma', async () => {
    const arrumado = await tidy(torto());
    if (arrumado === null) throw new Error('o RDKit não devolveu o desenho organizado');

    const antes = await analyze(torto());
    const depois = await analyze(arrumado.molblock);
    if (!antes.ok || !depois.ok) throw new Error('o propano deixou de ser válido');

    expect(depois.molecule.formula).toBe('C3H8');
    expect(depois.molecule.inchiKey).toBe(antes.molecule.inchiKey);
  });

  it('o anel vira hexágono, e é essa a diferença que se vê', async () => {
    const arrumado = await tidy('c1ccccc1');
    if (arrumado === null) throw new Error('o RDKit não devolveu o desenho organizado');

    const graph = fromMolblock(arrumado.molblock);
    const centro = {
      x: graph.atoms.reduce((soma, atom) => soma + atom.x, 0) / graph.atoms.length,
      y: graph.atoms.reduce((soma, atom) => soma + atom.y, 0) / graph.atoms.length,
    };

    // Todo vértice à mesma distância do centro: é a definição de regular.
    const raios = graph.atoms.map((atom) => Math.hypot(atom.x - centro.x, atom.y - centro.y));
    for (const raio of raios) expect(raio).toBeCloseTo(raios[0] ?? 0, 2);
  });

  it('molécula sem cunha nenhuma organiza e o relatório vem todo zerado', async () => {
    const arrumado = await tidy(torto());
    if (arrumado === null) throw new Error('o RDKit não devolveu o desenho organizado');

    expect(arrumado.stereo).toEqual({
      removedWedges: 0,
      flippedWedges: 0,
      movedWedges: 0,
      sameConfiguration: true,
    });
  });

  it('cunha sem centro estereogênico some, e o relatório conta a remoção', async () => {
    const entrada = etanolComCunhaSemSentido();
    const antes = fromMolblock(entrada);
    expect(antes.bonds.map((bond) => bond.wedge ?? 'none')).toEqual(['none', 'up']);

    const arrumado = await tidy(entrada);
    if (arrumado === null) throw new Error('o RDKit não devolveu o desenho organizado');

    const depois = fromMolblock(arrumado.molblock);
    expect(depois.bonds.map((bond) => bond.wedge ?? 'none')).toEqual(['none', 'none']);

    expect(arrumado.stereo).toEqual({
      removedWedges: 1,
      flippedWedges: 0,
      movedWedges: 0,
      // Não havia centro nenhum, dos dois lados — os dois mapas de configuração
      // continuam vazios, e vazio contra vazio é "a mesma coisa".
      sameConfiguration: true,
    });
  });

  it('a configuração do centro sobrevive — R continua R, e a cunha troca de tipo', async () => {
    const entrada = centroComCunha();

    const antes = await analyze(entrada);
    if (!antes.ok) throw new Error(antes.error.message);

    const arrumado = await tidy(entrada);
    if (arrumado === null) throw new Error('o RDKit não devolveu o desenho organizado');

    const depois = await analyze(arrumado.molblock);
    if (!depois.ok) throw new Error(depois.error.message);

    // A mesma configuração, e o mesmo SMILES — só o lado do papel mudou.
    expect(depois.molecule.stereo.atoms).toEqual(antes.molecule.stereo.atoms);
    expect(depois.molecule.smiles).toBe(antes.molecule.smiles);

    expect(arrumado.stereo).toEqual({
      removedWedges: 0,
      flippedWedges: 1,
      movedWedges: 0,
      sameConfiguration: true,
    });
  });

  it('alanina: o centro de uma molécula de aula também troca de cunha sem trocar de configuração', async () => {
    const entrada = await alanina();

    const antes = await analyze(entrada);
    if (!antes.ok) throw new Error(antes.error.message);
    expect(antes.molecule.stereo.atoms).toEqual([{ index: 1, label: 'R' }]);

    const arrumado = await tidy(entrada);
    if (arrumado === null) throw new Error('o RDKit não devolveu o desenho organizado');

    const depois = await analyze(arrumado.molblock);
    if (!depois.ok) throw new Error(depois.error.message);

    // O centro continua R — só o lado do papel em que a cunha aparece mudou.
    expect(depois.molecule.stereo.atoms).toEqual(antes.molecule.stereo.atoms);

    expect(arrumado.stereo).toEqual({
      removedWedges: 0,
      flippedWedges: 1,
      movedWedges: 0,
      sameConfiguration: true,
    });
  });
});

describe('a cunha que muda de ligação não é cunha que sai', () => {
  /**
   * O caso que a revisão pegou.
   *
   * O RDKit escolhe de qual ligação do centro a cunha sai, e a escolha muda com
   * as coordenadas. Contando por ligação, a alanina com cunha no C–N saía como
   * "uma cunha removida" — indistinguível do etanol, onde a cunha não valia
   * nada. Os dois casos ensinam coisas opostas.
   */
  it('a alanina com a cunha no C–N: a cunha muda de ligação, e nada é removido', async () => {
    const partida = await tidy('C[C@@H](N)C(=O)O');
    if (partida === null) throw new Error('o RDKit não organizou a alanina');

    // O desenho de partida já vem do RDKit, com a cunha onde ele a põe. Mover a
    // cunha para outra ligação do mesmo centro é o que reproduz o caso.
    const graph = fromMolblock(partida.molblock);
    const wedged = graph.bonds.find((bond) => (bond.wedge ?? 'none') !== 'none');
    if (!wedged) throw new Error('a alanina saiu sem cunha nenhuma');

    const outra = graph.bonds.find(
      (bond) => bond.id !== wedged.id && (bond.from === wedged.from || bond.to === wedged.from),
    );
    if (!outra) throw new Error('o centro não tem outra ligação para receber a cunha');

    const movida = setBondWedge(setBondWedge(graph, wedged.id, 'none'), outra.id, 'up');
    const resultado = await tidy(toMolblock(movida));
    if (resultado === null) throw new Error('o RDKit não organizou a alanina movida');

    // Nenhuma cunha saiu: o centro continua desenhado, com a mesma configuração.
    expect(resultado.stereo.removedWedges).toBe(0);
    expect(resultado.stereo.movedWedges + resultado.stereo.flippedWedges).toBeGreaterThan(0);
    expect(resultado.stereo.sameConfiguration).toBe(true);

    const antes = await analyze(toMolblock(movida));
    const depois = await analyze(resultado.molblock);
    if (!antes.ok || !depois.ok) throw new Error('a alanina deixou de ser válida');

    expect(depois.molecule.stereo.atoms).toEqual(antes.molecule.stereo.atoms);
  });

  it('o etanol com cunha continua sendo cunha que sai — ali não há centro nenhum', async () => {
    let graph = emptyGraph();
    const c1 = addAtom(graph, { element: 'C', x: 0, y: 0 });
    graph = c1.graph;
    const c2 = addAtom(graph, { element: 'C', x: 1.5, y: 0 });
    graph = c2.graph;
    const o = addAtom(graph, { element: 'O', x: 2.2, y: 1.2 });
    graph = o.graph;
    graph = addBond(graph, c1.atomId, c2.atomId).graph;
    const ligacao = addBond(graph, c2.atomId, o.atomId);
    graph = ligacao.graph;
    if (ligacao.bondId === null) throw new Error('a ligação com o oxigênio não foi criada');

    const resultado = await tidy(toMolblock(setBondWedge(graph, ligacao.bondId, 'up')));
    if (resultado === null) throw new Error('o RDKit não organizou o etanol');

    expect(resultado.stereo.removedWedges).toBe(1);
    expect(resultado.stereo.movedWedges).toBe(0);
    expect(resultado.stereo.sameConfiguration).toBe(true);
  });
});
