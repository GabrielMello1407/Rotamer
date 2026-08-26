import type { AtomId, BondId, MoleculeGraph } from '@rotamer/core';

/** Tipos que o estado e as contas de tela compartilham. */

/**
 * `structure` desenha, `move` arrasta, `erase` apaga.
 *
 * Em `move`, arrastar um átomo move o átomo e arrastar o vazio move a vista —
 * é a mesma intenção, "pegar e levar", e quem desenha não deveria ter que
 * escolher entre duas ferramentas para isso. No modo desenho o átomo também se
 * move, mas segurando Shift; a ferramenta existe porque atalho de teclado não
 * existe no celular e ninguém adivinha Shift.
 */
export type Tool = 'structure' | 'move' | 'erase';

/** Ponto em coordenadas do grafo (ångström), salvo onde estiver dito o contrário. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Camera {
  /** Ponto do grafo que fica no centro da tela. */
  readonly x: number;
  readonly y: number;
  /** Pixels por ångström. */
  readonly scale: number;
}

/** Tamanho da área de desenho, em pixels de CSS. */
export interface Viewport {
  readonly width: number;
  readonly height: number;
}

/** O que o ponteiro está tocando agora. */
export type Hover =
  | { readonly kind: 'atom'; readonly id: AtomId }
  | { readonly kind: 'bond'; readonly id: BondId }
  | null;

/** Arrasto em andamento. Só existe entre o apertar e o soltar. */
export type Drag =
  | { readonly kind: 'none' }
  | {
      readonly kind: 'move';
      readonly atom: AtomId;
      /** O grafo antes do arrasto começar — o passo de desfazer. */
      readonly before: MoleculeGraph;
      readonly moved: boolean;
    }
  | { readonly kind: 'bond'; readonly from: AtomId; readonly to: Point }
  | { readonly kind: 'pan'; readonly origin: Point; readonly camera: Camera };
