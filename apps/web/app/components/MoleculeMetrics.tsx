'use client';

import type { AnalysisResult } from '@rotamer/core';
import { Formula, Label, NumberValue, SourceBadge } from '@rotamer/ui';
import type { ReactElement } from 'react';
import styles from './MoleculeMetrics.module.css';

export interface MoleculeMetricsProps {
  readonly analysis: AnalysisResult | null;
  readonly pending: boolean;
  readonly waitingForEngine: boolean;
}

/**
 * A faixa de métricas.
 *
 * Todo número aqui saiu do RDKit — daí o selo verde. Nenhum deles passa por
 * modelo de linguagem, e a interface diz isso sem o usuário precisar perguntar.
 */
export function MoleculeMetrics({
  analysis,
  pending,
  waitingForEngine,
}: MoleculeMetricsProps): ReactElement {
  if (analysis === null) {
    return (
      <div className={styles.strip} data-testid="metricas">
        <p className={styles.quiet}>
          {waitingForEngine
            ? 'Carregando o motor de química…'
            : 'Desenhe uma estrutura para ver fórmula, massa e descritores.'}
        </p>
      </div>
    );
  }

  if (!analysis.ok) {
    return (
      <div className={styles.strip} data-testid="metricas">
        <p className={styles.error} data-testid="erro-quimico">
          <span className={styles.errorMark} aria-hidden="true" />
          {analysis.error.message}
        </p>
      </div>
    );
  }

  const { molecule } = analysis;
  const { descriptors } = molecule;

  return (
    <div className={styles.strip} data-testid="metricas" aria-busy={pending}>
      <div className={styles.metric}>
        <Label>fórmula</Label>
        <span data-testid="formula">
          <Formula value={molecule.formula} className={styles.formula} />
        </span>
      </div>

      <div className={styles.metric}>
        <Label>massa molar</Label>
        <NumberValue value={descriptors.molarMass} unit="g/mol" />
      </div>

      <div className={styles.metric}>
        <Label>TPSA</Label>
        <NumberValue value={descriptors.tpsa} unit="Å²" />
      </div>

      <div className={styles.metric}>
        <Label>logP</Label>
        <NumberValue value={descriptors.logP} />
      </div>

      <div className={styles.metric}>
        <Label>rotacionáveis</Label>
        <NumberValue value={descriptors.rotatableBonds} decimals={0} />
      </div>

      <div className={styles.metric}>
        <Label>anéis aromáticos</Label>
        <NumberValue value={descriptors.aromaticRings} decimals={0} />
      </div>

      <div className={styles.metric}>
        <Label>estereocentros</Label>
        <span className={styles.stereo} data-testid="estereocentros">
          <NumberValue value={descriptors.stereocenters} decimals={0} />
          {descriptors.unspecifiedStereocenters > 0 && (
            <span
              className={styles.stereoNote}
              title="O editor ainda não representa cunhas e traços: a configuração não está definida no desenho."
            >
              {descriptors.unspecifiedStereocenters === descriptors.stereocenters
                ? 'sem configuração'
                : `${String(descriptors.unspecifiedStereocenters)} sem configuração`}
            </span>
          )}
        </span>
      </div>

      <div className={styles.metric}>
        <Label>InChIKey</Label>
        <span className={styles.key}>{molecule.inchiKey}</span>
      </div>

      <span className={styles.spacer} />
      <SourceBadge source="computed" />
    </div>
  );
}
