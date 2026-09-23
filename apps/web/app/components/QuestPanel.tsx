'use client';

import type { AnalysisResult } from '@rotamer/core';
import { useLocale, useMessages } from '@rotamer/i18n/react';
import {
  CATALOG,
  localize,
  trackNames,
  evaluateAnalysis,
  findQuest,
  type Assessable,
  type Goal,
  type Track,
} from '@rotamer/quests';
import { Button, Label, SourceBadge } from '@rotamer/ui';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { track } from '../../lib/track';
import {
  openQuest,
  readProgress,
  saveAttempt,
  type AttemptOutcome,
  type QuestProgress,
} from '../actions/attempt';
import {
  checkQuest,
  readQuestDetail,
  readStudentAssignments,
  reportQuest,
  type CheckQuestResult,
  type StudentAssignment,
  type StudentQuestDetail,
} from '../actions/assignment';
import { messages as classroomMessages } from '../turmas/messages';
import { questPanelMessages } from './messages';
import { StudentAssignmentsSection } from './StudentAssignmentsSection';
import styles from './QuestPanel.module.css';

export interface QuestPanelProps {
  readonly analysis: AnalysisResult | null;
  /** A missão escolhida vive fora daqui: o tutor também precisa saber qual é. */
  readonly slug: string;
  readonly onSlug: (slug: string) => void;
}

/** Sem missão: a tela vira ferramenta livre, sem tique e sem contador (D-09). */
const FREE = '';
const TEACHER_PREFIX = 'professor:';

/**
 * Debounce de `checkQuest` — o mesmo silêncio de 120 ms que o resto do
 * produto usa antes de perguntar ao worker (`use-molecule.ts`): aqui quem
 * responde é o servidor, não o RDKit local, mas a regra é a mesma —
 * perguntar a cada traço desperdiça e faz o painel piscar.
 */
const CHECK_QUIET_MS = 120;

interface NextUp {
  readonly assignmentTitle: string;
  readonly met: number;
  readonly total: number;
  readonly next: StudentAssignment['items'][number] | undefined;
}

/**
 * A próxima missão da lista, quando a que acabou de ser cumprida é item de
 * uma lista da turma (§6.4). Função pura, fora do componente: o React
 * Compiler memoiza a chamada sozinho, sem precisar de `useMemo` escrito à
 * mão por cima.
 */
function findNextUp(
  passedNow: boolean,
  assignments: readonly StudentAssignment[],
  slug: string,
  done: ReadonlySet<string>,
): NextUp | null {
  if (!passedNow) return null;

  for (const assignment of assignments) {
    const index = assignment.items.findIndex((item) => item.questSlug === slug);
    if (index === -1) continue;

    const met = assignment.items.filter((item) => done.has(item.questSlug) || item.questSlug === slug).length;
    const next = assignment.items.find((item) => item.questSlug !== slug && !done.has(item.questSlug));

    return { assignmentTitle: assignment.title, met, total: assignment.items.length, next };
  }

  return null;
}

/**
 * O painel de missões.
 *
 * O veredito de uma missão do catálogo sai do motor de missões rodando aqui
 * mesmo, comparando os números que o RDKit calculou — `evaluateAnalysis`. Uma
 * missão de professor faz o mesmo **quando a lista da turma trouxe a
 * condição**: o objetivo de InChIKey nunca manda a
 * condição para o cliente (R-4), e aí quem decide é `checkQuest`, sem gravar
 * nada, a cada estrutura válida nova. `saveAttempt` só entra depois que um
 * dos dois já disse que passou — nunca antes, para um desenho de
 * passagem não virar tentativa gravada.
 */
export function QuestPanel({ analysis, slug, onSlug }: QuestPanelProps): ReactElement {
  const locale = useLocale();
  const text = useMessages(questPanelMessages);
  const messages = useMessages(classroomMessages);
  const trackName = useMessages(trackNames);
  const [hintsShown, setHintsShown] = useState(0);
  const [outcome, setOutcome] = useState<AttemptOutcome | null>(null);
  const [progress, setProgress] = useState<readonly QuestProgress[]>([]);
  const [assignments, setAssignments] = useState<readonly StudentAssignment[]>([]);
  const [inClassroom, setInClassroom] = useState(false);
  const [teacherQuest, setTeacherQuest] = useState<StudentQuestDetail | null>(null);

  const startedAt = useRef<number | null>(null);
  const recorded = useRef<Set<string>>(new Set());

  const isTeacherQuest = slug.startsWith(TEACHER_PREFIX);
  const quest = slug === FREE || isTeacherQuest ? undefined : findQuest(slug, locale);

  /**
   * A `condition` de uma missão de professor só chega ao cliente pela lista
   * "Da sua turma" — `readStudentAssignments` manda `condition` em
   * todo objetivo, **menos** no de InChIKey (R-4), e esse objetivo nunca vem
   * sozinho fora de uma exclusividade que o servidor garante na criação. Uma
   * missão alcançada só pelo catálogo (fora das listas do aluno) não passa
   * por aqui, e cai no mesmo caminho de "sem condição local" — não porque
   * seja de InChIKey, mas porque o cliente não tem como saber.
   */
  const localAssessable: Assessable | null = useMemo(() => {
    if (!isTeacherQuest) return null;

    const item = assignments
      .flatMap((assignment) => assignment.items)
      .find((entry) => entry.questSlug === slug);

    if (item === undefined) return null;
    const goals: Goal[] = [];
    for (const goal of item.goals) {
      // Sem condição, o cliente não tem como avaliar — e fingir que tem seria
      // dizer "por cumprir" para um objetivo que ninguém mediu (R-4).
      if (goal.condition === undefined) return null;
      goals.push({ id: goal.id, condition: goal.condition });
    }

    return { slug, goals };
  }, [isTeacherQuest, assignments, slug]);

  const result = useMemo(() => {
    if (quest) return evaluateAnalysis(quest, analysis);
    if (localAssessable) return evaluateAnalysis(localAssessable, analysis);
    return null;
  }, [quest, localAssessable, analysis]);

  /**
   * Sem condição local, quem decide é o servidor — `checkQuest` (R-4, achado
   * 1 e 2): confere sem gravar, a cada estrutura válida nova, com o mesmo
   * debounce de intenção do resto do produto. Nunca dispara para a missão do
   * catálogo nem quando a lista da turma já deu a condição de graça.
   *
   * O estado guarda de qual `slug`/InChIKey a resposta é — em vez de zerar
   * `checkResult` de volta a `null` toda vez que a estrutura muda (`setState`
   * síncrono dentro do efeito, que o React desaconselha), a leitura abaixo
   * descarta sozinha uma resposta que não é mais sobre o desenho atual.
   */
  const [checkState, setCheckState] = useState<{
    readonly slug: string;
    readonly inchiKey: string;
    readonly result: CheckQuestResult;
  } | null>(null);
  const usingServerCheck = isTeacherQuest && localAssessable === null;

  /**
   * Arrastar um átomo não muda a topologia, mas recalcula
   * `analysis` (nova referência, mesma InChIKey) a cada debounce de métrica.
   * Sem esta memória, cada arrasto perguntava `checkQuest` de novo para a
   * mesma molécula. O veredito é função pura da missão e da InChIKey — cache
   * por `slug:inchiKey`, dentro da vida do componente, nunca persistido.
   */
  const checkCache = useRef<Map<string, CheckQuestResult>>(new Map());

  useEffect(() => {
    if (!usingServerCheck || analysis === null || !analysis.ok) return;

    const { molblock, inchiKey } = analysis.molecule;
    const cacheKey = `${slug}:${inchiKey}`;
    const cached = checkCache.current.get(cacheKey);

    if (cached !== undefined) {
      setCheckState((current) =>
        current !== null && current.slug === slug && current.inchiKey === inchiKey
          ? current
          : { slug, inchiKey, result: cached },
      );
      return;
    }

    let alive = true;
    const timer = window.setTimeout(() => {
      void checkQuest({ questSlug: slug, molblock }).then((outcome) => {
        // Só o veredito entra na memória. Recusa é transitória — teto de
        // conferências, acesso que ainda não existia — e guardá-la faria o
        // aluno que cumpriu a missão depois nunca ter a tentativa gravada.
        if (outcome.status === 'ok') checkCache.current.set(cacheKey, outcome);
        if (alive) setCheckState({ slug, inchiKey, result: outcome });
      });
    }, CHECK_QUIET_MS);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [usingServerCheck, slug, analysis]);

  const checkResult =
    checkState !== null && checkState.slug === slug && analysis?.ok === true && checkState.inchiKey === analysis.molecule.inchiKey
      ? checkState.result
      : null;

  // O que já foi cumprido em visitas anteriores. Sem conta, a lista volta
  // vazia e a tela simplesmente não mostra progresso nenhum.
  useEffect(() => {
    let alive = true;

    const load = async (): Promise<void> => {
      const saved = await readProgress();
      if (alive) setProgress(saved);
    };

    void load();
    return () => {
      alive = false;
    };
  }, [outcome]);

  // "Da sua turma" (§6.4) — as listas publicadas das turmas do aluno.
  useEffect(() => {
    let alive = true;
    void readStudentAssignments().then((rows) => {
      if (!alive) return;
      setAssignments(rows.assignments);
      setInClassroom(rows.inClassroom);
    });
    return () => {
      alive = false;
    };
  }, [outcome]);

  // Título, enunciado e dicas de uma missão de professor não vêm do catálogo
  // (D-12): só o servidor sabe, e só depois de conferir acesso (R-7). Não
  // reseta para `null` de propósito — `teacherQuestForSlug` abaixo descarta
  // dado velho comparando `slug`, e evitar o reset síncrono é o que mantém
  // este efeito só com `setState` dentro do `.then()`.
  useEffect(() => {
    if (!isTeacherQuest) return;

    let alive = true;
    void readQuestDetail({ questSlug: slug }).then((detail) => {
      if (alive && detail.status === 'ok') setTeacherQuest(detail.quest);
    });
    return () => {
      alive = false;
    };
  }, [slug, isTeacherQuest]);

  // Descarta o `teacherQuest` de uma missão anterior enquanto a busca da
  // atual ainda não voltou — sem isso, trocar de missão de professor
  // mostraria por um instante o título e os objetivos da anterior.
  const teacherQuestForSlug = teacherQuest?.slug === slug ? teacherQuest : null;

  // O relógio da missão começa quando ela é escolhida, não quando o componente
  // renderiza — daí o efeito em vez de um valor inicial.
  useEffect(() => {
    startedAt.current = Date.now();
  }, [slug]);

  /**
   * Abrir a missão é o que o painel do professor precisa saber.
   *
   * Escolher a missão na lista é ato deliberado — e "abriu e não cumpriu" é
   * exatamente a definição de travar que a tela da turma usa. Gravar abandono na
   * saída não funcionaria: fechar a aba não roda limpeza de efeito nenhuma, e é
   * assim que uma aula termina (D-22).
   */
  useEffect(() => {
    if (slug === FREE) return;
    void openQuest({ questSlug: slug });
  }, [slug]);

  /**
   * A tentativa cumprida vai para o servidor com o desenho, nunca com a nota
   * — e nunca por desenho intermediário.
   *
   * Catálogo e missão de professor com condição local: só manda quando o
   * veredito **local** já bateu — a mesma regra, porque `result` cobre os
   * dois casos igual. Missão sem condição local (InChIKey, R-4, ou missão
   * alcançada só pelo catálogo): quem decide é `checkQuest`, sem gravar
   * nada; só quando ele diz que passou é que `saveAttempt` entra em cena.
   * Nenhuma estrutura de passagem vira `Attempt` nem molécula na estante.
   */
  useEffect(() => {
    if (slug === FREE || analysis === null || !analysis.ok) return;

    const key = `${slug}:${analysis.molecule.inchiKey}`;
    if (recorded.current.has(key)) return;

    const passed = usingServerCheck ? checkResult?.status === 'ok' && checkResult.passed : result?.passed === true;
    if (!passed) return;

    recorded.current.add(key);
    if (!isTeacherQuest) track('missao-cumprida');

    const record = async (): Promise<void> => {
      const attempt = await saveAttempt({
        questSlug: slug,
        molblock: analysis.molecule.molblock,
        elapsedMs: Date.now() - (startedAt.current ?? Date.now()),
      });
      setOutcome(attempt);
      if (isTeacherQuest && attempt.status === 'saved' && attempt.passed) track('missao-cumprida');
    };

    void record();
  }, [slug, isTeacherQuest, usingServerCheck, result, checkResult, analysis]);

  const done = useMemo(
    () => new Set(progress.filter((entry) => entry.passed).map((entry) => entry.questSlug)),
    [progress],
  );

  const byTrack = useMemo(() => {
    const tracks: Track[] = ['structure', 'geometry', 'property'];
    return tracks.map((track) => ({
      track,
      quests: CATALOG.filter((entry) => entry.track === track).map((spec) =>
        localize(spec, locale),
      ),
    }));
  }, [locale]);

  const passedNow =
    result?.passed === true ||
    (isTeacherQuest && outcome?.status === 'saved' && outcome.passed);

  // A faixa "Próxima:" — só existe quando a missão cumprida é item de uma
  // lista da turma (§6.4). Nunca ranking, nunca comparação (D-22).
  const nextUp = findNextUp(passedNow, assignments, slug, done);

  const title = quest?.title ?? teacherQuestForSlug?.title ?? null;
  const brief = quest?.brief ?? teacherQuestForSlug?.brief ?? null;
  const hints = quest?.hints ?? teacherQuestForSlug?.hints ?? [];

  /**
   * O estado real por objetivo.
   *
   * `result` já cobre catálogo e missão de professor com condição local — o
   * mesmo `evaluateAnalysis` dos dois casos. Sem condição local, o único
   * veredito confiável é o que `checkQuest` devolveu; enquanto ele não
   * respondeu (ou nunca vai, porque nada foi desenhado ainda), a tela nunca
   * finge saber: cada objetivo aparece como "conferindo…", nunca como se
   * tivesse sido medido e não batido.
   */
  const awaitingServerCheck = usingServerCheck && analysis?.ok === true && checkResult === null;

  /**
   * O rótulo de cada objetivo, com o que já bateu marcado.
   *
   * O rótulo **não** viaja junto do veredito: `GoalResult` é só `{ id, met }`,
   * porque um veredito é o mesmo em qualquer idioma. Quem tem a frase é a
   * missão — vinda do catálogo já localizada, ou vinda do servidor, que a
   * monta no idioma de quem pediu. É o que mantém o objetivo de InChIKey longe
   * do cliente (R-4) e ainda assim legível nos dois idiomas.
   */
  const met = result ?? (checkResult?.status === 'ok' ? checkResult : null);
  const named: readonly { readonly id: string; readonly label: string }[] =
    quest?.goals ?? teacherQuestForSlug?.goals ?? [];

  const goalLabels: readonly { readonly id: string; readonly label: string; readonly met: boolean }[] =
    named.map((goal) => ({
      id: goal.id,
      label: goal.label,
      met: met?.goals.find((entry) => entry.id === goal.id)?.met === true,
    }));

  /**
   * `checkQuest` recusado (sem acesso, teto de conferências) não
   * pode virar "por cumprir": a lista de objetivos mentiria dizendo que nada
   * foi medido ainda, quando na verdade o servidor já respondeu que não dá
   * para conferir. O motivo do servidor substitui a lista inteira.
   */
  const checkRejectedReason = checkResult?.status === 'rejected' ? checkResult.reason : null;

  return (
    <section className={styles.panel} aria-label={text.label}>
      <StudentAssignmentsSection
        slug={slug}
        onSlug={onSlug}
        done={done}
        assignments={assignments}
        inClassroom={inClassroom}
      />

      <p className={styles.catalogLink}>
        <Link href="/catalogo">{messages.catalog.linkFromMenu}</Link>
      </p>

      <div className={styles.header}>
        <Label>
          {done.size === 0 ? text.quest : text.questProgress(done.size, CATALOG.length)}
        </Label>
        {passedNow === true && (
          <span className={styles.done} data-testid="missao-cumprida">
            {text.met}
          </span>
        )}
      </div>

      <select
        className={styles.picker}
        value={slug}
        aria-label={text.pick}
        data-testid="escolher-missao"
        onChange={(event) => {
          onSlug(event.target.value);
          setHintsShown(0);
          setOutcome(null);
        }}
      >
        <option value={FREE}>{text.free}</option>
        {isTeacherQuest && teacherQuestForSlug !== null && (
          <option value={slug} disabled>
            {messages.studentAssignments.inProgressOption(teacherQuestForSlug.title)}
          </option>
        )}
        {byTrack.map((group) => (
          <optgroup key={group.track} label={trackName[group.track]}>
            {group.quests.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {done.has(entry.slug) ? `✓ ${entry.title}` : entry.title}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <p className={styles.free}>{messages.studentAssignments.catalogFreedom}</p>

      {slug === FREE && (
        <p className={styles.free}>{text.freeBody}</p>
      )}

      {title !== null && (
        <>
          <p className={styles.brief}>{brief}</p>

          {teacherQuestForSlug?.byTeacher !== undefined && teacherQuestForSlug?.byTeacher !== null && (
            <p className={styles.byTeacher} data-testid="autoria-missao">
              {messages.catalog.byTeacher(teacherQuestForSlug.byTeacher.name, teacherQuestForSlug.byTeacher.institution)}
            </p>
          )}

          {checkRejectedReason !== null ? (
            <p className={styles.hint} data-testid="objetivos-recusados">
              {checkRejectedReason}
            </p>
          ) : (
            <ul className={styles.goals} data-testid="objetivos">
              {goalLabels.map((goal) => (
                <li
                  key={goal.id}
                  className={[styles.goal, goal.met ? styles.goalMet : null].filter(Boolean).join(' ')}
                >
                  <span
                    className={[styles.mark, goal.met ? styles.markMet : null].filter(Boolean).join(' ')}
                    aria-hidden="true"
                  >
                    {goal.met ? '✓' : ''}
                  </span>
                  {goal.label}
                  {/* Missão de InChIKey (ou alcançada só pelo catálogo, sem
                      condição local) — R-4. Nunca "por cumprir": o cliente não
                      tem como saber, só o servidor. */}
                  {awaitingServerCheck && (
                    <span className={styles.pending} data-testid="objetivo-conferindo">
                      {messages.studentAssignments.checkingWithServer}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {hints.slice(0, hintsShown).map((hint) => (
            <p key={hint} className={styles.hint}>
              {hint}
            </p>
          ))}

          {outcome?.status === 'saved' && (
            <p className={styles.hint} data-testid="progresso-salvo">
              {text.progressSaved(outcome.score)}
            </p>
          )}

          {outcome?.status === 'anonymous' && (
            <p className={styles.hint}>
              <Link href="/entrar">{messages.errors.enterAccount}</Link>
              {text.signInToKeep}
            </p>
          )}

          {outcome?.status === 'rejected' && <p className={styles.hint}>{outcome.reason}</p>}

          {passedNow === true && nextUp !== null && (
            <p className={styles.nextBanner} data-testid="faixa-proxima">
              {nextUp.next === undefined ? (
                messages.studentAssignments.listClosed(nextUp.assignmentTitle)
              ) : (
                <>
                  {messages.studentAssignments.metJustNow(nextUp.total - nextUp.met)}{' '}
                  <button
                    type="button"
                    className={styles.nextButton}
                    data-testid="proxima-missao"
                    onClick={() => {
                      onSlug(nextUp.next?.questSlug ?? FREE);
                    }}
                  >
                    {messages.studentAssignments.nextItem(nextUp.next.title)}
                  </button>
                </>
              )}
            </p>
          )}

          {isTeacherQuest && teacherQuestForSlug !== null && <ReportBox key={slug} slug={slug} />}

          <div className={styles.footer}>
            <p className={styles.score}>
              {result?.score ?? (outcome?.status === 'saved' ? outcome.score : 0)}
              <span className={styles.scoreLabel}>{text.outOf}</span>
            </p>

            <SourceBadge source="computed" locale={locale} />

            {hintsShown < hints.length && (
              <Button
                size="small"
                variant="ghost"
                onClick={() => {
                  setHintsShown((shown) => shown + 1);
                }}
              >
                {hintsShown === 0 ? text.seeHint : text.anotherHint}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/**
 * "Denunciar" (D-27) — isolado num componente próprio, montado de novo a
 * cada `slug` (`key={slug}` em quem chama). É o que zera `aberto`/`motivo`/
 * `enviado` sem precisar de um `useEffect` resetando estado a cada troca de
 * missão: o remonte já faz isso, e sem ele sobraria "Recebido." pendurado
 * numa missão que a pessoa nem denunciou.
 */
function ReportBox({ slug }: { readonly slug: string }): ReactElement {
  const messages = useMessages(classroomMessages);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(false);

  const send = (): void => {
    if (reason.trim() === '') return;
    void reportQuest({ questSlug: slug, reason: reason.trim() }).then((outcome) => {
      if (outcome.status === 'ok') {
        setSent(true);
        setOpen(false);
      }
    });
  };

  if (sent) {
    return (
      <p className={styles.hint} data-testid="denuncia-recebida">
        {messages.catalog.reportReceived}
      </p>
    );
  }

  if (!open) {
    return (
      <div className={styles.report}>
        <Button
          size="small"
          variant="ghost"
          onClick={() => {
            setOpen(true);
          }}
          data-testid="denunciar-missao"
        >
          {messages.catalog.report}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.report}>
      <div className={styles.reportForm}>
        <input
          className={styles.reportInput}
          value={reason}
          maxLength={200}
          placeholder={messages.catalog.reportPlaceholder}
          onChange={(event) => {
            setReason(event.target.value);
          }}
          data-testid="motivo-denuncia"
        />
        <Button size="small" onClick={send} data-testid="enviar-denuncia">
          {messages.catalog.reportSend}
        </Button>
        <Button
          size="small"
          variant="ghost"
          onClick={() => {
            setOpen(false);
          }}
        >
          {messages.catalog.reportCancel}
        </Button>
      </div>
    </div>
  );
}
