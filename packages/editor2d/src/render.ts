import type { GraphAtom, MoleculeGraph } from '@rotamer/core';
import { toScreen } from './geometry2d';
import { colorOf, type EditorPalette } from './palette';
import type { Camera, Drag, Hover, Point, Viewport } from './types';

/**
 * O desenho da fórmula estrutural.
 *
 * Convenção de bastão, como químico desenha: carbono não escreve símbolo, o
 * vértice já diz que ele está ali. Só aparece escrito o que precisa ser lido —
 * heteroátomo, carga, e carbono solto que sem rótulo seria um ponto no vazio.
 */

export interface Scene {
  readonly graph: MoleculeGraph;
  readonly camera: Camera;
  readonly viewport: Viewport;
  readonly hover: Hover;
  readonly drag: Drag;
  readonly palette: EditorPalette;
  /** Elemento que será usado no próximo átomo — pinta o fantasma do arrasto. */
  readonly element: string;
  readonly erasing: boolean;
}

/** Espessura do traço da ligação, em pixels, na escala padrão. */
const STROKE = 1.9;

/** Separação entre as linhas de uma ligação dupla, em ångström. */
const DOUBLE_GAP = 0.16;

export function draw(context: CanvasRenderingContext2D, scene: Scene): void {
  const { viewport, palette } = scene;

  context.clearRect(0, 0, viewport.width, viewport.height);
  context.lineCap = 'round';
  context.lineJoin = 'round';

  drawBonds(context, scene);
  drawDragPreview(context, scene);
  drawAtoms(context, scene);

  void palette;
}

function drawBonds(context: CanvasRenderingContext2D, scene: Scene): void {
  const { graph, camera, viewport, palette, hover, erasing } = scene;

  for (const bond of graph.bonds) {
    const from = graph.atoms.find((atom) => atom.id === bond.from);
    const to = graph.atoms.find((atom) => atom.id === bond.to);
    if (!from || !to) continue;

    const start = trimmed(from, to, graph, camera, viewport);
    const end = trimmed(to, from, graph, camera, viewport);

    const highlighted = hover?.kind === 'bond' && hover.id === bond.id;
    context.strokeStyle = highlighted
      ? erasing
        ? palette.danger
        : palette.brand
      : palette.ink;
    context.lineWidth = STROKE * (highlighted ? 1.6 : 1);

    const gap = DOUBLE_GAP * camera.scale;

    if (bond.order === 1) {
      line(context, start, end);
    } else if (bond.order === 2) {
      const offset = perpendicular(start, end, gap / 2);
      line(context, shift(start, offset), shift(end, offset));
      line(context, shift(start, negate(offset)), shift(end, negate(offset)));
    } else {
      const offset = perpendicular(start, end, gap);
      line(context, start, end);
      line(context, shift(start, offset), shift(end, offset));
      line(context, shift(start, negate(offset)), shift(end, negate(offset)));
    }
  }
}

function drawAtoms(context: CanvasRenderingContext2D, scene: Scene): void {
  const { graph, camera, viewport, palette, hover, erasing } = scene;

  const size = Math.max(11, camera.scale * 0.62);
  context.font = `500 ${String(size)}px ${palette.font}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  for (const atom of graph.atoms) {
    const center = toScreen(atom, camera, viewport);
    const highlighted = hover?.kind === 'atom' && hover.id === atom.id;

    if (highlighted) {
      context.beginPath();
      context.arc(center.x, center.y, size * 0.85, 0, Math.PI * 2);
      context.fillStyle = erasing ? palette.danger : palette.brand;
      context.globalAlpha = 0.18;
      context.fill();
      context.globalAlpha = 1;
    }

    if (!shouldLabel(atom, graph)) continue;

    // O rótulo se apoia num disco da cor da superfície: é o que abre espaço na
    // ligação sem apagar o traço com um retângulo.
    context.beginPath();
    context.arc(center.x, center.y, size * 0.62, 0, Math.PI * 2);
    context.fillStyle = palette.surface;
    context.fill();

    context.fillStyle = colorOf(palette, atom.element);
    context.fillText(atom.element, center.x, center.y);

    if (atom.charge !== 0) {
      const superscript = Math.max(9, size * 0.62);
      context.font = `600 ${String(superscript)}px ${palette.font}`;
      context.fillStyle = palette.inkSoft;
      context.fillText(chargeLabel(atom.charge), center.x + size * 0.7, center.y - size * 0.5);
      context.font = `500 ${String(size)}px ${palette.font}`;
    }
  }
}

function drawDragPreview(context: CanvasRenderingContext2D, scene: Scene): void {
  const { drag, graph, camera, viewport, palette, element } = scene;
  if (drag.kind !== 'bond') return;

  const from = graph.atoms.find((atom) => atom.id === drag.from);
  if (!from) return;

  const start = toScreen(from, camera, viewport);
  const end = toScreen(drag.to, camera, viewport);

  context.save();
  context.setLineDash([4, 4]);
  context.strokeStyle = palette.brand;
  context.lineWidth = STROKE;
  line(context, start, end);
  context.restore();

  const size = Math.max(11, camera.scale * 0.62);
  context.beginPath();
  context.arc(end.x, end.y, size * 0.62, 0, Math.PI * 2);
  context.fillStyle = palette.surface;
  context.fill();
  context.strokeStyle = palette.brand;
  context.lineWidth = 1;
  context.stroke();

  if (element !== 'C') {
    context.fillStyle = colorOf(palette, element);
    context.fillText(element, end.x, end.y);
  }
}

/**
 * Encurta a ponta da ligação quando o átomo tem rótulo, para o traço não
 * atravessar a letra.
 */
function trimmed(
  atom: GraphAtom,
  other: GraphAtom,
  graph: MoleculeGraph,
  camera: Camera,
  viewport: Viewport,
): Point {
  const point = toScreen(atom, camera, viewport);
  if (!shouldLabel(atom, graph)) return point;

  const target = toScreen(other, camera, viewport);
  const dx = target.x - point.x;
  const dy = target.y - point.y;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) return point;

  const trim = Math.max(9, camera.scale * 0.5);
  return { x: point.x + (dx / length) * trim, y: point.y + (dy / length) * trim };
}

/**
 * Carbono no meio da cadeia não escreve nada: o vértice já é o átomo. Carbono
 * sozinho escreve, senão o desenho fica vazio; heteroátomo sempre escreve.
 */
function shouldLabel(atom: GraphAtom, graph: MoleculeGraph): boolean {
  if (atom.element !== 'C') return true;
  if (atom.charge !== 0) return true;

  return !graph.bonds.some((bond) => bond.from === atom.id || bond.to === atom.id);
}

function chargeLabel(charge: number): string {
  const sign = charge > 0 ? '+' : '−';
  const size = Math.abs(charge);
  return size === 1 ? sign : `${String(size)}${sign}`;
}

function line(context: CanvasRenderingContext2D, start: Point, end: Point): void {
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
}

function perpendicular(start: Point, end: Point, size: number): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) return { x: 0, y: 0 };

  return { x: (-dy / length) * size, y: (dx / length) * size };
}

function shift(point: Point, offset: Point): Point {
  return { x: point.x + offset.x, y: point.y + offset.y };
}

function negate(point: Point): Point {
  return { x: -point.x, y: -point.y };
}
