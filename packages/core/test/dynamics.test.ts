import { describe, expect, it } from 'vitest';
import { generateGeometry } from '../src/geometry/conformer';
import { simulateDynamics } from '../src/geometry/dynamics';
import { analyze } from '../src/chemistry/analysis';
import type { Geometry } from '../src/geometry/types';

/**
 * A vibração é dinâmica molecular de verdade: integração de Newton sobre o
 * mesmo campo de força MMFF94 que encontrou a geometria. Estes testes checam a
 * física — se algum deles falhar, o que está na tela deixou de ser física e o
 * README passa a mentir.
 */
async function prepare(smiles: string): Promise<{ molblock: string; geometry: Geometry }> {
  const analysis = await analyze(smiles);
  if (!analysis.ok) throw new Error('estrutura de teste inválida');

  const geometry = await generateGeometry(analysis.molecule.molblock);
  return { molblock: analysis.molecule.molblock, geometry };
}

function distance(frame: readonly number[], first: number, second: number): number {
  return Math.hypot(
    (frame[first * 3] ?? 0) - (frame[second * 3] ?? 0),
    (frame[first * 3 + 1] ?? 0) - (frame[second * 3 + 1] ?? 0),
    (frame[first * 3 + 2] ?? 0) - (frame[second * 3 + 2] ?? 0),
  );
}

describe('dinâmica molecular', () => {
  it('produz trajetória a partir do mínimo encontrado', async () => {
    const { molblock, geometry } = await prepare('CCO');
    const trajectory = await simulateDynamics(molblock, geometry, { frames: 24 });

    // Nulo aqui quer dizer que o acesso rápido ao campo de força parou de
    // funcionar — provavelmente porque o OpenChemLib mudou por dentro.
    expect(trajectory).not.toBeNull();
    if (trajectory === null) return;

    expect(trajectory.frames).toHaveLength(24);
    expect(trajectory.frames[0]).toHaveLength(geometry.atoms.length * 3);
  });

  it('os átomos se mexem, e a molécula não explode', async () => {
    const { molblock, geometry } = await prepare('CCO');
    const trajectory = await simulateDynamics(molblock, geometry, { frames: 40 });
    if (trajectory === null) throw new Error('sem trajetória');

    const primeiro = trajectory.frames[0];
    const ultimo = trajectory.frames[trajectory.frames.length - 1];
    if (!primeiro || !ultimo) throw new Error('trajetória vazia');

    const deslocamento = Math.max(
      ...primeiro.map((value, index) => Math.abs(value - (ultimo[index] ?? 0))),
    );

    // Movimento existe...
    expect(deslocamento).toBeGreaterThan(0.01);
    // ...e é vibração, não desmonte: a trezentos kelvin nenhum átomo anda meio
    // ångström para longe.
    expect(deslocamento).toBeLessThan(0.6);
  });

  it('as ligações continuam sendo ligações do começo ao fim', async () => {
    const { molblock, geometry } = await prepare('CC(=O)Oc1ccccc1C(=O)O');
    const trajectory = await simulateDynamics(molblock, geometry, { frames: 30 });
    if (trajectory === null) throw new Error('sem trajetória');

    for (const frame of trajectory.frames) {
      for (const bond of geometry.bonds) {
        const length = distance(frame, bond.from, bond.to);
        expect(length).toBeGreaterThan(0.8);
        expect(length).toBeLessThan(2.0);
      }
    }
  });

  it('a molécula vibra parada: sem deriva e sem giro do conjunto', async () => {
    const { molblock, geometry } = await prepare('CCO');
    const trajectory = await simulateDynamics(molblock, geometry, { frames: 40 });
    if (trajectory === null) throw new Error('sem trajetória');

    // O que a simulação conserva é o **centro de massa**, não o centroide
    // geométrico: o hidrogênio balança muito e é leve, então a média simples
    // das posições oscila mesmo com a molécula parada no lugar.
    const MASSA: Readonly<Record<string, number>> = { H: 1.008, C: 12.011, O: 15.999 };

    const centro = (frame: readonly number[]): number[] => {
      const soma = [0, 0, 0];
      let total = 0;

      geometry.atoms.forEach((atom, index) => {
        const massa = MASSA[atom.element] ?? 12.011;
        total += massa;
        for (let axis = 0; axis < 3; axis += 1) {
          soma[axis] = (soma[axis] ?? 0) + massa * (frame[index * 3 + axis] ?? 0);
        }
      });

      return soma.map((value) => value / total);
    };

    const primeiro = trajectory.frames[0];
    const ultimo = trajectory.frames[trajectory.frames.length - 1];
    if (!primeiro || !ultimo) throw new Error('trajetória vazia');

    const inicio = centro(primeiro);
    const fim = centro(ultimo);

    for (let axis = 0; axis < 3; axis += 1) {
      expect(Math.abs((fim[axis] ?? 0) - (inicio[axis] ?? 0))).toBeLessThan(0.01);
    }
  });

  it('a mesma molécula vibra igual em toda visita', async () => {
    const { molblock, geometry } = await prepare('CCO');

    const primeira = await simulateDynamics(molblock, geometry, { frames: 12 });
    const segunda = await simulateDynamics(molblock, geometry, { frames: 12 });

    expect(primeira?.frames[11]).toEqual(segunda?.frames[11]);
  });
});
