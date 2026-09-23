import { describe, expect, it } from 'vitest';
import { chemistryApi } from '../src/chemistry/api';
import type { Geometry } from '../src/geometry/types';

/**
 * A geometria é derivada: sai do molblock que o RDKit sanitizou e nunca de um
 * palpite nosso. Estes testes checam a física que o usuário vai ver na tela.
 */

async function geometryOf(smiles: string): Promise<Geometry> {
  const result = await chemistryApi.geometry(smiles);
  if (!result.ok) throw new Error(`esperava geometria, veio erro: ${result.error.code}`);
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
    expect(resultado.error.code).toBe('valence_exceeded');
    expect(resultado.error.atom).toEqual({ index: 0, symbol: 'C', bonds: 5, max: 4 });
  });
});

describe('elemento fora do campo de força', () => {
  it('o estanho ganha forma no espaço, só que sem relaxamento', async () => {
    // Tetrametilestanho existe, e o RDKit a aceita. O MMFF94 é que não tem
    // parâmetro para Sn — mas o gerador de conformações monta o arranjo mesmo
    // assim, a partir de comprimentos e ângulos de ligação.
    const analysis = await chemistryApi.analyze('C[Sn](C)(C)C');
    expect(analysis.ok).toBe(true);

    const result = await chemistryApi.geometry('C[Sn](C)(C)C');
    if (!result.ok) throw new Error(`esperava geometria: ${result.error.code}`);

    const { geometry } = result;
    expect(geometry.relaxed).toBe(false);
    expect(geometry.energy).toBeNull();
    expect(geometry.unsupported).toEqual(['Sn']);

    // A forma é tridimensional de verdade, e o C–Sn tem comprimento de C–Sn.
    expect(geometry.atoms).toHaveLength(17);
    expect(Math.max(...geometry.atoms.map((atom) => Math.abs(atom.z)))).toBeGreaterThan(0.3);

    const carbono = geometry.atoms.findIndex((atom) => atom.element === 'C');
    const estanho = geometry.atoms.findIndex((atom) => atom.element === 'Sn');
    const comprimento = distance(geometry, carbono, estanho);

    // C–Sn mede 2,14 Å na tabela.
    expect(comprimento).toBeGreaterThan(1.9);
    expect(comprimento).toBeLessThan(2.4);
  });

  it('sem campo de força não há vibração nem modo — e nenhuma exceção solta', async () => {
    const vibration = await chemistryApi.dynamics('C[Sn](C)(C)C');
    const modes = await chemistryApi.modes('C[Sn](C)(C)C');

    if (!vibration.ok || !modes.ok) throw new Error('esperava resposta, não recusa');

    // A molécula existe: o que não existe é o movimento dela.
    expect(vibration.trajectory).toBeNull();
    expect(modes.modes).toBeNull();
  });
});

describe('estereoquímica no espaço', () => {
  /**
   * O que está desenhado tem que ser o que aparece na cena.
   *
   * Cunha cheia e cunha tracejada são enantiômeros — a mesma molécula refletida
   * no espelho. Se a geometria 3D ignorasse a cunha, os dois desenhos cairiam na
   * mesma forma, e o produto estaria mostrando a molécula errada para metade dos
   * casos.
   */
  function chirality(geometry: Geometry, center: number): number {
    const neighbours = geometry.bonds
      .filter((bond) => bond.from === center || bond.to === center)
      .map((bond) => (bond.from === center ? bond.to : bond.from))
      .slice(0, 3);

    const [first, second, third] = neighbours;
    if (first === undefined || second === undefined || third === undefined) {
      throw new Error('o centro precisa de três vizinhos para ter sinal');
    }

    const at = (index: number): readonly [number, number, number] => {
      const atom = geometry.atoms[index];
      const middle = geometry.atoms[center];
      if (!atom || !middle) throw new Error('átomo fora da geometria');

      return [atom.x - middle.x, atom.y - middle.y, atom.z - middle.z];
    };

    const [ax, ay, az] = at(first);
    const [bx, by, bz] = at(second);
    const [cx, cy, cz] = at(third);

    // Produto misto: o sinal diz de que lado do plano dos outros três está o
    // primeiro vizinho — é a quiralidade da geometria, em uma conta só.
    return ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);
  }

  it('cunha cheia e tracejada dão formas espelhadas no espaço', async () => {
    const cheia = await geometryOf('F[C@H](Cl)Br');
    const tracejada = await geometryOf('F[C@@H](Cl)Br');

    const carbono = cheia.atoms.findIndex((atom) => atom.element === 'C');
    expect(carbono).toBeGreaterThanOrEqual(0);

    const primeiro = chirality(cheia, carbono);
    const segundo = chirality(tracejada, carbono);

    // Sinais opostos: as duas formas são imagens especulares uma da outra.
    expect(Math.abs(primeiro)).toBeGreaterThan(1);
    expect(Math.sign(primeiro)).toBe(-Math.sign(segundo));
  }, 60_000);

  it('o mesmo enantiômero pedido duas vezes cai na mesma forma', async () => {
    const primeira = await geometryOf('F[C@H](Cl)Br');
    const segunda = await geometryOf('F[C@H](Cl)Br');
    const carbono = primeira.atoms.findIndex((atom) => atom.element === 'C');

    expect(Math.sign(chirality(primeira, carbono))).toBe(
      Math.sign(chirality(segunda, carbono)),
    );
  }, 60_000);
});
