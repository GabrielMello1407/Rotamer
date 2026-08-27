import { addAtom, addBond, BOND_LENGTH, emptyGraph, type MoleculeGraph } from '@rotamer/core';
import { describe, expect, it } from 'vitest';
import {
  atomAt,
  bondAt,
  frameGraph,
  selectInRegion,
  snapFromAtom,
  suggestDirection,
  toGraph,
  toScreen,
} from '../src/geometry2d';

const VIEWPORT = { width: 800, height: 600 };
const CAMERA = { x: 0, y: 0, scale: 26 };

function pair(): MoleculeGraph {
  const first = addAtom(emptyGraph(), { element: 'C', x: 0, y: 0 });
  const second = addAtom(first.graph, { element: 'C', x: BOND_LENGTH, y: 0 });
  return addBond(second.graph, first.atomId, second.atomId).graph;
}

describe('tela e grafo', () => {
  it('ir e voltar entre pixel e ångström devolve o mesmo ponto', () => {
    const original = { x: 2.5, y: -1.25 };
    const roundTrip = toGraph(toScreen(original, CAMERA, VIEWPORT), CAMERA, VIEWPORT);

    expect(roundTrip.x).toBeCloseTo(original.x, 10);
    expect(roundTrip.y).toBeCloseTo(original.y, 10);
  });

  it('o eixo y da tela cresce para baixo, o do grafo para cima', () => {
    const acima = toScreen({ x: 0, y: 1 }, CAMERA, VIEWPORT);
    const abaixo = toScreen({ x: 0, y: -1 }, CAMERA, VIEWPORT);

    expect(acima.y).toBeLessThan(abaixo.y);
  });
});

describe('o que está sob o cursor', () => {
  it('acha o átomo pelo raio de acerto', () => {
    const graph = pair();

    expect(atomAt(graph, { x: 0.1, y: 0.1 })).toBe(graph.atoms[0]?.id);
    expect(atomAt(graph, { x: 0.75, y: 0 })).toBeNull();
  });

  it('acha a ligação pelo meio do traço', () => {
    const graph = pair();

    expect(bondAt(graph, { x: BOND_LENGTH / 2, y: 0.05 })).toBe(graph.bonds[0]?.id);
    expect(bondAt(graph, { x: BOND_LENGTH / 2, y: 1 })).toBeNull();
  });
});

describe('traço preso ao ângulo', () => {
  it('prende de 30 em 30 graus', () => {
    const origem = { x: 0, y: 0 };
    const solto = snapFromAtom(origem, { x: 1, y: 0.15 });

    const angulo = (Math.atan2(solto.y, solto.x) * 180) / Math.PI;
    expect(Math.abs(angulo % 30)).toBeLessThan(1e-6);
  });

  it('trava o comprimento em 1,5 Å enquanto o arrasto é curto', () => {
    const perto = snapFromAtom({ x: 0, y: 0 }, { x: 0.8, y: 0 });
    expect(Math.hypot(perto.x, perto.y)).toBeCloseTo(BOND_LENGTH, 6);

    // Puxando bem longe, a ligação estica de propósito.
    const longe = snapFromAtom({ x: 0, y: 0 }, { x: 4, y: 0 });
    expect(Math.hypot(longe.x, longe.y)).toBeGreaterThan(BOND_LENGTH * 2);
  });

  it('a próxima ligação de uma cadeia sai em zigue-zague, não reta', () => {
    const graph = pair();
    const second = graph.atoms[1];
    if (!second) throw new Error('faltou átomo');

    const proximo = suggestDirection(graph, second.id);
    const angulo = (Math.atan2(proximo.y - second.y, proximo.x - second.x) * 180) / Math.PI;

    // O vizinho está a 180°; a sugestão precisa abrir ângulo, não continuar
    // reto — é o que faz a cadeia sair em 120°, como químico desenha.
    expect(Math.abs(angulo)).toBeGreaterThan(20);
    expect(Math.abs(angulo)).toBeLessThan(160);
  });
});

describe('enquadrar', () => {
  it('centraliza a molécula e escolhe uma escala que cabe', () => {
    const graph = pair();
    const camera = frameGraph(graph, VIEWPORT, 26);

    expect(camera.x).toBeCloseTo(BOND_LENGTH / 2, 6);
    expect(camera.y).toBeCloseTo(0, 6);
    expect(camera.scale).toBeGreaterThan(0);
  });

  it('tela em branco não muda a escala', () => {
    const camera = frameGraph(emptyGraph(), VIEWPORT, 26);
    expect(camera).toEqual({ x: 0, y: 0, scale: 26 });
  });
});

describe('retângulo de seleção', () => {
  it('pega o átomo pelo centro dele', () => {
    const graph = pair();
    const dentro = selectInRegion(graph, { x0: -0.5, y0: -0.5, x1: 0.5, y1: 0.5 });

    expect(dentro.atoms).toEqual(new Set([graph.atoms[0]?.id]));
    expect(dentro.bonds.size).toBe(0);
  });

  it('a ligação só entra quando as duas pontas entram, não quando o traço só cruza a borda', () => {
    const graph = pair();

    // O retângulo cobre só o primeiro átomo: o traço da ligação cruza a
    // borda direita, mas a segunda ponta fica de fora.
    const meioCaminho = selectInRegion(graph, { x0: -0.5, y0: -0.5, x1: BOND_LENGTH / 2, y1: 0.5 });
    expect(meioCaminho.bonds.size).toBe(0);

    // Com as duas pontas dentro, a ligação entra junto.
    const inteiro = selectInRegion(graph, { x0: -0.5, y0: -0.5, x1: BOND_LENGTH + 0.5, y1: 0.5 });
    expect(inteiro.atoms.size).toBe(2);
    expect(inteiro.bonds).toEqual(new Set([graph.bonds[0]?.id]));
  });

  it('os cantos do retângulo podem vir em qualquer ordem', () => {
    const graph = pair();
    const invertido = selectInRegion(graph, {
      x0: BOND_LENGTH + 0.5,
      y0: 0.5,
      x1: -0.5,
      y1: -0.5,
    });

    expect(invertido.atoms.size).toBe(2);
  });

  it('retângulo fora da molécula não pega nada', () => {
    const graph = pair();
    const fora = selectInRegion(graph, { x0: 10, y0: 10, x1: 11, y1: 11 });

    expect(fora.atoms.size).toBe(0);
    expect(fora.bonds.size).toBe(0);
  });
});
