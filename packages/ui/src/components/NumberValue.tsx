import { formatNumber, type Locale } from '@rotamer/i18n';
import type { ReactElement } from 'react';
import styles from './NumberValue.module.css';

export interface NumberValueProps {
  readonly value: number;
  /** Casas decimais. O padrão é duas, que é como massa e TPSA aparecem. */
  readonly decimals?: number;
  /** Unidade, ex.: `g/mol` ou `Å²`. Fica em tom mais claro, ao lado. */
  readonly unit?: string;
  /**
   * O idioma decide o separador decimal: 46,07 em português, 46.07 em inglês.
   * Não é estilo — é o mesmo número escrito de dois jeitos, e o jeito errado
   * numa tela de química é um número errado.
   *
   * Vem por prop, e não de contexto, porque o número também aparece em página
   * renderizada no servidor.
   */
  readonly locale: Locale;
  readonly className?: string | undefined;
}

/**
 * Todo número do produto passa por aqui: fonte mono, `tabular-nums` e o
 * separador decimal do idioma de quem lê. Coluna de números precisa alinhar
 * mesmo quando o valor muda.
 */
export function NumberValue({
  value,
  decimals = 2,
  unit,
  locale,
  className,
}: NumberValueProps): ReactElement {
  return (
    <span className={[styles.number, className].filter(Boolean).join(' ')}>
      {formatNumber(locale, value, decimals)}
      {unit !== undefined && <span className={styles.unit}>{unit}</span>}
    </span>
  );
}
