'use client';

import type { NormalModes } from '@rotamer/core';
import { SourceBadge } from '@rotamer/ui';
import type { ReactElement } from 'react';
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
 * Número de onda sem separador de milhar.
 *
 * Espectroscopia escreve `1042 cm⁻¹`, nunca `1.042` — e em português o ponto de
 * milhar é justamente o que se lê como vírgula decimal em outros lugares. Aqui a
 * convenção da área ganha da convenção tipográfica.
 */
const WAVE = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0, useGrouping: false });
const PERCENT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

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
  if (modes === null) {
    return (
      <section className={styles.section} data-testid="modos-normais">
        <h3 className={styles.heading}>Modos normais</h3>
        <p className={styles.quiet}>
          {unsupported.length > 0
            ? `O campo de força MMFF94 não tem parâmetros para ${unsupported.join(', ')}. A forma no espaço aparece assim mesmo, montada com comprimentos e ângulos de ligação — o que não existe é a energia, e sem energia não há frequência de vibração.`
            : pending
              ? 'Calculando a Hessiana do campo de força…'
              : 'Os modos aparecem quando a estrutura fecha. Molécula muito grande fica de fora: a conta trava a máquina antes de terminar.'}
        </p>
      </section>
    );
  }

  const formula = modes.linear ? '3N − 5' : '3N − 6';
  const imaginary = modes.modes.filter((mode) => mode.wavenumber < 0).length;

  return (
    <section className={styles.section} data-testid="modos-normais">
      <h3 className={styles.heading}>Modos normais</h3>

      <p className={styles.count} data-testid="conta-de-modos">
        <strong>{modes.modes.length}</strong> modos ={' '}
        <span className={styles.formula}>{formula}</span>, com N = {modes.atomCount}
        {modes.linear ? ' — a molécula é linear' : ''}.
      </p>

      <ul className={styles.list}>
        {modes.modes.map((mode, index) => {
          const kind = mode.stretch >= mode.bend ? 'estiramento' : 'dobramento';
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
                  {WAVE.format(mode.wavenumber)}
                  <span className={styles.unit}>cm⁻¹</span>
                </span>
                <span className={styles.kind}>
                  {kind}
                  <span className={styles.share}>{PERCENT.format(share)}%</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {imaginary > 0 && (
        <p className={styles.warn} data-testid="modo-imaginario">
          {imaginary === 1 ? 'Um modo tem' : `${String(imaginary)} modos têm`} frequência
          imaginária (número negativo): nesta geometria o campo de força não vê um mínimo, e a
          molécula desceria de energia se se deformasse nesse sentido. Acontece com estruturas em
          que o MMFF94 é mal parametrizado — o CO₂ é o exemplo clássico.
        </p>
      )}

      <p className={styles.note}>
        Frequências do campo de força MMFF94, calculadas aqui — não são medidas de espectro. Campo
        de força clássico costuma superestimar estiramento em torno de 5% a 10%: o número serve
        para comparar modos entre si e ver a forma do movimento.
      </p>

      <p className={styles.note}>
        Na cena, amplitude e velocidade são exageradas para caber no olho: um estiramento C–H
        completa um ciclo a cada 11 femtossegundos, e a amplitude real é uma fração de ångström. O
        que está certo é a forma do movimento — quem anda, para onde e em que proporção.
      </p>

      <SourceBadge source="computed" />
    </section>
  );
}
