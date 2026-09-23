'use client';

import type { NormalModes } from '@rotamer/core';
import { useFormatters, useLocale, useMessages } from '@rotamer/i18n/react';
import { SourceBadge } from '@rotamer/ui';
import { useMemo, type ReactElement } from 'react';
import { normalModesMessages } from './messages';
import styles from './NormalModesPanel.module.css';

export interface NormalModesPanelProps {
  readonly modes: NormalModes | null;
  /** Elementos sem parâmetro no campo de força, quando é esse o motivo. */
  readonly unsupported?: readonly string[];
  /** Qual está em exibição na cena, pelo índice na lista. */
  readonly selected: number | null;
  readonly onSelect: (index: number | null) => void;
  /** Verdadeiro enquanto o worker ainda está calculando. */
  readonly pending: boolean;
}

/**
 * Os modos normais de vibração.
 *
 * Uma molécula com N átomos tem 3N graus de liberdade. Três vão para a molécula
 * inteira andar pelo espaço e três para ela girar — duas, se for linear, porque
 * girar em torno do próprio eixo não muda a posição de átomo nenhum. O que sobra
 * é vibração: **3N − 6**, ou **3N − 5** para linear.
 *
 * Clicar num modo faz a cena mostrar só ele, isolado dos outros — que é como se
 * ensina espectroscopia: primeiro o movimento, depois a frequência.
 */
export function NormalModesPanel({
  modes,
  unsupported = [],
  selected,
  onSelect,
  pending,
}: NormalModesPanelProps): ReactElement | null {
  const locale = useLocale();
  const messages = useMessages(normalModesMessages);
  const { integer } = useFormatters();

  /**
   * Número de onda sem separador de milhar.
   *
   * Espectroscopia escreve `1042 cm⁻¹`, nunca `1.042` — e em português o ponto
   * de milhar é justamente o que se lê como vírgula decimal em outros lugares.
   * Aqui a convenção da área ganha da convenção tipográfica, nos dois idiomas.
   */
  const wave = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0, useGrouping: false }),
    [locale],
  );

  if (modes === null) {
    return (
      <section className={styles.section} data-testid="modos-normais">
        <h3 className={styles.heading}>{messages.heading}</h3>
        <p className={styles.quiet}>
          {unsupported.length > 0
            ? messages.unsupported(unsupported.join(', '))
            : pending
              ? messages.computing
              : messages.empty}
        </p>
      </section>
    );
  }

  const formula = modes.linear ? '3N − 5' : '3N − 6';
  const imaginary = modes.modes.filter((mode) => mode.wavenumber < 0).length;

  return (
    <section className={styles.section} data-testid="modos-normais">
      <h3 className={styles.heading}>{messages.heading}</h3>

      <p className={styles.count} data-testid="conta-de-modos">
        <strong>{modes.modes.length}</strong>
        {messages.countTail(formula, modes.atomCount, modes.linear)}
      </p>

      <ul className={styles.list}>
        {modes.modes.map((mode, index) => {
          const kind = mode.stretch >= mode.bend ? messages.stretch : messages.bend;
          const share = Math.round(Math.max(mode.stretch, mode.bend) * 100);

          return (
            <li key={index}>
              <button
                type="button"
                className={styles.row}
                aria-pressed={selected === index}
                data-testid={`modo-${String(index + 1)}`}
                onClick={() => {
                  onSelect(selected === index ? null : index);
                }}
              >
                <span className={styles.number}>{index + 1}</span>
                <span
                  className={[styles.wave, mode.wavenumber < 0 ? styles.imaginary : null]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {wave.format(mode.wavenumber)}
                  <span className={styles.unit}>cm⁻¹</span>
                </span>
                <span className={styles.kind}>
                  {kind}
                  <span className={styles.share}>{integer(share)}%</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {imaginary > 0 && (
        <p className={styles.warn} data-testid="modo-imaginario">
          {messages.imaginary(imaginary)}
        </p>
      )}

      <p className={styles.note}>{messages.forceFieldNote}</p>

      <p className={styles.note}>{messages.sceneNote}</p>

      <SourceBadge source="computed" locale={locale} />
    </section>
  );
}
