'use client';

import type { AnalysisResult } from '@rotamer/core';
import { chemistryErrorText } from '@rotamer/i18n';
import { useFormatters, useLocale, useMessages } from '@rotamer/i18n/react';
import { extractGoals, goalLabel, type CandidateGoal } from '@rotamer/quests';
import { Formula, Label, SourceBadge } from '@rotamer/ui';
import { useMemo, type ReactElement } from 'react';
import { messages as classroomMessages } from '../turmas/messages';
import { authoringPanelMessages } from './messages';
import styles from './AuthoringPanel.module.css';

export interface AuthoringPanelProps {
  readonly analysis: AnalysisResult | null;
  readonly selectedGoalIds: ReadonlySet<string>;
  /**
   * `exclusive` é o mesmo `candidate.exclusive` do InChIKey: quem chama
   * precisa saber para desligar os outros marcados
   * ao ligar este, em vez de só travá-los sem dizer.
   */
  readonly onToggleGoal: (id: string, exclusive: boolean) => void;
  readonly title: string;
  readonly onTitle: (value: string) => void;
  readonly brief: string;
  readonly onBrief: (value: string) => void;
  readonly hints: readonly string[];
  readonly onHint: (index: number, value: string) => void;
  readonly onAddHint: () => void;
  readonly onRemoveHint: (index: number) => void;
  readonly error: string | null;
}

const TITLE_MAX = 80;
const BRIEF_MAX = 400;
const HINT_MAX = 200;
const HINTS_MAX = 3;

/**
 * As quatro caixas em que os candidatos se agrupam. O `kind` é o que o
 * extrator devolve; o nome da caixa vem do dicionário, no idioma de quem lê.
 */
const BLOCKS: readonly {
  readonly kind: CandidateGoal['kind'];
  readonly label: 'blockIdentity' | 'blockFormula' | 'blockGroups' | 'blockCounts';
}[] = [
  { kind: 'identity', label: 'blockIdentity' },
  { kind: 'formula', label: 'blockFormula' },
  { kind: 'group', label: 'blockGroups' },
  { kind: 'count', label: 'blockCounts' },
];

/**
 * A aba "Autoria" (§6.3) — o professor desenha a resposta, o RDKit já
 * calculou, e esta tela só oferece o que dá para cobrar.
 *
 * `extractGoals` roda aqui **só para pré-visualizar**: o rótulo de cada
 * candidato é o que o servidor vai gerar de novo, caractere a caractere,
 * quando `createTeacherQuest` reanalisa o molblock. O que viaja para o
 * servidor é `goalIds`, nunca a `Condition` — é o servidor quem decide se o
 * `id` realmente saiu desta molécula (R-1).
 */
export function AuthoringPanel({
  analysis,
  selectedGoalIds,
  onToggleGoal,
  title,
  onTitle,
  brief,
  onBrief,
  hints,
  onHint,
  onAddHint,
  onRemoveHint,
  error,
}: AuthoringPanelProps): ReactElement {
  const locale = useLocale();
  const messages = useMessages(classroomMessages);
  const text = useMessages(authoringPanelMessages);
  const { number } = useFormatters();

  const candidates = useMemo<readonly CandidateGoal[]>(
    () => (analysis?.ok === true ? extractGoals(analysis.molecule) : []),
    [analysis],
  );

  const exclusiveMarked = candidates.some(
    (candidate) => candidate.exclusive && selectedGoalIds.has(candidate.id),
  );

  if (analysis === null || !analysis.ok) {
    return (
      <section className={styles.panel} data-testid="painel-autoria">
        <p className={styles.quiet}>
          {analysis === null
            ? messages.authoring.nothingDrawn
            : chemistryErrorText(locale, analysis.error)}
        </p>
        {analysis !== null && <p className={styles.quiet}>{messages.errors.structureCantClose}</p>}
      </section>
    );
  }

  const { molecule } = analysis;

  return (
    <section className={styles.panel} data-testid="painel-autoria">
      <div className={styles.structure}>
        <h3 className={styles.heading}>{messages.authoring.structureHeading}</h3>
        <p className={styles.structureLine}>
          <Formula value={molecule.formula} />
          <span className={styles.dot}>·</span>
          {number(molecule.descriptors.molarMass, 2)} g/mol
          <span className={styles.dot}>·</span>
          {text.groupCount(molecule.groups.length)}
          <SourceBadge source="computed" locale={locale} className={styles.badge} />
        </p>
        <p className={styles.quiet}>{messages.authoring.keptInside}</p>
      </div>

      <div className={styles.goalsBlock}>
        <div className={styles.goalsHeader}>
          <h3 className={styles.heading}>{messages.authoring.goalsHeading}</h3>
          <span className={styles.count} data-testid="contador-objetivos">
            {messages.authoring.goalsCount(selectedGoalIds.size, candidates.length)}
          </span>
        </div>

        {/* A frase de exclusividade aparece uma vez, no topo. Debaixo de CADA
            objetivo desligado; com dez objetivos, dez repetições da mesma
            linha. Uma vez só, no topo, enquanto o InChIKey estiver marcado. */}
        {exclusiveMarked && (
          <p className={styles.quiet} data-testid="desligado-por-exclusividade">
            {messages.authoring.disabledByExclusive}
          </p>
        )}

        {BLOCKS.map((block) => {
          const inBlock = candidates.filter((candidate) => candidate.kind === block.kind);
          if (inBlock.length === 0) return null;

          return (
            <div key={block.kind} className={styles.block}>
              <Label>{messages.authoring[block.label]}</Label>
              <ul className={styles.goalList} aria-label={messages.a11y.goalsList}>
                {inBlock.map((candidate) => {
                  const checked = selectedGoalIds.has(candidate.id);
                  const disabled = !candidate.exclusive && exclusiveMarked;

                  return (
                    <li key={candidate.id}>
                      <label
                        className={[styles.goalRow, disabled ? styles.goalDisabled : null]
                          .filter(Boolean)
                          .join(' ')}
                        title={disabled ? messages.authoring.disabledByExclusive : undefined}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => {
                            onToggleGoal(candidate.id, candidate.exclusive);
                          }}
                          data-testid={`objetivo-${candidate.id}`}
                        />
                        <span className={styles.goalLabel}>
                          {goalLabel(locale, candidate.condition)}
                        </span>
                        <span className={styles.goalMeasured}>{candidate.measured}</span>
                      </label>

                      {candidate.exclusive && checked && (
                        <p className={styles.inchiWarning} data-testid="aviso-inchikey">
                          <strong>{messages.authoring.inchiWarningHeadline}</strong>{' '}
                          {messages.authoring.inchiWarningBody}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>

              {block.kind === 'count' && <p className={styles.quiet}>{messages.authoring.rotatableNote}</p>}
            </div>
          );
        })}

        <p className={styles.quiet}>{messages.authoring.closing}</p>
      </div>

      <div className={styles.writtenBlock}>
        <label className={styles.field}>
          <Label>{messages.authoring.titleLabel}</Label>
          <input
            className={styles.input}
            value={title}
            maxLength={TITLE_MAX}
            onChange={(event) => {
              onTitle(event.target.value);
            }}
            data-testid="titulo-missao"
          />
        </label>

        <label className={styles.field}>
          <Label>{messages.authoring.briefLabel}</Label>
          <textarea
            className={styles.textarea}
            value={brief}
            maxLength={BRIEF_MAX}
            rows={3}
            onChange={(event) => {
              onBrief(event.target.value);
            }}
            data-testid="enunciado-missao"
          />
          <p className={styles.help}>{messages.authoring.briefHelp}</p>
          <p className={styles.help}>{messages.authoring.briefStudentsWarning}</p>
        </label>

        <div className={styles.field}>
          <Label>{messages.authoring.hintsLabel}</Label>
          <p className={styles.help}>{messages.authoring.hintsHelp}</p>

          {hints.map((hint, index) => (
            <div key={index} className={styles.hintRow}>
              <input
                className={styles.input}
                value={hint}
                maxLength={HINT_MAX}
                onChange={(event) => {
                  onHint(index, event.target.value);
                }}
                data-testid={`dica-${index}`}
              />
              <button
                type="button"
                className={styles.removeHint}
                onClick={() => {
                  onRemoveHint(index);
                }}
                aria-label={`${messages.authoring.removeHint} ${String(index + 1)}`}
              >
                ×
              </button>
            </div>
          ))}

          {hints.length < HINTS_MAX && (
            <button type="button" className={styles.addHint} onClick={onAddHint} data-testid="acrescentar-dica">
              {messages.authoring.addHint}
            </button>
          )}
        </div>
      </div>

      <p className={styles.footerCount} data-testid="contador-rodape">
        {messages.authoring.footerCount(selectedGoalIds.size, hints.length)}
      </p>

      {error !== null && (
        <p className={styles.error} data-testid="erro-autoria">
          {error}
        </p>
      )}
    </section>
  );
}
