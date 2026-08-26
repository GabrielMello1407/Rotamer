'use client';

import type { AnalysisResult } from '@rotamer/core';
import { Button } from '@rotamer/ui';
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
 * Até aqui, molécula só chegava ao banco de raspão, como efeito de missão
 * cumprida — quem desenha fora de missão não tinha onde deixar o que fez.
 *
 * O que sobe é o molblock; a validade é reconferida pelo RDKit no servidor. Sem
 * conta, o botão não some: ele explica que guardar precisa de conta e leva para
 * a porta de entrada.
 */
export function SaveMolecule({ analysis, onNew }: SaveMoleculeProps): ReactElement | null {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [pending, startTransition] = useTransition();

  if (analysis?.ok !== true) return null;

  const { molblock, inchiKey } = analysis.molecule;

  return (
    <div className={styles.save}>
      <Button
        size="small"
        variant="secondary"
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
      </Button>

      {state.kind === 'saved' && (
        <div className={styles.done} data-testid="molecula-guardada" key={inchiKey}>
          <p className={styles.ok}>
            Guardada.{' '}
            <Link className={styles.link} href="/minhas">
              Ver minhas moléculas
            </Link>
          </p>

          <Button
            size="small"
            variant="secondary"
            data-testid="comecar-outra"
            onClick={() => {
              setState({ kind: 'idle' });
              onNew();
            }}
          >
            Começar outra
          </Button>
        </div>
      )}

      {state.kind === 'anonymous' && (
        <p className={styles.quiet} data-testid="guardar-sem-conta">
          Guardar precisa de conta —{' '}
          <Link className={styles.link} href="/entrar">
            entre
          </Link>{' '}
          e a estrutura fica esperando aqui.
        </p>
      )}

      {state.kind === 'rejected' && <p className={styles.error}>{state.reason}</p>}
    </div>
  );
}
