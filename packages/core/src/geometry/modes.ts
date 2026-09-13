import { openFastField, type FastField } from './field-access';
import { jacobiEigen } from './jacobi';
import { massesOf } from './masses';
import { loadOpenChemLib } from './openchemlib';
import type { Geometry } from './types';

/**
 * Modos normais de vibração.
 *
 * Uma molécula com N átomos tem 3N graus de liberdade. Três vão para a
 * translação do conjunto e três para a rotação — duas, se ela for linear, porque
 * girar em torno do próprio eixo não muda a posição de átomo nenhum. O que sobra
 * é vibração: **3N − 6**, ou **3N − 5** para molécula linear. Cada um desses
 * modos é um jeito específico de a molécula se mexer, com frequência própria, e
 * todos os átomos participam dele ao mesmo tempo.
 *
 * O cálculo é o de sempre em química computacional, e é inteiramente
 * determinístico:
 *
 * 1. a **Hessiana** — as segundas derivadas da energia MMFF94 em relação a cada
 *    par de coordenadas — por diferenças finitas, porque o OpenChemLib não expõe
 *    derivada analítica;
 * 2. **ponderação por massa**: divide-se cada elemento por `√(mᵢmⱼ)`, que é o
 *    que faz o hidrogênio se mexer mais que o carbono no mesmo modo;
 * 3. **projeção**: os seis (ou cinco) movimentos de corpo rígido são removidos
 *    do espaço antes de diagonalizar, em vez de descartados depois por um limiar
 *    escolhido a dedo;
 * 4. **diagonalização**: autovalor vira frequência, autovetor vira o desenho do
 *    movimento.
 *
 * **O que isto não é.** As frequências são as do campo de força MMFF94, não
 * medidas em espectro. Campo de força clássico com potencial harmônico costuma
 * superestimar estiramento em torno de 5% a 10% — o número serve para comparar
 * modos entre si e para ver a forma do movimento, não para conferir uma tabela
 * de infravermelho experimental. A interface diz isso.
 */


/**
 * De autovalor da Hessiana ponderada por massa para número de onda, em cm⁻¹.
 *
 * O autovalor sai em kcal/(mol·Å²·u). Convertendo para SI e dividindo por 2πc
 * chega-se a `ν̃ = 108,59 · √λ`, que é a constante que aparece em todo pacote de
 * química quântica que trabalha nessas unidades.
 */
const WAVENUMBER = 108.591;

/** Deslocamento para a primeira derivada, em ångström. */
const GRADIENT_STEP = 1e-4;

/** Deslocamento para a segunda derivada, em ångström. */
const HESSIAN_STEP = 1e-3;

/**
 * Teto de átomos, contando hidrogênio.
 *
 * A Hessiana custa 36N² avaliações de energia e a diagonalização é O(N³). Em
 * cinquenta átomos isso é cerca de noventa mil avaliações e uma matriz 150×150 —
 * roda no worker sem travar a tela. O dobro disso multiplica o trabalho por oito
 * e o celular fraco, que é o caso de uso e não o caso extremo, congela.
 *
 * Cafeína tem 24 átomos com hidrogênio, aspirina 21, paracetamol 20: o teto está
 * bem acima do que uma aula desenha, e quem passar dele recebe a resposta honesta
 * de que os modos não foram calculados.
 */
const MAX_ATOMS = 50;

/** Abaixo disto, um vetor de rotação é ruído numérico — a molécula é linear. */
const LINEAR_TOLERANCE = 1e-6;

export interface NormalMode {
  /** Número de onda em cm⁻¹. Negativo quer dizer modo imaginário. */
  readonly wavenumber: number;
  /**
   * Deslocamento cartesiano de cada átomo, achatado: `[x0, y0, z0, ...]`.
   *
   * Normalizado para o átomo que mais anda ter deslocamento 1 — a escala em
   * ångström de verdade é infinitesimal, e o que interessa aqui é a forma do
   * movimento, não a amplitude.
   */
  readonly displacement: readonly number[];
  /** Quanto do movimento estica ligação, de 0 a 1. */
  readonly stretch: number;
  /** Quanto do movimento dobra ângulo, de 0 a 1. */
  readonly bend: number;
}

export interface NormalModes {
  /** Todos os átomos numa reta só. */
  readonly linear: boolean;
  readonly atomCount: number;
  /** `3N − 6`, ou `3N − 5` quando linear. */
  readonly expected: number;
  /** Os modos, do mais lento para o mais rápido. */
  readonly modes: readonly NormalMode[];
}

/**
 * Calcula os modos normais em torno da geometria já minimizada.
 *
 * Devolve `null` quando não dá para responder com honestidade: molécula grande
 * demais, campo de força que não abriu, ou geometria que não corresponde ao
 * molblock recebido.
 */
export async function normalModes(
  molblock: string,
  geometry: Geometry,
): Promise<NormalModes | null> {
  // Modo normal é a curvatura da energia em torno de um mínimo. Sem campo de
  // força não há energia, não há mínimo, e não há modo — a molécula aparece na
  // tela com a forma que o gerador de conformações montou, parada.
  if (!geometry.relaxed || geometry.energy === null) return null;

  const atomCount = geometry.atoms.length;
  if (atomCount < 2 || atomCount > MAX_ATOMS) return null;

  const ocl = await loadOpenChemLib();
  const molecule = ocl.Molecule.fromMolfile(molblock);
  molecule.addImplicitHydrogens();

  if (molecule.getAllAtoms() !== atomCount) return null;

  // O modo normal só existe em torno de um mínimo: a molécula recebe as
  // coordenadas do fim do dobramento antes de o campo de força ser montado.
  const last = geometry.frames[geometry.frames.length - 1];
  if (!last) return null;

  for (let atom = 0; atom < atomCount; atom += 1) {
    molecule.setAtomX(atom, last.positions[atom * 3] ?? 0);
    molecule.setAtomY(atom, last.positions[atom * 3 + 1] ?? 0);
    molecule.setAtomZ(atom, last.positions[atom * 3 + 2] ?? 0);
  }

  const field = new ocl.ForceFieldMMFF94(molecule, 'MMFF94');
  const energy = field.getTotalEnergy();
  if (!Number.isFinite(energy) || Math.abs(energy - geometry.energy) > 1) return null;

  const fast = openFastField(field, atomCount);
  if (fast === null) return null;

  const masses = massesOf(geometry);
  if (masses === null) return null;
  const equilibrium = [...fast.positions];

  const hessian = massWeighted(hessianOf(fast, atomCount), masses);
  const rigid = rigidBody(equilibrium, masses);
  const linear = rigid.length === 5;

  project(hessian, rigid);

  const { values, vectors } = jacobiEigen(hessian);

  // Ordenados por |λ|: os primeiros são o espaço de corpo rígido que acabou de
  // ser projetado fora, e valem exatamente zero a menos de erro de máquina.
  const order = values
    .map((value, index) => ({ value, index }))
    .sort((first, second) => Math.abs(first.value) - Math.abs(second.value))
    .slice(rigid.length)
    .sort((first, second) => first.value - second.value);

  const bonds = geometry.bonds.map((bond) => [bond.from, bond.to] as const);
  const angles = anglesOf(bonds, atomCount);

  const modes = order.map((entry) => {
    const displacement = unweight(columnOf(vectors, entry.index), masses);
    const share = motionShare(equilibrium, displacement, bonds, angles);

    return {
      wavenumber: Math.sign(entry.value) * WAVENUMBER * Math.sqrt(Math.abs(entry.value)),
      displacement,
      stretch: share.stretch,
      bend: share.bend,
    };
  });

  return {
    linear,
    atomCount,
    expected: 3 * atomCount - rigid.length,
    modes,
  };
}

/** Gradiente da energia por diferença central, em kcal/(mol·Å). */
function gradient(fast: FastField, size: number): number[] {
  const result = new Array<number>(size).fill(0);

  for (let index = 0; index < size; index += 1) {
    const saved = fast.positions[index] ?? 0;

    fast.positions[index] = saved + GRADIENT_STEP;
    const forward = fast.energy();

    fast.positions[index] = saved - GRADIENT_STEP;
    const backward = fast.energy();

    fast.positions[index] = saved;
    result[index] = (forward - backward) / (2 * GRADIENT_STEP);
  }

  return result;
}

/**
 * Hessiana por diferença central do gradiente.
 *
 * Simetrizada no fim: `∂²E/∂x∂y` e `∂²E/∂y∂x` são a mesma coisa na matemática,
 * e a diferença que sobra entre as duas é só erro numérico.
 */
function hessianOf(fast: FastField, atomCount: number): number[][] {
  const size = atomCount * 3;
  const hessian: number[][] = Array.from({ length: size }, () => new Array<number>(size).fill(0));

  for (let index = 0; index < size; index += 1) {
    const saved = fast.positions[index] ?? 0;

    fast.positions[index] = saved + HESSIAN_STEP;
    const forward = gradient(fast, size);

    fast.positions[index] = saved - HESSIAN_STEP;
    const backward = gradient(fast, size);

    fast.positions[index] = saved;

    const row = hessian[index];
    if (!row) continue;

    for (let other = 0; other < size; other += 1) {
      row[other] = ((forward[other] ?? 0) - (backward[other] ?? 0)) / (2 * HESSIAN_STEP);
    }
  }

  for (let row = 0; row < size; row += 1) {
    for (let column = row + 1; column < size; column += 1) {
      const average = ((hessian[row]?.[column] ?? 0) + (hessian[column]?.[row] ?? 0)) / 2;

      const first = hessian[row];
      const second = hessian[column];
      if (first) first[column] = average;
      if (second) second[row] = average;
    }
  }

  return hessian;
}

/** Divide cada elemento por `√(mᵢmⱼ)`. É o que traz a massa para dentro do modo. */
function massWeighted(hessian: number[][], masses: readonly number[]): number[][] {
  const size = hessian.length;

  for (let row = 0; row < size; row += 1) {
    const line = hessian[row];
    if (!line) continue;

    for (let column = 0; column < size; column += 1) {
      const first = masses[Math.floor(row / 3)] ?? 0;
      const second = masses[Math.floor(column / 3)] ?? 0;
      line[column] = (line[column] ?? 0) / Math.sqrt(first * second);
    }
  }

  return hessian;
}

/**
 * Os movimentos que não são vibração: três translações e as rotações.
 *
 * Em coordenada ponderada por massa, transladar em `x` é o vetor com `√m` em
 * toda posição `x`; girar em torno de um eixo é o produto vetorial do eixo pela
 * posição do átomo em relação ao centro de massa, também com `√m`.
 *
 * Molécula linear devolve cinco vetores em vez de seis: o giro em torno do eixo
 * da própria molécula não move átomo nenhum, e o vetor correspondente sai nulo.
 */
function rigidBody(positions: readonly number[], masses: readonly number[]): number[][] {
  const atomCount = masses.length;
  const size = atomCount * 3;

  let totalMass = 0;
  const center = [0, 0, 0];

  for (let atom = 0; atom < atomCount; atom += 1) {
    const mass = masses[atom] ?? 0;
    totalMass += mass;

    for (let axis = 0; axis < 3; axis += 1) {
      center[axis] = (center[axis] ?? 0) + mass * (positions[atom * 3 + axis] ?? 0);
    }
  }

  for (let axis = 0; axis < 3; axis += 1) {
    center[axis] = (center[axis] ?? 0) / totalMass;
  }

  const candidates: number[][] = [];

  for (let axis = 0; axis < 3; axis += 1) {
    const translation = new Array<number>(size).fill(0);
    for (let atom = 0; atom < atomCount; atom += 1) {
      translation[atom * 3 + axis] = Math.sqrt(masses[atom] ?? 0);
    }
    candidates.push(translation);
  }

  for (let axis = 0; axis < 3; axis += 1) {
    const rotation = new Array<number>(size).fill(0);

    for (let atom = 0; atom < atomCount; atom += 1) {
      const root = Math.sqrt(masses[atom] ?? 0);
      const relative = [0, 1, 2].map(
        (coordinate) => (positions[atom * 3 + coordinate] ?? 0) - (center[coordinate] ?? 0),
      );

      // Produto vetorial do eixo unitário pelo vetor posição.
      const unit = [0, 0, 0];
      unit[axis] = 1;

      const cross = [
        (unit[1] ?? 0) * (relative[2] ?? 0) - (unit[2] ?? 0) * (relative[1] ?? 0),
        (unit[2] ?? 0) * (relative[0] ?? 0) - (unit[0] ?? 0) * (relative[2] ?? 0),
        (unit[0] ?? 0) * (relative[1] ?? 0) - (unit[1] ?? 0) * (relative[0] ?? 0),
      ];

      for (let coordinate = 0; coordinate < 3; coordinate += 1) {
        rotation[atom * 3 + coordinate] = root * (cross[coordinate] ?? 0);
      }
    }

    candidates.push(rotation);
  }

  // Gram-Schmidt: o que sobrar com norma desprezível não é movimento nenhum —
  // é o giro da molécula linear em torno do próprio eixo.
  const basis: number[][] = [];

  for (const candidate of candidates) {
    const vector = [...candidate];

    for (const already of basis) {
      const overlap = dot(vector, already);
      for (let index = 0; index < vector.length; index += 1) {
        vector[index] = (vector[index] ?? 0) - overlap * (already[index] ?? 0);
      }
    }

    const norm = Math.sqrt(dot(vector, vector));
    if (norm < LINEAR_TOLERANCE) continue;

    basis.push(vector.map((value) => value / norm));
  }

  return basis;
}

/** `H ← P H P`, com `P = I − Σ vvᵀ`. Tira o corpo rígido de dentro do problema. */
function project(hessian: number[][], basis: readonly (readonly number[])[]): void {
  const size = hessian.length;

  for (const vector of basis) {
    // `H − v(vᵀH) − (Hv)vᵀ + v(vᵀHv)vᵀ`, feito em duas passadas.
    const product = new Array<number>(size).fill(0);
    for (let row = 0; row < size; row += 1) {
      let sum = 0;
      for (let column = 0; column < size; column += 1) {
        sum += (hessian[row]?.[column] ?? 0) * (vector[column] ?? 0);
      }
      product[row] = sum;
    }

    const middle = dot(product, vector);

    for (let row = 0; row < size; row += 1) {
      const line = hessian[row];
      if (!line) continue;

      for (let column = 0; column < size; column += 1) {
        line[column] =
          (line[column] ?? 0) -
          (vector[row] ?? 0) * (product[column] ?? 0) -
          (product[row] ?? 0) * (vector[column] ?? 0) +
          (vector[row] ?? 0) * middle * (vector[column] ?? 0);
      }
    }
  }
}

function dot(first: readonly number[], second: readonly number[]): number {
  let sum = 0;
  for (let index = 0; index < first.length; index += 1) {
    sum += (first[index] ?? 0) * (second[index] ?? 0);
  }
  return sum;
}

function columnOf(vectors: readonly (readonly number[])[], column: number): number[] {
  return vectors.map((row) => row[column] ?? 0);
}

/**
 * Volta da coordenada ponderada por massa para o deslocamento cartesiano.
 *
 * É a divisão por `√m` que faz o hidrogênio aparecer se mexendo muito e o iodo
 * quase parado no mesmo modo — o que é o comportamento físico, não licença
 * poética.
 */
function unweight(vector: readonly number[], masses: readonly number[]): number[] {
  const cartesian = vector.map(
    (value, index) => value / Math.sqrt(masses[Math.floor(index / 3)] ?? 0),
  );

  let largest = 0;
  for (let atom = 0; atom < masses.length; atom += 1) {
    largest = Math.max(
      largest,
      Math.hypot(
        cartesian[atom * 3] ?? 0,
        cartesian[atom * 3 + 1] ?? 0,
        cartesian[atom * 3 + 2] ?? 0,
      ),
    );
  }

  if (largest < 1e-12) return cartesian;
  return cartesian.map((value) => value / largest);
}

/** Todo trio a–b–c com b no meio, a partir da lista de ligações. */
function anglesOf(
  bonds: readonly (readonly [number, number])[],
  atomCount: number,
): (readonly [number, number, number])[] {
  const neighbours: number[][] = Array.from({ length: atomCount }, () => []);

  for (const [from, to] of bonds) {
    neighbours[from]?.push(to);
    neighbours[to]?.push(from);
  }

  const angles: (readonly [number, number, number])[] = [];

  for (let center = 0; center < atomCount; center += 1) {
    const around = neighbours[center] ?? [];

    for (let first = 0; first < around.length - 1; first += 1) {
      for (let second = first + 1; second < around.length; second += 1) {
        const left = around[first];
        const right = around[second];
        if (left === undefined || right === undefined) continue;

        angles.push([left, center, right]);
      }
    }
  }

  return angles;
}

/**
 * Quanto do movimento é estiramento e quanto é dobramento.
 *
 * Mede-se, não se adivinha: desloca-se a molécula um tiquinho ao longo do modo e
 * observa-se o que mudou — comprimento de ligação, ou ângulo entre ligações. A
 * mudança de ângulo é multiplicada pelo comprimento médio das duas ligações,
 * para as duas coisas ficarem em ångström e poderem ser comparadas.
 *
 * É uma aproximação — a decomposição rigorosa distribui a **energia** potencial
 * entre as coordenadas internas, não o deslocamento. Serve para dizer "este modo
 * é sobretudo estiramento", que é o que o aluno precisa ver.
 */
function motionShare(
  positions: readonly number[],
  displacement: readonly number[],
  bonds: readonly (readonly [number, number])[],
  angles: readonly (readonly [number, number, number])[],
): { readonly stretch: number; readonly bend: number } {
  const step = 1e-3;

  const moved = (sign: number): number[] =>
    positions.map((value, index) => value + sign * step * (displacement[index] ?? 0));

  const forward = moved(1);
  const backward = moved(-1);

  let stretch = 0;
  for (const [from, to] of bonds) {
    const change = (distance(forward, from, to) - distance(backward, from, to)) / (2 * step);
    stretch += change * change;
  }

  let bend = 0;
  for (const [left, center, right] of angles) {
    const change = (angle(forward, left, center, right) - angle(backward, left, center, right)) / (2 * step);
    const arm = (distance(positions, left, center) + distance(positions, center, right)) / 2;
    bend += (change * arm) ** 2;
  }

  const total = stretch + bend;
  if (total < 1e-12) return { stretch: 0, bend: 0 };

  return { stretch: stretch / total, bend: bend / total };
}

function distance(positions: readonly number[], first: number, second: number): number {
  return Math.hypot(
    (positions[first * 3] ?? 0) - (positions[second * 3] ?? 0),
    (positions[first * 3 + 1] ?? 0) - (positions[second * 3 + 1] ?? 0),
    (positions[first * 3 + 2] ?? 0) - (positions[second * 3 + 2] ?? 0),
  );
}

function angle(
  positions: readonly number[],
  left: number,
  center: number,
  right: number,
): number {
  const first = [0, 1, 2].map(
    (axis) => (positions[left * 3 + axis] ?? 0) - (positions[center * 3 + axis] ?? 0),
  );
  const second = [0, 1, 2].map(
    (axis) => (positions[right * 3 + axis] ?? 0) - (positions[center * 3 + axis] ?? 0),
  );

  const norms = Math.sqrt(dot(first, first)) * Math.sqrt(dot(second, second));
  if (norms < 1e-12) return 0;

  return Math.acos(Math.min(1, Math.max(-1, dot(first, second) / norms)));
}
