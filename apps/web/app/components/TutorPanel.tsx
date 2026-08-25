'use client';

import type { AnalysisResult } from '@rotamer/core';
import { Button, Label, SourceBadge } from '@rotamer/ui';
import { Fragment, useState, type ReactElement, type ReactNode } from 'react';
import { askTutor, type TutorOutcome } from '../actions/tutor';
import type { HintKind } from '../../lib/tutor/prompt';
import type { ReferenceKey } from '../../lib/tutor/schema';
import styles from './TutorPanel.module.css';

export interface TutorPanelProps {
  readonly analysis: AnalysisResult | null;
  readonly questSlug: string | null;
}

const ASKS: readonly { readonly kind: HintKind; readonly label: string }[] = [
  { kind: 'proximo-passo', label: 'E agora?' },
  { kind: 'por-que-nao-fechou', label: 'Por que não fechou?' },
  { kind: 'entender-a-molecula', label: 'O que é isto?' },
];

const PLACEHOLDER = /(\{\{[a-zA-Z]+\}\})/g;

/**
 * O tutor.
 *
 * Tudo que sai daqui é hipótese, e a tela diz isso: selo âmbar, borda âmbar, e
 * nenhum número escrito pelo modelo — os valores que aparecem no texto são os
 * que o RDKit calculou, encaixados pela interface no lugar das referências.
 */
export function TutorPanel({ analysis, questSlug }: TutorPanelProps): ReactElement {
  const [outcome, setOutcome] = useState<TutorOutcome | null>(null);
  const [asking, setAsking] = useState(false);

  const ready = analysis !== null && analysis.ok;

  const ask = (kind: HintKind): void => {
    if (!ready) return;

    setAsking(true);
    const run = async (): Promise<void> => {
      setOutcome(
        await askTutor({ molblock: analysis.molecule.molblock, questSlug, kind }),
      );
      setAsking(false);
    };

    void run();
  };

  return (
    <section className={styles.panel} aria-label="Tutor">
      <div className={styles.header}>
        <Label>tutor</Label>
        {outcome?.status === 'ok' && <SourceBadge source="generated" />}
      </div>

      <div className={styles.actions}>
        {ASKS.map((entry) => (
          <Button
            key={entry.kind}
            size="small"
            variant="secondary"
            disabled={!ready || asking}
            data-testid={`tutor-${entry.kind}`}
            onClick={() => {
              ask(entry.kind);
            }}
          >
            {entry.label}
          </Button>
        ))}
      </div>

      {!ready && (
        <p className={styles.quiet}>
          Desenhe uma estrutura válida e o tutor pode comentar o que você já tem.
        </p>
      )}

      {asking && <p className={styles.quiet}>Perguntando…</p>}

      {outcome?.status === 'unavailable' && (
        <p className={styles.quiet} data-testid="tutor-indisponivel">
          O tutor está desligado neste ambiente. As dicas da missão continuam valendo — elas são
          escritas à mão e revisadas como conteúdo.
        </p>
      )}

      {outcome?.status === 'limit' && (
        <p className={styles.quiet} data-testid="tutor-limite">
          Você chegou ao limite de perguntas de hoje. As dicas escritas à mão continuam
          disponíveis na missão.
        </p>
      )}

      {outcome?.status === 'rejected' && <p className={styles.quiet}>{outcome.reason}</p>}

      {outcome?.status === 'ok' && (
        <div className={styles.answer} data-testid="tutor-resposta">
          <p className={styles.diagnosis}>
            {withReferences(outcome.answer.hint.diagnosis, outcome.answer.values)}
          </p>

          <ul className={styles.suggestions}>
            {outcome.answer.hint.suggestions.map((suggestion) => (
              <li key={suggestion}>{withReferences(suggestion, outcome.answer.values)}</li>
            ))}
          </ul>

          {outcome.answer.hint.watchOut !== undefined && (
            <p className={styles.watchOut}>
              <span className={styles.watchOutLabel}>Cuidado: </span>
              {withReferences(outcome.answer.hint.watchOut, outcome.answer.values)}
            </p>
          )}

          <p className={styles.quiet}>
            Texto gerado por modelo de linguagem a partir dos números calculados. É hipótese, não
            medida.
          </p>
        </div>
      )}
    </section>
  );
}

/**
 * Troca cada referência pelo número que o RDKit calculou, em fonte mono.
 *
 * O modelo escreveu `{{tpsa}}`; quem escreve o valor é a interface. É por isso
 * que não existe caminho pelo qual um número errado chegue à tela.
 */
function withReferences(
  text: string,
  values: Readonly<Partial<Record<ReferenceKey, string>>>,
): ReactNode {
  return text.split(PLACEHOLDER).map((piece, index) => {
    const match = /^\{\{([a-zA-Z]+)\}\}$/.exec(piece);
    if (match === null) return <Fragment key={`${String(index)}-t`}>{piece}</Fragment>;

    const key = match[1] as ReferenceKey | undefined;
    const value = key === undefined ? '' : (values[key] ?? '');

    return (
      <span key={`${String(index)}-v`} className={styles.value}>
        {value}
      </span>
    );
  });
}
