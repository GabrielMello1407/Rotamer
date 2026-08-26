'use client';

import type { AnalysisResult } from '@rotamer/core';
import { CATALOG, evaluateAnalysis, findQuest, type Track } from '@rotamer/quests';
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
import styles from './QuestPanel.module.css';

export interface QuestPanelProps {
  readonly analysis: AnalysisResult | null;
  /** A missão escolhida vive fora daqui: o tutor também precisa saber qual é. */
  readonly slug: string;
  readonly onSlug: (slug: string) => void;
}

const TRACK_NAMES: Readonly<Record<Track, string>> = {
  structure: 'Estrutura',
  geometry: 'Geometria',
  property: 'Propriedade',
};

/** Sem missão: a tela vira ferramenta livre, sem tique e sem contador (D-09). */
const FREE = '';

/**
 * O painel de missões.
 *
 * O veredito sai do motor de missões, comparando os números que o RDKit
 * calculou — nunca de modelo de linguagem. As dicas são escritas junto com a
 * missão e revisadas como conteúdo.
 */
export function QuestPanel({ analysis, slug, onSlug }: QuestPanelProps): ReactElement {
  const [hintsShown, setHintsShown] = useState(0);
  const [outcome, setOutcome] = useState<AttemptOutcome | null>(null);

  const [progress, setProgress] = useState<readonly QuestProgress[]>([]);

  const startedAt = useRef<number | null>(null);
  const recorded = useRef<Set<string>>(new Set());

  const quest = slug === FREE ? undefined : findQuest(slug);
  const result = useMemo(
    () => (quest ? evaluateAnalysis(quest, analysis) : null),
    [quest, analysis],
  );

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
    if (!quest) return;

    void openQuest({ questSlug: quest.slug });
  }, [quest]);

  /**
   * A tentativa cumprida vai para o servidor com o desenho, nunca com a nota.
   *
   * Lá o molblock passa de novo pelo RDKit e a mesma `spec` é reavaliada: nota
   * que chega pronta do navegador não vale nada.
   */
  useEffect(() => {
    if (!quest || result?.passed !== true || analysis === null || !analysis.ok) return;

    const key = `${quest.slug}:${analysis.molecule.inchiKey}`;
    if (recorded.current.has(key)) return;
    recorded.current.add(key);

    track('missao-cumprida');

    const record = async (): Promise<void> => {
      setOutcome(
        await saveAttempt({
          questSlug: quest.slug,
          molblock: analysis.molecule.molblock,
          elapsedMs: Date.now() - (startedAt.current ?? Date.now()),
        }),
      );
    };

    void record();
  }, [quest, result, analysis]);

  const done = useMemo(
    () => new Set(progress.filter((entry) => entry.passed).map((entry) => entry.questSlug)),
    [progress],
  );

  const byTrack = useMemo(() => {
    const tracks: Track[] = ['structure', 'geometry', 'property'];
    return tracks.map((track) => ({
      track,
      quests: CATALOG.filter((entry) => entry.track === track),
    }));
  }, []);

  return (
    <section className={styles.panel} aria-label="Missão">
      <div className={styles.header}>
        <Label>
          {done.size === 0 ? 'missão' : `missão · ${String(done.size)} de ${String(CATALOG.length)} cumpridas`}
        </Label>
        {result?.passed === true && (
          <span className={styles.done} data-testid="missao-cumprida">
            cumprida
          </span>
        )}
      </div>

      <select
        className={styles.picker}
        value={slug}
        aria-label="Escolher missão"
        data-testid="escolher-missao"
        onChange={(event) => {
          onSlug(event.target.value);
          setHintsShown(0);
          setOutcome(null);
        }}
      >
        <option value={FREE}>Sem missão — ferramenta livre</option>
        {byTrack.map((group) => (
          <optgroup key={group.track} label={TRACK_NAMES[group.track]}>
            {group.quests.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {done.has(entry.slug) ? `✓ ${entry.title}` : entry.title}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {!quest && (
        <p className={styles.free}>
          Desenhe o que quiser. Os descritores continuam saindo do RDKit a cada traço.
        </p>
      )}

      {quest && (
        <>
          <p className={styles.brief}>{quest.brief}</p>

          <ul className={styles.goals} data-testid="objetivos">
            {result?.goals.map((goal) => (
              <li
                key={goal.id}
                className={[styles.goal, goal.met ? styles.goalMet : null]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span
                  className={[styles.mark, goal.met ? styles.markMet : null]
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden="true"
                >
                  {goal.met ? '✓' : ''}
                </span>
                {goal.label}
              </li>
            ))}
          </ul>

          {quest.hints.slice(0, hintsShown).map((hint) => (
            <p key={hint} className={styles.hint}>
              {hint}
            </p>
          ))}

          {outcome?.status === 'saved' && (
            <p className={styles.hint} data-testid="progresso-salvo">
              Progresso salvo. Nota conferida no servidor: {outcome.score} de 100.
            </p>
          )}

          {outcome?.status === 'anonymous' && (
            <p className={styles.hint}>
              <Link href="/entrar">Entre na sua conta</Link> para guardar o que já cumpriu.
            </p>
          )}

          {outcome?.status === 'rejected' && (
            <p className={styles.hint}>{outcome.reason}</p>
          )}

          <div className={styles.footer}>
            <p className={styles.score}>
              {result?.score ?? 0}
              <span className={styles.scoreLabel}>de 100</span>
            </p>

            <SourceBadge source="computed" />

            {hintsShown < quest.hints.length && (
              <Button
                size="small"
                variant="ghost"
                onClick={() => {
                  setHintsShown((shown) => shown + 1);
                }}
              >
                {hintsShown === 0 ? 'Ver dica' : 'Outra dica'}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
