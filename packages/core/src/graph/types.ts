/**
 * O grafo é a única fonte de verdade do produto.
 *
 * Fórmula, descritores, coordenadas 3D, nota de missão e texto do tutor são
 * todos derivados dele e recalculáveis a qualquer momento. Nada além do grafo é
 * persistido como estado do usuário.
 *
 * As coordenadas são em **ångström**, não em pixel: a distância padrão de uma
 * ligação simples é 1,5 Å. Quem converte para tela é o editor, aplicando zoom.
 * Assim o grafo atravessa a fronteira do worker sem depender de resolução.
 */

export type AtomId = number;
export type BondId = number;

/** Ordem de ligação. Aromático não entra aqui: quem percebe isso é o RDKit. */
export type BondOrder = 1 | 2 | 3;

/** Comprimento padrão de uma ligação simples, em ångström. */
export const BOND_LENGTH = 1.5;

export interface GraphAtom {
  readonly id: AtomId;
  /** Símbolo do elemento, ex.: `C`, `N`, `Cl`. */
  readonly element: string;
  /** Coordenada em ångström. */
  readonly x: number;
  readonly y: number;
  /** Carga formal. Zero na imensa maioria dos casos. */
  readonly charge: number;
}

export interface GraphBond {
  readonly id: BondId;
  readonly from: AtomId;
  readonly to: AtomId;
  readonly order: BondOrder;
}

export interface MoleculeGraph {
  readonly atoms: readonly GraphAtom[];
  readonly bonds: readonly GraphBond[];
  /** Próximo identificador livre. Identificador nunca é reaproveitado. */
  readonly nextId: number;
}

/** O que se informa para criar um átomo — o identificador é do grafo. */
export interface NewAtom {
  readonly element: string;
  readonly x: number;
  readonly y: number;
  readonly charge?: number;
}
