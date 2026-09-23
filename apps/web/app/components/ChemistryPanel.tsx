'use client';

import type { AnalysisResult } from '@rotamer/core';
import { chemistryErrorText } from '@rotamer/i18n';
import { useLocale, useMessages } from '@rotamer/i18n/react';
import { Card, Formula, Label, NumberValue, SourceBadge } from '@rotamer/ui';
import { useEffect, useState, type ReactElement } from 'react';
import { chemistryPanelMessages } from './messages';
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
  const locale = useLocale();
  const messages = useMessages(chemistryPanelMessages);
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
    <Card title={name} accessory={<SourceBadge source="computed" locale={locale} />}>
      {connection.status === 'loading' && (
        <p className={styles.waiting}>
          <span className={styles.pulse} aria-hidden="true" />
          {messages.loading}
        </p>
      )}

      {connection.status === 'failed' && <p className={styles.error}>{messages.engineFailed}</p>}

      {analysis !== null && !analysis.ok && (
        <p className={styles.error} data-testid="chemistry-error">
          {chemistryErrorText(locale, analysis.error)}
        </p>
      )}

      {connection.status === 'ready' && analysis?.ok === true && (
        <div className={styles.panel}>
          <div data-testid="formula">
            <Formula value={analysis.molecule.formula} className={styles.formula} />
          </div>

          <div className={styles.grid}>
            <div className={styles.metric}>
              <Label>{messages.molarMass}</Label>
              <NumberValue
                value={analysis.molecule.descriptors.molarMass}
                unit="g/mol"
                locale={locale}
                className={styles.value}
              />
            </div>
            <div className={styles.metric}>
              <Label>{messages.tpsa}</Label>
              <NumberValue
                value={analysis.molecule.descriptors.tpsa}
                unit="Å²"
                locale={locale}
                className={styles.value}
              />
            </div>
            <div className={styles.metric}>
              <Label>{messages.logP}</Label>
              <NumberValue
                value={analysis.molecule.descriptors.logP}
                locale={locale}
                className={styles.value}
              />
            </div>
            <div className={styles.metric}>
              <Label>{messages.rotatable}</Label>
              <NumberValue
                value={analysis.molecule.descriptors.rotatableBonds}
                decimals={0}
                locale={locale}
                className={styles.value}
              />
            </div>
            <div className={styles.metric}>
              <Label>{messages.aromaticRings}</Label>
              <NumberValue
                value={analysis.molecule.descriptors.aromaticRings}
                decimals={0}
                locale={locale}
                className={styles.value}
              />
            </div>
          </div>

          <div className={styles.metric}>
            <Label>{messages.inchiKey}</Label>
            <span className={styles.key}>{analysis.molecule.inchiKey}</span>
          </div>

          <p className={styles.footer}>
            <span>{messages.footer(connection.version)}</span>
          </p>
        </div>
      )}
    </Card>
  );
}
