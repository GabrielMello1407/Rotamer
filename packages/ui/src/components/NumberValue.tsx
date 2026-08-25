import type { ReactElement } from 'react';
import styles from './NumberValue.module.css';

export interface NumberValueProps {
  readonly value: number;
  /** Casas decimais. O padrão é duas, que é como massa e TPSA aparecem. */
  readonly decimals?: number;
  /** Unidade, ex.: `g/mol` ou `Å²`. Fica em tom mais claro, ao lado. */
  readonly unit?: string;
  readonly className?: string | undefined;
}

/**
 * Todo número do produto passa por aqui: fonte mono, `tabular-nums` e vírgula
 * decimal. Coluna de números precisa alinhar mesmo quando o valor muda.
 */
export function NumberValue({
  value,
  decimals = 2,
  unit,
  className,
}: NumberValueProps): ReactElement {
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  return (
    <span className={[styles.number, className].filter(Boolean).join(' ')}>
      {formatted}
      {unit !== undefined && <span className={styles.unit}>{unit}</span>}
    </span>
  );
}
