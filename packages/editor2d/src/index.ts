/**
 * `@rotamer/editor2d` — a tela de desenho.
 *
 * **Ninguém depende deste pacote.** A interface de desenho é substituível sem
 * tocar em nada abaixo dela: ele mexe no grafo, e o grafo é que atravessa para
 * o núcleo. Nenhuma pergunta química é respondida aqui.
 */
export { Editor2D, type Editor2DProps } from './Editor2D';
export { Toolbar, type ToolbarProps } from './Toolbar';
export {
  createEditorStore,
  clampScale,
  DEFAULT_SCALE,
  MAX_HISTORY,
  MAX_SCALE,
  MIN_SCALE,
  type EditorState,
  type EditorStore,
} from './store';
export {
  atomAt,
  bondAt,
  frameGraph,
  hoverAt,
  selectInRegion,
  snapFromAtom,
  type Insets,
  type Rect,
  type RegionSelection,
  suggestDirection,
  toGraph,
  toScreen,
} from './geometry2d';
export { readPalette, colorOf, type EditorPalette } from './palette';
export { atomLabel, draw, type Scene } from './render';
export { insertRing, ringLabel, RING_KINDS, type RingKind } from './templates';
export { PeriodicTable, type PeriodicTableProps } from './PeriodicTable';
export { Shortcuts, type ShortcutsProps } from './Shortcuts';
export { Popover, type PopoverProps } from './Popover';
export { ContextMenu, type ContextMenuProps, type MenuEntry } from './ContextMenu';
export { COMMON_ELEMENTS, PERIODIC_TABLE, type TableEntry } from './elements-table';
export type { Camera, Drag, Hover, Point, Selection, Tool, Viewport } from './types';
