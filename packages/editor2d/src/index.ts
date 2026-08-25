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
  snapFromAtom,
  suggestDirection,
  toGraph,
  toScreen,
} from './geometry2d';
export { readPalette, colorOf, type EditorPalette } from './palette';
export { insertRing, ringLabel, RING_KINDS, type RingKind } from './templates';
export type { Camera, Drag, Hover, Point, Tool, Viewport } from './types';
