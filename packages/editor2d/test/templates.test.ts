import { analyze, emptyGraph, toMolblock } from '@rotamer/core';
import { describe, expect, it } from 'vitest';
import { insertRing, RING_KINDS } from '../src/templates';

/**
 * O anel pronto precisa ser um anel de verdade: geometria regular, ligação de
 * 1,5 Å e — o que realmente importa — o RDKit lendo dali a molécula que o aluno
 * espera ver.
 */
function distance(
  graph: ReturnType<typeof insertRing>['graph'],
  first: number,
  second: number,
): number {
  const a = graph.atoms.find((atom) => atom.id === first);
  const b = graph.atoms.find((atom) => atom.id === second);
  if (!a || !b) throw new Error('átomo fora do grafo');

  return Math.hypot(a.x - b.x, a.y - b.y);
}

describe('geometria do anel', () => {
  it('todos os lados têm comprimento de ligação', () => {
    for (const kind of RING_KINDS) {
      const { graph, atoms } = insertRing(emptyGraph(), kind, { x: 0, y: 0 });

      for (let side = 0; side < atoms.length; side += 1) {
        const from = atoms[side];
        const to = atoms[(side + 1) % atoms.length];
        if (from === undefined || to === undefined) continue;

        expect(distance(graph, from, to)).toBeCloseTo(1.5, 6);
      }
    }
  });

  it('fecha o anel: cada átomo tem dois vizinhos', () => {
    const { graph, atoms } = insertRing(emptyGraph(), 'cicloexano', { x: 0, y: 0 });

    for (const atom of atoms) {
      const vizinhos = graph.bonds.filter((bond) => bond.from === atom || bond.to === atom);
      expect(vizinhos).toHaveLength(2);
    }
  });

  it('entra onde foi pedido, sem apagar o que já estava lá', () => {
    const primeiro = insertRing(emptyGraph(), 'benzeno', { x: 0, y: 0 });
    const segundo = insertRing(primeiro.graph, 'ciclopentano', { x: 10, y: 0 });

    expect(segundo.graph.atoms).toHaveLength(11);
    expect(segundo.graph.bonds).toHaveLength(11);

    const centro =
      segundo.atoms.reduce((soma, id) => {
        const atom = segundo.graph.atoms.find((candidate) => candidate.id === id);
        return soma + (atom?.x ?? 0);
      }, 0) / segundo.atoms.length;

    expect(centro).toBeCloseTo(10, 6);
  });
});

describe('o que o RDKit lê do anel', () => {
  it('benzeno é C6H6 e aromático', async () => {
    const { graph } = insertRing(emptyGraph(), 'benzeno', { x: 0, y: 0 });
    const resultado = await analyze(toMolblock(graph));

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    expect(resultado.molecule.formula).toBe('C6H6');
    expect(resultado.molecule.descriptors.aromaticRings).toBe(1);
  });

  it('cicloexano é C6H12 e não é aromático', async () => {
    const { graph } = insertRing(emptyGraph(), 'cicloexano', { x: 0, y: 0 });
    const resultado = await analyze(toMolblock(graph));

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    expect(resultado.molecule.formula).toBe('C6H12');
    expect(resultado.molecule.descriptors.aromaticRings).toBe(0);
    expect(resultado.molecule.descriptors.rings).toBe(1);
  });

  it('piridina é C5H5N, aromática e heterocíclica', async () => {
    const { graph } = insertRing(emptyGraph(), 'piridina', { x: 0, y: 0 });
    const resultado = await analyze(toMolblock(graph));

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    expect(resultado.molecule.formula).toBe('C5H5N');
    expect(resultado.molecule.descriptors.aromaticRings).toBe(1);
    expect(resultado.molecule.descriptors.aromaticHeterocycles).toBe(1);
  });

  it('ciclopentano é C5H10', async () => {
    const { graph } = insertRing(emptyGraph(), 'ciclopentano', { x: 0, y: 0 });
    const resultado = await analyze(toMolblock(graph));

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.molecule.formula).toBe('C5H10');
  });
});
