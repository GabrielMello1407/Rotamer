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
  /**
   * Energia do último quadro, em kcal/mol — ou `null` quando não houve campo de
   * força para calcular.
   */
  readonly energy: number | null;
  /**
   * Se o campo de força chegou a relaxar esta geometria.
   *
   * Quando falso, o que existe é o arranjo que o gerador de conformações montou
   * a partir de comprimentos e ângulos de ligação: a forma está certa em ordem
   * de grandeza, mas ninguém desceu a energia dela — e sem energia não há
   * vibração nem modo normal.
   */
  readonly relaxed: boolean;
  /**
   * Elementos da molécula que o campo de força não parametriza.
   *
   * Vazio no caso normal. Quando tem alguma coisa, é isso que explica por que a
   * geometria não foi relaxada — e é o que a tela mostra, com o símbolo do
   * elemento, em vez de um "não foi possível".
   */
  readonly unsupported: readonly string[];
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
