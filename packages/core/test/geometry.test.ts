import { describe, expect, it } from 'vitest';
import { chemistryApi } from '../src/chemistry/api';
import type { Geometry } from '../src/geometry/types';

/**
 * A geometria é derivada: sai do molblock que o RDKit sanitizou e nunca de um
 * palpite nosso. Estes testes checam a física que o usuário vai ver na tela.
 */

async function geometryOf(smiles: string): Promise<Geometry> {
  const result = await chemistryApi.geometry(smiles);
  if (!result.ok) throw new Error(`esperava geometria, veio erro: ${result.error.message}`);
  return result.geometry;
}

function distance(geometry: Geometry, first: number, second: number): number {
  const a = geometry.atoms[first];
  const b = geometry.atoms[second];
  if (!a || !b) throw new Error('átomo fora da geometria');

  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

describe('conformação', () => {
  it('o etanol ganha os hidrogênios e sai do plano', async () => {
    const geometry = await geometryOf('CCO');

    // C2H6O: nove átomos, com os hidrogênios que o 2D não mostrava.
    expect(geometry.atoms).toHaveLength(9);
    expect(geometry.atoms.filter((atom) => atom.element === 'H')).toHaveLength(6);

    const espalhamento = Math.max(...geometry.atoms.map((atom) => Math.abs(atom.z)));
    expect(espalhamento).toBeGreaterThan(0.3);
  });

  it('cada átomo da cena aponta para o átomo do desenho que o originou', async () => {
    const geometry = await geometryOf('CCO');

    // Os três do desenho vêm primeiro, na mesma ordem em que foram desenhados.
    expect(geometry.atoms.slice(0, 3).map((atom) => atom.element)).toEqual(['C', 'C', 'O']);
    expect(geometry.atoms.slice(0, 3).map((atom) => atom.source)).toEqual([0, 1, 2]);

    // Os hidrogênios não existem no desenho: cada um aponta para o átomo em que
    // está pendurado. É o que faz apontar um H na cena acender o carbono certo.
    const pendurados = new Map<number, number>();
    for (const atom of geometry.atoms) {
      if (atom.element !== 'H') continue;
      pendurados.set(atom.source, (pendurados.get(atom.source) ?? 0) + 1);
    }

    // CH3–CH2–OH: três, dois e um.
    expect([...pendurados.entries()].sort((a, b) => a[0] - b[0])).toEqual([
      [0, 3],
      [1, 2],
      [2, 1],
    ]);
  });

  it('as ligações têm comprimento de ligação de verdade', async () => {
    const geometry = await geometryOf('CCO');

    for (const bond of geometry.bonds) {
      const comprimento = distance(geometry, bond.from, bond.to);
      // Nada de átomo empilhado nem de molécula esticada: C–H tem ~1,1 Å e
      // C–C tem ~1,5 Å.
      expect(comprimento).toBeGreaterThan(0.9);
      expect(comprimento).toBeLessThan(1.7);
    }
  });

  it('o dobramento é a minimização acontecendo, não animação inventada', async () => {
    const geometry = await geometryOf('CC(=O)Oc1ccccc1C(=O)O');

    expect(geometry.frames.length).toBeGreaterThan(2);

    const primeiro = geometry.frames[0];
    const ultimo = geometry.frames[geometry.frames.length - 1];
    if (!primeiro || !ultimo) throw new Error('dobramento sem quadros');

    // O primeiro quadro é o embrulho inicial; o último é o mínimo encontrado.
    expect(ultimo.energy).toBeLessThan(primeiro.energy);
    expect(geometry.energy).toBeCloseTo(ultimo.energy, 6);
    expect(primeiro.positions).toHaveLength(geometry.atoms.length * 3);
  });

  it('o benzeno fica plano', async () => {
    const geometry = await geometryOf('c1ccccc1');

    const anel = geometry.atoms.filter((atom) => atom.element === 'C');
    expect(anel).toHaveLength(6);

    const centro = {
      x: anel.reduce((total, atom) => total + atom.x, 0) / 6,
      y: anel.reduce((total, atom) => total + atom.y, 0) / 6,
      z: anel.reduce((total, atom) => total + atom.z, 0) / 6,
    };

    // Normal do plano a partir de dois raios do anel.
    const primeiro = anel[0];
    const segundo = anel[2];
    if (!primeiro || !segundo) throw new Error('anel incompleto');

    const u = [primeiro.x - centro.x, primeiro.y - centro.y, primeiro.z - centro.z] as const;
    const v = [segundo.x - centro.x, segundo.y - centro.y, segundo.z - centro.z] as const;
    const normal = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    const norma = Math.hypot(normal[0] ?? 0, normal[1] ?? 0, normal[2] ?? 0);

    for (const atom of anel) {
      const distanciaAoPlano =
        Math.abs(
          (atom.x - centro.x) * (normal[0] ?? 0) +
            (atom.y - centro.y) * (normal[1] ?? 0) +
            (atom.z - centro.z) * (normal[2] ?? 0),
        ) / norma;

      expect(distanciaAoPlano).toBeLessThan(0.05);
    }
  });

  it('o anel aromático tem seis ligações de comprimento igual', async () => {
    const geometry = await geometryOf('c1ccccc1');

    const doAnel = geometry.bonds.filter(
      (bond) =>
        geometry.atoms[bond.from]?.element === 'C' && geometry.atoms[bond.to]?.element === 'C',
    );
    expect(doAnel).toHaveLength(6);

    const comprimentos = doAnel.map((bond) => distance(geometry, bond.from, bond.to));
    const maior = Math.max(...comprimentos);
    const menor = Math.min(...comprimentos);

    // Aromático não alterna longo e curto: as seis ligações são iguais.
    expect(maior - menor).toBeLessThan(0.02);
    expect(menor).toBeGreaterThan(1.3);
    expect(maior).toBeLessThan(1.45);
  });
});

describe('cache por InChIKey', () => {
  it('a mesma molécula escrita de dois jeitos cai na mesma geometria', async () => {
    const primeiro = await chemistryApi.geometry('OCC');
    const segundo = await chemistryApi.geometry('CCO');

    expect(primeiro.ok && segundo.ok).toBe(true);
    if (!primeiro.ok || !segundo.ok) return;

    expect(segundo.inchiKey).toBe(primeiro.inchiKey);
    // Mesma chave, mesmo objeto: a segunda chamada não recalculou nada.
    expect(segundo.geometry).toBe(primeiro.geometry);
  });

  it('estrutura inválida não chega a virar geometria', async () => {
    const resultado = await chemistryApi.geometry('C(C)(C)(C)(C)C');

    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.error.message).toBe('O átomo de C tem 5 ligações, mas suporta no máximo 4.');
  });
});
