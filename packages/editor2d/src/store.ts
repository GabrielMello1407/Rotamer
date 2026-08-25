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
import { frameGraph } from './geometry2d';
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
  camera: Camera;
  /** Tamanho da área de desenho, informado pelo componente do canvas. */
  viewport: Viewport;

  setTool: (tool: Tool) => void;
  setElement: (element: string) => void;
  setHover: (hover: Hover) => void;
  setDrag: (drag: Drag) => void;
  setCamera: (camera: Camera) => void;
  setViewport: (viewport: Viewport) => void;
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
    camera: { x: 0, y: 0, scale: DEFAULT_SCALE },
    viewport: { width: 0, height: 0 },

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
    frame: () => {
      const { graph, viewport, camera, setCamera } = get();
      if (viewport.width === 0 || viewport.height === 0) return;
      setCamera(frameGraph(graph, viewport, camera.scale));
    },

    commit: (graph) => {
      const { graph: previous, past } = get();
      if (graph === previous) return;

      set({
        graph,
        past: [...past.slice(-(MAX_HISTORY - 1)), previous],
        future: [],
      });
    },

    amend: (graph) => {
      set({ graph });
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
