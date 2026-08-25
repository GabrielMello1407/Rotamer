'use client';

import type { DynamicsTrajectory, Geometry } from '@rotamer/core';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { readCpk, type Cpk } from './cpk';
import { centerOf, radiusOf } from './folding';
import { Molecule } from './Molecule';
import styles from './Viewer3D.module.css';

export interface Viewer3DProps {
  readonly geometry: Geometry | null;
  /** A vibração. Chega depois da forma, quando o worker termina de simular. */
  readonly trajectory?: DynamicsTrajectory | null | undefined;
  /** Texto mostrado quando ainda não há molécula para mostrar. */
  readonly placeholder?: string;
  readonly className?: string | undefined;
}

/**
 * A cena 3D.
 *
 * Aqui não existe química nenhuma: as posições chegam prontas do worker, e este
 * pacote só desenha. Se o Three.js sumisse amanhã, nada do que decide se a
 * molécula existe mudaria de lugar.
 */
export function Viewer3D({
  geometry,
  trajectory,
  placeholder = 'Desenhe uma estrutura válida para ver a forma dela no espaço.',
  className,
}: Viewer3DProps): ReactElement {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [cpk, setCpk] = useState<Cpk | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // As cores vêm dos tokens, e os tokens mudam com o tema.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reread = (): void => {
      setCpk(readCpk(stage));
    };
    reread();

    const themeObserver = new MutationObserver(reread);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    scheme.addEventListener('change', reread);

    return () => {
      themeObserver.disconnect();
      scheme.removeEventListener('change', reread);
    };
  }, []);

  // Quem pediu menos movimento recebe a geometria final direto, sem dobramento.
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (): void => {
      setReducedMotion(media.matches);
    };

    update();
    media.addEventListener('change', update);
    return () => {
      media.removeEventListener('change', update);
    };
  }, []);

  const view = useMemo(() => {
    if (!geometry) return null;

    const center = centerOf(geometry);
    const radius = radiusOf(geometry);
    return { center, distance: radius * 3.2 + 3 };
  }, [geometry]);

  return (
    <div
      ref={stageRef}
      className={[styles.stage, className].filter(Boolean).join(' ')}
      data-testid="cena-3d"
    >
      {geometry && cpk && view ? (
        <Canvas
          className={styles.canvas}
          camera={{ position: [view.distance * 0.4, view.distance * 0.35, view.distance], fov: 40 }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.85} />
          <directionalLight position={[6, 8, 10]} intensity={1.1} />
          <directionalLight position={[-8, -4, -6]} intensity={0.35} />

          <group position={[-view.center[0], -view.center[1], -view.center[2]]}>
            <Molecule
              geometry={geometry}
              cpk={cpk}
              trajectory={trajectory}
              animate={!reducedMotion}
              onEnergy={(value) => {
                setEnergy(value);
              }}
            />
          </group>

          <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} />
        </Canvas>
      ) : (
        <p className={styles.empty}>{placeholder}</p>
      )}

      {geometry && energy !== null && (
        <p className={styles.energy} data-testid="energia">
          <span className={styles.energyLabel}>energia</span>
          {new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }).format(energy)}
          <span className={styles.energyLabel}>kcal/mol</span>
        </p>
      )}
    </div>
  );
}
