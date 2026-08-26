'use client';

import type { AnalysisResult } from '@rotamer/core';
import { Formula, Logo } from '@rotamer/ui';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { AccountMenu } from './AccountMenu';
import styles from './TopBar.module.css';

export interface TopBarProps {
  readonly analysis: AnalysisResult | null;
  readonly waitingForEngine: boolean;
  /** Nome de quem está identificado, ou `null` sem conta e sem banco. */
  readonly accountName: string | null;
  readonly showAccount: boolean;
  readonly panelOpen: boolean;
  readonly onPanel: (tab: 'analysis' | 'quests') => void;
  readonly onExample: (smiles: string) => void;
}

/**
 * Moléculas de referência, à mão.
 *
 * São as mesmas da bateria de testes do núcleo: se alguma delas sair diferente
 * aqui, o erro aparece antes de qualquer aluno encontrar.
 */
const EXAMPLES: readonly { readonly name: string; readonly smiles: string }[] = [
  { name: 'Etanol', smiles: 'CCO' },
  { name: 'Ácido acético', smiles: 'CC(=O)O' },
  { name: 'Benzeno', smiles: 'c1ccccc1' },
  { name: 'Paracetamol', smiles: 'CC(=O)Nc1ccc(O)cc1' },
  { name: 'Aspirina', smiles: 'CC(=O)Oc1ccccc1C(=O)O' },
  { name: 'Cafeína', smiles: 'Cn1cnc2c1c(=O)n(C)c(=O)n2C' },
];

/**
 * A faixa de cima.
 *
 * Fica fina de propósito: o que interessa é a molécula, e a fórmula com a massa
 * é o resumo mais curto possível do que está desenhado. O estado — válida,
 * calculando, ou o erro — vive aqui porque é a única coisa que precisa ser vista
 * sem procurar.
 */
export function TopBar({
  analysis,
  waitingForEngine,
  accountName,
  showAccount,
  panelOpen,
  onPanel,
  onExample,
}: TopBarProps): ReactElement {
  const [examplesOpen, setExamplesOpen] = useState(false);
  const examplesRef = useRef<HTMLDivElement | null>(null);

  // Clicar fora fecha o menu, como fecha qualquer menu.
  useEffect(() => {
    if (!examplesOpen) return;

    const onPointerDown = (event: PointerEvent): void => {
      if (!examplesRef.current?.contains(event.target as Node)) setExamplesOpen(false);
    };
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setExamplesOpen(false);
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [examplesOpen]);

  const mass =
    analysis?.ok === true
      ? new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(analysis.molecule.descriptors.molarMass)
      : null;

  return (
    <header className={styles.bar}>
      <div className={styles.identity}>
        <Logo size={22} />
        <span className={styles.wordmark}>Rotamer</span>
      </div>

      {analysis?.ok === true && (
        <span className={styles.molecule}>
          <span data-testid="formula">
            <Formula value={analysis.molecule.formula} className={styles.formula} />
          </span>
          <span className={styles.mass}>{mass} g/mol</span>
        </span>
      )}

      <span className={styles.spacer} />

      <Status analysis={analysis} waitingForEngine={waitingForEngine} />

      <div className={styles.examples} ref={examplesRef}>
        <button
          type="button"
          className={styles.action}
          aria-expanded={examplesOpen}
          aria-haspopup="menu"
          data-testid="abrir-exemplos"
          onClick={() => {
            setExamplesOpen((current) => !current);
          }}
        >
          Exemplos
        </button>

        {examplesOpen && (
          <div className={styles.menu} role="menu" aria-label="Moléculas de exemplo">
            {EXAMPLES.map((example) => (
              <button
                key={example.smiles}
                type="button"
                role="menuitem"
                className={styles.menuItem}
                data-testid={`exemplo-${example.smiles}`}
                onClick={() => {
                  onExample(example.smiles);
                  setExamplesOpen(false);
                }}
              >
                {example.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className={styles.action}
        data-testid="abrir-missoes"
        onClick={() => {
          onPanel('quests');
        }}
      >
        Missões
      </button>

      <button
        type="button"
        className={[styles.action, styles.primary].join(' ')}
        aria-pressed={panelOpen}
        data-testid="abrir-analise"
        onClick={() => {
          onPanel('analysis');
        }}
      >
        Análise
      </button>

      {showAccount && <AccountMenu displayName={accountName} />}
    </header>
  );
}

/** Válida, calculando, vazia ou com erro — em uma frase curta. */
function Status({
  analysis,
  waitingForEngine,
}: {
  readonly analysis: AnalysisResult | null;
  readonly waitingForEngine: boolean;
}): ReactElement | null {
  if (waitingForEngine) {
    return (
      <span className={[styles.status, styles.neutral].join(' ')} data-testid="estado-molecula">
        <span className={styles.dot} aria-hidden="true" />
        carregando o motor
      </span>
    );
  }

  if (analysis === null) return null;

  if (!analysis.ok) {
    return (
      <span className={[styles.status, styles.invalid].join(' ')} data-testid="estado-molecula">
        <span className={styles.dot} aria-hidden="true" />
        estrutura impossível
      </span>
    );
  }

  return (
    <span className={[styles.status, styles.valid].join(' ')} data-testid="estado-molecula">
      <span className={styles.dot} aria-hidden="true" />
      válida
    </span>
  );
}
