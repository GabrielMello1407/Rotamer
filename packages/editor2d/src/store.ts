import {
  addAtom,
  addBond,
  bondBetween,
  connectedFragment,
  connectedFragmentFromBond,
  cycleBondOrder,
  cycleBondWedge,
  flipBond,
  emptyGraph,
  findAtom,
  moveAtom,
  removeAtom,
  removeBond,
  setBondOrder,
  setBondWedge,
  setCharge as setAtomCharge,
  setElement,
  type AtomId,
  type BondId,
  type BondOrder,
  type BondWedge,
  type MoleculeGraph,
} from '@rotamer/core';
import { createStore } from 'zustand/vanilla';
import { frameGraph, type Insets } from './geometry2d';
import { insertRing, type RingKind } from './templates';
import type { Camera, Drag, Hover, Point, Selection, Tool, Viewport } from './types';

export type { Camera, Drag, Hover, Point, Selection, Tool, Viewport } from './types';

/** Nenhum átomo e nenhuma ligação pegos — o estado de repouso da seleção. */
function emptySelection(): Selection {
  return { atoms: new Set<AtomId>(), bonds: new Set<BondId>() };
}

/**
 * A seleção depois que o grafo mudou: só sobrevive quem ainda existe.
 *
 * Isto só é seguro quando o identificador continua significando o mesmo átomo
 * — o caso de `amend` (arrasto quadro a quadro) e do `commit` com
 * `keepSelection`, que só embrulham `setElement`/`setBondOrder`/`moveAtom`, e
 * esses nunca trocam identificador de ninguém. **Não** é seguro depois de
 * `fromMolblock`: organizar o desenho e carregar um exemplo passam por ali, e
 * o molblock renumera os átomos a partir de 1 — um número velho passaria a
 * apontar para um átomo *diferente* no grafo novo, silenciosamente. Por isso
 * esses dois caminhos usam o `commit` **sem** `keepSelection`, que não chama
 * esta função — zera a seleção inteira, o lado seguro.
 */
function pruneSelection(selection: Selection, graph: MoleculeGraph): Selection {
  const atomIds = new Set(graph.atoms.map((atom) => atom.id));
  const bondIds = new Set(graph.bonds.map((bond) => bond.id));

  const atoms = new Set<AtomId>();
  for (const id of selection.atoms) {
    if (atomIds.has(id)) atoms.add(id);
  }

  const bonds = new Set<BondId>();
  for (const id of selection.bonds) {
    if (bondIds.has(id)) bonds.add(id);
  }

  // Nada mudou: devolve a mesma referência, para não disparar re-render à toa
  // a cada quadro de um arrasto que não tirou ninguém da seleção.
  if (atoms.size === selection.atoms.size && bonds.size === selection.bonds.size) {
    return selection;
  }

  return { atoms, bonds };
}

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
/**
 * Pixels por ångström no começo.
 *
 * Uma ligação de 1,5 Å sai com 63 px — do tamanho em que se desenha estrutura
 * no quadro e em livro. Com o dobro disso a molécula não cabe; com a metade,
 * o benzeno fica do tamanho de uma moeda no meio de uma tela vazia.
 */
export const DEFAULT_SCALE = 42;

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
  /**
   * A configuração de cada centro — `R`, `S` ou `?` —, atribuída pelo RDKit.
   *
   * Chega junto com a análise e some a cada mudança do grafo: letra velha em
   * desenho novo é pior que letra nenhuma.
   */
  stereo: ReadonlyMap<AtomId, string>;
  /** `E` ou `Z` de cada dupla com geometria definida, pelo identificador dela. */
  stereoBonds: ReadonlyMap<BondId, string>;
  camera: Camera;
  /** Tamanho da área de desenho, informado pelo componente do canvas. */
  viewport: Viewport;
  /** Bordas da tela cobertas por painel, barra ou pela cena 3D. */
  insets: Insets;
  /**
   * O que está pego para mover, apagar ou trocar em bloco.
   *
   * É estado de interface, como `hover` e `camera`: nunca persistida, nunca
   * escrita no molblock. `commit` limpa por padrão, `amend` poda, e desfazer,
   * refazer e limpar zeram — o grafo que reaparece na tela não é mais aquele
   * em que a pessoa selecionou.
   */
  selection: Selection;

  setTool: (tool: Tool) => void;
  setElement: (element: string) => void;
  setHover: (hover: Hover) => void;
  setDrag: (drag: Drag) => void;
  setCamera: (camera: Camera) => void;
  setHydrogens: (hydrogens: ReadonlyMap<AtomId, number>) => void;
  setFocus: (focus: AtomId | null) => void;
  setFlagged: (flagged: AtomId | null) => void;
  setStereo: (
    stereo: ReadonlyMap<AtomId, string>,
    bonds: ReadonlyMap<BondId, string>,
  ) => void;
  setViewport: (viewport: Viewport) => void;
  setInsets: (insets: Insets) => void;
  /** Enquadra a molécula inteira com folga. */
  frame: () => void;

  /**
   * Troca o grafo guardando o anterior no histórico.
   *
   * Limpa a seleção por padrão — número velho num desenho novo é pior que
   * número nenhum, e esquecer de pedir `keepSelection` cai no lado seguro,
   * nunca no errado. Só pede `keepSelection: true` quem vai deixar a pessoa
   * ver o que acabou de mudar: trocar elemento em bloco e trocar ordem em
   * bloco.
   */
  commit: (graph: MoleculeGraph, options?: { readonly keepSelection?: boolean }) => void;
  /**
   * Troca o grafo **sem** marcar histórico — para quadros de um arrasto.
   *
   * Sempre poda a seleção contra o grafo novo: é o que sustenta o arrasto de
   * um bloco quadro a quadro sem a seleção sumir e sem ela sobreviver a um
   * átomo que deixou de existir.
   */
  amend: (graph: MoleculeGraph) => void;
  /** Fecha um arrasto: o caminho inteiro vira um passo só de desfazer. */
  closeUndoStep: (before: MoleculeGraph) => void;

  undo: () => void;
  redo: () => void;
  clear: () => void;

  /** Troca a seleção inteira — o clique simples (substitui) e o retângulo. */
  setSelection: (selection: Selection) => void;
  /** Soma um átomo à seleção, sem mexer no resto. */
  addAtomToSelection: (id: AtomId) => void;
  /** Tira um átomo da seleção, sem mexer no resto. */
  removeAtomFromSelection: (id: AtomId) => void;
  /** Alterna um átomo dentro ou fora da seleção — o Shift+clique. */
  toggleAtomSelection: (id: AtomId) => void;
  /** Esvazia a seleção — Esc, clique no vazio, "Soltar a seleção". */
  clearSelection: () => void;
  /** Todo átomo e toda ligação do grafo — Ctrl+A. */
  selectAll: () => void;
  /** O fragmento inteiro ligado a este átomo — o duplo clique. */
  selectFragmentFromAtom: (id: AtomId) => void;
  /** O fragmento inteiro ligado a esta ligação — o duplo clique no traço. */
  selectFragmentFromBond: (id: BondId) => void;

  /**
   * Move todo o bloco selecionado, a partir de um deslocamento total desde o
   * começo do arrasto — não quadro a quadro, para não acumular erro de ponto
   * flutuante num arrasto longo. `base` é o grafo de quando o arrasto
   * começou (o `before` do `Drag` de kind `'selection'`).
   */
  moveSelectionBy: (base: MoleculeGraph, delta: Point) => void;
  /** Apaga tudo o que está selecionado num só passo de desfazer. */
  eraseSelection: () => void;
  /** Troca o elemento de todo átomo selecionado, um passo de desfazer só. */
  changeSelectionElement: (element: string) => void;
  /** Troca a ordem de toda ligação selecionada, um passo de desfazer só. */
  setSelectionOrder: (order: BondOrder) => void;

  addAtomAt: (point: Point) => AtomId;
  /** Põe um anel pronto no centro da vista. */
  addRing: (kind: RingKind) => void;
  bondTo: (from: AtomId, to: AtomId) => void;
  bondToNewAtom: (from: AtomId, point: Point) => AtomId;
  eraseAtom: (id: AtomId) => void;
  eraseBond: (id: BondId) => void;
  cycleBond: (id: BondId) => void;
  /** Plano → cunha cheia → tracejada → plano. */
  cycleWedge: (id: BondId) => void;
  /** Troca a ponta fina de lado, o que troca a configuração do centro. */
  flipWedge: (id: BondId) => void;
  changeElement: (id: AtomId, element: string) => void;
  /** A ordem escolhida de uma vez, sem passar pelas do meio. */
  setOrder: (id: BondId, order: BondOrder) => void;
  /** A estereoquímica escolhida de uma vez. */
  setWedge: (id: BondId, wedge: BondWedge) => void;
  /** A carga formal do átomo, para íon e para par que faltou. */
  setCharge: (id: AtomId, charge: number) => void;
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
    stereo: new Map<AtomId, string>(),
    stereoBonds: new Map<BondId, string>(),
    camera: { x: 0, y: 0, scale: DEFAULT_SCALE },
    viewport: { width: 0, height: 0 },
    insets: { left: 0, right: 0, top: 0, bottom: 0 },
    selection: emptySelection(),

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
    setStereo: (stereo, stereoBonds) => {
      set({ stereo, stereoBonds });
    },
    frame: () => {
      const { graph, viewport, camera, insets, setCamera } = get();
      if (viewport.width === 0 || viewport.height === 0) return;
      setCamera(frameGraph(graph, viewport, camera.scale, insets));
    },

    commit: (graph, options) => {
      const { graph: previous, past, selection } = get();
      if (graph === previous) return;

      set({
        graph,
        past: [...past.slice(-(MAX_HISTORY - 1)), previous],
        future: [],
        hydrogens: new Map<AtomId, number>(),
        stereo: new Map<AtomId, string>(),
        stereoBonds: new Map<BondId, string>(),
        flagged: null,
        selection: options?.keepSelection === true ? pruneSelection(selection, graph) : emptySelection(),
      });
    },

    amend: (graph) => {
      const { selection } = get();

      set({
        graph,
        hydrogens: new Map<AtomId, number>(),
        stereo: new Map<AtomId, string>(),
        stereoBonds: new Map<BondId, string>(),
        flagged: null,
        selection: pruneSelection(selection, graph),
      });
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

      // O grafo que reaparece não é aquele em que a pessoa selecionou — a
      // seleção zera, não se poda: podar preservaria por coincidência os
      // identificadores que sobrevivem ao vaivém, escondendo o mesmo defeito
      // do identificador renumerado.
      set({
        graph: previous,
        past: past.slice(0, -1),
        future: [graph, ...future].slice(0, MAX_HISTORY),
        selection: emptySelection(),
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
        selection: emptySelection(),
      });
    },

    clear: () => {
      get().commit(emptyGraph());
    },

    setSelection: (selection) => {
      set({ selection });
    },

    addAtomToSelection: (id) => {
      const { graph, selection } = get();
      if (!findAtom(graph, id) || selection.atoms.has(id)) return;

      set({ selection: { atoms: new Set(selection.atoms).add(id), bonds: selection.bonds } });
    },

    removeAtomFromSelection: (id) => {
      const { selection } = get();
      if (!selection.atoms.has(id)) return;

      const atoms = new Set(selection.atoms);
      atoms.delete(id);
      set({ selection: { atoms, bonds: selection.bonds } });
    },

    toggleAtomSelection: (id) => {
      const { selection, addAtomToSelection, removeAtomFromSelection } = get();
      if (selection.atoms.has(id)) removeAtomFromSelection(id);
      else addAtomToSelection(id);
    },

    clearSelection: () => {
      const { selection } = get();
      if (selection.atoms.size === 0 && selection.bonds.size === 0) return;

      set({ selection: emptySelection() });
    },

    selectAll: () => {
      const { graph } = get();
      set({
        selection: {
          atoms: new Set(graph.atoms.map((atom) => atom.id)),
          bonds: new Set(graph.bonds.map((bond) => bond.id)),
        },
      });
    },

    selectFragmentFromAtom: (id) => {
      const { graph } = get();
      set({ selection: connectedFragment(graph, id) });
    },

    selectFragmentFromBond: (id) => {
      const { graph } = get();
      set({ selection: connectedFragmentFromBond(graph, id) });
    },

    moveSelectionBy: (base, delta) => {
      const { selection, amend } = get();
      if (selection.atoms.size === 0 && selection.bonds.size === 0) return;

      /*
       * Ligação selecionada anda com as duas pontas.
       *
       * Clicar numa ligação seleciona a ligação, e só ela — se o arrasto
       * olhasse apenas os átomos marcados, pegar uma ligação e puxar não faria
       * nada, enquanto a tela promete "arraste de dentro para mover". Uma
       * ligação sem os átomos dela também não é uma coisa que se possa mover:
       * o traço é o desenho de um vínculo entre dois pontos.
       */
      const moving = new Set(selection.atoms);
      for (const bond of base.bonds) {
        if (!selection.bonds.has(bond.id)) continue;

        moving.add(bond.from);
        moving.add(bond.to);
      }

      const moved: MoleculeGraph = {
        atoms: base.atoms.map((atom) =>
          moving.has(atom.id) ? { ...atom, x: atom.x + delta.x, y: atom.y + delta.y } : atom,
        ),
        bonds: base.bonds,
        nextId: base.nextId,
      };

      amend(moved);
    },

    eraseSelection: () => {
      const { graph, selection, commit } = get();
      if (selection.atoms.size === 0 && selection.bonds.size === 0) return;

      // Um passo só de desfazer: a mutação anda em memória, e o `commit`
      // acontece uma única vez no fim. Apagar um átomo já leva as ligações
      // dele junto (`removeAtom`), então uma ligação selecionada que também
      // tinha as duas pontas selecionadas não é apagada duas vezes — só some.
      let next = graph;
      for (const bondId of selection.bonds) {
        next = removeBond(next, bondId);
      }
      for (const atomId of selection.atoms) {
        next = removeAtom(next, atomId);
      }

      commit(next);
    },

    changeSelectionElement: (element) => {
      const { graph, selection, commit } = get();
      if (selection.atoms.size === 0) return;

      let next = graph;
      for (const atomId of selection.atoms) {
        next = setElement(next, atomId, element);
      }

      commit(next, { keepSelection: true });
    },

    setSelectionOrder: (order) => {
      const { graph, selection, commit } = get();
      if (selection.bonds.size === 0) return;

      let next = graph;
      for (const bondId of selection.bonds) {
        next = setBondOrder(next, bondId, order);
      }

      commit(next, { keepSelection: true });
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

    cycleWedge: (id) => {
      const { graph, commit } = get();
      commit(cycleBondWedge(graph, id));
    },

    flipWedge: (id) => {
      const { graph, commit } = get();
      commit(flipBond(graph, id));
    },

    setOrder: (id, order) => {
      const { graph, commit } = get();
      commit(setBondOrder(graph, id, order));
    },

    setWedge: (id, wedge) => {
      const { graph, commit } = get();
      commit(setBondWedge(graph, id, wedge));
    },

    setCharge: (id, charge) => {
      const { graph, commit } = get();
      const atom = findAtom(graph, id);
      if (!atom || atom.charge === charge) return;
      commit(setAtomCharge(graph, id, charge));
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
