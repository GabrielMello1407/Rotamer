import type { BondOrder } from '../graph/types';
import { loadOpenChemLib, type OpenChemLib } from './openchemlib';
import type { FoldingFrame, Geometry, GeometryAtom, GeometryBond, GeometryOptions } from './types';

/**
 * Semente fixa do gerador de conformações.
 *
 * Sem semente fixa a mesma molécula daria geometrias diferentes a cada visita —
 * e o cache por InChIKey deixaria de fazer sentido, porque geometria precisa ser
 * função pura do grafo.
 */
const SEED = 1907;

/**
 * A escada do dobramento: cada degrau é uma minimização que roda até o
 * gradiente ficar abaixo daquela tolerância, sempre continuando de onde a
 * anterior parou.
 *
 * É assim que se consegue quadro intermediário de verdade. O minimizador do
 * OpenChemLib só devolve coordenadas quando converge — pedir "dez iterações e
 * me mostre" não funciona, ele roda e não escreve nada. Apertando o gradiente
 * aos poucos, cada parada é uma geometria real do caminho até o mínimo, e não
 * uma interpolação inventada entre o começo e o fim.
 */
const TOLERANCE_LADDER = [60, 30, 15, 8, 4, 2, 1, 0.5, 0.25, 0.1, 0.03, 0.0001] as const;

const MAX_ITERATIONS = 4000;

/**
 * Gera a geometria 3D a partir de um molblock **já sanitizado pelo RDKit**.
 *
 * Duas etapas, as duas de verdade: o gerador de conformações do OpenChemLib
 * encontra um arranjo inicial plausível, e o campo de força MMFF94 desce a
 * energia dali até o mínimo mais próximo.
 */
export async function generateGeometry(
  molblock: string,
  options: GeometryOptions = {},
): Promise<Geometry> {
  const ocl = await loadOpenChemLib();
  const { molecule: conformer, drawn } = buildConformer(ocl, molblock);

  const field = new ocl.ForceFieldMMFF94(conformer, 'MMFF94');

  // Quadro zero: o embrulho que saiu do gerador, antes de qualquer relaxamento.
  const frames: FoldingFrame[] = [
    { positions: positionsOf(conformer), energy: field.getTotalEnergy() },
  ];

  const ladder = ladderFor(options.maxFrames);
  for (const gradTol of ladder) {
    field.minimise({ maxIts: options.maxIterations ?? MAX_ITERATIONS, gradTol });
    frames.push({ positions: positionsOf(conformer), energy: field.getTotalEnergy() });
  }

  return {
    atoms: atomsOf(conformer, sourcesOf(conformer, drawn)),
    bonds: bondsOf(conformer),
    frames,
    energy: frames[frames.length - 1]?.energy ?? 0,
  };
}

/** Menos quadros pedidos, degraus mais largos — o fim da escada é sempre o mesmo. */
function ladderFor(maxFrames: number | undefined): number[] {
  const rungs = [...TOLERANCE_LADDER];
  if (maxFrames === undefined || maxFrames >= rungs.length + 1) return rungs;

  const wanted = Math.max(1, maxFrames - 1);
  const step = rungs.length / wanted;

  const chosen: number[] = [];
  for (let index = 0; index < wanted; index += 1) {
    const rung = rungs[Math.min(rungs.length - 1, Math.floor(index * step))];
    if (rung !== undefined) chosen.push(rung);
  }

  const last = rungs[rungs.length - 1];
  if (last !== undefined && chosen[chosen.length - 1] !== last) chosen[chosen.length - 1] = last;

  return chosen;
}

/** Molécula do OpenChemLib, do jeito que este módulo a usa. */
type OclMolecule = ReturnType<OpenChemLib['Molecule']['fromMolfile']>;

interface Conformer {
  readonly molecule: OclMolecule;
  /**
   * Quantos átomos vieram do desenho, antes de o campo de força acrescentar os
   * hidrogênios. Os primeiros índices são, um a um, os átomos do grafo.
   */
  readonly drawn: number;
}

function buildConformer(ocl: OpenChemLib, molblock: string): Conformer {
  const molecule = ocl.Molecule.fromMolfile(molblock);
  const drawn = molecule.getAllAtoms();

  // Hidrogênio implícito não existe em 3D: sem ele o campo de força não tem o
  // que segurar e os ângulos saem errados.
  molecule.addImplicitHydrogens();

  const generator = new ocl.ConformerGenerator(SEED);
  generator.initializeConformers(molecule);

  const conformer = generator.getNextConformerAsMolecule();
  if (conformer === null) {
    throw new Error('não foi possível encontrar um arranjo tridimensional para esta estrutura');
  }

  return { molecule: conformer, drawn };
}

/**
 * De cada átomo da cena para o átomo do desenho que o originou.
 *
 * Os `drawn` primeiros saíram do molblock na mesma ordem, porque nem o RDKit nem
 * o OpenChemLib reordenam o que leem. Os hidrogênios acrescentados depois herdam
 * o índice do vizinho — eles só existem por causa dele.
 */
function sourcesOf(molecule: OclMolecule, drawn: number): number[] {
  const total = molecule.getAllAtoms();
  const sources = new Array<number>(total);

  for (let atom = 0; atom < total; atom += 1) {
    sources[atom] = atom < drawn ? atom : -1;
  }

  for (let bond = 0; bond < molecule.getAllBonds(); bond += 1) {
    const first = molecule.getBondAtom(0, bond);
    const second = molecule.getBondAtom(1, bond);

    if ((sources[first] ?? -1) < 0 && (sources[second] ?? -1) >= 0) {
      sources[first] = sources[second] ?? 0;
    } else if ((sources[second] ?? -1) < 0 && (sources[first] ?? -1) >= 0) {
      sources[second] = sources[first] ?? 0;
    }
  }

  return sources.map((source) => (source < 0 ? 0 : source));
}

function positionsOf(molecule: OclMolecule): number[] {
  const total = molecule.getAllAtoms();
  const positions = new Array<number>(total * 3);

  for (let atom = 0; atom < total; atom += 1) {
    positions[atom * 3] = molecule.getAtomX(atom);
    positions[atom * 3 + 1] = molecule.getAtomY(atom);
    positions[atom * 3 + 2] = molecule.getAtomZ(atom);
  }

  return positions;
}

function atomsOf(molecule: OclMolecule, sources: readonly number[]): GeometryAtom[] {
  const total = molecule.getAllAtoms();
  const atoms: GeometryAtom[] = [];

  for (let atom = 0; atom < total; atom += 1) {
    atoms.push({
      element: molecule.getAtomLabel(atom),
      x: molecule.getAtomX(atom),
      y: molecule.getAtomY(atom),
      z: molecule.getAtomZ(atom),
      source: sources[atom] ?? 0,
    });
  }

  return atoms;
}

function bondsOf(molecule: OclMolecule): GeometryBond[] {
  const total = molecule.getAllBonds();
  const bonds: GeometryBond[] = [];

  for (let bond = 0; bond < total; bond += 1) {
    bonds.push({
      from: molecule.getBondAtom(0, bond),
      to: molecule.getBondAtom(1, bond),
      order: clampOrder(molecule.getBondOrder(bond)),
    });
  }

  return bonds;
}

/**
 * O 3D desenha bastão: ordem só decide a espessura do traço. Quem responde
 * sobre aromaticidade é o RDKit, do outro lado da fronteira.
 */
function clampOrder(order: number): BondOrder {
  return order === 2 || order === 3 ? order : 1;
}
