import type { Geometry, GeometryBond } from '@rotamer/core';
import { describe, expect, it } from 'vitest';
import { sticksOf } from '../src/sticks';

/**
 * Ligação dupla não é vareta grossa: são duas varetas paralelas, e a tripla são
 * três. É o que o modelo de plástico mostra, e é o que faz a cena 3D dizer a
 * mesma coisa que o desenho 2D já dizia.
 */

function geometryWith(bonds: readonly GeometryBond[], atoms = 4): Geometry {
  return {
    atoms: Array.from({ length: atoms }, (_, index) => ({
      element: 'C',
      x: index,
      y: 0,
      z: 0,
      source: index,
    })),
    bonds,
    frames: [{ positions: Array.from({ length: atoms * 3 }, () => 0), energy: 0 }],
    energy: 0,
    relaxed: true,
    unsupported: [],
  };
}

describe('varetas por ordem de ligação', () => {
  it('a simples é uma vareta no eixo', () => {
    const sticks = sticksOf(geometryWith([{ from: 0, to: 1, order: 1 }]));

    expect(sticks).toEqual([{ bond: 0, offset: 0, reference: null }]);
  });

  it('a dupla são duas, uma de cada lado, e nada no meio', () => {
    const sticks = sticksOf(
      geometryWith([
        { from: 0, to: 1, order: 2 },
        { from: 1, to: 2, order: 1 },
      ]),
    );

    const dupla = sticks.filter((stick) => stick.bond === 0);
    expect(dupla.map((stick) => stick.offset)).toEqual([-1, 1]);

    // O plano vem de um vizinho: é ele que põe as duas varetas no lugar certo.
    expect(dupla.every((stick) => stick.reference === 2)).toBe(true);
  });

  it('a tripla são três, com uma no eixo', () => {
    const sticks = sticksOf(
      geometryWith([
        { from: 0, to: 1, order: 3 },
        { from: 1, to: 2, order: 1 },
      ]),
    );

    expect(sticks.filter((stick) => stick.bond === 0).map((stick) => stick.offset)).toEqual([
      -1, 0, 1,
    ]);
  });

  it('molécula diatômica não tem vizinho, e mesmo assim ganha as duas varetas', () => {
    const sticks = sticksOf(geometryWith([{ from: 0, to: 1, order: 2 }], 2));

    expect(sticks).toHaveLength(2);
    expect(sticks.every((stick) => stick.reference === null)).toBe(true);
  });

  it('o total de varetas é a soma das ordens', () => {
    // Eteno: uma dupla C=C e quatro simples C–H.
    const sticks = sticksOf(
      geometryWith(
        [
          { from: 0, to: 1, order: 2 },
          { from: 0, to: 2, order: 1 },
          { from: 0, to: 3, order: 1 },
          { from: 1, to: 4, order: 1 },
          { from: 1, to: 5, order: 1 },
        ],
        6,
      ),
    );

    expect(sticks).toHaveLength(6);
  });
});
