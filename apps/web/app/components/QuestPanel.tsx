'use client';

import type { AnalysisResult } from '@rotamer/core';
import { CATALOG, evaluateAnalysis, findQuest, type Track } from '@rotamer/quests';
import { Button, Label, SourceBadge } from '@rotamer/ui';
import { useMemo, useState, type ReactElement } from 'react';
import styles from './QuestPanel.module.css';

export interface QuestPanelProps {
  readonly analysis: AnalysisResult | null;
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
export function QuestPanel({ analysis }: QuestPanelProps): ReactElement {
  const [slug, setSlug] = useState<string>(FREE);
  const [hintsShown, setHintsShown] = useState(0);

  const quest = slug === FREE ? undefined : findQuest(slug);
  const result = useMemo(
    () => (quest ? evaluateAnalysis(quest, analysis) : null),
    [quest, analysis],
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
        <Label>missão</Label>
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
          setSlug(event.target.value);
          setHintsShown(0);
        }}
      >
        <option value={FREE}>Sem missão — ferramenta livre</option>
        {byTrack.map((group) => (
          <optgroup key={group.track} label={TRACK_NAMES[group.track]}>
            {group.quests.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {entry.title}
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
