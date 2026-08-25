'use client';

import { Card, Formula, Label, NumberValue, SourceBadge } from '@rotamer/ui';
import type { ReactElement } from 'react';
import styles from './ChemistryPanel.module.css';
import { useChemistry } from './use-chemistry';

export interface ChemistryPanelProps {
  /** Estrutura analisada. Na Fase 0 é a aspirina, escrita em SMILES. */
  readonly input: string;
  readonly name: string;
}

/**
 * A prova de que a Fase 0 está de pé: RDKit rodando em worker, com os números
 * saindo do motor determinístico e o selo verde dizendo isso na cara.
 *
 * Nenhum número desta tela foi escrito à mão.
 */
export function ChemistryPanel({ input, name }: ChemistryPanelProps): ReactElement {
  const state = useChemistry(input);

  return (
    <Card title={name} accessory={<SourceBadge source="computed" />}>
      {state.phase === 'loading' && (
        <p className={styles.waiting}>
          <span className={styles.pulse} aria-hidden="true" />
          Carregando o RDKit no worker — a página aparece primeiro, o WebAssembly sobe depois.
        </p>
      )}

      {state.phase === 'failed' && <p className={styles.error}>{state.message}</p>}

      {state.phase === 'ready' && !state.result.ok && (
        <p className={styles.error} data-testid="chemistry-error">
          {state.result.error.message}
        </p>
      )}

      {state.phase === 'ready' && state.result.ok && (
        <div className={styles.panel}>
          <div data-testid="formula">
            <Formula value={state.result.molecule.formula} className={styles.formula} />
          </div>

          <div className={styles.grid}>
            <div className={styles.metric}>
              <Label>massa molar</Label>
              <NumberValue
                value={state.result.molecule.descriptors.molarMass}
                unit="g/mol"
                className={styles.value}
              />
            </div>
            <div className={styles.metric}>
              <Label>TPSA</Label>
              <NumberValue
                value={state.result.molecule.descriptors.tpsa}
                unit="Å²"
                className={styles.value}
              />
            </div>
            <div className={styles.metric}>
              <Label>logP</Label>
              <NumberValue
                value={state.result.molecule.descriptors.logP}
                className={styles.value}
              />
            </div>
            <div className={styles.metric}>
              <Label>rotacionáveis</Label>
              <NumberValue
                value={state.result.molecule.descriptors.rotatableBonds}
                decimals={0}
                className={styles.value}
              />
            </div>
            <div className={styles.metric}>
              <Label>anéis aromáticos</Label>
              <NumberValue
                value={state.result.molecule.descriptors.aromaticRings}
                decimals={0}
                className={styles.value}
              />
            </div>
          </div>

          <div className={styles.metric}>
            <Label>InChIKey</Label>
            <span className={styles.key}>{state.result.molecule.inchiKey}</span>
          </div>

          <p className={styles.footer}>
            <span>RDKit {state.version} · WebAssembly em Web Worker</span>
          </p>
        </div>
      )}
    </Card>
  );
}
