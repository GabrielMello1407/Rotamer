import { emptyGraph } from './operations';
import type { BondOrder, GraphAtom, GraphBond, MoleculeGraph } from './types';

/**
 * Tradução entre o grafo e o molblock V2000 — o formato que o RDKit lê.
 *
 * O grafo é nosso; o molblock é a fronteira. Toda pergunta química sai daqui
 * para o RDKit e volta como resposta, nunca como palpite nosso.
 */

const CABECALHO_PROGRAMA = '  Rotamer  2D';

/** Grafo → molblock V2000, com as coordenadas 2D como estão na tela. */
export function toMolblock(graph: MoleculeGraph): string {
  const indexByAtom = new Map(graph.atoms.map((atom, index) => [atom.id, index + 1]));

  const lines: string[] = ['', CABECALHO_PROGRAMA, ''];
  lines.push(`${count(graph.atoms.length)}${count(graph.bonds.length)}  0  0  0  0  0  0  0  0999 V2000`);

  for (const atom of graph.atoms) {
    lines.push(atomLine(atom));
  }

  for (const bond of graph.bonds) {
    const from = indexByAtom.get(bond.from);
    const to = indexByAtom.get(bond.to);
    if (from === undefined || to === undefined) continue;
    lines.push(`${count(from)}${count(to)}${count(bond.order)}  0`);
  }

  for (const line of chargeLines(graph, indexByAtom)) {
    lines.push(line);
  }

  lines.push('M  END');
  return lines.join('\n');
}

/**
 * Molblock V2000 → grafo.
 *
 * Serve para trazer molécula de fora: colar SMILES, abrir estrutura salva,
 * receber de volta o que o RDKit canonizou.
 */
export function fromMolblock(molblock: string): MoleculeGraph {
  const lines = molblock.split(/\r?\n/);
  const counts = lines[3];
  if (counts === undefined) return emptyGraph();

  const atomCount = readInt(counts, 0, 3);
  const bondCount = readInt(counts, 3, 6);
  if (atomCount === null || bondCount === null) return emptyGraph();

  const atoms: GraphAtom[] = [];
  for (let index = 0; index < atomCount; index += 1) {
    const line = lines[4 + index];
    if (line === undefined) break;

    const x = readFloat(line, 0, 10);
    const y = readFloat(line, 10, 20);
    const element = line.slice(31, 34).trim();
    if (x === null || y === null || element === '') continue;

    atoms.push({ id: index + 1, element, x, y, charge: 0 });
  }

  const bonds: GraphBond[] = [];
  for (let index = 0; index < bondCount; index += 1) {
    const line = lines[4 + atomCount + index];
    if (line === undefined) break;

    const from = readInt(line, 0, 3);
    const to = readInt(line, 3, 6);
    const order = readInt(line, 6, 9);
    if (from === null || to === null || order === null) continue;
    if (order !== 1 && order !== 2 && order !== 3) continue;

    bonds.push({ id: atomCount + index + 1, from, to, order });
  }

  const charged = applyCharges(atoms, lines);

  return { atoms: charged, bonds, nextId: atomCount + bondCount + 1 };
}

/** `M  CHG  2   3  -1   7   1` — a carga formal fora do bloco de átomos. */
function applyCharges(atoms: GraphAtom[], lines: readonly string[]): GraphAtom[] {
  const charges = new Map<number, number>();

  for (const line of lines) {
    if (!line.startsWith('M  CHG')) continue;

    const fields = line.slice(6).trim().split(/\s+/).map(Number);
    const pairs = fields.slice(1);
    for (let index = 0; index + 1 < pairs.length; index += 2) {
      const position = pairs[index];
      const charge = pairs[index + 1];
      if (position === undefined || charge === undefined) continue;
      if (Number.isNaN(position) || Number.isNaN(charge)) continue;
      charges.set(position, charge);
    }
  }

  if (charges.size === 0) return atoms;

  return atoms.map((atom, index) => {
    const charge = charges.get(index + 1);
    return charge === undefined ? atom : { ...atom, charge };
  });
}

function chargeLines(
  graph: MoleculeGraph,
  indexByAtom: ReadonlyMap<number, number>,
): string[] {
  const charged = graph.atoms.filter((atom) => atom.charge !== 0);
  if (charged.length === 0) return [];

  const lines: string[] = [];
  // O formato aceita no máximo oito pares por linha.
  for (let start = 0; start < charged.length; start += 8) {
    const chunk = charged.slice(start, start + 8);
    const pairs = chunk
      .map((atom) => `${count(indexByAtom.get(atom.id) ?? 0)}${count(atom.charge)}`)
      .join('');
    lines.push(`M  CHG${count(chunk.length)}${pairs}`);
  }

  return lines;
}

function atomLine(atom: GraphAtom): string {
  const element = atom.element.padEnd(3, ' ');
  return `${coordinate(atom.x)}${coordinate(atom.y)}${coordinate(0)} ${element} 0  0  0  0  0  0  0  0  0  0  0  0`;
}

/** Campo numérico de três colunas, alinhado à direita, como manda o formato. */
function count(value: number): string {
  return String(value).padStart(3, ' ');
}

/** Coordenada em dez colunas, quatro casas decimais. */
function coordinate(value: number): string {
  return value.toFixed(4).padStart(10, ' ');
}

function readInt(line: string, start: number, end: number): number | null {
  const text = line.slice(start, end).trim();
  if (text === '') return null;
  const value = Number.parseInt(text, 10);
  return Number.isNaN(value) ? null : value;
}

function readFloat(line: string, start: number, end: number): number | null {
  const text = line.slice(start, end).trim();
  if (text === '') return null;
  const value = Number.parseFloat(text);
  return Number.isNaN(value) ? null : value;
}

/** A ordem de ligação como o molblock a escreve. */
export function bondOrderFromMolfile(value: number): BondOrder | null {
  return value === 1 || value === 2 || value === 3 ? value : null;
}
