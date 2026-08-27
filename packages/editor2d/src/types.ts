import type { AtomId, BondId, MoleculeGraph } from '@rotamer/core';

/** Tipos que o estado e as contas de tela compartilham. */

/**
 * `structure` desenha, `move` arrasta, `stereo` põe cunha, `erase` apaga.
 *
 * Em `move`, arrastar um átomo move o átomo e arrastar o vazio move a vista —
 * é a mesma intenção, "pegar e levar", e quem desenha não deveria ter que
 * escolher entre duas ferramentas para isso. No modo desenho o átomo também se
 * move, mas segurando Shift; a ferramenta existe porque atalho de teclado não
 * existe no celular e ninguém adivinha Shift.
 *
 * `stereo` é ferramenta própria porque clicar numa ligação já faz outra coisa —
 * trocar a ordem. Estereoquímica não pode ser um modo escondido dentro de um
 * gesto que já significa outra coisa.
 *
 * `select` pega um pedaço inteiro — um retângulo, o fragmento conectado, ou
 * átomo a átomo com Shift — para mover, apagar ou trocar em bloco de uma vez.
 * É ferramenta própria pelo mesmo motivo de `move`: no celular não existe
 * Shift nem botão direito, e ninguém adivinha o atalho.
 */
export type Tool = 'structure' | 'move' | 'stereo' | 'erase' | 'select';

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

/**
 * O que está pego agora: átomos e ligações, cada um no seu próprio conjunto.
 *
 * Os dois conjuntos são independentes por escolha, e de propósito não se
 * inferem um do outro: selecionar as duas pontas de uma ligação, um átomo de
 * cada vez com Shift, **não** marca a ligação sozinha — ela só entra quando é
 * pega diretamente (clique nela, o retângulo cercando as duas pontas, ou a
 * travessia do fragmento). Inferir a ligação a partir dos átomos surpreenderia
 * quem soltou o segundo átomo sem nunca ter tocado o traço entre eles, e o
 * desenho da seleção (D-18 à parte) só pinta o que está de fato no conjunto.
 */
export interface Selection {
  readonly atoms: ReadonlySet<AtomId>;
  readonly bonds: ReadonlySet<BondId>;
}

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
  | { readonly kind: 'pan'; readonly origin: Point; readonly camera: Camera }
  | {
      readonly kind: 'marquee';
      /**
       * Cantos do retângulo em **coordenadas do grafo**, não em pixel: assim o
       * retângulo continua colado à molécula se a vista se mexer no meio do
       * gesto (pinça de dois dedos, por exemplo).
       */
      readonly origin: Point;
      readonly point: Point;
    }
  | {
      readonly kind: 'selection';
      /**
       * O grafo no instante em que o arrasto do bloco começou. É o passo de
       * desfazer, igual ao `before` de `move`, e também a base sobre a qual o
       * deslocamento total do arrasto é aplicado a cada quadro — recalcular a
       * partir do início, e não quadro sobre quadro, é o que evita acumular
       * erro de ponto flutuante num arrasto longo.
       */
      readonly before: MoleculeGraph;
      readonly moved: boolean;
    };
