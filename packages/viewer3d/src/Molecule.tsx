'use client';

import type { DynamicsTrajectory, Geometry } from '@rotamer/core';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { memo, useEffect, useMemo, useRef, type ReactElement } from 'react';
import { Html } from '@react-three/drei';
import {
  Color,
  Matrix4,
  Quaternion,
  Vector3,
  type Group,
  type InstancedMesh,
  type Mesh,
} from 'three';
import { colorOf, radiusOf, type Cpk } from './cpk';
import { sampleDynamics, sampleFolding, sampleMode, FOLD_DURATION } from './folding';
import { sticksOf } from './sticks';
import styles from './Molecule.module.css';

export interface MoleculeProps {
  readonly geometry: Geometry;
  readonly cpk: Cpk;
  /** Sem movimento: vai direto para a geometria final e não vibra. */
  readonly animate: boolean;
  /** A vibração, quando o worker já terminou de simular. */
  readonly trajectory?: DynamicsTrajectory | null | undefined;
  readonly onEnergy?: ((energy: number, done: boolean) => void) | undefined;
  /** Preenchimento de espaço: a esfera cresce até o raio de van der Waals. */
  readonly spaceFilling?: boolean;
  /** Os hidrogênios podem sair da cena sem sair da física. */
  readonly showHydrogens?: boolean;
  /** O átomo do desenho que está aceso agora. */
  readonly highlight?: number | null | undefined;
  /** Qual átomo do desenho está sob o cursor, ou `null` ao sair. */
  readonly onHover?: ((source: number | null) => void) | undefined;
  /**
   * A configuração de cada centro estereogênico, pelo átomo do desenho.
   *
   * Cunha e traço não atravessam para cá: eles são notação de **projeção**, um
   * jeito de escrever profundidade num papel plano. Aqui a profundidade é real,
   * e desenhar tracejado significaria outra coisa. O que atravessa é a letra —
   * `R`, `S` — para as duas telas dizerem a mesma coisa sobre o mesmo átomo.
   */
  readonly stereo?:
    | readonly { readonly source: number; readonly label: string }[]
    | undefined;
  /**
   * Um modo normal para mostrar sozinho, no lugar da vibração térmica.
   *
   * Deslocamento cartesiano por átomo, já normalizado. Com ele a cena para de
   * mostrar a molécula a 300 K e passa a mostrar **um** jeito de vibrar, isolado
   * dos outros — que é como se ensina espectroscopia.
   */
  readonly mode?: readonly number[] | null | undefined;
}

const UP = new Vector3(0, 1, 0);

/** Espessura da vareta, em ångström. */
const STICK = 0.09;

/** Vareta de ligação múltipla é mais fina: três grossas viram um tubo só. */
const MULTIPLE_STICK = 0.062;

/** Distância entre as varetas de uma ligação múltipla, em ångström. */
const MULTIPLE_GAP = 0.16;

/** Quanto a esfera cresce no modo volume. Bola-e-vareta é ~0,4 do raio real. */
const SPACE_FILLING = 2.4;

/**
 * Menor variação de energia que vale um aviso, em kcal/mol.
 *
 * Abaixo disso o número na tela nem muda de casa decimal — avisar seria pedir
 * uma repintura para não mudar nada.
 */
const ENERGY_STEP = 0.05;

/**
 * A molécula em bola-e-vareta.
 *
 * Átomos e ligações são malhas instanciadas: uma esfera e um cilindro só,
 * repetidos por matriz. É o que segura 60 fps enquanto o dobramento roda, mesmo
 * em celular fraco.
 *
 * O que some da cena — hidrogênio escondido, vareta no modo volume — some
 * encolhendo a instância, nunca refazendo a lista. Índice de átomo é o mesmo em
 * todo lugar: nas posições, na trajetória e no desenho 2D.
 */
function MoleculeScene({
  geometry,
  cpk,
  animate,
  trajectory,
  onEnergy,
  spaceFilling = false,
  showHydrogens = true,
  highlight,
  onHover,
  mode,
  stereo = [],
}: MoleculeProps): ReactElement {
  const atomsRef = useRef<InstancedMesh | null>(null);
  const bondsRef = useRef<InstancedMesh | null>(null);
  const haloRef = useRef<Mesh | null>(null);
  const labelsRef = useRef<(Group | null)[]>([]);

  /**
   * Dois relógios, não um.
   *
   * O do dobramento começa quando a geometria chega; o da vibração, quando a
   * trajetória chega — e ela chega depois, porque a simulação roda no worker.
   * Com um relógio só, a vibração entrava no meio do ciclo: a molécula pulava
   * da forma parada para um instante qualquer da trajetória num quadro de tela.
   */
  const startRef = useRef<number | null>(null);
  const vibeRef = useRef<number | null>(null);
  const reportedRef = useRef<number | null>(null);
  const doneRef = useRef<boolean | null>(null);

  const matrix = useMemo(() => new Matrix4(), []);
  const position = useMemo(() => new Vector3(), []);
  const scale = useMemo(() => new Vector3(), []);
  const rotation = useMemo(() => new Quaternion(), []);
  const direction = useMemo(() => new Vector3(), []);

  /**
   * A cor de cada átomo, pintada instância por instância.
   *
   * Malha instanciada não aceita cor por atributo comum: quem pinta é
   * `setColorAt`, e é preciso avisar que mudou. Sem isso as esferas saem pretas
   * — e átomo preto é justamente o que a regra CPK existe para evitar.
   */
  useEffect(() => {
    const atoms = atomsRef.current;
    if (!atoms) return;

    const color = new Color();
    geometry.atoms.forEach((atom, index) => {
      atoms.setColorAt(index, color.set(colorOf(cpk, atom.element)));
    });

    if (atoms.instanceColor !== null) atoms.instanceColor.needsUpdate = true;
  }, [geometry.atoms, cpk]);

  /**
   * Geometria nova, dobramento do começo.
   *
   * Sem isto o relógio nunca voltava a zero: a partir da segunda molécula, o
   * tempo decorrido já passava dos dois segundos do dobramento e toda estrutura
   * nascia pronta, sem a animação que é metade do que o produto mostra.
   */
  useEffect(() => {
    startRef.current = null;
    vibeRef.current = null;
    reportedRef.current = null;
    doneRef.current = null;
  }, [geometry]);

  // A vibração recomeça no quadro zero — que é a própria geometria mínima —
  // sempre que a trajetória troca, o modo troca ou o movimento é religado.
  useEffect(() => {
    vibeRef.current = null;
  }, [trajectory, animate, mode]);

  const atomRadii = useMemo(
    () => geometry.atoms.map((atom) => radiusOf(atom.element)),
    [geometry.atoms],
  );

  /**
   * As varetas: uma por ligação simples, duas na dupla, três na tripla.
   *
   * A lista é fixa para uma geometria, então ela é montada uma vez — o que muda
   * a cada quadro é só onde cada vareta está.
   */
  const sticks = useMemo(() => sticksOf(geometry), [geometry]);

  useFrame(({ clock, camera }) => {
    const atoms = atomsRef.current;
    const bonds = bondsRef.current;
    if (!atoms || !bonds) return;

    const now = clock.getElapsedTime() * 1000;
    startRef.current ??= now;

    const elapsed = animate ? now - startRef.current : FOLD_DURATION;
    const sample = sampleFolding(geometry, elapsed);

    // A energia é avisada por mudança, não por quadro: sessenta `setState` por
    // segundo repintam a árvore inteira e engasgam justamente a animação que
    // eles descrevem.
    const reported = reportedRef.current;
    const changed = reported === null || Math.abs(sample.energy - reported) > ENERGY_STEP;

    // A virada de regime — dobrou, agora vibra — sempre é avisada, mesmo quando
    // a energia mal se move: é ela que troca a palavra na faixa da cena.
    if (changed || doneRef.current !== sample.done) {
      reportedRef.current = sample.energy;
      doneRef.current = sample.done;
      onEnergy?.(sample.energy, sample.done);
    }

    // Terminado o dobramento, a molécula passa a vibrar: mesma física, outro
    // regime. Quem pediu menos movimento fica na forma final, parada.
    let positions = sample.positions;

    if (sample.done && animate && mode) {
      // Com um modo escolhido, a cena mostra só ele: a molécula deixa de ser
      // uma amostra térmica e vira o movimento único que aquela frequência
      // descreve.
      vibeRef.current ??= now;
      positions = sampleMode(sample.positions, mode, now - vibeRef.current);
    } else if (sample.done && animate && trajectory) {
      vibeRef.current ??= now;
      positions = sampleDynamics(trajectory, now - vibeRef.current);
    }

    const positionAt = (index: number): Vector3 =>
      position.set(
        positions[index * 3] ?? 0,
        positions[index * 3 + 1] ?? 0,
        positions[index * 3 + 2] ?? 0,
      );

    const visible = (index: number): boolean =>
      showHydrogens || geometry.atoms[index]?.element !== 'H';

    for (let index = 0; index < geometry.atoms.length; index += 1) {
      const base = atomRadii[index] ?? 0.38;
      const radius = visible(index) ? base * (spaceFilling ? SPACE_FILLING : 1) : 0;

      matrix.compose(
        positionAt(index).clone(),
        rotation.identity(),
        scale.set(radius, radius, radius),
      );
      atoms.setMatrixAt(index, matrix);
    }
    atoms.instanceMatrix.needsUpdate = true;

    sticks.forEach((stick, index) => {
      const bond = geometry.bonds[stick.bond];
      if (!bond) return;

      const hidden = spaceFilling || !visible(bond.from) || !visible(bond.to);
      const start = positionAt(bond.from).clone();
      const end = positionAt(bond.to).clone();

      direction.subVectors(end, start);
      const length = direction.length();
      if (length < 1e-6) return;

      const axis = direction.clone().normalize();
      rotation.setFromUnitVectors(UP, axis);

      const middle = start.clone().add(end).multiplyScalar(0.5);

      // A vareta de fora do eixo anda perpendicular à ligação, no plano em que a
      // ligação está — é o vizinho que diz qual plano é esse.
      if (stick.offset !== 0) {
        const reference =
          stick.reference === null ? null : positionAt(stick.reference).clone().sub(start);

        const semPlano =
          reference === null || Math.abs(reference.dot(axis)) > reference.length() * 0.99;

        /*
         * Sem vizinho fora do eixo — uma molécula linear, como o acetileno —
         * não existe plano químico para respeitar. Aí o critério passa a ser
         * quem olha: as varetas abrem no plano da tela, senão elas se projetam
         * umas sobre as outras e a tripla vira uma vareta só.
         */
        const guide = semPlano ? camera.getWorldDirection(direction.clone()) : reference;

        const perpendicular = guide.clone().cross(axis).normalize();
        middle.addScaledVector(perpendicular, stick.offset * MULTIPLE_GAP);
      }

      const thickness = bond.order === 1 ? STICK : MULTIPLE_STICK;

      matrix.compose(
        middle,
        rotation,
        hidden ? scale.set(0, 0, 0) : scale.set(thickness, length, thickness),
      );
      bonds.setMatrixAt(index, matrix);
    });
    bonds.instanceMatrix.needsUpdate = true;

    // As letras de configuração acompanham os átomos: a molécula está vibrando,
    // e rótulo parado ao lado de átomo que se mexe deixa de apontar para ele.
    stereo.forEach((entry, index) => {
      const label = labelsRef.current[index];
      if (!label) return;

      const atom = geometry.atoms.findIndex((candidate) => candidate.source === entry.source);
      if (atom < 0) {
        label.visible = false;
        return;
      }

      label.visible = true;
      label.position.copy(positionAt(atom));
    });

    // O halo acompanha o átomo aceso quadro a quadro: a molécula está vibrando,
    // e um anel parado ao lado de uma esfera que se mexe não indica nada.
    const halo = haloRef.current;
    if (halo) {
      const index =
        highlight === null || highlight === undefined
          ? -1
          : geometry.atoms.findIndex((atom) => atom.source === highlight);

      halo.visible = index >= 0;
      if (index >= 0) {
        const radius = (atomRadii[index] ?? 0.38) * (spaceFilling ? SPACE_FILLING : 1) + 0.16;
        halo.position.copy(positionAt(index));
        halo.scale.setScalar(radius);
      }
    }
  });

  const report = (event: ThreeEvent<PointerEvent>): void => {
    if (!onHover) return;
    event.stopPropagation();

    const index = event.instanceId;
    if (index === undefined) return;

    const atom = geometry.atoms[index];
    if (atom) onHover(atom.source);
  };

  return (
    <group>
      <instancedMesh
        // A chave força uma malha nova quando a molécula muda de tamanho: a
        // contagem de instâncias é fixada na criação.
        key={`atomos-${String(geometry.atoms.length)}`}
        ref={atomsRef}
        args={[undefined, undefined, Math.max(1, geometry.atoms.length)]}
        castShadow={false}
        onPointerMove={report}
        onPointerOut={() => {
          onHover?.(null);
        }}
      >
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial roughness={0.32} metalness={0.05} />
      </instancedMesh>

      <instancedMesh
        key={`varetas-${String(sticks.length)}`}
        ref={bondsRef}
        args={[undefined, undefined, Math.max(1, sticks.length)]}
      >
        <cylinderGeometry args={[1, 1, 1, 16]} />
        <meshStandardMaterial color={cpk.bond} roughness={0.45} metalness={0.05} />
      </instancedMesh>

      {stereo.map((entry, index) => (
        <group
          key={entry.source}
          ref={(node) => {
            labelsRef.current[index] = node;
          }}
        >
          <Html center distanceFactor={9} className={styles.stereo} zIndexRange={[10, 0]}>
            {entry.label}
          </Html>
        </group>
      ))}

      {/* O halo é turquesa de propósito: nenhum elemento é turquesa no CPK, então
          ele nunca vai ser confundido com um átomo. */}
      <mesh ref={haloRef} visible={false} raycast={() => null}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color={cpk.highlight} transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * A cena não repinta por repintura da página.
 *
 * Tudo o que ela desenha é atualizado quadro a quadro por matriz, dentro do
 * `useFrame`; render do React aqui só serve para trocar molécula. Sem a
 * memoização, cada `setState` de fora — a energia, o átomo apontado — refazia a
 * árvore inteira no meio da animação.
 */
export const Molecule = memo(MoleculeScene);
