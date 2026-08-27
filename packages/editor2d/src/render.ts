import type { AtomId, BondId, GraphAtom, MoleculeGraph } from '@rotamer/core';
import { toScreen } from './geometry2d';
import { colorOf, type EditorPalette } from './palette';
import type { Camera, Drag, Hover, Point, Selection, Viewport } from './types';

/**
 * O desenho da fórmula estrutural.
 *
 * Convenção de bastão, como químico desenha: carbono não escreve símbolo. Mas
 * bastão sem vértice visível vira um rabisco — quem está aprendendo precisa ver
 * que ali existe um átomo. Por isso cada carbono sem rótulo ganha um ponto
 * discreto, na cor CPK dele: continua sendo bastão, e continua sendo legível.
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
  /** Hidrogênios por átomo, contados pelo RDKit. Vazio até a análise chegar. */
  readonly hydrogens: ReadonlyMap<AtomId, number>;
  /** O átomo aceso pela outra tela — a esfera 3D sob o cursor. */
  readonly focus: AtomId | null;
  /** O átomo que o RDKit culpou pelo erro. Ganha o círculo tracejado. */
  readonly flagged: AtomId | null;
  /**
   * A configuração de cada centro, atribuída pelo RDKit: `R`, `S` ou `?`.
   *
   * O ponto de interrogação é resposta, não ausência dela: existe um centro ali
   * e o desenho não disse de que lado. É o que aponta onde falta a cunha.
   */
  readonly stereo: ReadonlyMap<AtomId, string>;
  /** `E` ou `Z` de cada dupla com geometria definida. */
  readonly stereoBonds: ReadonlyMap<BondId, string>;
  /** O que está pego pela ferramenta Selecionar — o desenho só lê, não calcula. */
  readonly selection: Selection;
}

/**
 * Espessura do traço em função do zoom.
 *
 * Fina de propósito: a ligação é o que liga, o átomo é o que existe. Traço
 * grosso demais engole o vértice e a fórmula vira um emaranhado preto.
 */
function strokeWidth(camera: Camera): number {
  return Math.min(2.8, Math.max(1.3, camera.scale * 0.05));
}

/** Separação entre as linhas de uma ligação múltipla, em ångström. */
const MULTIPLE_GAP = 0.17;

/** Quanto a linha de dentro encolhe em cada ponta, como manda o desenho clássico. */
const INNER_TRIM = 0.16;

export function draw(context: CanvasRenderingContext2D, scene: Scene): void {
  const { viewport } = scene;

  context.clearRect(0, 0, viewport.width, viewport.height);
  context.lineCap = 'round';
  context.lineJoin = 'round';

  drawSelection(context, scene);
  drawBonds(context, scene);
  drawDragPreview(context, scene);
  drawAtoms(context, scene);
  drawBondStereo(context, scene);
  drawMarquee(context, scene);
}

/** Largura da faixa do marca-texto: cobre a tripla inteira e sobra folga. */
function highlightBand(camera: Camera): number {
  return Math.max(12, camera.scale * 0.48);
}

/** Folga do marca-texto em volta do átomo, em px de tela. */
const HIGHLIGHT_PAD = 4;

/**
 * O que está pego.
 *
 * Marca-texto: preenchimento macio por baixo da tinta, seguindo o esqueleto.
 * Por baixo porque a letra do elemento é CPK e a cunha é preta — recolorir
 * qualquer um dos dois trocaria o significado deles pelo de um estado da
 * interface. E preenchimento largo, não anel: o anel fino já é o cursor.
 */
function drawSelection(context: CanvasRenderingContext2D, scene: Scene): void {
  const { graph, camera, viewport, palette, selection } = scene;
  if (selection.atoms.size === 0 && selection.bonds.size === 0) return;

  const size = Math.max(12, camera.scale * 0.66);

  context.save();
  context.fillStyle = palette.selectWash;
  context.strokeStyle = palette.selectWash;
  context.lineWidth = highlightBand(camera);
  context.lineCap = 'round';

  for (const bond of graph.bonds) {
    if (!selection.bonds.has(bond.id)) continue;

    const from = graph.atoms.find((atom) => atom.id === bond.from);
    const to = graph.atoms.find((atom) => atom.id === bond.to);
    if (!from || !to) continue;

    // De centro a centro, sem encurtar: o disco do rótulo recorta o miolo
    // depois, e a faixa termina encostada na letra como a tinta termina.
    line(context, toScreen(from, camera, viewport), toScreen(to, camera, viewport));
  }

  for (const atom of graph.atoms) {
    if (!selection.atoms.has(atom.id)) continue;

    const center = toScreen(atom, camera, viewport);
    context.beginPath();
    context.arc(center.x, center.y, labelRadius(context, scene, atom, size) + HIGHLIGHT_PAD, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
}

/**
 * O retângulo que pega.
 *
 * Tracejado parado, não formiguinha andando: animar o tracejado é uma
 * repintura por quadro num tablet fraco, e é movimento que
 * `prefers-reduced-motion` teria de desligar. Canto vivo e `rect` simples
 * porque `roundRect` não existe em WebView antiga.
 */
function drawMarquee(context: CanvasRenderingContext2D, scene: Scene): void {
  const { drag, camera, viewport, palette } = scene;
  if (drag.kind !== 'marquee') return;

  const origin = toScreen(drag.origin, camera, viewport);
  const point = toScreen(drag.point, camera, viewport);

  // Meio pixel: em linha de 1 px o traço sai nítido em vez de borrado em dois.
  const left = Math.round(Math.min(origin.x, point.x)) + 0.5;
  const top = Math.round(Math.min(origin.y, point.y)) + 0.5;
  const width = Math.round(Math.abs(point.x - origin.x));
  const height = Math.round(Math.abs(point.y - origin.y));

  context.save();
  context.fillStyle = palette.selectVeil;
  context.fillRect(left, top, width, height);
  context.setLineDash([5, 4]);
  context.strokeStyle = palette.select;
  context.lineWidth = 1;
  context.strokeRect(left, top, width, height);
  context.restore();
}

function drawBonds(context: CanvasRenderingContext2D, scene: Scene): void {
  const { graph, camera, viewport, palette, hover, erasing } = scene;
  const width = strokeWidth(camera);

  for (const bond of graph.bonds) {
    const from = graph.atoms.find((atom) => atom.id === bond.from);
    const to = graph.atoms.find((atom) => atom.id === bond.to);
    if (!from || !to) continue;

    const start = trimmed(from, to, graph, camera, viewport);
    const end = trimmed(to, from, graph, camera, viewport);

    const highlighted = hover?.kind === 'bond' && hover.id === bond.id;
    context.strokeStyle = highlighted ? (erasing ? palette.danger : palette.brand) : palette.ink;
    context.lineWidth = width * (highlighted ? 1.7 : 1);

    const gap = MULTIPLE_GAP * camera.scale;

    if (bond.order === 1) {
      // A cunha sai do plano do papel: cheia vem em direção a quem olha,
      // tracejada vai para trás. A ponta fina fica no átomo estereogênico, que é
      // sempre o `from` — virar a cunha troca a configuração do centro.
      if (bond.wedge === 'up') {
        wedge(context, start, end, gap);
        continue;
      }

      if (bond.wedge === 'down') {
        hashes(context, start, end, gap, width);
        continue;
      }

      line(context, start, end);
      continue;
    }

    if (bond.order === 2) {
      // A segunda linha vai para o lado onde a molécula está, e vem encolhida
      // nas pontas: é assim que a dupla aparece em livro, e é o que faz um anel
      // com duplas parecer um anel com duplas.
      const side = crowdedSide(graph, bond.from, bond.to, camera, viewport);

      if (side === 0) {
        const offset = perpendicular(start, end, gap / 2);
        line(context, shift(start, offset), shift(end, offset));
        line(context, shift(start, negate(offset)), shift(end, negate(offset)));
      } else {
        const offset = perpendicular(start, end, gap * side);
        line(context, start, end);
        line(
          context,
          shift(along(start, end, INNER_TRIM), offset),
          shift(along(end, start, INNER_TRIM), offset),
        );
      }
      continue;
    }

    const offset = perpendicular(start, end, gap);
    line(context, start, end);
    line(context, shift(start, offset), shift(end, offset));
    line(context, shift(start, negate(offset)), shift(end, negate(offset)));
  }
}

/**
 * `E` ou `Z` ao lado da dupla.
 *
 * Fica depois dos átomos porque o rótulo do átomo abre um disco branco por cima
 * do que já foi desenhado — a letra da dupla, escrita antes, sumiria embaixo
 * dele quando a dupla encosta num heteroátomo.
 */
function drawBondStereo(context: CanvasRenderingContext2D, scene: Scene): void {
  const { graph, camera, viewport, palette, stereoBonds } = scene;
  if (stereoBonds.size === 0) return;

  const size = Math.max(10, camera.scale * 0.34);
  context.font = `italic 600 ${String(size)}px ${palette.font}`;
  context.fillStyle = palette.ink;
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  for (const bond of graph.bonds) {
    const label = stereoBonds.get(bond.id);
    if (label === undefined) continue;

    const from = graph.atoms.find((atom) => atom.id === bond.from);
    const to = graph.atoms.find((atom) => atom.id === bond.to);
    if (!from || !to) continue;

    const start = toScreen(from, camera, viewport);
    const end = toScreen(to, camera, viewport);
    const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

    // Encostada na ligação, do lado de fora: dentro ela cairia em cima da
    // segunda linha da dupla.
    const offset = perpendicular(start, end, size * 1.1);
    context.fillText(label, middle.x + offset.x, middle.y + offset.y);
  }
}

/**
 * A letra da configuração, ao lado do centro.
 *
 * Em livro ela aparece em itálico — `(R)`, `(S)` — e aqui aparece sem
 * parênteses, encostada no átomo, porque a tela tem menos espaço que a página e
 * o parêntese não carrega informação nenhuma.
 *
 * Quem atribuiu foi o RDKit, pela regra de Cahn–Ingold–Prelog. O editor só
 * escreve o que ele disse.
 */
function drawStereo(
  context: CanvasRenderingContext2D,
  scene: Scene,
  atom: GraphAtom,
  center: Point,
  size: number,
): void {
  const label = scene.stereo.get(atom.id);
  if (label === undefined) return;

  const font = Math.max(10, size * 0.52);
  context.font = `italic 600 ${String(font)}px ${scene.palette.font}`;
  context.fillStyle = label === '?' ? scene.palette.inkSoft : scene.palette.ink;
  context.textAlign = 'left';
  context.fillText(label, center.x + size * 0.55, center.y - size * 0.5);
  context.textAlign = 'center';
}

/**
 * A cunha cheia: triângulo com a ponta no átomo estereogênico.
 *
 * Ela é preenchida com a mesma tinta do traço — em livro a cunha é sólida, e
 * contorno vazado seria outra convenção, de outra coisa.
 */
function wedge(
  context: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  width: number,
): void {
  const offset = perpendicular(start, end, width * 0.75);

  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x + offset.x, end.y + offset.y);
  context.lineTo(end.x - offset.x, end.y - offset.y);
  context.closePath();

  context.fillStyle = context.strokeStyle;
  context.fill();
}

/**
 * A cunha tracejada: barras perpendiculares que crescem em direção ao fundo.
 *
 * Crescer é o que dá a perspectiva — a barra mais larga é a mais distante de
 * quem olha. Barras de largura igual seriam só um traço pontilhado, que quer
 * dizer outra coisa em química.
 */
function hashes(
  context: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  width: number,
  stroke: number,
): void {
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  const count = Math.max(3, Math.min(8, Math.round(length / 7)));

  context.lineWidth = stroke * 0.9;

  for (let index = 1; index <= count; index += 1) {
    const t = index / count;
    const center = { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
    const offset = perpendicular(start, end, width * 0.75 * t);

    line(context, shift(center, offset), shift(center, negate(offset)));
  }
}

/**
 * O raio do disco que apoia o rótulo — o mesmo número que o marca-texto
 * precisa para não ser apagado por ele.
 *
 * Rótulo largo (`H3C`, `NH2`) tem disco maior que qualquer raio fixo; sem essa
 * mesma medida nos dois lugares, o marca-texto desses átomos sumiria por baixo
 * do próprio rótulo.
 */
function labelRadius(
  context: CanvasRenderingContext2D,
  scene: Scene,
  atom: GraphAtom,
  size: number,
): number {
  if (!shouldLabel(atom, scene.graph)) return Math.max(2.8, scene.camera.scale * 0.1) + 3;

  context.font = `600 ${String(size)}px ${scene.palette.font}`;
  const label = atomLabel(atom, scene.graph, scene.hydrogens.get(atom.id) ?? 0) ?? atom.element;

  return Math.max(size * 0.62, context.measureText(label).width / 2 + size * 0.2);
}

function drawAtoms(context: CanvasRenderingContext2D, scene: Scene): void {
  const { graph, camera, viewport, palette, hover, erasing, hydrogens, focus, flagged } = scene;

  const size = Math.max(12, camera.scale * 0.66);

  // O vértice do carbono é uma bolinha de verdade, não um engrossamento do
  // traço: quem está aprendendo precisa ver que ali existe um átomo, e não uma
  // dobra da linha.
  const dot = Math.max(2.8, camera.scale * 0.1);

  context.textAlign = 'center';
  context.textBaseline = 'middle';

  for (const atom of graph.atoms) {
    const center = toScreen(atom, camera, viewport);
    const highlighted = (hover?.kind === 'atom' && hover.id === atom.id) || focus === atom.id;
    const labelled = shouldLabel(atom, graph);

    // O culpado do erro fica marcado com círculo tracejado, porque a mensagem
    // diz "o átomo de O tem 3 ligações" e sem isso ninguém sabe qual dos O é.
    if (flagged === atom.id) {
      context.save();
      context.setLineDash([4, 4]);
      context.beginPath();
      context.arc(center.x, center.y, size * 0.86, 0, Math.PI * 2);
      context.strokeStyle = palette.danger;
      context.lineWidth = 1.5;
      context.stroke();
      context.restore();
    }

    if (highlighted) {
      context.beginPath();
      context.arc(center.x, center.y, size * 0.72, 0, Math.PI * 2);
      context.fillStyle = erasing ? palette.danger : palette.brand;
      context.globalAlpha = 0.16;
      context.fill();
      context.globalAlpha = 1;
    }

    if (!labelled) {
      // O vértice do carbono: pequeno, mas presente. Sem ele a cadeia vira um
      // zigue-zague sem átomo nenhum para quem está começando.
      context.beginPath();
      context.arc(center.x, center.y, dot, 0, Math.PI * 2);
      context.fillStyle = colorOf(palette, atom.element);
      context.fill();

      drawStereo(context, scene, atom, center, size);

      if (highlighted) {
        context.beginPath();
        context.arc(center.x, center.y, dot + 5, 0, Math.PI * 2);
        context.strokeStyle = erasing ? palette.danger : palette.brand;
        context.lineWidth = 1.5;
        context.stroke();
      }

      continue;
    }

    context.font = `600 ${String(size)}px ${palette.font}`;

    const label = atomLabel(atom, graph, hydrogens.get(atom.id) ?? 0) ?? atom.element;

    const half = labelRadius(context, scene, atom, size);

    // O rótulo se apoia num disco da cor da superfície: é o que abre espaço na
    // ligação sem apagar o traço com um retângulo.
    context.beginPath();
    context.arc(center.x, center.y, half, 0, Math.PI * 2);
    context.fillStyle = palette.surface;
    context.fill();

    context.fillStyle = colorOf(palette, atom.element);
    context.fillText(label, center.x, center.y);

    if (atom.charge !== 0) {
      const superscript = Math.max(10, size * 0.6);
      context.font = `700 ${String(superscript)}px ${palette.font}`;
      context.fillStyle = palette.inkSoft;
      context.fillText(chargeLabel(atom.charge), center.x + half * 0.95, center.y - half * 0.8);
    }

    drawStereo(context, scene, atom, center, size);

    // O anel do destaque vem depois do rótulo — desenhado antes, o disco que
    // abre espaço para a letra apagaria justamente o anel.
    if (highlighted) {
      context.beginPath();
      context.arc(center.x, center.y, half + 2, 0, Math.PI * 2);
      context.strokeStyle = erasing ? palette.danger : palette.brand;
      context.lineWidth = 1.5;
      context.stroke();
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
  const size = Math.max(12, camera.scale * 0.66);

  context.save();
  context.strokeStyle = palette.brand;
  context.lineWidth = strokeWidth(camera);
  context.globalAlpha = 0.85;
  line(context, start, end);
  context.restore();

  // O fantasma do átomo que vai nascer: disco na cor da superfície com contorno
  // da marca, e o símbolo dentro quando não for carbono.
  context.beginPath();
  context.arc(end.x, end.y, size * 0.5, 0, Math.PI * 2);
  context.fillStyle = palette.surface;
  context.fill();
  context.strokeStyle = palette.brand;
  context.lineWidth = 1.5;
  context.stroke();

  context.font = `600 ${String(size * 0.8)}px ${palette.font}`;
  context.fillStyle = colorOf(palette, element);
  context.fillText(element, end.x, end.y);
}

/**
 * Para que lado a segunda linha da dupla deve ir.
 *
 * Devolve `+1`, `-1` ou `0` — zero quando não há vizinho nenhum para decidir, e
 * aí a dupla sai simétrica, como no eteno.
 */
function crowdedSide(
  graph: MoleculeGraph,
  first: number,
  second: number,
  camera: Camera,
  viewport: Viewport,
): number {
  const a = graph.atoms.find((atom) => atom.id === first);
  const b = graph.atoms.find((atom) => atom.id === second);
  if (!a || !b) return 0;

  const start = toScreen(a, camera, viewport);
  const end = toScreen(b, camera, viewport);
  const normal = perpendicular(start, end, 1);
  const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

  let balance = 0;
  for (const bond of graph.bonds) {
    for (const [near, far] of [
      [bond.from, bond.to],
      [bond.to, bond.from],
    ] as const) {
      if (near !== first && near !== second) continue;
      if (far === first || far === second) continue;

      const neighbour = graph.atoms.find((atom) => atom.id === far);
      if (!neighbour) continue;

      const point = toScreen(neighbour, camera, viewport);
      balance += (point.x - middle.x) * normal.x + (point.y - middle.y) * normal.y;
    }
  }

  if (Math.abs(balance) < 1) return 0;
  return balance > 0 ? 1 : -1;
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
  const trim = Math.max(11, camera.scale * 0.52);
  return along(point, target, trim / distance(point, target));
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

/**
 * O que se escreve em cima do átomo, ou `null` quando ele é só um vértice.
 *
 * O hidrogênio entra no rótulo porque sem ele o desenho mente: um oxigênio de
 * ácido escrito como `O` solto tem cara de éter. E ele vai do lado onde não há
 * ligação — `HO—` quando o traço sai pela direita, como se faz em livro.
 */
export function atomLabel(
  atom: GraphAtom,
  graph: MoleculeGraph,
  hydrogens: number,
): string | null {
  if (!shouldLabel(atom, graph)) return null;
  if (hydrogens <= 0) return atom.element;

  const hydrogen = hydrogens === 1 ? 'H' : `H${String(hydrogens)}`;
  return labelSide(atom, graph) === 'left'
    ? `${hydrogen}${atom.element}`
    : `${atom.element}${hydrogen}`;
}

/** De que lado ficam as ligações deste átomo. */
function labelSide(
  atom: GraphAtom,
  graph: MoleculeGraph,
): 'left' | 'right' {
  let balance = 0;

  for (const bond of graph.bonds) {
    const otherId = bond.from === atom.id ? bond.to : bond.to === atom.id ? bond.from : null;
    if (otherId === null) continue;

    const other = graph.atoms.find((candidate) => candidate.id === otherId);
    if (other) balance += other.x - atom.x;
  }

  // Ligação para a direita, hidrogênio para a esquerda.
  return balance > 0 ? 'left' : 'right';
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

function distance(first: Point, second: Point): number {
  return Math.max(1e-6, Math.hypot(first.x - second.x, first.y - second.y));
}

/** Caminha de `start` para `end` uma fração do caminho. */
function along(start: Point, end: Point, fraction: number): Point {
  return {
    x: start.x + (end.x - start.x) * fraction,
    y: start.y + (end.y - start.y) * fraction,
  };
}

function perpendicular(start: Point, end: Point, size: number): Point {
  const length = distance(start, end);
  return { x: (-(end.y - start.y) / length) * size, y: ((end.x - start.x) / length) * size };
}

function shift(point: Point, offset: Point): Point {
  return { x: point.x + offset.x, y: point.y + offset.y };
}

function negate(point: Point): Point {
  return { x: -point.x, y: -point.y };
}
