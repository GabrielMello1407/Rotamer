'use client';

import type { DynamicsTrajectory, Geometry } from '@rotamer/core';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactElement } from 'react';
import { Color, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three';
import { colorOf, radiusOf, type Cpk } from './cpk';
import { sampleDynamics, sampleFolding, FOLD_DURATION } from './folding';

export interface MoleculeProps {
  readonly geometry: Geometry;
  readonly cpk: Cpk;
  /** Sem movimento: vai direto para a geometria final e não vibra. */
  readonly animate: boolean;
  /** A vibração, quando o worker já terminou de simular. */
  readonly trajectory?: DynamicsTrajectory | null | undefined;
  readonly onEnergy?: ((energy: number, done: boolean) => void) | undefined;
}

const UP = new Vector3(0, 1, 0);

/** Espessura da vareta, em ångström. */
const STICK = 0.09;

/**
 * A molécula em bola-e-vareta.
 *
 * Átomos e ligações são malhas instanciadas: uma esfera e um cilindro só,
 * repetidos por matriz. É o que segura 60 fps enquanto o dobramento roda, mesmo
 * em celular fraco.
 */
export function Molecule({
  geometry,
  cpk,
  animate,
  trajectory,
  onEnergy,
}: MoleculeProps): ReactElement {
  const atomsRef = useRef<InstancedMesh | null>(null);
  const bondsRef = useRef<InstancedMesh | null>(null);
  const startRef = useRef<number | null>(null);

  const matrix = useMemo(() => new Matrix4(), []);
  const position = useMemo(() => new Vector3(), []);
  const scale = useMemo(() => new Vector3(), []);
  const rotation = useMemo(() => new Quaternion(), []);
  const direction = useMemo(() => new Vector3(), []);

  const atomColors = useMemo(() => {
    const colors = new Float32Array(geometry.atoms.length * 3);
    geometry.atoms.forEach((atom, index) => {
      const color = new Color(colorOf(cpk, atom.element));
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    });
    return colors;
  }, [geometry.atoms, cpk]);

  const atomRadii = useMemo(
    () => geometry.atoms.map((atom) => radiusOf(atom.element)),
    [geometry.atoms],
  );

  useFrame(({ clock }) => {
    const atoms = atomsRef.current;
    const bonds = bondsRef.current;
    if (!atoms || !bonds) return;

    const now = clock.getElapsedTime() * 1000;
    startRef.current ??= now;

    const elapsed = animate ? now - startRef.current : FOLD_DURATION;
    const sample = sampleFolding(geometry, elapsed);
    onEnergy?.(sample.energy, sample.done);

    // Terminado o dobramento, a molécula passa a vibrar: mesma física, outro
    // regime. Quem pediu menos movimento fica na forma final, parada.
    const positions =
      sample.done && animate && trajectory
        ? sampleDynamics(trajectory, elapsed - FOLD_DURATION)
        : sample.positions;

    const positionAt = (index: number): Vector3 =>
      position.set(
        positions[index * 3] ?? 0,
        positions[index * 3 + 1] ?? 0,
        positions[index * 3 + 2] ?? 0,
      );

    for (let index = 0; index < geometry.atoms.length; index += 1) {
      const radius = atomRadii[index] ?? 0.38;
      matrix.compose(
        positionAt(index).clone(),
        rotation.identity(),
        scale.set(radius, radius, radius),
      );
      atoms.setMatrixAt(index, matrix);
    }
    atoms.instanceMatrix.needsUpdate = true;

    geometry.bonds.forEach((bond, index) => {
      const start = positionAt(bond.from).clone();
      const end = positionAt(bond.to).clone();

      direction.subVectors(end, start);
      const length = direction.length();
      if (length < 1e-6) return;

      rotation.setFromUnitVectors(UP, direction.clone().normalize());
      matrix.compose(
        start.clone().add(end).multiplyScalar(0.5),
        rotation,
        scale.set(STICK, length, STICK),
      );
      bonds.setMatrixAt(index, matrix);
    });
    bonds.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh
        ref={atomsRef}
        args={[undefined, undefined, Math.max(1, geometry.atoms.length)]}
        castShadow={false}
      >
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial vertexColors roughness={0.35} metalness={0.05} />
        <instancedBufferAttribute
          attach="instanceColor"
          args={[atomColors, 3]}
          count={geometry.atoms.length}
        />
      </instancedMesh>

      <instancedMesh ref={bondsRef} args={[undefined, undefined, Math.max(1, geometry.bonds.length)]}>
        <cylinderGeometry args={[1, 1, 1, 12]} />
        <meshStandardMaterial color={cpk.bond} roughness={0.5} metalness={0.05} />
      </instancedMesh>
    </group>
  );
}
