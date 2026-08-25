'use client';

import type { AnalysisResult } from '@rotamer/core';
import { Card, Formula, Label, NumberValue, SourceBadge } from '@rotamer/ui';
import { useEffect, useState, type ReactElement } from 'react';
import styles from './ChemistryPanel.module.css';
import { useChemistryClient } from './use-chemistry-client';

export interface ChemistryPanelProps {
  /** Estrutura analisada. Na página de marca é a aspirina, escrita em SMILES. */
  readonly input: string;
  readonly name: string;
}

/**
 * A prova de que o motor está de pé: RDKit rodando em worker, com os números
 * saindo do motor determinístico e o selo verde dizendo isso na cara.
 *
 * Nenhum número desta tela foi escrito à mão.
 */
export function ChemistryPanel({ input, name }: ChemistryPanelProps): ReactElement {
  const connection = useChemistryClient();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (connection.status !== 'ready') return;

    let alive = true;
    const read = async (): Promise<void> => {
      const result = await connection.client.analyze(input);
      if (alive) setAnalysis(result);
    };

    void read();
    return () => {
      alive = false;
    };
  }, [connection, input]);

  return (
    <Card title={name} accessory={<SourceBadge source="computed" />}>
      {connection.status === 'loading' && (
        <p className={styles.waiting}>
          <span className={styles.pulse} aria-hidden="true" />
          Carregando o RDKit no worker — a página aparece primeiro, o WebAssembly sobe depois.
        </p>
      )}

      {connection.status === 'failed' && <p className={styles.error}>{connection.message}</p>}

      {analysis !== null && !analysis.ok && (
        <p className={styles.error} data-testid="chemistry-error">
          {analysis.error.message}
        </p>
      )}

      {connection.status === 'ready' && analysis?.ok === true && (
        <div className={styles.panel}>
          <div data-testid="formula">
            <Formula value={analysis.molecule.formula} className={styles.formula} />
          </div>

          <div className={styles.grid}>
            <div className={styles.metric}>
              <Label>massa molar</Label>
              <NumberValue
                value={analysis.molecule.descriptors.molarMass}
                unit="g/mol"
                className={styles.value}
              />
            </div>
            <div className={styles.metric}>
              <Label>TPSA</Label>
              <NumberValue
                value={analysis.molecule.descriptors.tpsa}
                unit="Å²"
                className={styles.value}
              />
            </div>
            <div className={styles.metric}>
              <Label>logP</Label>
              <NumberValue value={analysis.molecule.descriptors.logP} className={styles.value} />
            </div>
            <div className={styles.metric}>
              <Label>rotacionáveis</Label>
              <NumberValue
                value={analysis.molecule.descriptors.rotatableBonds}
                decimals={0}
                className={styles.value}
              />
            </div>
            <div className={styles.metric}>
              <Label>anéis aromáticos</Label>
              <NumberValue
                value={analysis.molecule.descriptors.aromaticRings}
                decimals={0}
                className={styles.value}
              />
            </div>
          </div>

          <div className={styles.metric}>
            <Label>InChIKey</Label>
            <span className={styles.key}>{analysis.molecule.inchiKey}</span>
          </div>

          <p className={styles.footer}>
            <span>RDKit {connection.version} · WebAssembly em Web Worker</span>
          </p>
        </div>
      )}
    </Card>
  );
}
