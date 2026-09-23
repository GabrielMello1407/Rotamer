'use client';

import type { DynamicsTrajectory, Geometry } from '@rotamer/core';
import { useFormatters, useMessages } from '@rotamer/i18n/react';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { readCpk, type Cpk } from './cpk';
import { centerOf, radiusOf } from './folding';
import { viewerMessages } from './messages';
import { Molecule } from './Molecule';
import styles from './Viewer3D.module.css';

export interface Viewer3DProps {
  readonly geometry: Geometry | null;
  /** A vibração. Chega depois da forma, quando o worker termina de simular. */
  readonly trajectory?: DynamicsTrajectory | null | undefined;
  /**
   * Texto mostrado quando ainda não há molécula para mostrar. Omitido, sai o
   * do dicionário, no idioma de quem está lendo.
   */
  readonly placeholder?: string | undefined;
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
  /** O modo normal em exibição, quando alguém escolheu um. */
  readonly mode?: SelectedMode | null | undefined;
  /** `R` e `S` de cada centro, pelo índice do átomo no desenho. */
  readonly stereo?: readonly { readonly source: number; readonly label: string }[];
  /** Voltar para a vibração térmica. */
  readonly onClearMode?: (() => void) | undefined;
}

export interface SelectedMode {
  /** Posição do modo na lista, começando em 1 — é assim que se cita. */
  readonly number: number;
  /** Número de onda em cm⁻¹. Negativo quer dizer imaginário. */
  readonly wavenumber: number;
  /** Deslocamento cartesiano por átomo, achatado. */
  readonly displacement: readonly number[];
  /** `estiramento` ou `dobramento`, pelo que domina o movimento. */
  readonly kind: string;
}

/**
 * A cena 3D.
 *
 * Aqui não existe química nenhuma: as posições chegam prontas do worker, e este
 * pacote só desenha. Se o Three.js sumisse amanhã, nada do que decide se a
 * molécula existe mudaria de lugar.
 */
/** Abertura vertical da câmera, em graus. */
const FOV = 38;

/** Folga em torno da molécula, em ångström. */
const PADDING = 1.2;

export function Viewer3D({
  geometry,
  trajectory,
  placeholder,
  className,
  highlight,
  onHover,
  onExpand,
  mode,
  onClearMode,
  stereo,
}: Viewer3DProps): ReactElement {
  const messages = useMessages(viewerMessages);
  const { locale, number } = useFormatters();

  /**
   * Número de onda como a espectroscopia escreve: sem separador de milhar.
   * Fica dentro do componente porque o idioma pode mudar sem a página recarregar.
   */
  const wavenumber = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0, useGrouping: false }),
    [locale],
  );

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

    /*
     * A distância que faz a molécula caber inteira, em qualquer rotação.
     *
     * A molécula gira, então o que precisa caber não é a silhueta de agora: é a
     * esfera que a contém. A folga cobre três coisas: o raio da esfera do átomo
     * da ponta, a amplitude da vibração, e as duas faixas que passam por cima da
     * cena — controles em cima, energia embaixo.
     */
    const halfFov = (FOV / 2) * (Math.PI / 180);
    const distance = (radius + PADDING) / Math.tan(halfFov);
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

  // Sem campo de força não há energia nem trajetória: a forma aparece, parada.
  const relaxed = geometry?.relaxed ?? true;
  const animate = !reducedMotion && vibrating && relaxed;

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
            camera={{ position: view.position, fov: FOV }}
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
                mode={mode?.displacement ?? null}
                stereo={stereo}
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

          <div className={styles.controls} role="group" aria-label={messages.sceneControls}>
            <SceneButton
              active={vibrating && relaxed}
              disabled={!relaxed}
              label={
                relaxed
                  ? messages.vibrate
                  : messages.noVibration(
                      geometry?.unsupported.join(', ') ?? messages.someElement,
                    )
              }
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
              <span className={styles.label}>{messages.vibrate}</span>
            </SceneButton>

            <SceneButton
              active={spaceFilling}
              label={messages.spaceFilling}
              testId="alternar-volume"
              onClick={() => {
                setSpaceFilling((current) => !current);
              }}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.icon}>
                <circle cx="6" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="11" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              <span className={styles.label}>{messages.spaceFillingShort}</span>
            </SceneButton>

            <SceneButton
              active={showHydrogens}
              label={messages.showHydrogens}
              testId="alternar-hidrogenios"
              onClick={() => {
                setShowHydrogens((current) => !current);
              }}
            >
              H
            </SceneButton>

            <SceneButton
              active={false}
              label={messages.recenter}
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
              label={expanded ? messages.shrink : messages.expand}
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
        <p className={styles.empty}>{placeholder ?? messages.placeholder}</p>
      )}

      {geometry && mode && (
        <p className={styles.mode} data-testid="modo-em-exibicao">
          <span className={styles.modeNumber}>{messages.mode(mode.number)}</span>
          <span className={styles.modeWave}>
            {wavenumber.format(mode.wavenumber)}
            {' cm⁻¹'}
          </span>
          <span className={styles.energyLabel}>{mode.kind}</span>
          <button
            type="button"
            className={styles.control}
            aria-label={messages.leaveMode}
            title={messages.leaveMode}
            data-testid="sair-do-modo"
            onClick={() => {
              onClearMode?.();
            }}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.icon}>
              <path
                d="M4 4l8 8M12 4l-8 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </p>
      )}

      {geometry && !relaxed && (
        <p className={styles.unrelaxed} data-testid="forma-sem-campo">
          {messages.unrelaxed(geometry.unsupported.join(', '))}
        </p>
      )}

      {geometry && relaxed && energy !== null && !mode && (
        <p className={styles.energy} data-testid="energia">
          <span className={styles.energyLabel}>
            {settled && animate && trajectory ? messages.dynamics : messages.energy}
          </span>
          {number(energy, 1)}
          <span className={styles.energyLabel}>kcal/mol</span>
          {!hovered && (
            <span className={styles.energyLabel}>· {messages.atoms(geometry.atoms.length)}</span>
          )}
        </p>
      )}

      {hovered && highlight !== null && highlight !== undefined && (
        <p className={styles.hovered} data-testid="atomo-apontado">
          <span className={styles.hoveredSymbol} data-element={hovered.element}>
            {hovered.element}
          </span>
          <span className={styles.energyLabel}>· {messages.atom(highlight + 1)}</span>
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
  readonly disabled?: boolean;
}

/** Botão da barra da cena: pequeno, sem moldura até estar ligado. */
function SceneButton({
  active,
  label,
  testId,
  onClick,
  children,
  disabled = false,
}: SceneButtonProps): ReactElement {
  return (
    <button
      type="button"
      className={styles.control}
      aria-pressed={active}
      aria-label={label}
      title={label}
      disabled={disabled}
      data-testid={testId}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
