import type { BondOrder } from '../graph/types';

/**
 * Geometria tridimensional derivada do grafo.
 *
 * Coordenadas em ångström, energia em kcal/mol — as unidades do campo de força
 * MMFF94, sem conversão pelo caminho.
 */

export interface GeometryAtom {
  readonly element: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /**
   * Qual átomo do desenho deu origem a este, pela posição na lista do grafo.
   *
   * É o que liga as duas telas: apontar uma esfera no espaço e saber que vértice
   * do desenho ela é. Os hidrogênios que o campo de força precisou acrescentar
   * não existem no desenho, então apontam para o átomo em que estão pendurados —
   * passar o mouse num hidrogênio acende o carbono dele, que é o que a pessoa
   * está procurando.
   */
  readonly source: number;
}

export interface GeometryBond {
  readonly from: number;
  readonly to: number;
  readonly order: BondOrder;
}

/**
 * Um quadro do dobramento: as posições de todos os átomos num instante da
 * minimização, com a energia daquele instante.
 *
 * São quadros **reais** da busca pelo mínimo de energia, não interpolação. É
 * por isso que a energia cai a cada quadro — e é isso que a tela mostra.
 */
export interface FoldingFrame {
  /** Posições achatadas: `[x0, y0, z0, x1, y1, z1, ...]`. */
  readonly positions: readonly number[];
  /** Energia MMFF94 em kcal/mol. */
  readonly energy: number;
}

export interface Geometry {
  readonly atoms: readonly GeometryAtom[];
  readonly bonds: readonly GeometryBond[];
  /** Do embrulho inicial até o mínimo encontrado. O primeiro quadro é o pior. */
  readonly frames: readonly FoldingFrame[];
  /** Energia do último quadro, em kcal/mol. */
  readonly energy: number;
}

export interface GeometryOptions {
  /** Gerar também a trajetória de vibração. */
  readonly dynamics?: boolean;
  /**
   * Teto de quadros do dobramento. O dobramento na tela dura ~2 s: mais de uma
   * dúzia de quadros não aparece para ninguém.
   */
  readonly maxFrames?: number;
  /** Iterações por degrau da minimização. */
  readonly maxIterations?: number;
}
