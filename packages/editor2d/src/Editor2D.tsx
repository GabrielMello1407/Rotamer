'use client';

import { findAtom, findBond, isEmpty, type AtomId, type MoleculeGraph } from '@rotamer/core';
import { useMessages } from '@rotamer/i18n/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactElement,
  WheelEvent as ReactWheelEvent,
} from 'react';
import { useStore } from 'zustand';
import { canvasMessages, contextMenuMessages } from './messages';
import { ContextMenu, type MenuEntry } from './ContextMenu';
import styles from './Editor2D.module.css';
import { elementForKey, shortcutsApply } from './keys';
import {
  hoverAt,
  selectInRegion,
  snapFromAtom,
  suggestDirection,
  toGraph,
  toleranceFor,
} from './geometry2d';
import { readPalette, type EditorPalette } from './palette';
import { draw } from './render';
import { clampScale, type EditorState, type EditorStore } from './store';
import type { Camera, Hover, Point, Selection, Tool, Viewport } from './types';

/**
 * Quanto tempo o dedo fica parado antes de o menu aparecer.
 *
 * Meio segundo é o que o Android e o iOS usam para o mesmo gesto. Mais curto
 * abre menu no meio de um traço; mais longo passa por travamento.
 */
const LONG_PRESS_MS = 500;

/** O estado de uma pinça em andamento. */
interface Pinch {
  /** Distância entre os dedos quando começou, em pixels. */
  readonly distance: number;
  readonly midpoint: Point;
  /** Ponto do grafo que fica ancorado sob os dedos. */
  readonly anchor: Point;
  readonly camera: Camera;
}

export interface Editor2DProps {
  readonly store: EditorStore;
  readonly className?: string | undefined;
  /**
   * Organizar o desenho, quando quem monta a tela tem o motor à mão.
   *
   * Quem endireita é o RDKit, e o editor não fala com ele — a regra de
   * dependência do repositório. Sem esta função, a opção simplesmente não
   * aparece no menu.
   */
  readonly onTidy?: (() => void) | undefined;
  /**
   * O aviso da última vez que se organizou o desenho.
   *
   * Enquanto ele existir, toma a banda da dica — duas vozes no mesmo canto
   * viram uma coisa ilegível. Quem decide a frase e por quanto tempo ela fica
   * na tela é `EditorWorkspace`; o editor só sabe desenhar um cartão.
   */
  readonly notice?: EditorNotice | undefined;
}

/**
 * O aviso que substitui a dica quando organizar mexeu na estereoquímica.
 *
 * `info` é conta do RDKit relatada — cunha que sumiu ou virou traço sem a
 * configuração mudar. `danger` é o caso em que o organizador erraria: algum
 * centro mudaria de letra, e o produto se recusa a aplicar o resultado.
 */
export interface EditorNotice {
  readonly tone: 'info' | 'danger';
  /** A frase que ensina. Fica na tinta cheia. */
  readonly headline: string;
  /** A linha de apoio, em tom mais baixo. */
  readonly detail: string;
  /** Só o aviso de defeito tem fechar — os outros saem sozinhos. */
  readonly onClose?: (() => void) | undefined;
}

/**
 * Abaixo disto, o gesto foi um clique, não um arrasto.
 *
 * O dedo treme mais que o mouse: exigir a mesma firmeza dos dois faz metade dos
 * cliques no celular virar arrasto de meio ângstrom.
 */
const CLICK_SLOP_MOUSE = 5;
const CLICK_SLOP_TOUCH = 12;

function clickSlop(pointerType: string): number {
  return pointerType === 'mouse' ? CLICK_SLOP_MOUSE : CLICK_SLOP_TOUCH;
}

/**
 * O que se pode fazer com o que está sob o cursor.
 *
 * Três cardápios, porque três coisas podem estar ali: um átomo, uma ligação, ou
 * o vazio — e no vazio o assunto passa a ser a molécula inteira.
 *
 * Cada opção chama a mesma ação do grafo que a barra de ferramentas chama. O
 * menu é caminho novo, não regra nova: quem diz se o resultado existe continua
 * sendo o RDKit, depois.
 */
function entriesFor(
  store: EditorStore,
  graph: MoleculeGraph,
  target: Hover,
  onTidy: (() => void) | null,
  messages: ContextMenuText,
): MenuEntry[] {
  const state = store.getState();

  // O alvo está dentro do que já está pego: o menu passa a falar do bloco
  // inteiro, não só do item apontado — é o caminho de quem selecionou e
  // trocou de ferramenta, ou de quem abriu o menu direto sobre a seleção.
  if (
    (target?.kind === 'atom' && state.selection.atoms.has(target.id)) ||
    (target?.kind === 'bond' && state.selection.bonds.has(target.id))
  ) {
    return selectionEntries(state, graph, state.selection, messages);
  }

  if (target?.kind === 'atom') {
    const atom = findAtom(graph, target.id);
    if (!atom) return [];

    return [
      { kind: 'title', label: messages.atomOf(atom.element) },
      {
        kind: 'elements',
        active: atom.element,
        onPick: (symbol) => {
          state.changeElement(atom.id, symbol);
        },
      },
      { kind: 'divider' },
      { kind: 'title', label: messages.formalCharge },
      ...CHARGES.map((charge) => ({
        kind: 'item' as const,
        label: chargeLabel(charge, messages),
        active: atom.charge === charge,
        testId: `menu-carga-${String(charge)}`,
        onPick: () => {
          state.setCharge(atom.id, charge);
        },
      })),
      { kind: 'divider' },
      {
        kind: 'item',
        label: messages.eraseAtom,
        danger: true,
        testId: 'menu-apagar-atomo',
        onPick: () => {
          state.eraseAtom(atom.id);
        },
      },
    ];
  }

  if (target?.kind === 'bond') {
    const bond = findBond(graph, target.id);
    if (!bond) return [];

    const wedge = bond.wedge ?? 'none';

    return [
      { kind: 'title', label: messages.bond },
      ...ORDERS.map((order) => ({
        kind: 'item' as const,
        label: messages[ORDER_KEYS[order]],
        active: bond.order === order,
        testId: `menu-ordem-${String(order)}`,
        onPick: () => {
          state.setOrder(bond.id, order);
        },
      })),
      { kind: 'divider' },
      { kind: 'title', label: messages.stereochemistry },
      ...WEDGES.map((kind) => ({
        kind: 'item' as const,
        label: messages[WEDGE_KEYS[kind]],
        active: wedge === kind,
        testId: `menu-cunha-${kind}`,
        onPick: () => {
          state.setWedge(bond.id, kind);
        },
      })),
      // Inverter só faz sentido com cunha: numa ligação no plano não há ponta
      // fina para trocar de lado.
      ...(wedge === 'none'
        ? []
        : [
            {
              kind: 'item' as const,
              label: messages.flipWedge,
              testId: 'menu-inverter-cunha',
              onPick: () => {
                state.flipWedge(bond.id);
              },
            },
          ]),
      { kind: 'divider' },
      {
        kind: 'item',
        label: messages.eraseBond,
        danger: true,
        testId: 'menu-apagar-ligacao',
        onPick: () => {
          state.eraseBond(bond.id);
        },
      },
    ];
  }

  // No vazio o assunto é a molécula inteira; com a tela vazia não há assunto
  // nenhum, e o menu não abre.
  if (isEmpty(graph)) return [];

  return [
    // Organizar só existe quando quem monta a tela ligou o motor: é o RDKit que
    // calcula o desenho arrumado, e o editor não fala com ele direto.
    ...(onTidy === null
      ? []
      : [
          {
            kind: 'item' as const,
            label: messages.tidy,
            testId: 'menu-organizar',
            onPick: onTidy,
          },
        ]),
    {
      kind: 'item',
      label: messages.fit,
      testId: 'menu-enquadrar',
      onPick: () => {
        state.frame();
      },
    },
    ...(state.past.length > 0
      ? [
          {
            kind: 'item' as const,
            label: messages.undo,
            testId: 'menu-desfazer',
            onPick: () => {
              store.getState().undo();
            },
          },
        ]
      : []),
    ...(state.future.length > 0
      ? [
          {
            kind: 'item' as const,
            label: messages.redo,
            testId: 'menu-refazer',
            onPick: () => {
              store.getState().redo();
            },
          },
        ]
      : []),
    { kind: 'divider' },
    {
      kind: 'item',
      label: messages.clear,
      danger: true,
      testId: 'menu-limpar',
      onPick: () => {
        store.getState().clear();
      },
    },
  ];
}

/**
 * O menu quando o alvo é parte da seleção: age no bloco inteiro, não só no
 * item apontado. Mesma regra do resto do menu — o menu só é o caminho até a
 * ação que já existe no grafo; quem diz se o resultado existe continua sendo
 * o RDKit, depois.
 *
 * Sem seção de estereoquímica: aplicar cunha em bloco definiria configurações
 * que ninguém escolheu, e o RDKit devolveria `R`/`S` que a pessoa não desenhou
 * (D-01, D-21).
 */
function selectionEntries(
  state: EditorState,
  graph: MoleculeGraph,
  selection: Selection,
  messages: ContextMenuText,
): MenuEntry[] {
  const commonElement = commonElementOf(graph, selection.atoms);

  return [
    { kind: 'title', label: messages.selection },
    ...(selection.atoms.size > 0
      ? [
          { kind: 'title' as const, label: messages.changeElement },
          {
            kind: 'elements' as const,
            active: commonElement,
            onPick: (symbol: string) => {
              state.changeSelectionElement(symbol);
            },
          },
          { kind: 'divider' as const },
        ]
      : []),
    ...(selection.bonds.size > 0
      ? [
          { kind: 'title' as const, label: messages.bondOrders },
          ...ORDERS.map((order) => ({
            kind: 'item' as const,
            label: messages[ORDER_KEYS[order]],
            testId: `menu-selecao-ordem-${String(order)}`,
            onPick: () => {
              state.setSelectionOrder(order);
            },
          })),
          { kind: 'divider' as const },
        ]
      : []),
    {
      kind: 'item',
      label: messages.clearSelection,
      testId: 'menu-soltar-selecao',
      onPick: () => {
        state.clearSelection();
      },
    },
    {
      kind: 'item',
      label: messages.eraseSelection(
        messages.selectionCount(selection.atoms.size, selection.bonds.size),
      ),
      danger: true,
      testId: 'menu-apagar-selecao',
      onPick: () => {
        state.eraseSelection();
      },
    },
  ];
}

/**
 * O elemento comum a todos os átomos selecionados, ou `null` quando são
 * diferentes — é o que a mini-tabela do menu marca como ativo. Trocar o
 * elemento em bloco não julga se o resultado existe; quem julga é o RDKit,
 * depois, como sempre.
 */
function commonElementOf(graph: MoleculeGraph, atoms: ReadonlySet<AtomId>): string | null {
  let common: string | null = null;

  for (const atom of graph.atoms) {
    if (!atoms.has(atom.id)) continue;
    if (common === null) common = atom.element;
    else if (common !== atom.element) return null;
  }

  return common;
}

/** O mesmo átomo, a mesma ligação — usado para reconhecer o duplo toque. */
function sameHover(a: Hover, b: Hover): boolean {
  if (a === null || b === null) return false;
  if (a.kind !== b.kind) return false;
  return a.id === b.id;
}

/**
 * Janela de tempo entre dois toques para contar como duplo toque.
 *
 * O gesto não existe no navegador para ponteiro de caneta/mouse com a mesma
 * confiabilidade que existe para toque — por isso a contagem é feita à mão
 * aqui, uniforme para os dois, em vez de depender do `dblclick` nativo.
 */
const DOUBLE_TAP_MS = 350;

/** As cargas que aparecem em aula de orgânica, e nada além delas. */
const CHARGES = [1, 0, -1] as const;

function chargeLabel(charge: number, messages: ContextMenuText): string {
  if (charge === 0) return messages.chargeNone;
  return charge > 0 ? messages.chargePositive : messages.chargeNegative;
}

/** As ordens de ligação que o menu oferece. A ordem é número, não palavra. */
const ORDERS = [1, 2, 3] as const;

const ORDER_KEYS: Readonly<Record<(typeof ORDERS)[number], 'single' | 'double' | 'triple'>> = {
  1: 'single',
  2: 'double',
  3: 'triple',
};

/*
 * Cunha e traço são projeção, e quem está aprendendo ainda não lê "up" e "down"
 * como frente e trás — é o dicionário que explica isso, em cada idioma. Aqui
 * fica só a notação que o grafo guarda.
 */
const WEDGES = ['none', 'up', 'down'] as const;

const WEDGE_KEYS: Readonly<Record<(typeof WEDGES)[number], 'inPlane' | 'wedge' | 'dash'>> = {
  none: 'inPlane',
  up: 'wedge',
  down: 'dash',
};

/** O lado do dicionário do menu que está valendo agora. */
type ContextMenuText = (typeof contextMenuMessages)['pt-BR'];

/** O lado do dicionário da tela de desenho que está valendo agora. */
type CanvasText = (typeof canvasMessages)['pt-BR'];

/**
 * A dica que fica no pé da tela.
 *
 * Aparece enquanto o desenho é pequeno e some depois — quem já tem uma molécula
 * na tela não precisa mais ler como começar. Fora do modo desenho ela fica,
 * porque cada ferramenta responde a arrasto de um jeito diferente e adivinhar
 * isso não é parte de aprender química.
 */
function hintFor(
  tool: Tool,
  graph: MoleculeGraph,
  hover: Hover,
  selection: Selection,
  messages: CanvasText,
): string | null {
  /*
   * A dica da seleção só aparece na ferramenta Selecionar.
   *
   * Ela promete "clique no vazio solta" — e em qualquer outra ferramenta o
   * clique parado no vazio cria um átomo. Prometer o gesto errado é pior que
   * não dizer nada: quem seguir a dica desenha carbono sem querer no meio da
   * estrutura.
   */
  if (tool === 'select' && (selection.atoms.size > 0 || selection.bonds.size > 0)) {
    return `${messages.selected(selection.atoms.size, selection.bonds.size)}. ${messages.selectionHint}`;
  }

  // Fora dela, a seleção continua existindo e o caminho para agir sobre ela é
  // voltar à ferramenta — é isso que a dica diz.
  if (selection.atoms.size > 0 || selection.bonds.size > 0) {
    return `${messages.selected(selection.atoms.size, selection.bonds.size)}. ${messages.selectionHintElsewhere}`;
  }

  if (tool === 'select') {
    return messages.selectHint;
  }

  // A dica mais útil é a que chega na hora da intenção: com o cursor em cima de
  // uma ligação, o que a pessoa quer saber é como transformá-la em dupla.
  if (tool === 'structure' && hover?.kind === 'bond') {
    return messages.bondHint;
  }

  if (tool === 'move') {
    return messages.moveHint;
  }

  if (tool === 'erase') {
    return messages.eraseHint;
  }

  if (tool === 'stereo') {
    return messages.stereoHint;
  }

  if (isEmpty(graph)) {
    return messages.emptyHint;
  }

  if (graph.atoms.length <= 3) {
    return messages.smallHint;
  }

  /*
   * A dor de repetir átomo a átomo aparece quando a molécula cresce — é a hora
   * de apontar o caminho mais curto. Mas só por uma faixa de tamanho: a dica
   * some depois, como toda dica desta função. Uma faixa de texto fixa no pé da
   * tela deixa de ser dica e vira moldura, e ela come a altura que a molécula
   * precisa para crescer.
   */
  if (graph.atoms.length >= 8 && graph.atoms.length <= 14) {
    return messages.growingHint;
  }

  return null;
}


/**
 * A tela de desenho.
 *
 * Canvas próprio, escrito à mão: é o diferencial do produto e nenhuma biblioteca
 * pronta dá o toque certo. O componente não sabe química — ele mexe no grafo, e
 * o grafo vai para o RDKit responder se aquilo existe.
 */
export function Editor2D({ store, className, onTidy, notice }: Editor2DProps): ReactElement {
  const canvasText = useMessages(canvasMessages);
  const menuText = useMessages(contextMenuMessages);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paletteRef = useRef<EditorPalette | null>(null);
  const viewportRef = useRef<Viewport>({ width: 0, height: 0 });
  const pointerStartRef = useRef<Point | null>(null);
  const scheduledRef = useRef(false);

  /**
   * Os dedos na tela e o estado da pinça.
   *
   * Em celular não existe roda de mouse: sem dois dedos, não há como enquadrar
   * uma molécula que cresceu — e escola pública em celular é o caso de uso
   * declarado, não o caso extremo.
   */
  const touchesRef = useRef(new Map<number, Point>());
  const pinchRef = useRef<Pinch | null>(null);

  /**
   * O ponto do grafo onde o arrasto do bloco selecionado começou.
   *
   * `Drag` de tipo `'selection'` não guarda a origem (só `before` e `moved`):
   * o deslocamento precisa ser recalculado do início a cada quadro para não
   * acumular erro de ponto flutuante, e é esta referência que sustenta a
   * conta — igual ao `pointerStartRef`, mas em coordenadas do grafo.
   */
  const selectionDragOriginRef = useRef<Point | null>(null);

  /**
   * O último toque solto sem arrastar, na ferramenta Selecionar — é o que
   * reconhece o duplo toque/clique sem depender do `dblclick` do navegador,
   * que não é confiável em toque.
   */
  const lastTapRef = useRef<{ readonly target: Hover; readonly time: number } | null>(null);

  const tool = useStore(store, (state) => state.tool);
  const dragKind = useStore(store, (state) => state.drag.kind);
  const graph = useStore(store, (state) => state.graph);
  // A dica muda com o que está sob o cursor, então ela precisa reagir ao hover.
  const hover = useStore(store, (state) => state.hover);
  const selection = useStore(store, (state) => state.selection);
  // Só a escala, e não a câmera inteira: mover a vista não precisa re-renderizar
  // o componente, quem redesenha é a assinatura do store.
  const cameraScale = useStore(store, (state) => state.camera.scale);

  /** Redesenha no próximo quadro; várias chamadas seguidas viram uma. */
  const paint = useCallback(() => {
    if (scheduledRef.current) return;
    scheduledRef.current = true;

    requestAnimationFrame(() => {
      scheduledRef.current = false;

      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      const palette = paletteRef.current;
      if (!canvas || !context || !palette) return;

      const state = store.getState();
      draw(context, {
        graph: state.graph,
        camera: state.camera,
        viewport: viewportRef.current,
        hover: state.hover,
        drag: state.drag,
        palette,
        element: state.element,
        erasing: state.tool === 'erase',
        hydrogens: state.hydrogens,
        focus: state.focus,
        flagged: state.flagged,
        stereo: state.stereo,
        stereoBonds: state.stereoBonds,
        selection: state.selection,
      });
    });
  }, [store]);

  // ---- tamanho, densidade de pixel e tema ----
  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;

    const resize = (): void => {
      const rect = frame.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;

      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);

      const context = canvas.getContext('2d');
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);

      viewportRef.current = { width: rect.width, height: rect.height };
      store.getState().setViewport(viewportRef.current);
      paint();
    };

    const rereadPalette = (): void => {
      paletteRef.current = readPalette(frame);
      paint();
    };

    rereadPalette();
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(frame);

    // O tema muda por escolha da pessoa ou pelo sistema; nos dois casos as cores
    // do desenho vêm dos tokens e precisam ser lidas de novo.
    const themeObserver = new MutationObserver(rereadPalette);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', rereadPalette);

    return () => {
      observer.disconnect();
      themeObserver.disconnect();
      media.removeEventListener('change', rereadPalette);
    };
  }, [paint, store]);

  // ---- redesenho a cada mudança de estado ----
  useEffect(() => store.subscribe(paint), [store, paint]);

  /**
   * O cartão de aviso entra com uma transição, não já pronto.
   *
   * `false` no quadro do mount e `true` um quadro depois é o que dá à
   * `transition` do CSS algo para animar — trocar direto para o estado final
   * faria o cartão nascer sem entrada nenhuma. Quanto tempo ele fica na tela
   * é decisão de quem monta a tela, não deste componente: aqui só existe a
   * animação de entrada.
   */
  const [noticeEntered, setNoticeEntered] = useState(false);

  useEffect(() => {
    if (notice === null || notice === undefined) {
      setNoticeEntered(false);
      return;
    }

    setNoticeEntered(false);
    const frame = requestAnimationFrame(() => {
      setNoticeEntered(true);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [notice]);

  /**
   * O menu do botão direito.
   *
   * Guarda o que estava sob o cursor no momento do clique, e não uma consulta
   * viva: mexer o mouse com o menu aberto não pode trocar o alvo debaixo dele.
   */
  const [menu, setMenu] = useState<{
    readonly x: number;
    readonly y: number;
    readonly target: Hover;
  } | null>(null);

  /** O dedo parado que vira menu. `null` quando não há espera em curso. */
  const longPressRef = useRef<number | null>(null);

  const clearLongPress = useCallback((): void => {
    if (longPressRef.current === null) return;

    window.clearTimeout(longPressRef.current);
    longPressRef.current = null;
  }, []);

  useEffect(() => clearLongPress, [clearLongPress]);

  const pointAt = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement> | ReactMouseEvent<HTMLCanvasElement>): Point => {
      const rect = event.currentTarget.getBoundingClientRect();
      const screen = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      return toGraph(screen, store.getState().camera, viewportRef.current);
    },
    [store],
  );

  /**
   * O arrasto que começa no vazio: view normal, retângulo com Shift.
   *
   * Vale para `structure`, `move` e `stereo` — não para `erase`, que nem chega
   * aqui (`erase` sai da função antes de montar drag nenhum), e não é o gesto
   * de `select`, que abre retângulo sem precisar de Shift porque é a própria
   * ferramenta.
   */
  const panOrMarquee = useCallback(
    (state: EditorState, point: Point, shift: boolean): void => {
      state.setDrag(
        shift ? { kind: 'marquee', origin: point, point } : { kind: 'pan', origin: point, camera: state.camera },
      );
    },
    [],
  );

  /**
   * A seleção como estava antes de o primeiro dedo encostar.
   *
   * No toque, encostar em cima de um átomo já troca a seleção — é o que faz o
   * toque simples selecionar. Só que o segundo dedo pode chegar em seguida e
   * transformar o gesto em pinça: em modo Selecionar é assim que se move a
   * vista, e nesse caso a troca do primeiro dedo nunca foi intenção de
   * ninguém. Guardar aqui é o que permite devolvê-la quando a pinça começa.
   */
  const selectionBeforeTouchRef = useRef<Selection | null>(null);

  /** Começa a pinça quando o segundo dedo encosta. */
  const startPinch = useCallback((): void => {
    const [first, second] = [...touchesRef.current.values()];
    if (!first || !second) return;

    const state = store.getState();
    state.setDrag({ kind: 'none' });
    state.setHover(null);

    // Dois dedos movem a vista, e mover a vista não é mexer no que está pego:
    // a seleção volta a ser a de antes do primeiro dedo.
    const before = selectionBeforeTouchRef.current;
    selectionBeforeTouchRef.current = null;
    if (before !== null) state.setSelection(before);

    const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };

    pinchRef.current = {
      distance: Math.hypot(first.x - second.x, first.y - second.y),
      midpoint,
      // O ponto do grafo debaixo dos dedos não pode escorregar: é ele que
      // ancora o zoom.
      anchor: toGraph(midpoint, state.camera, viewportRef.current),
      camera: state.camera,
    };
  }, [store]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>): void => {
      // O botão direito não desenha: ele abre o menu, e quem faz isso é o
      // `contextmenu`. Sem esta saída, o mesmo gesto abriria o menu e ainda
      // largaria um átomo atrás dele.
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      /*
       * Capturar o ponteiro é conveniência, não requisito.
       *
       * Ela mantém o arrasto vivo quando o dedo sai da tela de desenho — mas
       * lança quando o ponteiro daquele identificador já não está ativo, e aí
       * derruba o resto do gesto junto. Acontece de verdade num toque que o
       * sistema cancelou, e acontece sempre com evento sintético: era o que
       * fazia o teste da pinça no celular passar sem nunca chegar a testar a
       * pinça, porque o manipulador morria na primeira linha.
       */
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Sem captura, o gesto continua — só não sobrevive a sair da moldura.
      }
      frameRef.current?.focus();

      const rect = event.currentTarget.getBoundingClientRect();
      touchesRef.current.set(event.pointerId, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });

      if (touchesRef.current.size >= 2) {
        clearLongPress();
        startPinch();
        return;
      }

      const state = store.getState();
      const point = pointAt(event);
      pointerStartRef.current = { x: event.clientX, y: event.clientY };

      const under = hoverAt(state.graph, point, toleranceFor(state.camera));
      state.setHover(under);

      /*
       * No toque, o menu vem do dedo parado.
       *
       * Tablet de escola não tem botão direito, e é em tablet que boa parte das
       * aulas acontece. Meio segundo parado no mesmo lugar é o gesto que o
       * sistema todo usa para "me diga as opções disto".
       */
      if (event.pointerType !== 'mouse') {
        const { clientX, clientY } = event;

        clearLongPress();
        longPressRef.current = window.setTimeout(() => {
          longPressRef.current = null;

          const now = store.getState();
          now.setDrag({ kind: 'none' });
          setMenu({ x: clientX, y: clientY, target: under });
        }, LONG_PRESS_MS);
      }

      if (state.tool === 'erase') return;

      if (state.tool === 'select') {
        // Só no toque: o mouse não vira pinça, e guardar por lá seria carregar
        // estado que nunca é lido.
        selectionBeforeTouchRef.current =
          event.pointerType === 'mouse' ? null : state.selection;

        if (under !== null) {
          const alreadySelected =
            (under.kind === 'atom' && state.selection.atoms.has(under.id)) ||
            (under.kind === 'bond' && state.selection.bonds.has(under.id));

          // Clique substitui a seleção — inclusive quando o próximo gesto vira
          // arrasto: a pessoa já vê o que pegou antes de decidir mover. Em cima
          // de algo que já estava pego, a seleção fica como está: é o que
          // permite arrastar o bloco inteiro sem reduzi-lo a um item só.
          if (!alreadySelected) {
            state.setSelection(
              under.kind === 'atom'
                ? { atoms: new Set([under.id]), bonds: new Set() }
                : { atoms: new Set(), bonds: new Set([under.id]) },
            );
          }

          selectionDragOriginRef.current = point;
          state.setDrag({ kind: 'selection', before: state.graph, moved: false });
          return;
        }

        // O vazio abre o retângulo — sem Shift, porque a ferramenta inteira já
        // é sobre selecionar.
        state.setDrag({ kind: 'marquee', origin: point, point });
        return;
      }

      if (state.tool === 'stereo') {
        // Nesta ferramenta o arrasto não desenha nada: ela existe para clicar em
        // ligação. Arrastar move a vista — ou, com Shift a partir do vazio,
        // abre o retângulo de seleção.
        panOrMarquee(state, point, under === null && event.shiftKey);
        return;
      }

      if (state.tool === 'move') {
        // Em cima de um átomo, arrastar leva o átomo; no vazio, leva a vista —
        // ou, com Shift, abre o retângulo.
        if (under?.kind === 'atom') {
          state.setDrag({ kind: 'move', atom: under.id, before: state.graph, moved: false });
        } else {
          panOrMarquee(state, point, under === null && event.shiftKey);
        }
        return;
      }

      if (under?.kind === 'atom') {
        // Segurar Shift move o átomo; sem Shift, o arrasto puxa uma ligação.
        state.setDrag(
          event.shiftKey
            ? { kind: 'move', atom: under.id, before: state.graph, moved: false }
            : { kind: 'bond', from: under.id, to: point },
        );
        return;
      }

      // Ligação e vazio começam o mesmo arrasto: mover a vista. A diferença
      // aparece só no soltar, quando o clique parado vira ordem de ligação —
      // sem isto, clicar numa ligação não fazia **nada**, porque nenhum arrasto
      // era registrado e o soltar não tinha em que caso entrar. Com Shift a
      // partir do vazio, o arrasto abre o retângulo de seleção.
      if (under === null || under.kind === 'bond') {
        panOrMarquee(state, point, under === null && event.shiftKey);
      }
    },
    [clearLongPress, panOrMarquee, pointAt, startPinch, store],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>): void => {
      const state = store.getState();

      // Dedo que anda deixou de estar parado: o menu era espera, o traço é
      // intenção.
      const start = pointerStartRef.current;
      if (
        longPressRef.current !== null &&
        start !== null &&
        Math.hypot(event.clientX - start.x, event.clientY - start.y) > clickSlop(event.pointerType)
      ) {
        clearLongPress();
      }

      if (touchesRef.current.has(event.pointerId)) {
        const rect = event.currentTarget.getBoundingClientRect();
        touchesRef.current.set(event.pointerId, {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }

      const pinch = pinchRef.current;
      if (pinch !== null && touchesRef.current.size >= 2) {
        const [first, second] = [...touchesRef.current.values()];
        if (!first || !second) return;

        const distance = Math.hypot(first.x - second.x, first.y - second.y);
        if (distance < 1 || pinch.distance < 1) return;

        const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
        const scale = clampScale(pinch.camera.scale * (distance / pinch.distance));
        const viewport = viewportRef.current;

        // Câmera recolocada para o ponto ancorado continuar exatamente debaixo
        // dos dedos: é o que faz a pinça parecer que move o papel, e não a lente.
        state.setCamera({
          x: pinch.anchor.x - (midpoint.x - viewport.width / 2) / scale,
          y: pinch.anchor.y + (midpoint.y - viewport.height / 2) / scale,
          scale,
        });
        return;
      }

      const dragging = state.drag;
      const point = pointAt(event);

      if (dragging.kind === 'none') {
        state.setHover(hoverAt(state.graph, point, toleranceFor(state.camera)));
        return;
      }

      if (dragging.kind === 'bond') {
        const origin = state.graph.atoms.find((atom) => atom.id === dragging.from);
        if (!origin) return;

        // Perto de outro átomo, a ponta gruda nele: é assim que se fecha anel.
        const target = hoverAt(state.graph, point, toleranceFor(state.camera));
        if (target?.kind === 'atom' && target.id !== dragging.from) {
          const atom = state.graph.atoms.find((candidate) => candidate.id === target.id);
          if (atom) {
            state.setDrag({ kind: 'bond', from: dragging.from, to: { x: atom.x, y: atom.y } });
            state.setHover(target);
            return;
          }
        }

        state.setDrag({ kind: 'bond', from: dragging.from, to: snapFromAtom(origin, point) });
        state.setHover(null);
        return;
      }

      if (dragging.kind === 'move') {
        state.dragAtomTo(dragging.atom, point);
        state.setDrag({ ...dragging, moved: true });
        return;
      }

      if (dragging.kind === 'marquee') {
        // Ao vivo, não só no soltar: o que está dentro já veste o marca-texto
        // enquanto o retângulo cresce, e soltar só encerra o gesto.
        state.setDrag({ kind: 'marquee', origin: dragging.origin, point });
        state.setSelection(
          selectInRegion(state.graph, {
            x0: dragging.origin.x,
            y0: dragging.origin.y,
            x1: point.x,
            y1: point.y,
          }),
        );
        return;
      }

      if (dragging.kind === 'selection') {
        const origin = selectionDragOriginRef.current;
        if (!origin) return;

        // Do início até aqui, nunca quadro sobre quadro — é o que evita
        // acumular erro de ponto flutuante num arrasto longo.
        state.moveSelectionBy(dragging.before, { x: point.x - origin.x, y: point.y - origin.y });
        state.setDrag({ ...dragging, moved: true });
        return;
      }

      if (dragging.kind !== 'pan') return;

      state.setCamera({
        x: dragging.camera.x - (point.x - dragging.origin.x),
        y: dragging.camera.y - (point.y - dragging.origin.y),
        scale: dragging.camera.scale,
      });
    },
    [pointAt, store],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>): void => {
      touchesRef.current.delete(event.pointerId);

      if (pinchRef.current !== null) {
        // Um dedo saiu: a pinça acaba aqui e o dedo que sobrou não vira traço,
        // senão toda pinça terminaria desenhando um átomo perdido.
        if (touchesRef.current.size < 2) {
          pinchRef.current = null;
          pointerStartRef.current = null;
          store.getState().setDrag({ kind: 'none' });
        }
        return;
      }

      clearLongPress();
      selectionBeforeTouchRef.current = null;

      const state = store.getState();
      const point = pointAt(event);
      const start = pointerStartRef.current;
      pointerStartRef.current = null;

      const moved =
        start !== null &&
        Math.hypot(event.clientX - start.x, event.clientY - start.y) >
          clickSlop(event.pointerType);

      const dragging = state.drag;
      state.setDrag({ kind: 'none' });

      if (state.tool === 'erase') {
        const under = hoverAt(state.graph, point, toleranceFor(state.camera));
        if (under?.kind === 'atom') state.eraseAtom(under.id);
        else if (under?.kind === 'bond') state.eraseBond(under.id);
        return;
      }

      if (dragging.kind === 'move') {
        // O arrasto foi mexendo o grafo sem marcar histórico. Aqui o caminho
        // inteiro vira um passo só de desfazer.
        if (dragging.moved) {
          state.closeUndoStep(dragging.before);
          return;
        }

        // Sem arrasto, Shift+clique no átomo alterna ele na seleção — hoje
        // isso não fazia nada, porque o mesmo drag serve para "segurar Shift
        // move o átomo" em `structure`. Sem Shift, clicar um átomo com a
        // ferramenta Mover continua sem fazer nada, como sempre foi.
        if (event.shiftKey) state.toggleAtomSelection(dragging.atom);
        return;
      }

      if (dragging.kind === 'marquee') {
        if (!moved) {
          // Retângulo menor que o alvo de clique é um clique: no vazio, com a
          // ferramenta Selecionar, é o gesto que solta a seleção. Com Shift a
          // partir de outra ferramenta, o mesmo toque parado também limpa —
          // em vez de largar um átomo novo debaixo do dedo.
          state.clearSelection();
          return;
        }

        // A seleção já foi atualizada a cada quadro do arrasto (`drawMarquee`
        // lê o retângulo, `drawSelection` lê o resultado); soltar só encerra
        // o gesto.
        return;
      }

      if (dragging.kind === 'selection') {
        // `moved` com folga de clique, e não o `dragging.moved` que qualquer
        // pixel de tremor liga: no dedo a folga é de 12 px, e sem ela um toque
        // firme viraria "arrastou" — o duplo toque nunca chegaria a acontecer,
        // e cada toque deixaria um passo de desfazer que não move nada.
        if (moved) {
          // O arrasto foi movendo o bloco sem marcar histórico (`amend`, via
          // `moveSelectionBy`). Aqui o caminho inteiro vira um passo só de
          // desfazer — o mesmo contrato do arrasto de um átomo.
          if (dragging.moved) state.closeUndoStep(dragging.before);
          return;
        }

        // Dedo parado que chegou a mexer o grafo por um fio: devolve o desenho
        // ao que era, senão o toque deixaria a molécula deslocada.
        if (dragging.moved) state.commit(dragging.before);

        // Sem arrasto: foi um toque ou clique parado. Um segundo toque no
        // mesmo alvo, dentro da janela de tempo, pega o fragmento inteiro —
        // é o duplo clique/toque que só existe dentro desta ferramenta.
        const under = hoverAt(state.graph, point, toleranceFor(state.camera));
        if (under === null) return;

        const last = lastTapRef.current;
        const now = performance.now();
        lastTapRef.current = { target: under, time: now };

        if (last !== null && now - last.time < DOUBLE_TAP_MS && sameHover(last.target, under)) {
          lastTapRef.current = null;
          if (under.kind === 'atom') state.selectFragmentFromAtom(under.id);
          else state.selectFragmentFromBond(under.id);
        }

        return;
      }

      if (dragging.kind === 'bond') {
        const atom = state.graph.atoms.find((candidate) => candidate.id === dragging.from);
        if (!atom) return;

        if (!moved) {
          // Clique no átomo: com outro elemento ativo, troca o elemento; com o
          // mesmo, cresce a cadeia na direção mais livre.
          if (atom.element !== state.element) state.changeElement(atom.id, state.element);
          else state.bondToNewAtom(atom.id, suggestDirection(state.graph, atom.id));
          return;
        }

        const target = hoverAt(state.graph, point, toleranceFor(state.camera));
        if (target?.kind === 'atom' && target.id !== dragging.from) {
          state.bondTo(dragging.from, target.id);
        } else {
          state.bondToNewAtom(atom.id, snapFromAtom(atom, point));
        }
        return;
      }

      if (dragging.kind === 'pan' && !moved && state.tool === 'structure') {
        const under = hoverAt(state.graph, point, toleranceFor(state.camera));
        if (under?.kind === 'bond') state.cycleBond(under.id);
        else if (under === null) state.addAtomAt(point);
      }

      if (dragging.kind === 'pan' && !moved && state.tool === 'stereo') {
        const under = hoverAt(state.graph, point, toleranceFor(state.camera));
        if (under?.kind !== 'bond') return;

        // Shift vira a cunha de lado — troca qual átomo é a ponta fina, e com
        // isso a configuração do centro. Sem Shift, ela troca de tipo.
        if (event.shiftKey) state.flipWedge(under.id);
        else state.cycleWedge(under.id);
      }
    },
    [pointAt, store],
  );

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLCanvasElement>): void => {
      const state = store.getState();
      const factor = Math.exp(-event.deltaY * 0.0015);
      state.setCamera({ ...state.camera, scale: clampScale(state.camera.scale * factor) });
    },
    [store],
  );

  /**
   * Os atalhos valem na página, não só dentro da moldura.
   *
   * Enquanto o ouvinte estava no `onKeyDown` da moldura, teclar `O` só fazia
   * alguma coisa depois de clicar na tela de desenho — e a dica da missão diz
   * "tecle O" sem falar em clicar antes. Quem acabou de escolher uma missão no
   * painel está com o foco no painel, e a tecla morria ali.
   *
   * Duas exceções, e são as óbvias: enquanto alguém escreve num campo, letra é
   * letra; e com a tabela periódica aberta, quem manda é a tabela.
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (!shortcutsApply(event.target)) return;

      const state = store.getState();
      const key = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) state.redo();
        else state.undo();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === 'y') {
        event.preventDefault();
        state.redo();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === 'a') {
        // Sem isto o navegador seleciona a página inteira — o texto ao redor
        // do editor, não a molécula.
        event.preventDefault();
        state.selectAll();
        return;
      }

      if (key === 'escape') {
        // O menu de contexto tem o próprio ouvinte de Escape (`role="menu"`,
        // que `isSheetOpen()` não pega — ela procura `[role="dialog"]`). Sem
        // esta saída, a mesma tecla fecharia o menu **e** limparia a seleção
        // por baixo dele.
        if (menu !== null) return;

        event.preventDefault();
        state.clearSelection();
        return;
      }

      if (key === 'delete' || key === 'backspace') {
        event.preventDefault();

        if (state.selection.atoms.size > 0 || state.selection.bonds.size > 0) {
          state.eraseSelection();
          return;
        }

        const under = state.hover;
        if (under?.kind === 'atom') state.eraseAtom(under.id);
        else if (under?.kind === 'bond') state.eraseBond(under.id);
        return;
      }

      // Enquadrar mudou de tecla: `f` é do flúor. Enquanto o enquadrar ficou
      // aqui, ele respondia antes do mapa de elementos e o flúor era o único
      // elemento da barra sem atalho nenhum — desenhá-lo exigia o mouse.
      if (key === '0') {
        event.preventDefault();
        state.frame();
        return;
      }

      if (key === 'e') {
        event.preventDefault();
        state.setTool(state.tool === 'erase' ? 'structure' : 'erase');
        return;
      }

      if (key === 'w') {
        event.preventDefault();
        state.setTool(state.tool === 'stereo' ? 'structure' : 'stereo');
        return;
      }

      if (key === 'm') {
        event.preventDefault();
        state.setTool(state.tool === 'move' ? 'structure' : 'move');
        return;
      }

      // `v`, não `s`: `s` já é o enxofre, e tioéter é comum em aula.
      if (key === 'v') {
        event.preventDefault();
        state.setTool(state.tool === 'select' ? 'structure' : 'select');
        return;
      }

      if (key === 'd') {
        event.preventDefault();
        state.setTool('structure');
        return;
      }

      const element = elementForKey(key);
      if (element !== undefined && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        state.setElement(element);
        state.setTool('structure');
      }
    },
    [menu, store],
  );

  const openMenu = useCallback(
    (event: ReactMouseEvent<HTMLCanvasElement>): void => {
      event.preventDefault();

      const state = store.getState();
      const under = hoverAt(state.graph, pointAt(event), toleranceFor(state.camera));

      state.setDrag({ kind: 'none' });
      state.setHover(under);
      setMenu({ x: event.clientX, y: event.clientY, target: under });
    },
    [pointAt, store],
  );

  const closeMenu = useCallback((): void => {
    setMenu(null);
  }, []);

  const entries = useMemo(
    () => (menu === null ? [] : entriesFor(store, graph, menu.target, onTidy ?? null, menuText)),
    [menu, store, graph, onTidy],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const hint = hintFor(tool, graph, hover, selection, canvasText);

  /*
   * A escala da câmera fica legível no DOM.
   *
   * Não é enfeite nem depuração: é o único jeito de um teste perguntar "a pinça
   * aproximou?" sem comparar imagem com imagem. Comparação de captura já
   * enganou uma vez — o teste da pinça passou meses verde sem nunca executar o
   * gesto, porque duas capturas diferiam por outro motivo qualquer.
   *
   * Sai como atributo, com duas casas: quem lê é teste, não pessoa.
   */
  const scaleLabel = cameraScale.toFixed(2);
  const selectionEmpty = selection.atoms.size === 0 && selection.bonds.size === 0;

  const classes = [
    styles.frame,
    tool === 'erase' ? styles.erasing : null,
    tool === 'move' ? styles.moving : null,
    tool === 'stereo' ? styles.stereo : null,
    tool === 'select' ? styles.selecting : null,
    dragKind === 'pan' ? styles.panning : null,
    dragKind === 'move' ? styles.dragging : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={frameRef}
      className={classes}
      tabIndex={0}
      role="application"
      aria-label={canvasText.label}
      data-camera-scale={scaleLabel}
    >
      {/* Quem seleciona com Ctrl+A não vê o marca-texto: sem isto, nada
          anuncia para o leitor de tela que a seleção mudou. */}
      <p className={styles.announce} role="status" aria-live="polite">
        {selectionEmpty
          ? canvasText.nothingSelected
          : `${canvasText.selected(selection.atoms.size, selection.bonds.size)}.`}
      </p>

      <canvas
        ref={canvasRef}
        className={styles.canvas}
        data-testid="tela-de-desenho"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={openMenu}
      />

      {/* O aviso toma a banda da dica: as duas são a voz da tela de desenho, e
          duas vozes no mesmo canto viram uma coisa ilegível. */}
      {notice !== null && notice !== undefined ? (
        <div className={styles.notice}>
          <div
            className={[
              styles.noticeCard,
              notice.tone === 'danger' ? styles.noticeDanger : null,
              noticeEntered ? null : styles.noticeEnter,
            ]
              .filter(Boolean)
              .join(' ')}
            role={notice.tone === 'danger' ? 'alert' : 'status'}
            aria-live={notice.tone === 'danger' ? undefined : 'polite'}
            data-testid="aviso-organizar"
          >
            <span className={styles.noticeMark} aria-hidden="true" />
            <div>
              <p className={styles.noticeHeadline}>{notice.headline}</p>
              <p className={styles.noticeDetail}>{notice.detail}</p>
            </div>
            {notice.onClose !== undefined && (
              <button
                type="button"
                className={styles.noticeClose}
                aria-label={canvasText.dismissNotice}
                data-testid="fechar-aviso-organizar"
                onClick={notice.onClose}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.noticeCloseIcon}>
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      ) : (
        hint !== null && (
          <div className={styles.hint}>
            <p className={styles.hintText}>{hint}</p>
          </div>
        )
      )}

      {menu !== null && entries.length > 0 && (
        <ContextMenu x={menu.x} y={menu.y} entries={entries} onClose={closeMenu} />
      )}
    </div>
  );
}
