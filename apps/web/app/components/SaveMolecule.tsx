'use client';

import type { AnalysisResult } from '@rotamer/core';
import Link from 'next/link';
import { useState, useTransition, type ReactElement } from 'react';
import { saveMolecule } from '../actions/library';
import { track } from '../../lib/track';
import styles from './SaveMolecule.module.css';

export interface SaveMoleculeProps {
  readonly analysis: AnalysisResult | null;
  /**
   * Limpar a tela para começar outra estrutura.
   *
   * Aparece só depois de guardar: é o momento em que a pessoa acabou uma coisa e
   * quer começar a próxima, e até aqui ela tinha de adivinhar que o caminho era
   * limpar a tela.
   */
  readonly onNew: () => void;
}

type State =
  | { readonly kind: 'idle' }
  | { readonly kind: 'saved' }
  | { readonly kind: 'anonymous' }
  | { readonly kind: 'rejected'; readonly reason: string };

/**
 * Guardar a estrutura na estante de quem entrou.
 *
 * Fica na faixa de cima, ao lado da fórmula, e não dentro do painel de análise:
 * guardar é a coisa que se procura logo depois de terminar um desenho, e painel
 * fechado é o mesmo que botão inexistente.
 *
 * O que sobe é o molblock; a validade é reconferida pelo RDKit no servidor. Sem
 * conta, o botão não some: ele explica que guardar precisa de conta e leva para
 * a porta de entrada.
 */
export function SaveMolecule({ analysis, onNew }: SaveMoleculeProps): ReactElement | null {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [pending, startTransition] = useTransition();

  if (analysis?.ok !== true) return null;

  const { molblock } = analysis.molecule;

  return (
    <span className={styles.save}>
      {state.kind === 'saved' ? (
        <span className={styles.done} data-testid="molecula-guardada">
          <Link className={styles.link} href="/minhas">
            guardada
          </Link>
          <button
            type="button"
            className={styles.action}
            data-testid="comecar-outra"
            onClick={() => {
              setState({ kind: 'idle' });
              onNew();
            }}
          >
            começar outra
          </button>
        </span>
      ) : (
        <button
          type="button"
          className={styles.action}
          disabled={pending}
          data-testid="guardar-molecula"
          onClick={() => {
            startTransition(async () => {
              const outcome = await saveMolecule({ molblock });

              if (outcome.status === 'saved') {
                track('molecula-guardada');
                setState({ kind: 'saved' });
              } else if (outcome.status === 'anonymous') {
                setState({ kind: 'anonymous' });
              } else {
                setState({ kind: 'rejected', reason: outcome.reason });
              }
            });
          }}
        >
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
      )}

      {state.kind === 'anonymous' && (
        <span className={styles.quiet} data-testid="guardar-sem-conta">
          precisa de conta —{' '}
          <Link className={styles.link} href="/entrar">
            entre
          </Link>
        </span>
      )}

      {state.kind === 'rejected' && <span className={styles.error}>{state.reason}</span>}
    </span>
  );
}
