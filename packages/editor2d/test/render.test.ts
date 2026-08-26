import { addAtom, addBond, BOND_LENGTH, emptyGraph, type MoleculeGraph } from '@rotamer/core';
import { describe, expect, it } from 'vitest';
import { atomLabel } from '../src/render';

/**
 * O que aparece escrito em cima de cada átomo.
 *
 * Não é estilo: um oxigênio de ácido escrito como `O` solto tem cara de éter, e
 * quem está aprendendo lê a molécula errada. Quem conta os hidrogênios é o
 * RDKit; esta função só decide como escrever o que ele contou.
 */
function etanol(): { graph: MoleculeGraph; ids: number[] } {
  const primeiro = addAtom(emptyGraph(), { element: 'C', x: 0, y: 0 });
  const segundo = addAtom(primeiro.graph, { element: 'C', x: BOND_LENGTH, y: 0 });
  const terceiro = addAtom(segundo.graph, { element: 'O', x: BOND_LENGTH * 2, y: 0 });

  const ligado = addBond(terceiro.graph, primeiro.atomId, segundo.atomId);
  const completo = addBond(ligado.graph, segundo.atomId, terceiro.atomId);

  return {
    graph: completo.graph,
    ids: [primeiro.atomId, segundo.atomId, terceiro.atomId],
  };
}

function atomOf(graph: MoleculeGraph, id: number) {
  const found = graph.atoms.find((atom) => atom.id === id);
  if (!found) throw new Error('átomo sumiu');
  return found;
}

describe('rótulo do átomo', () => {
  it('carbono no meio da cadeia não escreve nada', () => {
    const { graph, ids } = etanol();
    expect(atomLabel(atomOf(graph, ids[1] ?? 0), graph, 2)).toBeNull();
  });

  it('carbono sozinho escreve, senão o desenho fica vazio', () => {
    const solto = addAtom(emptyGraph(), { element: 'C', x: 0, y: 0 });
    expect(atomLabel(atomOf(solto.graph, solto.atomId), solto.graph, 4)).toBe('CH4');
  });

  it('a hidroxila escreve OH, não O', () => {
    const { graph, ids } = etanol();
    expect(atomLabel(atomOf(graph, ids[2] ?? 0), graph, 1)).toBe('OH');
  });

  it('oxigênio sem hidrogênio continua sendo O — é o éster', () => {
    const { graph, ids } = etanol();
    expect(atomLabel(atomOf(graph, ids[2] ?? 0), graph, 0)).toBe('O');
  });

  it('o hidrogênio fica do lado sem ligação', () => {
    const { graph, ids } = etanol();

    // No etanol o oxigênio está na ponta direita: a ligação sai pela esquerda,
    // então o hidrogênio vai para a direita.
    expect(atomLabel(atomOf(graph, ids[2] ?? 0), graph, 1)).toBe('OH');

    // Espelhado: com a ligação saindo pela direita, escreve-se HO—.
    const espelhado = addAtom(emptyGraph(), { element: 'O', x: 0, y: 0 });
    const carbono = addAtom(espelhado.graph, { element: 'C', x: BOND_LENGTH, y: 0 });
    const ligado = addBond(carbono.graph, espelhado.atomId, carbono.atomId).graph;

    expect(atomLabel(atomOf(ligado, espelhado.atomId), ligado, 1)).toBe('HO');
  });

  it('mais de um hidrogênio vira número', () => {
    const nitrogenio = addAtom(emptyGraph(), { element: 'N', x: 0, y: 0 });
    const carbono = addAtom(nitrogenio.graph, { element: 'C', x: -BOND_LENGTH, y: 0 });
    const ligado = addBond(carbono.graph, nitrogenio.atomId, carbono.atomId).graph;

    expect(atomLabel(atomOf(ligado, nitrogenio.atomId), ligado, 2)).toBe('NH2');
  });
});
