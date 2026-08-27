import { describe, expect, it } from 'vitest';
import { analyze } from '../src/chemistry/analysis';
import { fromMolblock, toMolblock } from '../src/graph/molfile';
import {
  addAtom,
  addBond,
  bondBetween,
  connectedFragment,
  connectedFragmentFromBond,
  cycleBondOrder,
  emptyGraph,
  moveAtom,
  neighbors,
  removeAtom,
  setBondOrder,
  setElement,
  topologyKey,
} from '../src/graph/operations';
import { BOND_LENGTH, type MoleculeGraph } from '../src/graph/types';

/** Etanol montado à mão, como sairia do editor: C–C–O. */
function ethanol(): MoleculeGraph {
  const primeiro = addAtom(emptyGraph(), { element: 'C', x: 0, y: 0 });
  const segundo = addAtom(primeiro.graph, { element: 'C', x: BOND_LENGTH, y: 0 });
  const terceiro = addAtom(segundo.graph, { element: 'O', x: BOND_LENGTH * 2, y: 0 });

  const ligacao = addBond(terceiro.graph, primeiro.atomId, segundo.atomId);
  const outra = addBond(ligacao.graph, segundo.atomId, terceiro.atomId);

  return outra.graph;
}

describe('grafo', () => {
  it('cresce átomo a átomo, sem reaproveitar identificador', () => {
    const grafo = ethanol();

    expect(grafo.atoms).toHaveLength(3);
    expect(grafo.bonds).toHaveLength(2);
    expect(new Set(grafo.atoms.map((atom) => atom.id)).size).toBe(3);
  });

  it('apagar átomo leva junto as ligações dele', () => {
    const grafo = ethanol();
    const meio = grafo.atoms[1];
    if (!meio) throw new Error('grafo de teste inválido');

    const depois = removeAtom(grafo, meio.id);

    expect(depois.atoms).toHaveLength(2);
    expect(depois.bonds).toHaveLength(0);
  });

  it('não liga um átomo a ele mesmo nem repete ligação existente', () => {
    const grafo = ethanol();
    const [primeiro, segundo] = grafo.atoms;
    if (!primeiro || !segundo) throw new Error('grafo de teste inválido');

    expect(addBond(grafo, primeiro.id, primeiro.id).bondId).toBeNull();
    expect(addBond(grafo, primeiro.id, segundo.id).bondId).toBeNull();
    expect(addBond(grafo, primeiro.id, segundo.id).graph.bonds).toHaveLength(2);
  });

  it('a ordem da ligação gira simples, dupla, tripla e volta', () => {
    const grafo = ethanol();
    const ligacao = grafo.bonds[0];
    if (!ligacao) throw new Error('grafo de teste inválido');

    const dupla = cycleBondOrder(grafo, ligacao.id);
    const tripla = cycleBondOrder(dupla, ligacao.id);
    const simples = cycleBondOrder(tripla, ligacao.id);

    expect(dupla.bonds[0]?.order).toBe(2);
    expect(tripla.bonds[0]?.order).toBe(3);
    expect(simples.bonds[0]?.order).toBe(1);
  });

  it('sabe quem é vizinho de quem', () => {
    const grafo = ethanol();
    const meio = grafo.atoms[1];
    if (!meio) throw new Error('grafo de teste inválido');

    expect(neighbors(grafo, meio.id)).toHaveLength(2);
    expect(bondBetween(grafo, meio.id, grafo.atoms[0]?.id ?? 0)).toBeDefined();
  });

  it('arrastar átomo não muda a topologia; trocar elemento muda', () => {
    const grafo = ethanol();
    const primeiro = grafo.atoms[0];
    if (!primeiro) throw new Error('grafo de teste inválido');

    const arrastado = moveAtom(grafo, primeiro.id, 5, 7);
    const trocado = setElement(grafo, primeiro.id, 'N');

    // É o que decide se a geometria 3D precisa ser recalculada: mover átomo na
    // tela não muda a molécula, trocar elemento muda.
    expect(topologyKey(arrastado)).toBe(topologyKey(grafo));
    expect(topologyKey(trocado)).not.toBe(topologyKey(grafo));
  });
});

describe('fragmento conectado', () => {
  /** Um etanol e um carbono solto no mesmo desenho, sem ligação entre os dois. */
  function etanolEUmSolto(): MoleculeGraph {
    const grafo = ethanol();
    return addAtom(grafo, { element: 'C', x: 10, y: 10 }).graph;
  }

  it('pega tudo o que está ligado, e nada de um segundo fragmento na mesma tela', () => {
    const grafo = etanolEUmSolto();
    const primeiro = grafo.atoms[0];
    const soltoId = grafo.atoms[3]?.id;
    if (!primeiro || soltoId === undefined) throw new Error('grafo de teste inválido');

    const fragmento = connectedFragment(grafo, primeiro.id);

    expect(fragmento.atoms.size).toBe(3);
    expect(fragmento.bonds.size).toBe(2);
    expect(fragmento.atoms.has(soltoId)).toBe(false);
  });

  it('um átomo sozinho, sem ligação nenhuma, é um fragmento de um só', () => {
    const grafo = etanolEUmSolto();
    const solto = grafo.atoms[3];
    if (!solto) throw new Error('grafo de teste inválido');

    const fragmento = connectedFragment(grafo, solto.id);

    expect(fragmento.atoms).toEqual(new Set([solto.id]));
    expect(fragmento.bonds.size).toBe(0);
  });

  it('anel fechado não entra em laço infinito e volta com todos os átomos e ligações', () => {
    const a = addAtom(emptyGraph(), { element: 'C', x: 0, y: 0 });
    const b = addAtom(a.graph, { element: 'C', x: BOND_LENGTH, y: 0 });
    const c = addAtom(b.graph, { element: 'C', x: BOND_LENGTH / 2, y: BOND_LENGTH });

    let grafo = c.graph;
    grafo = addBond(grafo, a.atomId, b.atomId).graph;
    grafo = addBond(grafo, b.atomId, c.atomId).graph;
    grafo = addBond(grafo, c.atomId, a.atomId).graph;

    const fragmento = connectedFragment(grafo, a.atomId);

    expect(fragmento.atoms).toEqual(new Set([a.atomId, b.atomId, c.atomId]));
    expect(fragmento.bonds.size).toBe(3);
  });

  it('partindo de uma ligação pega o mesmo pedaço que partir de um dos átomos dela', () => {
    const grafo = ethanol();
    const ligacao = grafo.bonds[0];
    if (!ligacao) throw new Error('grafo de teste inválido');

    const peloAtomo = connectedFragment(grafo, ligacao.from);
    const pelaLigacao = connectedFragmentFromBond(grafo, ligacao.id);

    expect(pelaLigacao.atoms).toEqual(peloAtomo.atoms);
    expect(pelaLigacao.bonds).toEqual(peloAtomo.bonds);
  });

  it('átomo inexistente devolve fragmento vazio, não erro', () => {
    const grafo = ethanol();
    const fragmento = connectedFragment(grafo, 999);

    expect(fragmento.atoms.size).toBe(0);
    expect(fragmento.bonds.size).toBe(0);
  });
});

describe('molblock', () => {
  it('o etanol desenhado vira C2H6O quando o RDKit lê', async () => {
    const resultado = await analyze(toMolblock(ethanol()));

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    expect(resultado.molecule.formula).toBe('C2H6O');
    expect(resultado.molecule.inchiKey).toBe('LFQSCWFLJHTTHZ-UHFFFAOYSA-N');
  });

  it('a dupla ligação desenhada chega como dupla', async () => {
    const grafo = ethanol();
    const ligacao = grafo.bonds[0];
    if (!ligacao) throw new Error('grafo de teste inválido');

    const resultado = await analyze(toMolblock(setBondOrder(grafo, ligacao.id, 2)));

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.molecule.formula).toBe('C2H4O');
  });

  it('ida e volta preserva átomos, ligações e coordenadas', () => {
    const original = ethanol();
    const volta = fromMolblock(toMolblock(original));

    expect(volta.atoms.map((atom) => atom.element)).toEqual(['C', 'C', 'O']);
    expect(volta.bonds).toHaveLength(2);
    expect(volta.atoms[1]?.x).toBeCloseTo(BOND_LENGTH, 4);
  });

  it('carga formal atravessa a ida e a volta', async () => {
    const nitrogenio = addAtom(emptyGraph(), { element: 'N', x: 0, y: 0, charge: 1 });
    const primeiro = addAtom(nitrogenio.graph, { element: 'C', x: BOND_LENGTH, y: 0 });
    const segundo = addAtom(primeiro.graph, { element: 'C', x: -BOND_LENGTH, y: 0 });
    const terceiro = addAtom(segundo.graph, { element: 'C', x: 0, y: BOND_LENGTH });
    const quarto = addAtom(terceiro.graph, { element: 'C', x: 0, y: -BOND_LENGTH });

    let grafo = quarto.graph;
    for (const carbono of [primeiro, segundo, terceiro, quarto]) {
      grafo = addBond(grafo, nitrogenio.atomId, carbono.atomId).graph;
    }

    const molblock = toMolblock(grafo);
    expect(fromMolblock(molblock).atoms[0]?.charge).toBe(1);

    // Nitrogênio com quatro ligações só existe carregado — e é o RDKit quem
    // confirma isso, não o grafo.
    const resultado = await analyze(molblock);
    expect(resultado.ok).toBe(true);
  });

  it('grafo vazio não vira molécula', async () => {
    const resultado = await analyze(toMolblock(emptyGraph()));

    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.error.code).toBe('empty');
  });
});
