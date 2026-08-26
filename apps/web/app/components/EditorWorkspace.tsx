'use client';

import { fromMolblock } from '@rotamer/core';
import { Editor2D, Toolbar, createEditorStore } from '@rotamer/editor2d';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useStore } from 'zustand';
import { AnalysisDrawer, type DrawerTab } from './AnalysisDrawer';
import styles from './EditorWorkspace.module.css';
import { MetricsBar } from './MetricsBar';
import { TopBar } from './TopBar';
import { useChemistryClient } from './use-chemistry-client';
import { useDraft } from './use-draft';
import { useInitialSmiles } from './use-initial-smiles';
import { useMolecule } from './use-molecule';
import type { NormalModes } from '@rotamer/core';
import { track } from '../../lib/track';

/**
 * A cena 3D chega depois.
 *
 * Three.js, o renderizador e os controles são o pedaço mais pesado do pacote, e
 * nada disso é necessário para a primeira coisa que a pessoa faz: desenhar. Com
 * o carregamento adiado, o traço fica disponível antes — e num celular fraco em
 * 3G essa diferença é de segundos.
 */
const Viewer3D = dynamic(
  () => import('@rotamer/viewer3d').then((entrada) => entrada.Viewer3D),
  { ssr: false },
);

export interface EditorWorkspaceProps {
  /** Quem está identificado, quando há banco e sessão. */
  readonly accountName?: string | null;
  readonly showAccount?: boolean;
}

/**
 * A bancada.
 *
 * A tela de desenho ocupa tudo o que sobra: barra fina em cima, ferramentas em
 * pé na borda, números no pé e a cena 3D flutuando no canto. Painel de análise
 * só quando pedido — a molécula é o objeto, o resto é apoio.
 *
 * O grafo do editor é a única coisa que existe de verdade aqui. Tudo o que
 * aparece ao lado — fórmula, massa, descritores, conformação — é derivado dele
 * pelo worker e recalculável a qualquer momento.
 */
export function EditorWorkspace({
  accountName = null,
  showAccount = false,
}: EditorWorkspaceProps): ReactElement {
  const store = useMemo(() => createEditorStore(), []);
  const graph = useStore(store, (state) => state.graph);
  const hover = useStore(store, (state) => state.hover);
  const focus = useStore(store, (state) => state.focus);

  const [questSlug, setQuestSlug] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [sceneWide, setSceneWide] = useState(false);
  const [tab, setTab] = useState<DrawerTab>('analysis');

  const connection = useChemistryClient();
  // O desenho precisa saber quantos hidrogênios o RDKit contou em cada átomo.
  const applyHydrogens = useCallback(
    (hydrogens: ReadonlyMap<number, number>) => {
      store.getState().setHydrogens(hydrogens);
    },
    [store],
  );

  // E a configuração de cada centro, que o desenho escreve ao lado do átomo.
  const applyStereo = useCallback(
    (atoms: ReadonlyMap<number, string>, bonds: ReadonlyMap<number, string>) => {
      store.getState().setStereo(atoms, bonds);
    },
    [store],
  );

  const { analysis, geometry, trajectory, modes, geometryError, pending } = useMolecule(
    graph,
    connection,
    applyHydrogens,
    applyStereo,
  );

  /**
   * O modo normal em exibição.
   *
   * Escolhido na lista do painel, mostrado sozinho na cena — a molécula deixa de
   * ser uma amostra a 300 K e passa a ser um movimento só, que é como se estuda
   * vibração.
   *
   * A escolha guarda junto de que lista ela veio: o modo 7 de uma molécula não é
   * o modo 7 da outra, então trocar de molécula descarta a escolha sozinho, sem
   * efeito nenhum precisar limpar nada.
   */
  const [chosen, setChosen] = useState<{
    readonly from: NormalModes | null;
    readonly index: number;
  } | null>(null);

  const selectedMode = chosen !== null && chosen.from === modes ? chosen.index : null;

  const selectMode = useCallback(
    (index: number | null) => {
      setChosen(index === null ? null : { from: modes, index });
    },
    [modes],
  );

  const mode = useMemo(() => {
    if (selectedMode === null) return null;

    const chosen = modes?.modes[selectedMode];
    if (!chosen) return null;

    return {
      number: selectedMode + 1,
      wavenumber: chosen.wavenumber,
      displacement: chosen.displacement,
      kind: chosen.stretch >= chosen.bend ? 'estiramento' : 'dobramento',
    };
  }, [selectedMode, modes]);

  const fromLink = useInitialSmiles(store, connection);
  useDraft(store, !fromLink);

  // A primeira estrutura válida da visita: é o número que diz se quem abriu a
  // página chegou a desenhar alguma coisa.
  const reachedRef = useRef(false);

  useEffect(() => {
    if (reachedRef.current || analysis?.ok !== true) return;

    reachedRef.current = true;
    track('primeira-molecula');
  }, [analysis]);

  // O átomo que o RDKit culpou pelo erro vira marca no desenho: a mensagem fala
  // de um átomo, e sem isto ninguém sabe qual dos dois oxigênios é o culpado.
  useEffect(() => {
    const offending = analysis?.ok === false ? analysis.error.atom : undefined;
    const atom = offending ? graph.atoms[offending.index] : undefined;
    store.getState().setFlagged(atom?.id ?? null);
  }, [analysis, graph.atoms, store]);

  /**
   * O átomo aceso, venha o cursor de onde vier.
   *
   * As duas telas mostram a mesma molécula, então o destaque é um só: o vértice
   * do desenho e a esfera da cena acendem juntos, e a cena diz de que elemento
   * se trata. Sem isso, apontar no espaço acenderia o desenho e deixaria a
   * própria esfera apagada.
   */
  const highlight = useMemo(() => {
    const lit = hover?.kind === 'atom' ? hover.id : focus;
    if (lit === null || lit === undefined) return null;

    const index = graph.atoms.findIndex((atom) => atom.id === lit);
    return index < 0 ? null : index;
  }, [hover, focus, graph.atoms]);

  // E o contrário: a esfera apontada na cena acende o vértice do desenho.
  const onSceneHover = useCallback(
    (source: number | null) => {
      const atom = source === null ? undefined : graph.atoms[source];
      store.getState().setFocus(atom?.id ?? null);
    },
    [graph.atoms, store],
  );

  // O enquadramento precisa saber o que está por cima da tela de desenho: a
  // barra em pé, a faixa de números e a cena 3D. Sem isso, "enquadrar" põe
  // metade da molécula atrás da cena.
  const areaRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const metricsRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;

    const measure = (): void => {
      const bounds = area.getBoundingClientRect();
      if (bounds.width === 0) return;

      const width = (element: HTMLElement | null): number =>
        element === null ? 0 : element.getBoundingClientRect().width;
      const height = (element: HTMLElement | null): number =>
        element === null ? 0 : element.getBoundingClientRect().height;

      store.getState().setInsets({
        left: width(railRef.current) + 24,
        right: width(viewerRef.current) + 24,
        top: 8,
        bottom: Math.max(height(metricsRef.current), height(viewerRef.current) * 0.35) + 24,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(area);
    if (viewerRef.current) observer.observe(viewerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [store, panelOpen]);

  const openPanel = useCallback((next: DrawerTab) => {
    setTab(next);
    setPanelOpen(true);
  }, []);

  // Clicar num exemplo antes de o motor subir não é erro: o pedido espera na
  // fila e entra assim que o worker responde. Num celular fraco isso é a regra.
  const [wanted, setWanted] = useState<string | null>(null);
  const client = connection.status === 'ready' ? connection.client : null;

  useEffect(() => {
    if (wanted === null || !client) return;

    let alive = true;

    const load = async (): Promise<void> => {
      const result = await client.analyze(wanted);
      if (!alive) return;

      setWanted(null);
      if (!result.ok) return;

      store.getState().commit(fromMolblock(result.molecule.molblock));
      store.getState().frame();
    };

    void load();
    return () => {
      alive = false;
    };
  }, [wanted, client, store]);

  return (
    <div className={styles.shell}>
      <TopBar
        analysis={analysis}
        waitingForEngine={connection.status === 'loading' && graph.atoms.length > 0}
        accountName={accountName}
        showAccount={showAccount}
        panelOpen={panelOpen}
        onPanel={openPanel}
        onExample={(smiles) => {
          track('exemplo-carregado');
          setWanted(smiles);
        }}
      />

      <div className={styles.stage}>
        <div className={styles.canvasArea} ref={areaRef}>
          <Editor2D store={store} />

          <div className={styles.rail} ref={railRef}>
            <Toolbar store={store} />
          </div>

          <div className={styles.metrics} ref={metricsRef}>
            <MetricsBar
              analysis={analysis}
              pending={pending}
              waitingForEngine={connection.status === 'loading' && graph.atoms.length > 0}
              onOpen={() => {
                openPanel('analysis');
              }}
            />
          </div>

          <div
            className={[styles.viewer, sceneWide ? styles.viewerWide : null]
              .filter(Boolean)
              .join(' ')}
            ref={viewerRef}
          >
            <Viewer3D
              geometry={geometry}
              trajectory={trajectory}
              highlight={highlight}
              onHover={onSceneHover}
              mode={mode}
              onClearMode={() => {
                selectMode(null);
              }}
              onExpand={(wide) => {
                setSceneWide(wide);

                // A área livre mudou de tamanho: reenquadrar é o que evita a
                // molécula ficar metade atrás da cena.
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    store.getState().frame();
                  });
                });
              }}
              placeholder={
                geometryError ?? 'A forma no espaço aparece assim que a estrutura fechar.'
              }
            />
          </div>
        </div>

        {panelOpen && (
          <AnalysisDrawer
            analysis={analysis}
            modes={modes}
            modesPending={geometry !== null && modes === null}
            unsupported={geometry?.unsupported ?? []}
            selectedMode={selectedMode}
            onSelectMode={selectMode}
            onNew={() => {
              store.getState().clear();
            }}
            connection={connection}
            store={store}
            tab={tab}
            onTab={setTab}
            onClose={() => {
              setPanelOpen(false);
            }}
            questSlug={questSlug}
            onQuestSlug={setQuestSlug}
          />
        )}
      </div>
    </div>
  );
}
