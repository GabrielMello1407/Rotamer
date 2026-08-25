import { openFastField, type FastField } from './field-access';
import { loadOpenChemLib } from './openchemlib';
import type { Geometry } from './types';

/**
 * Dinâmica molecular.
 *
 * A vibração que aparece na tela é integração de Newton sobre o **mesmo campo
 * de força** que encontrou a geometria: as forças são a derivada do potencial
 * MMFF94, obtida por diferença central, e o passo é velocity-Verlet. Não é
 * animação de senoide — cada quadro é um instante da molécula a trezentos
 * kelvin.
 *
 * Por que derivada numérica: o OpenChemLib não expõe o gradiente analítico. Com
 * acesso direto ao vetor de coordenadas do campo, cada avaliação de energia
 * custa poucos microssegundos, e o gradiente de uma molécula do tamanho da
 * aspirina sai em menos de meio milissegundo. O erro de uma diferença central
 * com passo de 10⁻⁴ Å é pequeno demais para aparecer em vinte femtossegundos de
 * trajetória.
 */

/** Massas atômicas, em u. Não é perícia química: é tabela periódica. */
const MASSES: Readonly<Record<string, number>> = {
  H: 1.008,
  B: 10.81,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  Si: 28.085,
  P: 30.974,
  S: 32.06,
  Cl: 35.45,
  Br: 79.904,
  I: 126.904,
};

const DEFAULT_MASS = 12.011;

/**
 * Constante de Boltzmann em u·Å²/(ps²·K).
 *
 * É o que casa massa em u, distância em ångström e tempo em picossegundo — as
 * unidades em que esta simulação anda.
 */
const BOLTZMANN = 0.831446;

/** kcal/(mol·Å) para u·Å/ps². */
const FORCE_TO_ACCELERATION = 418.4;

/** Passo de integração, em picossegundos. Meio femtossegundo. */
const TIME_STEP = 0.0005;

/** Deslocamento da diferença central, em ångström. */
const DELTA = 1e-4;

export interface DynamicsOptions {
  /** Temperatura do banho, em kelvin. */
  readonly temperature?: number;
  /** Quantos quadros gravar. */
  readonly frames?: number;
  /** Passos de integração entre um quadro e o outro. */
  readonly stepsPerFrame?: number;
  /** Semente do sorteio das velocidades iniciais. */
  readonly seed?: number;
}

export interface DynamicsTrajectory {
  /** Cada quadro: posições achatadas `[x0, y0, z0, ...]`, em ångström. */
  readonly frames: readonly (readonly number[])[];
  /** Temperatura do banho, em kelvin. */
  readonly temperature: number;
  /** Duração de um quadro, em femtossegundos. */
  readonly frameFs: number;
}

const DEFAULTS = {
  temperature: 300,
  frames: 90,
  stepsPerFrame: 4,
  seed: 1907,
} as const;

/**
 * Sorteia velocidades reprodutíveis.
 *
 * Semente fixa porque a trajetória entra no cache por InChIKey junto com a
 * conformação: a mesma molécula precisa vibrar igual em toda visita.
 */
function randomStream(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Duas normais padrão a partir de dois uniformes. */
function gaussian(random: () => number): number {
  const first = Math.max(random(), Number.EPSILON);
  const second = random();
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
}

/**
 * Roda a dinâmica a partir da geometria já minimizada.
 *
 * Devolve `null` quando não é possível chegar ao campo de força de forma barata
 * — e aí a cena mostra a geometria parada, que é o correto: melhor não vibrar
 * do que vibrar de mentira.
 */
export async function simulateDynamics(
  molblock: string,
  geometry: Geometry,
  options: DynamicsOptions = {},
): Promise<DynamicsTrajectory | null> {
  const temperature = options.temperature ?? DEFAULTS.temperature;
  const frameCount = options.frames ?? DEFAULTS.frames;
  const stepsPerFrame = options.stepsPerFrame ?? DEFAULTS.stepsPerFrame;

  const ocl = await loadOpenChemLib();
  const molecule = ocl.Molecule.fromMolfile(molblock);
  molecule.addImplicitHydrogens();

  const atomCount = geometry.atoms.length;
  if (atomCount === 0 || molecule.getAllAtoms() !== atomCount) return null;

  // A vibração é em torno do mínimo que o dobramento encontrou, então a
  // molécula recebe aquelas coordenadas **antes** de o campo de força ser
  // montado. Um molblock plano com hidrogênio recém-acrescentado tem átomos
  // empilhados no mesmo ponto, e ali a energia do MMFF94 é NaN.
  const last = geometry.frames[geometry.frames.length - 1];
  if (!last) return null;

  for (let atom = 0; atom < atomCount; atom += 1) {
    molecule.setAtomX(atom, last.positions[atom * 3] ?? 0);
    molecule.setAtomY(atom, last.positions[atom * 3 + 1] ?? 0);
    molecule.setAtomZ(atom, last.positions[atom * 3 + 2] ?? 0);
  }

  const field = new ocl.ForceFieldMMFF94(molecule, 'MMFF94');

  // Se a energia daqui não bate com a do fim do dobramento, a ordem dos átomos
  // não é a mesma — e vibrar a molécula errada é pior do que não vibrar.
  const energy = field.getTotalEnergy();
  if (!Number.isFinite(energy) || Math.abs(energy - geometry.energy) > 1) return null;

  const fast = openFastField(field, atomCount);
  if (fast === null) return null;

  const masses = geometry.atoms.map((atom) => MASSES[atom.element] ?? DEFAULT_MASS);
  const random = randomStream(options.seed ?? DEFAULTS.seed);
  const velocities = drawVelocities(masses, temperature, random);

  removeDrift(fast.positions, velocities, masses);

  let acceleration = accelerations(fast, masses);
  const frames: number[][] = [[...fast.positions]];

  for (let frame = 1; frame < frameCount; frame += 1) {
    for (let step = 0; step < stepsPerFrame; step += 1) {
      // Velocity-Verlet: posição com a aceleração atual, aceleração nova,
      // velocidade com a média das duas.
      for (let index = 0; index < velocities.length; index += 1) {
        const current = fast.positions[index] ?? 0;
        const speed = velocities[index] ?? 0;
        const accel = acceleration[index] ?? 0;
        fast.positions[index] = current + speed * TIME_STEP + 0.5 * accel * TIME_STEP * TIME_STEP;
      }

      const next = accelerations(fast, masses);
      for (let index = 0; index < velocities.length; index += 1) {
        const speed = velocities[index] ?? 0;
        velocities[index] =
          speed + 0.5 * ((acceleration[index] ?? 0) + (next[index] ?? 0)) * TIME_STEP;
      }
      acceleration = next;
    }

    // Banho térmico simples e sem deriva: a molécula vibra parada no lugar, em
    // vez de sair passeando e girando pela cena.
    thermostat(velocities, masses, temperature);
    removeDrift(fast.positions, velocities, masses);

    frames.push([...fast.positions]);
  }

  return { frames, temperature, frameFs: stepsPerFrame * TIME_STEP * 1000 };
}

/** Acelerações a partir do gradiente numérico do potencial MMFF94. */
function accelerations(fast: FastField, masses: readonly number[]): number[] {
  const total = masses.length * 3;
  const result = new Array<number>(total).fill(0);

  for (let index = 0; index < total; index += 1) {
    const saved = fast.positions[index] ?? 0;

    fast.positions[index] = saved + DELTA;
    const forward = fast.energy();

    fast.positions[index] = saved - DELTA;
    const backward = fast.energy();

    fast.positions[index] = saved;

    // Força é menos o gradiente da energia.
    const force = -(forward - backward) / (2 * DELTA);
    const mass = masses[Math.floor(index / 3)] ?? DEFAULT_MASS;
    result[index] = (force * FORCE_TO_ACCELERATION) / mass;
  }

  return result;
}

/** Distribuição de Maxwell-Boltzmann na temperatura pedida. */
function drawVelocities(
  masses: readonly number[],
  temperature: number,
  random: () => number,
): number[] {
  const velocities = new Array<number>(masses.length * 3).fill(0);

  for (let atom = 0; atom < masses.length; atom += 1) {
    const mass = masses[atom] ?? DEFAULT_MASS;
    const sigma = Math.sqrt((BOLTZMANN * temperature) / mass);

    for (let axis = 0; axis < 3; axis += 1) {
      velocities[atom * 3 + axis] = gaussian(random) * sigma;
    }
  }

  return velocities;
}

/** Reescala as velocidades para a temperatura do banho. */
function thermostat(velocities: number[], masses: readonly number[], temperature: number): void {
  let kinetic = 0;
  for (let atom = 0; atom < masses.length; atom += 1) {
    const mass = masses[atom] ?? DEFAULT_MASS;
    for (let axis = 0; axis < 3; axis += 1) {
      const speed = velocities[atom * 3 + axis] ?? 0;
      kinetic += mass * speed * speed;
    }
  }

  const degrees = Math.max(1, masses.length * 3 - 6);
  const current = kinetic / (degrees * BOLTZMANN);
  if (current <= 0) return;

  // Correção suave: puxa um décimo do caminho por quadro, para a trajetória não
  // ficar com degrau visível.
  const factor = Math.sqrt(1 + 0.1 * (temperature / current - 1));
  for (let index = 0; index < velocities.length; index += 1) {
    velocities[index] = (velocities[index] ?? 0) * factor;
  }
}

/**
 * Tira o movimento do centro de massa e o giro do conjunto.
 *
 * Sem isso, a molécula vibra **e** sai andando e rodando pela cena, e quem olha
 * perde justamente o que interessa: a ligação simples girando e a dupla travada.
 */
function removeDrift(
  positions: readonly number[],
  velocities: number[],
  masses: readonly number[],
): void {
  const count = masses.length;
  let totalMass = 0;
  const centre = [0, 0, 0];
  const momentum = [0, 0, 0];

  for (let atom = 0; atom < count; atom += 1) {
    const mass = masses[atom] ?? DEFAULT_MASS;
    totalMass += mass;

    for (let axis = 0; axis < 3; axis += 1) {
      centre[axis] = (centre[axis] ?? 0) + mass * (positions[atom * 3 + axis] ?? 0);
      momentum[axis] = (momentum[axis] ?? 0) + mass * (velocities[atom * 3 + axis] ?? 0);
    }
  }

  for (let axis = 0; axis < 3; axis += 1) {
    centre[axis] = (centre[axis] ?? 0) / totalMass;
    const drift = (momentum[axis] ?? 0) / totalMass;
    for (let atom = 0; atom < count; atom += 1) {
      velocities[atom * 3 + axis] = (velocities[atom * 3 + axis] ?? 0) - drift;
    }
  }

  removeSpin(positions, velocities, masses, centre);
}

/** Zera o momento angular resolvendo `L = I·ω` e subtraindo `ω × r`. */
function removeSpin(
  positions: readonly number[],
  velocities: number[],
  masses: readonly number[],
  centre: readonly number[],
): void {
  const count = masses.length;
  if (count < 2) return;

  const angular = [0, 0, 0];
  const inertia = [0, 0, 0, 0, 0, 0, 0, 0, 0];

  for (let atom = 0; atom < count; atom += 1) {
    const mass = masses[atom] ?? DEFAULT_MASS;
    const x = (positions[atom * 3] ?? 0) - (centre[0] ?? 0);
    const y = (positions[atom * 3 + 1] ?? 0) - (centre[1] ?? 0);
    const z = (positions[atom * 3 + 2] ?? 0) - (centre[2] ?? 0);

    const vx = velocities[atom * 3] ?? 0;
    const vy = velocities[atom * 3 + 1] ?? 0;
    const vz = velocities[atom * 3 + 2] ?? 0;

    angular[0] = (angular[0] ?? 0) + mass * (y * vz - z * vy);
    angular[1] = (angular[1] ?? 0) + mass * (z * vx - x * vz);
    angular[2] = (angular[2] ?? 0) + mass * (x * vy - y * vx);

    inertia[0] = (inertia[0] ?? 0) + mass * (y * y + z * z);
    inertia[4] = (inertia[4] ?? 0) + mass * (x * x + z * z);
    inertia[8] = (inertia[8] ?? 0) + mass * (x * x + y * y);
    inertia[1] = (inertia[1] ?? 0) - mass * x * y;
    inertia[2] = (inertia[2] ?? 0) - mass * x * z;
    inertia[5] = (inertia[5] ?? 0) - mass * y * z;
  }

  // O tensor de inércia é simétrico: a metade de baixo espelha a de cima.
  inertia[3] = inertia[1] ?? 0;
  inertia[6] = inertia[2] ?? 0;
  inertia[7] = inertia[5] ?? 0;

  const spin = solve3(inertia, angular);
  if (spin === null) return;

  for (let atom = 0; atom < count; atom += 1) {
    const x = (positions[atom * 3] ?? 0) - (centre[0] ?? 0);
    const y = (positions[atom * 3 + 1] ?? 0) - (centre[1] ?? 0);
    const z = (positions[atom * 3 + 2] ?? 0) - (centre[2] ?? 0);

    velocities[atom * 3] = (velocities[atom * 3] ?? 0) - ((spin[1] ?? 0) * z - (spin[2] ?? 0) * y);
    velocities[atom * 3 + 1] =
      (velocities[atom * 3 + 1] ?? 0) - ((spin[2] ?? 0) * x - (spin[0] ?? 0) * z);
    velocities[atom * 3 + 2] =
      (velocities[atom * 3 + 2] ?? 0) - ((spin[0] ?? 0) * y - (spin[1] ?? 0) * x);
  }
}

/** Resolve um sistema 3×3 por Cramer. Molécula linear tem determinante zero. */
function solve3(matrix: readonly number[], vector: readonly number[]): number[] | null {
  const [a, b, c, d, e, f, g, h, i] = matrix as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];

  const determinant =
    a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(determinant) < 1e-9) return null;

  const [x, y, z] = vector as [number, number, number];

  return [
    (x * (e * i - f * h) - b * (y * i - f * z) + c * (y * h - e * z)) / determinant,
    (a * (y * i - f * z) - x * (d * i - f * g) + c * (d * z - y * g)) / determinant,
    (a * (e * z - y * h) - b * (d * z - y * g) + x * (d * h - e * g)) / determinant,
  ];
}
