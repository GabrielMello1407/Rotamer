'use client';

import { findAtom, findBond, isEmpty, type MoleculeGraph } from '@rotamer/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactElement,
  WheelEvent as ReactWheelEvent,
} from 'react';
import { useStore } from 'zustand';
import { ContextMenu, type MenuEntry } from './ContextMenu';
import styles from './Editor2D.module.css';
import { shortcutsApply } from './keys';
import { hoverAt, snapFromAtom, suggestDirection, toGraph, toleranceFor } from './geometry2d';
import { readPalette, type EditorPalette } from './palette';
import { draw } from './render';
import { clampScale, type EditorStore } from './store';
import type { Camera, Hover, Point, Tool, Viewport } from './types';

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
function entriesFor(store: EditorStore, graph: MoleculeGraph, target: Hover): MenuEntry[] {
  const state = store.getState();

  if (target?.kind === 'atom') {
    const atom = findAtom(graph, target.id);
    if (!atom) return [];

    return [
      { kind: 'title', label: `Átomo de ${atom.element}` },
      {
        kind: 'elements',
        active: atom.element,
        onPick: (symbol) => {
          state.changeElement(atom.id, symbol);
        },
      },
      { kind: 'divider' },
      { kind: 'title', label: 'carga formal' },
      ...CHARGES.map((charge) => ({
        kind: 'item' as const,
        label: chargeLabel(charge),
        active: atom.charge === charge,
        testId: `menu-carga-${String(charge)}`,
        onPick: () => {
          state.setCharge(atom.id, charge);
        },
      })),
      { kind: 'divider' },
      {
        kind: 'item',
        label: 'Apagar o átomo',
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
      { kind: 'title', label: 'Ligação' },
      ...ORDERS.map(([order, label]) => ({
        kind: 'item' as const,
        label,
        active: bond.order === order,
        testId: `menu-ordem-${String(order)}`,
        onPick: () => {
          state.setOrder(bond.id, order);
        },
      })),
      { kind: 'divider' },
      { kind: 'title', label: 'estereoquímica' },
      ...WEDGES.map(([kind, label]) => ({
        kind: 'item' as const,
        label,
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
              label: 'Inverter a ponta fina',
              testId: 'menu-inverter-cunha',
              onPick: () => {
                state.flipWedge(bond.id);
              },
            },
          ]),
      { kind: 'divider' },
      {
        kind: 'item',
        label: 'Apagar a ligação',
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
    {
      kind: 'item',
      label: 'Enquadrar a molécula',
      testId: 'menu-enquadrar',
      onPick: () => {
        state.frame();
      },
    },
    ...(state.past.length > 0
      ? [
          {
            kind: 'item' as const,
            label: 'Desfazer',
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
            label: 'Refazer',
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
      label: 'Limpar a tela',
      danger: true,
      testId: 'menu-limpar',
      onPick: () => {
        store.getState().clear();
      },
    },
  ];
}

/** As cargas que aparecem em aula de orgânica, e nada além delas. */
const CHARGES = [1, 0, -1] as const;

function chargeLabel(charge: number): string {
  if (charge === 0) return 'Sem carga';
  return charge > 0 ? 'Positiva (+1)' : 'Negativa (−1)';
}

const ORDERS = [
  [1, 'Simples'],
  [2, 'Dupla'],
  [3, 'Tripla'],
] as const;

/* O texto diz o que a notação significa: cunha e traço são projeção, e a pessoa
   que está aprendendo ainda não lê "up" e "down" como frente e trás. */
const WEDGES = [
  ['none', 'No plano'],
  ['up', 'Cunha cheia — vem para frente'],
  ['down', 'Traço — vai para trás'],
] as const;

/**
 * A dica que fica no pé da tela.
 *
 * Aparece enquanto o desenho é pequeno e some depois — quem já tem uma molécula
 * na tela não precisa mais ler como começar. Fora do modo desenho ela fica,
 * porque cada ferramenta responde a arrasto de um jeito diferente e adivinhar
 * isso não é parte de aprender química.
 */
function hintFor(tool: Tool, graph: MoleculeGraph, hover: Hover): string | null {
  // A dica mais útil é a que chega na hora da intenção: com o cursor em cima de
  // uma ligação, o que a pessoa quer saber é como transformá-la em dupla.
  if (tool === 'structure' && hover?.kind === 'bond') {
    return 'Clique na ligação para trocar a ordem: simples → dupla → tripla.';
  }

  if (tool === 'move') {
    return 'Arraste um átomo para movê-lo. Arraste o fundo para mover a vista.';
  }

  if (tool === 'erase') {
    return 'Clique num átomo ou numa ligação para apagar.';
  }

  if (tool === 'stereo') {
    return 'Clique numa ligação simples: plano, cunha cheia, cunha tracejada. Com Shift, a cunha vira de lado.';
  }

  if (isEmpty(graph)) {
    return 'Clique para começar um átomo. Arraste de um átomo para puxar uma ligação, e clique na ligação para fazer dupla.';
  }

  if (graph.atoms.length <= 3) {
    return 'Clique numa ligação para trocar a ordem: simples → dupla → tripla. Para mover um átomo, use a ferramenta de mover — ou segure Shift.';
  }

  return null;
}

/** Atalhos de elemento. São os que aparecem em prova de orgânica. */
/**
 * A letra do elemento.
 *
 * São os elementos que aparecem em aula de orgânica, cada um na inicial do
 * próprio símbolo — que é o que a pessoa já teria escrito à mão. `l` é o cloro e
 * `b` é o bromo porque `c` já é o carbono e o carbono é o mais usado de todos.
 */
const ELEMENT_KEYS: Readonly<Record<string, string>> = {
  c: 'C',
  n: 'N',
  o: 'O',
  s: 'S',
  p: 'P',
  f: 'F',
  l: 'Cl',
  b: 'Br',
  i: 'I',
  h: 'H',
};

/**
 * A tela de desenho.
 *
 * Canvas próprio, escrito à mão: é o diferencial do produto e nenhuma biblioteca
 * pronta dá o toque certo. O componente não sabe química — ele mexe no grafo, e
 * o grafo vai para o RDKit responder se aquilo existe.
 */
export function Editor2D({ store, className }: Editor2DProps): ReactElement {
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

  const tool = useStore(store, (state) => state.tool);
  const dragKind = useStore(store, (state) => state.drag.kind);
  const graph = useStore(store, (state) => state.graph);
  // A dica muda com o que está sob o cursor, então ela precisa reagir ao hover.
  const hover = useStore(store, (state) => state.hover);

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

  /** Começa a pinça quando o segundo dedo encosta. */
  const startPinch = useCallback((): void => {
    const [first, second] = [...touchesRef.current.values()];
    if (!first || !second) return;

    const state = store.getState();
    state.setDrag({ kind: 'none' });
    state.setHover(null);

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

      event.currentTarget.setPointerCapture(event.pointerId);
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

      if (state.tool === 'stereo') {
        // Nesta ferramenta o arrasto não desenha nada: ela existe para clicar em
        // ligação. Arrastar move a vista, que é o gesto inofensivo.
        state.setDrag({ kind: 'pan', origin: point, camera: state.camera });
        return;
      }

      if (state.tool === 'move') {
        // Em cima de um átomo, arrastar leva o átomo; no vazio, leva a vista.
        state.setDrag(
          under?.kind === 'atom'
            ? { kind: 'move', atom: under.id, before: state.graph, moved: false }
            : { kind: 'pan', origin: point, camera: state.camera },
        );
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
      // era registrado e o soltar não tinha em que caso entrar.
      if (under === null || under.kind === 'bond') {
        state.setDrag({ kind: 'pan', origin: point, camera: state.camera });
      }
    },
    [clearLongPress, pointAt, startPinch, store],
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
        if (dragging.moved) state.closeUndoStep(dragging.before);
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

      if (key === 'delete' || key === 'backspace') {
        event.preventDefault();
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

      if (key === 'd') {
        event.preventDefault();
        state.setTool('structure');
        return;
      }

      const element = ELEMENT_KEYS[key];
      if (element !== undefined && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        state.setElement(element);
        state.setTool('structure');
      }
    },
    [store],
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
    () => (menu === null ? [] : entriesFor(store, graph, menu.target)),
    [menu, store, graph],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const hint = hintFor(tool, graph, hover);

  const classes = [
    styles.frame,
    tool === 'erase' ? styles.erasing : null,
    tool === 'move' ? styles.moving : null,
    tool === 'stereo' ? styles.stereo : null,
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
      aria-label="Tela de desenho da molécula"
    >
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

      {hint !== null && (
        <div className={styles.hint}>
          <p className={styles.hintText}>{hint}</p>
        </div>
      )}

      {menu !== null && entries.length > 0 && (
        <ContextMenu x={menu.x} y={menu.y} entries={entries} onClose={closeMenu} />
      )}
    </div>
  );
}
