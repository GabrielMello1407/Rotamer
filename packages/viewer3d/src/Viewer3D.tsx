'use client';

import type { DynamicsTrajectory, Geometry } from '@rotamer/core';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
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
  /** O átomo do desenho aceso agora, para a esfera correspondente ganhar halo. */
  readonly highlight?: number | null | undefined;
  /** Avisa qual átomo do desenho está sob o cursor na cena. */
  readonly onHover?: ((source: number | null) => void) | undefined;
  /**
   * Avisa que a cena pediu mais espaço.
   *
   * Quem decide o tamanho é quem colocou a cena na página — ela não sabe o que
   * mais existe na tela nem tem direito de cobrir o desenho inteiro.
   */
  readonly onExpand?: ((expanded: boolean) => void) | undefined;
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
  highlight,
  onHover,
  onExpand,
}: Viewer3DProps): ReactElement {
  const stageRef = useRef<HTMLDivElement | null>(null);
  // Só o que este componente precisa do controle de órbita. Tipar por estrutura
  // evita depender do pacote interno de onde a implementação vem.
  const orbitRef = useRef<{ reset: () => void } | null>(null);
  const [cpk, setCpk] = useState<Cpk | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [settled, setSettled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const [vibrating, setVibrating] = useState(true);
  const [spaceFilling, setSpaceFilling] = useState(false);
  const [showHydrogens, setShowHydrogens] = useState(true);
  const [expanded, setExpanded] = useState(false);

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

  // Esc devolve a cena ao tamanho de canto, como fecha qualquer coisa aberta.
  useEffect(() => {
    if (!expanded) return;

    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setExpanded(false);
        onExpand?.(false);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [expanded, onExpand]);

  const view = useMemo(() => {
    if (!geometry) return null;

    const center = centerOf(geometry);
    const radius = radiusOf(geometry);

    // Perto o bastante para a molécula ocupar a cena, longe o bastante para não
    // cortar átomo quando ela gira. A direção é normalizada: sem isso a câmera
    // fica 14% mais longe do que o cálculo pediu, e a molécula sai pequena.
    const distance = radius * 2.3 + 1.8;
    const direction = [0.4, 0.35, 1];
    const length = Math.hypot(direction[0] ?? 0, direction[1] ?? 0, direction[2] ?? 0);

    return {
      center,
      position: direction.map((axis) => (axis / length) * distance) as [number, number, number],
    };
  }, [geometry]);

  const onEnergy = useCallback((value: number, done: boolean) => {
    setEnergy(value);
    setSettled(done);
  }, []);

  const animate = !reducedMotion && vibrating;

  // Qual átomo está aceso, para a cena dizer o nome dele em vez de só acender.
  const hovered =
    geometry && highlight !== null && highlight !== undefined
      ? geometry.atoms.find((atom) => atom.source === highlight)
      : undefined;

  return (
    <div
      ref={stageRef}
      className={[styles.stage, className].filter(Boolean).join(' ')}
      data-testid="cena-3d"
    >
      {geometry && cpk && view ? (
        <>
          <Canvas
            className={styles.canvas}
            camera={{ position: view.position, fov: 40 }}
            dpr={[1, 2]}
          >
            <ambientLight intensity={1.05} />
            <hemisphereLight intensity={0.55} groundColor={cpk.stageBottom} />
            <directionalLight position={[6, 8, 10]} intensity={1.25} />
            <directionalLight position={[-8, -4, -6]} intensity={0.45} />

            <group position={[-view.center[0], -view.center[1], -view.center[2]]}>
              <Molecule
                geometry={geometry}
                cpk={cpk}
                trajectory={trajectory}
                animate={animate}
                spaceFilling={spaceFilling}
                showHydrogens={showHydrogens}
                highlight={highlight}
                onHover={onHover}
                onEnergy={onEnergy}
              />
            </group>

            <OrbitControls
              ref={(instance) => {
                orbitRef.current = instance;
              }}
              enablePan={false}
              enableDamping
              dampingFactor={0.08}
            />
          </Canvas>

          <div className={styles.controls} role="group" aria-label="Controles da cena">
            <SceneButton
              active={vibrating}
              label="Vibrar"
              testId="alternar-vibracao"
              onClick={() => {
                setVibrating((current) => !current);
              }}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.icon}>
                <path
                  d="M1 8h2.2l1.6-4.4 2.4 9L9.8 8H15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={styles.label}>Vibrar</span>
            </SceneButton>

            <SceneButton
              active={spaceFilling}
              label="Preenchimento de espaço"
              testId="alternar-volume"
              onClick={() => {
                setSpaceFilling((current) => !current);
              }}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.icon}>
                <circle cx="6" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="11" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              <span className={styles.label}>Volume</span>
            </SceneButton>

            <SceneButton
              active={showHydrogens}
              label="Mostrar hidrogênios"
              testId="alternar-hidrogenios"
              onClick={() => {
                setShowHydrogens((current) => !current);
              }}
            >
              H
            </SceneButton>

            <SceneButton
              active={false}
              label="Recentrar a cena"
              testId="recentrar-cena"
              onClick={() => {
                orbitRef.current?.reset();
              }}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.icon}>
                <path
                  d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5V5h-2.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </SceneButton>

            <span className={styles.spacer} />

            <SceneButton
              active={expanded}
              label={expanded ? 'Reduzir a cena' : 'Ampliar a cena'}
              testId="ampliar-cena"
              onClick={() => {
                const next = !expanded;
                setExpanded(next);
                onExpand?.(next);
              }}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.icon}>
                <path
                  d="M2 6V2h4M14 10v4h-4M14 6V2h-4M2 10v4h4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </SceneButton>
          </div>
        </>
      ) : (
        <p className={styles.empty}>{placeholder}</p>
      )}

      {geometry && energy !== null && (
        <p className={styles.energy} data-testid="energia">
          <span className={styles.energyLabel}>
            {settled && animate && trajectory ? 'dinâmica' : 'energia'}
          </span>
          {new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }).format(energy)}
          <span className={styles.energyLabel}>kcal/mol</span>
          {!hovered && (
            <span className={styles.energyLabel}>· {geometry.atoms.length} átomos</span>
          )}
        </p>
      )}

      {hovered && highlight !== null && highlight !== undefined && (
        <p className={styles.hovered} data-testid="atomo-apontado">
          <span className={styles.hoveredSymbol} data-element={hovered.element}>
            {hovered.element}
          </span>
          <span className={styles.energyLabel}>· átomo {highlight + 1}</span>
        </p>
      )}
    </div>
  );
}

interface SceneButtonProps {
  readonly active: boolean;
  readonly label: string;
  readonly testId: string;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}

/** Botão da barra da cena: pequeno, sem moldura até estar ligado. */
function SceneButton({ active, label, testId, onClick, children }: SceneButtonProps): ReactElement {
  return (
    <button
      type="button"
      className={styles.control}
      aria-pressed={active}
      aria-label={label}
      title={label}
      data-testid={testId}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
