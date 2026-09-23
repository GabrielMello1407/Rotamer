'use client';

import { fromMolblock, toMolblock } from '@rotamer/core';
import { Editor2D, Popover, Toolbar, createEditorStore, type EditorNotice } from '@rotamer/editor2d';
import { chemistryErrorText } from '@rotamer/i18n';
import { useLocale, useMessages } from '@rotamer/i18n/react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useStore } from 'zustand';
import { createTeacherQuest } from '../actions/assignment';
import { messages as classroomMessages } from '../turmas/messages';
import { workspaceMessages } from './messages';
import { AnalysisDrawer, type DrawerTab } from './AnalysisDrawer';
import styles from './EditorWorkspace.module.css';
import { MetricsBar } from './MetricsBar';
import { TopBar } from './TopBar';
import { useChemistryClient } from './use-chemistry-client';
import { useDraft } from './use-draft';
import { useInitialSmiles } from './use-initial-smiles';
import { useMolecule } from './use-molecule';
import type { MoleculeGraph, NormalModes, TidyStereoChanges } from '@rotamer/core';
import { track } from '../../lib/track';

/**
 * Nove segundos: tempo para ler uma frase de sala de aula sem pressa. A frase
 * ensina, e o traço seguinte apaga o aviso antes disso de qualquer jeito — ser
 * generoso aqui não custa nada porque o cartão não intercepta clique
 * (`pointer-events: none` em `.notice`, `Editor2D.module.css`).
 *
 * `prefers-reduced-motion` não encurta este tempo: quem pede menos movimento
 * costuma precisar de mais tempo para ler, não de menos.
 */
const NOTICE_MS = 9_000;

/**
 * O aviso da faixa depois de organizar, escolhido só a partir do que `tidy`
 * relatou — nunca inventado aqui.
 *
 * `null` quando nada mudou na estereoquímica: é o caso da maioria das
 * moléculas de aula, que não têm cunha nenhuma, e um aviso que aparece sempre
 * vira moldura que ninguém lê.
 *
 * Três coisas diferentes podem acontecer com uma cunha, e cada uma ensina uma
 * química diferente:
 *
 * - **saiu** — aquele átomo não é centro estereogênico, e cunha que não define
 *   configuração é enfeite. É o caso que gerou este aviso;
 * - **mudou de ligação** — o centro continua ali; o RDKit só escolheu outra
 *   ligação para desenhar a mesma configuração;
 * - **virou traço** — a mesma configuração, vista do outro lado do papel.
 *
 * Dizer "saiu" nos três seria mentir em dois — e mentir sobre estereoquímica
 * para uma sala inteira é o erro que este produto não pode cometer (D-01). Por
 * isso o núcleo distingue os três, e cada um tem a sua frase.
 */
function infoNoticeFor(stereo: TidyStereoChanges, text: WorkspaceText): EditorNotice | null {
  const { removedWedges, movedWedges, flippedWedges } = stereo;
  if (removedWedges === 0 && movedWedges === 0 && flippedWedges === 0) return null;

  // A cunha que saiu de verdade vem primeiro: é a única das três que muda o que
  // o desenho afirma, e é a única que a pessoa precisa conferir.
  if (removedWedges > 0) {
    return {
      tone: 'info',
      headline: text.removedWedges(removedWedges),
      detail: text.removedWedgesDetail,
    };
  }

  if (movedWedges > 0 && flippedWedges > 0) {
    return {
      tone: 'info',
      headline: text.redrawnWedges,
      detail: text.redrawnWedgesDetail,
    };
  }

  if (movedWedges > 0) {
    return {
      tone: 'info',
      headline: text.movedWedges(movedWedges),
      detail: text.movedWedgesDetail,
    };
  }

  return {
    tone: 'info',
    headline: text.flippedWedges(flippedWedges),
    detail: text.flippedWedgesDetail,
  };
}

/** O lado do dicionário da bancada que está valendo agora. */
type WorkspaceText = (typeof workspaceMessages)['pt-BR'];

/**
 * O aviso de quando organizar erraria: algum centro (R/S/E/Z) mudaria de
 * letra. Isso nunca deveria acontecer só de reorganizar o desenho — por isso
 * `tidy` é descartado neste caso (ver `tidy` em `EditorWorkspace`) e a tela
 * devolve a responsabilidade a quem é dela, em vez de aplicar um resultado que
 * silenciosamente trocaria a molécula do desenho por outra.
 */
function dangerNotice(onClose: () => void, text: WorkspaceText): EditorNotice {
  return {
    tone: 'danger',
    headline: text.tidyRefused,
    detail: text.tidyRefusedDetail,
    onClose,
  };
}

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

/**
 * A bancada em modo "criar missão desenhando" (§6.3): o professor desenha
 * exatamente como o aluno desenha, e o que muda é a `TopBar` e a aba do
 * painel. `assignmentTitle` é só para o rótulo — o resto da lista não é
 * tocado daqui.
 */
export interface EditorAuthoringContext {
  readonly assignmentId: string;
  readonly assignmentTitle: string;
  readonly classroomId: string;
}

export interface EditorWorkspaceProps {
  /** Quem está identificado, quando há banco e sessão. */
  readonly accountName?: string | null;
  readonly showAccount?: boolean;
  readonly authoring?: EditorAuthoringContext | undefined;
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
  authoring,
}: EditorWorkspaceProps): ReactElement {
  const locale = useLocale();
  const messages = useMessages(classroomMessages);
  const text = useMessages(workspaceMessages);
  const store = useMemo(() => createEditorStore(), []);
  const graph = useStore(store, (state) => state.graph);
  const hover = useStore(store, (state) => state.hover);
  const focus = useStore(store, (state) => state.focus);
  const router = useRouter();

  const [questSlug, setQuestSlug] = useState('');
  // Em modo autoria o painel já abre na aba certa — não se resolve missão
  // aqui, se escreve uma (§6.3).
  const [panelOpen, setPanelOpen] = useState(authoring !== undefined);
  const [sceneWide, setSceneWide] = useState(false);
  const [tab, setTab] = useState<DrawerTab>(authoring !== undefined ? 'authoring' : 'analysis');

  // ---------------------------------------------------------- autoria (§6.3)
  const [authoringTitle, setAuthoringTitle] = useState('');
  const [authoringBrief, setAuthoringBrief] = useState('');
  const [authoringHints, setAuthoringHints] = useState<readonly string[]>([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<ReadonlySet<string>>(new Set());
  const [authoringError, setAuthoringError] = useState<string | null>(null);
  const [authoringSaving, setAuthoringSaving] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelAnchor, setCancelAnchor] = useState<HTMLButtonElement | null>(null);

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
   * A seleção de objetivos é sobre **esta** molécula.
   *
   * `extractGoals` roda de novo sobre cada análise nova, e um `id` marcado
   * antes do desenho mudar pode não existir mais no conjunto novo — ou pior,
   * existir com o mesmo `id` e outra `condition` (mesmo tipo de objetivo,
   * medida diferente). Zerar quando a InChIKey muda é o mesmo "esquecer cai
   * no seguro, nunca no errado" que a seleção do editor já usa (D-23):
   * arrastar um átomo não muda a molécula e não mexe na marcação; virar outra
   * substância — ou deixar de fechar — limpa.
   */
  const authoredInchiKey = analysis?.ok === true ? analysis.molecule.inchiKey : null;
  const lastAuthoredInchiKey = useRef<string | null>(null);
  useEffect(() => {
    if (lastAuthoredInchiKey.current === authoredInchiKey) return;
    lastAuthoredInchiKey.current = authoredInchiKey;
    setSelectedGoalIds(new Set());
  }, [authoredInchiKey]);

  /**
   * Salvar a missão (§6.3, §4.5).
   *
   * O que sai daqui é `goalIds`, nunca `Condition` — o servidor regenera
   * `extractGoals` sobre o molblock reanalisado e só aceita `id` que está
   * nessa lista (R-1). A validação local aqui é só para poupar uma ida ao
   * servidor com erro óbvio; o veredito de química (R-2, teto de átomos, link
   * no enunciado) é sempre o que a ação devolve.
   */
  const saveAuthoredQuest = useCallback(() => {
    if (authoring === undefined) return;

    if (analysis === null) {
      setAuthoringError(messages.authoring.nothingDrawn);
      return;
    }
    if (!analysis.ok) {
      setAuthoringError(chemistryErrorText(locale, analysis.error));
      return;
    }
    if (selectedGoalIds.size === 0) {
      setAuthoringError(messages.authoring.noGoalMarked);
      return;
    }
    if (authoringTitle.trim() === '' || authoringBrief.trim() === '') {
      setAuthoringError(messages.authoring.emptyTitleOrBrief);
      return;
    }

    setAuthoringSaving(true);
    setAuthoringError(null);

    const run = async (): Promise<void> => {
      const outcome = await createTeacherQuest({
        assignmentId: authoring.assignmentId,
        title: authoringTitle,
        brief: authoringBrief,
        hints: authoringHints,
        molblock: toMolblock(graph),
        goalIds: [...selectedGoalIds],
      });

      setAuthoringSaving(false);

      if (outcome.status === 'rejected') {
        setAuthoringError(outcome.reason);
        return;
      }

      /*
       * O query string leva um código fechado, nunca a frase
       * pronta: `feito=missao-criada` é o único valor que a lista aceita
       * (§6.6), e a posição basta para achar o item na lista já carregada e
       * montar o texto com `messages.assignment.entered`. Nada além disso
       * atravessa a URL — um link forjado com outro `feito` é ignorado, e
       * um `entered` livre nunca mais aparece na tela como se fosse do
       * sistema.
       */
      router.push(
        `/turmas/${authoring.classroomId}/listas/${authoring.assignmentId}?feito=missao-criada&posicao=${String(outcome.position)}`,
      );
    };

    void run();
  }, [
    authoring,
    analysis,
    selectedGoalIds,
    authoringTitle,
    authoringBrief,
    authoringHints,
    graph,
    router,
    locale,
    messages,
  ]);

  /**
   * Marcar o objetivo de InChIKey desmarca qualquer outro já marcado (achado
   * 7 do `reviewer`): §6.3 já avisa que, marcado, ele precisa ser o único
   * objetivo da missão — antes disto os outros só ficavam desabilitados
   * *checked*, travados sem explicação nenhuma na tela. Desmarcar um
   * objetivo comum nunca mexe nos demais.
   */
  const toggleGoal = useCallback((id: string, exclusive: boolean) => {
    setSelectedGoalIds((current) => {
      if (current.has(id)) {
        const next = new Set(current);
        next.delete(id);
        return next;
      }

      if (exclusive) return new Set([id]);

      return new Set(current).add(id);
    });
  }, []);

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

  /*
   * O catálogo buscável (D-26/D-27) manda para `/?missao=<slug>`: quem
   * escolhe uma missão lá quer chegar no editor já com o painel de missões
   * aberto naquele slug — sem isso, "escolher uma abre o editor com aquele
   * slug" (item 5 desta entrega) não teria como acontecer.
   */
  const openedFromQuestLink = useRef(false);
  useEffect(() => {
    if (openedFromQuestLink.current || authoring !== undefined) return;

    const wanted = new URLSearchParams(window.location.search).get('missao');
    if (wanted === null || wanted.trim() === '') return;

    openedFromQuestLink.current = true;
    // Sincronizando com um sistema externo de verdade — a URL, lida depois da
    // hidratação — não com estado derivado de prop. `useInitialSmiles` faz o
    // mesmo pelo lado do grafo; aqui é local porque `questSlug` mora neste
    // componente, não na store do editor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuestSlug(wanted);
    setTab('quests');
    setPanelOpen(true);
  }, [authoring]);

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

  /**
   * Os centros com configuração, para a cena escrever a mesma letra do desenho.
   *
   * Cunha e traço ficam no 2D — eles são notação de projeção, e no espaço não há
   * o que projetar. O que atravessa é a letra.
   */
  const stereo = useMemo(() => {
    if (analysis?.ok !== true) return [];

    return analysis.molecule.stereo.atoms.map((entry) => ({
      source: entry.index,
      label: entry.label,
    }));
  }, [analysis]);

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

  const client = connection.status === 'ready' ? connection.client : null;

  /**
   * O aviso da faixa sobre a última vez que se organizou, e só sobre ela.
   *
   * `noticeGraphRef` guarda o grafo a que o aviso se refere: quando o grafo do
   * editor deixa de ser esse (desenhar, desfazer, refazer, carregar exemplo,
   * limpar a tela — qualquer caminho, sem precisar enumerar cada um), o efeito
   * abaixo apaga o aviso sozinho. Um aviso que continua na tela descrevendo um
   * desenho que já não existe é mentira, mesmo que tenha sido verdade um
   * instante atrás.
   */
  const [notice, setNotice] = useState<EditorNotice | null>(null);
  const noticeGraphRef = useRef<MoleculeGraph | null>(null);
  const noticeTimerRef = useRef<number | undefined>(undefined);

  const clearNoticeTimer = useCallback(() => {
    window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = undefined;
  }, []);

  const dismissNotice = useCallback(() => {
    clearNoticeTimer();
    noticeGraphRef.current = null;
    setNotice(null);
  }, [clearNoticeTimer]);

  useEffect(() => {
    if (noticeGraphRef.current !== null && noticeGraphRef.current !== graph) {
      dismissNotice();
    }
  }, [graph, dismissNotice]);

  // O temporizador não pode sobreviver ao componente.
  useEffect(() => clearNoticeTimer, [clearNoticeTimer]);

  /**
   * Organizar o desenho.
   *
   * A tela deixa desenhar de qualquer jeito — é assim que tem que ser — e o
   * resultado é uma estrutura torta, com ligações de tamanhos diferentes e
   * ângulos que não existem. Quem endireita é o RDKit, com o mesmo algoritmo de
   * layout que ele usa para desenhar: comprimento de ligação e ângulo de cadeia
   * são química, não gosto.
   *
   * O grafo continua o mesmo; o que muda são as posições. E, como isso entra no
   * histórico, Ctrl+Z devolve o desenho de antes.
   *
   * A cunha, porém, é desenho, e o RDKit reescreve cada uma para as posições
   * novas: pode sumir, quando não definia nada, ou virar traço, quando definia
   * e passou para o outro lado do papel — as duas são certas, e ficam mudas se
   * a tela não contar (`tidy.ts`, `TidyStereoChanges`). Quando o RDKit relata
   * que algum centro mudaria de letra, o resultado nem chega a ser aplicado: é
   * o organizador que errou, não o desenho, e a tela devolve a
   * responsabilidade em vez de trocar a molécula da pessoa por outra em
   * silêncio.
   */
  const tidy = useCallback(() => {
    if (!client || graph.atoms.length === 0) return;

    const run = async (): Promise<void> => {
      // Organizar de novo é sobre um desenho que está prestes a deixar de
      // existir na forma atual: o aviso anterior conta a história de um
      // instante que já passou.
      dismissNotice();

      const result = await client.tidy(toMolblock(graph));
      if (result === null) return;

      if (!result.stereo.sameConfiguration) {
        noticeGraphRef.current = graph;
        setNotice(dangerNotice(dismissNotice, text));
        return;
      }

      const arranged = fromMolblock(result.molblock);
      store.getState().commit(arranged);
      store.getState().frame();

      const next = infoNoticeFor(result.stereo, text);
      if (next === null) return;

      noticeGraphRef.current = arranged;
      setNotice(next);
      noticeTimerRef.current = window.setTimeout(dismissNotice, NOTICE_MS);
    };

    void run();
  }, [client, graph, store, dismissNotice, text]);

  const openPanel = useCallback((next: DrawerTab) => {
    setTab(next);
    setPanelOpen(true);
  }, []);

  // Clicar num exemplo antes de o motor subir não é erro: o pedido espera na
  // fila e entra assim que o worker responde. Num celular fraco isso é a regra.
  const [wanted, setWanted] = useState<string | null>(null);

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

  const authoringTopBar =
    authoring === undefined
      ? undefined
      : {
          label: messages.authoring.topBarLabel(authoring.assignmentTitle),
          saveLabel: messages.authoring.save,
          cancelLabel: messages.authoring.cancel,
          canSave: analysis?.ok === true,
          saving: authoringSaving,
          onSave: saveAuthoredQuest,
          onCancel: () => {
            setCancelConfirmOpen(true);
          },
          bindCancelButton: setCancelAnchor,
        };

  return (
    <div className={styles.shell}>
      <TopBar
        analysis={analysis}
        waitingForEngine={connection.status === 'loading' && graph.atoms.length > 0}
        accountName={accountName}
        showAccount={showAccount}
        panelOpen={panelOpen}
        onPanel={openPanel}
        onNew={() => {
          store.getState().clear();
        }}
        onSignOut={() => {
          store.getState().clear();
        }}
        onExample={(smiles) => {
          track('exemplo-carregado');
          setWanted(smiles);
        }}
        authoring={authoringTopBar}
      />

      {cancelConfirmOpen && (
        <Popover
          anchor={cancelAnchor}
          label={messages.cancelAuthoringPopover.title}
          onClose={() => {
            setCancelConfirmOpen(false);
          }}
          testId="confirmar-cancelar-autoria"
        >
          <div className={styles.cancelConfirm}>
            <p className={styles.cancelConfirmTitle}>{messages.cancelAuthoringPopover.title}</p>
            <p className={styles.cancelConfirmBody}>{messages.cancelAuthoringPopover.body}</p>
            <div className={styles.cancelConfirmActions}>
              <button
                type="button"
                className={styles.cancelConfirmButton}
                data-testid="confirmar-sair-autoria"
                onClick={() => {
                  if (authoring !== undefined) router.push(`/turmas/${authoring.classroomId}/listas/${authoring.assignmentId}`);
                }}
              >
                {messages.cancelAuthoringPopover.confirm}
              </button>
              <button
                type="button"
                className={styles.cancelConfirmGhost}
                onClick={() => {
                  setCancelConfirmOpen(false);
                }}
              >
                {messages.cancelAuthoringPopover.cancel}
              </button>
            </div>
          </div>
        </Popover>
      )}

      <div className={styles.stage}>
        <div className={styles.canvasArea} ref={areaRef}>
          <Editor2D store={store} onTidy={client ? tidy : undefined} notice={notice ?? undefined} />

          <div className={styles.rail} ref={railRef}>
            <Toolbar store={store} onTidy={client ? tidy : undefined} />
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
              stereo={stereo}
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
                geometryError === null
                  ? text.scenePlaceholder
                  : chemistryErrorText(locale, { code: geometryError })
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
            connection={connection}
            store={store}
            tab={tab}
            onTab={setTab}
            onClose={() => {
              setPanelOpen(false);
            }}
            questSlug={questSlug}
            onQuestSlug={setQuestSlug}
            authoring={
              authoring === undefined
                ? undefined
                : {
                    analysis,
                    selectedGoalIds,
                    onToggleGoal: toggleGoal,
                    title: authoringTitle,
                    onTitle: setAuthoringTitle,
                    brief: authoringBrief,
                    onBrief: setAuthoringBrief,
                    hints: authoringHints,
                    onHint: (index, value) => {
                      setAuthoringHints((current) => current.map((hint, i) => (i === index ? value : hint)));
                    },
                    onAddHint: () => {
                      setAuthoringHints((current) => (current.length >= 3 ? current : [...current, '']));
                    },
                    onRemoveHint: (index) => {
                      setAuthoringHints((current) => current.filter((_, i) => i !== index));
                    },
                    error: authoringError,
                  }
            }
          />
        )}
      </div>
    </div>
  );
}
