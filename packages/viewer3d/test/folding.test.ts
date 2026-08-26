import type { DynamicsTrajectory, Geometry } from '@rotamer/core';
import { describe, expect, it } from 'vitest';
import { FOLD_DURATION, sampleDynamics, sampleFolding } from '../src/folding';

/**
 * A reprodução do movimento.
 *
 * Nada aqui é física: a física já aconteceu no worker. O que estes testes
 * garantem é que a tela mostra os quadros simulados **na ordem e sem salto** —
 * porque salto na tela é lido como erro de física por quem está olhando.
 */

function geometryWith(frames: readonly (readonly number[])[]): Geometry {
  return {
    atoms: [{ element: 'C', x: 0, y: 0, z: 0, source: 0 }],
    bonds: [],
    frames: frames.map((positions, index) => ({ positions, energy: 100 - index * 10 })),
    energy: 100 - (frames.length - 1) * 10,
  };
}

const DOBRAMENTO = geometryWith([
  [0, 0, 0],
  [1, 0, 0],
  [2, 0, 0],
]);

const TRAJETORIA: DynamicsTrajectory = {
  frames: [
    [0, 0, 0],
    [1, 0, 0],
    [2, 0, 0],
  ],
  frameFs: 2,
  temperature: 300,
};

describe('dobramento', () => {
  it('começa no primeiro quadro — o embrulho cru, antes de relaxar', () => {
    const sample = sampleFolding(DOBRAMENTO, 0);

    expect(sample.positions).toEqual([0, 0, 0]);
    expect(sample.done).toBe(false);
  });

  it('no meio do caminho está no meio do caminho, interpolado', () => {
    const sample = sampleFolding(DOBRAMENTO, FOLD_DURATION / 2);

    expect(sample.positions[0]).toBeCloseTo(1, 5);
    expect(sample.done).toBe(false);
  });

  it('terminado o tempo, entrega o mínimo encontrado e diz que terminou', () => {
    const sample = sampleFolding(DOBRAMENTO, FOLD_DURATION + 1);

    expect(sample.positions).toEqual([2, 0, 0]);
    expect(sample.energy).toBe(80);
    expect(sample.done).toBe(true);
  });
});

describe('vibração', () => {
  it('o primeiro quadro é a própria geometria mínima', () => {
    // É o que torna a emenda entre dobrar e vibrar invisível: a vibração começa
    // exatamente onde o dobramento parou, com deslocamento zero.
    expect(sampleDynamics(TRAJETORIA, 0)).toEqual([0, 0, 0]);
  });

  it('vai e volta sem salto no retorno', () => {
    const frameMs = 40;
    const ida = sampleDynamics(TRAJETORIA, 2 * frameMs);
    const logoDepois = sampleDynamics(TRAJETORIA, 2 * frameMs + 1);

    // No fim da ida ela está no último quadro; um milissegundo depois já está
    // voltando, e a distância percorrida é a de um milissegundo — não a de um
    // ciclo inteiro.
    expect(ida[0]).toBeCloseTo(2, 5);
    expect(Math.abs((logoDepois[0] ?? 0) - (ida[0] ?? 0))).toBeLessThan(0.05);
  });

  it('depois de um ciclo inteiro, volta ao começo', () => {
    const ciclo = (TRAJETORIA.frames.length - 1) * 2 * 40;

    expect(sampleDynamics(TRAJETORIA, ciclo)).toEqual(sampleDynamics(TRAJETORIA, 0));
  });

  it('trajetória vazia não quebra a cena', () => {
    expect(sampleDynamics({ ...TRAJETORIA, frames: [] }, 123)).toEqual([]);
  });
});
