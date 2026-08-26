import {
  addAtom,
  addBond,
  bondBetween,
  cycleBondOrder,
  emptyGraph,
  findAtom,
  moveAtom,
  removeAtom,
  removeBond,
  setElement,
  type AtomId,
  type BondId,
  type MoleculeGraph,
} from '@rotamer/core';
import { createStore } from 'zustand/vanilla';
import { frameGraph, type Insets } from './geometry2d';
import { insertRing, type RingKind } from './templates';
import type { Camera, Drag, Hover, Point, Tool, Viewport } from './types';

export type { Camera, Drag, Hover, Point, Tool, Viewport } from './types';

/**
 * O estado do editor.
 *
 * O grafo é a fonte de verdade; tudo o mais aqui é interface — ferramenta ativa,
 * o que está sob o cursor, para onde a câmera aponta. Desfazer é uma pilha de
 * grafos inteiros: como as operações do núcleo são puras, guardar o estado
 * anterior custa quase nada e não existe comando para "desfazer errado".
 */

export const MAX_HISTORY = 100;

export const MIN_SCALE = 8;
export const MAX_SCALE = 120;
export const DEFAULT_SCALE = 26;

export interface EditorState {
  graph: MoleculeGraph;
  past: MoleculeGraph[];
  future: MoleculeGraph[];
  tool: Tool;
  /** Elemento que o próximo átomo vai receber. */
  element: string;
  hover: Hover;
  drag: Drag;
  /**
   * Hidrogênios de cada átomo, contados pelo RDKit.
   *
   * Chega depois do traço, junto com a análise, e é o que faz o desenho
   * escrever `OH` em vez de `O`. Some a cada mudança do grafo: número velho num
   * desenho novo é pior que número nenhum.
   */
  hydrogens: ReadonlyMap<AtomId, number>;
  /**
   * O átomo aceso agora, venha o cursor de onde vier.
   *
   * As duas telas mostram a mesma molécula: apontar uma esfera no espaço tem
   * que acender o vértice do desenho, e apontar o vértice tem que acender a
   * esfera. Sem isso, quem olha para a forma 3D não sabe qual traço ela é.
   */
  focus: AtomId | null;
  /** O átomo que o RDKit apontou como culpado do erro, para marcar na tela. */
  flagged: AtomId | null;
  camera: Camera;
  /** Tamanho da área de desenho, informado pelo componente do canvas. */
  viewport: Viewport;
  /** Bordas da tela cobertas por painel, barra ou pela cena 3D. */
  insets: Insets;

  setTool: (tool: Tool) => void;
  setElement: (element: string) => void;
  setHover: (hover: Hover) => void;
  setDrag: (drag: Drag) => void;
  setCamera: (camera: Camera) => void;
  setHydrogens: (hydrogens: ReadonlyMap<AtomId, number>) => void;
  setFocus: (focus: AtomId | null) => void;
  setFlagged: (flagged: AtomId | null) => void;
  setViewport: (viewport: Viewport) => void;
  setInsets: (insets: Insets) => void;
  /** Enquadra a molécula inteira com folga. */
  frame: () => void;

  /** Troca o grafo guardando o anterior no histórico. */
  commit: (graph: MoleculeGraph) => void;
  /** Troca o grafo **sem** marcar histórico — para quadros de um arrasto. */
  amend: (graph: MoleculeGraph) => void;
  /** Fecha um arrasto: o caminho inteiro vira um passo só de desfazer. */
  closeUndoStep: (before: MoleculeGraph) => void;

  undo: () => void;
  redo: () => void;
  clear: () => void;

  addAtomAt: (point: Point) => AtomId;
  /** Põe um anel pronto no centro da vista. */
  addRing: (kind: RingKind) => void;
  bondTo: (from: AtomId, to: AtomId) => void;
  bondToNewAtom: (from: AtomId, point: Point) => AtomId;
  eraseAtom: (id: AtomId) => void;
  eraseBond: (id: BondId) => void;
  cycleBond: (id: BondId) => void;
  changeElement: (id: AtomId, element: string) => void;
  dragAtomTo: (id: AtomId, point: Point) => void;
}

export type EditorStore = ReturnType<typeof createEditorStore>;

export function createEditorStore(initial: MoleculeGraph = emptyGraph()) {
  return createStore<EditorState>()((set, get) => ({
    graph: initial,
    past: [],
    future: [],
    tool: 'structure',
    element: 'C',
    hover: null,
    drag: { kind: 'none' },
    hydrogens: new Map<AtomId, number>(),
    focus: null,
    flagged: null,
    camera: { x: 0, y: 0, scale: DEFAULT_SCALE },
    viewport: { width: 0, height: 0 },
    insets: { left: 0, right: 0, top: 0, bottom: 0 },

    setTool: (tool) => {
      set({ tool });
    },
    setElement: (element) => {
      set({ element });
    },
    setHover: (hover) => {
      set({ hover });
    },
    setDrag: (drag) => {
      set({ drag });
    },
    setCamera: (camera) => {
      set({ camera: { ...camera, scale: clampScale(camera.scale) } });
    },
    setViewport: (viewport) => {
      set({ viewport });
    },
    setInsets: (insets) => {
      set({ insets });
    },
    setHydrogens: (hydrogens) => {
      set({ hydrogens });
    },
    setFocus: (focus) => {
      if (get().focus !== focus) set({ focus });
    },
    setFlagged: (flagged) => {
      if (get().flagged !== flagged) set({ flagged });
    },
    frame: () => {
      const { graph, viewport, camera, insets, setCamera } = get();
      if (viewport.width === 0 || viewport.height === 0) return;
      setCamera(frameGraph(graph, viewport, camera.scale, insets));
    },

    commit: (graph) => {
      const { graph: previous, past } = get();
      if (graph === previous) return;

      set({
        graph,
        past: [...past.slice(-(MAX_HISTORY - 1)), previous],
        future: [],
        hydrogens: new Map<AtomId, number>(),
        flagged: null,
      });
    },

    amend: (graph) => {
      set({ graph, hydrogens: new Map<AtomId, number>(), flagged: null });
    },

    closeUndoStep: (before) => {
      const { graph, past } = get();
      if (graph === before) return;

      set({ past: [...past.slice(-(MAX_HISTORY - 1)), before], future: [] });
    },

    undo: () => {
      const { past, future, graph } = get();
      const previous = past[past.length - 1];
      if (previous === undefined) return;

      set({
        graph: previous,
        past: past.slice(0, -1),
        future: [graph, ...future].slice(0, MAX_HISTORY),
      });
    },

    redo: () => {
      const { past, future, graph } = get();
      const next = future[0];
      if (next === undefined) return;

      set({
        graph: next,
        past: [...past, graph].slice(-MAX_HISTORY),
        future: future.slice(1),
      });
    },

    clear: () => {
      get().commit(emptyGraph());
    },

    addRing: (kind) => {
      const { graph, camera, commit, frame } = get();
      commit(insertRing(graph, kind, { x: camera.x, y: camera.y }).graph);
      frame();
    },

    addAtomAt: (point) => {
      const { graph, element, commit } = get();
      const created = addAtom(graph, { element, x: point.x, y: point.y });
      commit(created.graph);
      return created.atomId;
    },

    bondTo: (from, to) => {
      const { graph, commit } = get();
      if (bondBetween(graph, from, to)) return;
      commit(addBond(graph, from, to).graph);
    },

    bondToNewAtom: (from, point) => {
      const { graph, element, commit } = get();
      const created = addAtom(graph, { element, x: point.x, y: point.y });
      commit(addBond(created.graph, from, created.atomId).graph);
      return created.atomId;
    },

    eraseAtom: (id) => {
      const { graph, commit } = get();
      if (!findAtom(graph, id)) return;
      commit(removeAtom(graph, id));
    },

    eraseBond: (id) => {
      const { graph, commit } = get();
      commit(removeBond(graph, id));
    },

    cycleBond: (id) => {
      const { graph, commit } = get();
      commit(cycleBondOrder(graph, id));
    },

    changeElement: (id, element) => {
      const { graph, commit } = get();
      const atom = findAtom(graph, id);
      if (!atom || atom.element === element) return;
      commit(setElement(graph, id, element));
    },

    dragAtomTo: (id, point) => {
      const { graph, amend } = get();
      amend(moveAtom(graph, id, point.x, point.y));
    },
  }));
}

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}
