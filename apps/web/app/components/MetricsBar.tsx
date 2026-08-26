'use client';

import type { AnalysisResult, Descriptors } from '@rotamer/core';
import type { ReactElement } from 'react';
import styles from './MetricsBar.module.css';

export interface MetricsBarProps {
  readonly analysis: AnalysisResult | null;
  readonly pending: boolean;
  readonly waitingForEngine: boolean;
  /** Abre o painel com a análise inteira. */
  readonly onOpen: () => void;
}

const NUMBER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * A faixa de baixo: cinco números e o estado da regra dos cinco.
 *
 * É o resumo que fica na tela o tempo inteiro enquanto se desenha. Tudo aqui
 * saiu do RDKit — por isso não há selo de origem em cada número: a faixa
 * inteira é calculada, e o que é hipótese de IA vive no painel, marcado.
 */
export function MetricsBar({
  analysis,
  pending,
  waitingForEngine,
  onOpen,
}: MetricsBarProps): ReactElement {
  if (analysis === null) {
    return (
      <div className={styles.bar} data-testid="metricas">
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
      <div className={[styles.bar, styles.broken].join(' ')} data-testid="metricas">
        <p className={styles.error} data-testid="erro-quimico">
          <span className={styles.errorMark} aria-hidden="true" />
          {analysis.error.message}
        </p>
        <button type="button" className={styles.more} onClick={onOpen}>
          Ver o que fazer
        </button>
      </div>
    );
  }

  const { descriptors } = analysis.molecule;

  return (
    <div className={styles.bar} data-testid="metricas" aria-busy={pending}>
      <Chip label="massa" value={NUMBER.format(descriptors.molarMass)} />
      <Chip label="TPSA" value={NUMBER.format(descriptors.tpsa)} />
      <Chip label="rotáveis" value={String(descriptors.rotatableBonds)} />
      <Chip
        label="anéis"
        value={
          descriptors.aromaticRings > 0
            ? `${String(descriptors.rings)} · ${String(descriptors.aromaticRings)} arom.`
            : String(descriptors.rings)
        }
      />
      <Chip label="doa/ace" value={`${String(descriptors.hbDonors)}/${String(descriptors.hbAcceptors)}`} />
      <Chip
        label="Lipinski"
        value={lipinski(descriptors) === 0 ? 'ok' : `${String(lipinski(descriptors))} fora`}
        tone={lipinski(descriptors) === 0 ? 'ok' : 'warn'}
      />

      <button
        type="button"
        className={styles.more}
        aria-label="Abrir a análise completa"
        data-testid="abrir-analise-faixa"
        onClick={onOpen}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.icon}>
          <path
            d="M6 3.5 10.5 8 6 12.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

interface ChipProps {
  readonly label: string;
  readonly value: string;
  readonly tone?: 'ok' | 'warn';
}

function Chip({ label, value, tone }: ChipProps): ReactElement {
  return (
    <div className={styles.chip}>
      <span className={styles.label}>{label}</span>
      <span className={[styles.value, tone ? styles[tone] : null].filter(Boolean).join(' ')}>
        {value}
      </span>
    </div>
  );
}

/**
 * Quantos critérios da regra dos cinco a molécula ultrapassa.
 *
 * A conta é aritmética sobre números que o RDKit já entregou — massa até 500,
 * logP até 5, cinco doadores, dez aceitadores. Não é previsão de nada: a regra
 * de Lipinski descreve o que costuma ser absorvido por via oral, e nada aqui
 * afirma que esta molécula tem qualquer atividade.
 */
function lipinski(descriptors: Descriptors): number {
  let broken = 0;
  if (descriptors.molarMass > 500) broken += 1;
  if (descriptors.logP > 5) broken += 1;
  if (descriptors.hbDonors > 5) broken += 1;
  if (descriptors.hbAcceptors > 10) broken += 1;
  return broken;
}
