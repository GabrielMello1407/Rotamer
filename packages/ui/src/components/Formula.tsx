import { Fragment, type ReactElement } from 'react';
import styles from './Formula.module.css';

export interface FormulaProps {
  /** Fórmula em notação de Hill vinda do núcleo, ex.: `C9H8O4`. */
  readonly value: string;
  readonly className?: string | undefined;
}

/**
 * Fórmula molecular com subscrito real. Nunca `C6H6` em texto corrido — o
 * número é índice, não parte do nome do elemento.
 */
export function Formula({ value, className }: FormulaProps): ReactElement {
  const parts = value.match(/\d+|\D+/g) ?? [];

  return (
    <span
      className={[styles.formula, className].filter(Boolean).join(' ')}
      aria-label={spoken(value)}
    >
      {parts.map((part, index) => (
        <Fragment key={`${String(index)}-${part}`}>
          {/^\d+$/.test(part) ? <sub>{part}</sub> : part}
        </Fragment>
      ))}
    </span>
  );
}

/** Leitura em voz alta: `C9H8O4` vira "C 9 H 8 O 4". */
function spoken(value: string): string {
  return (value.match(/\d+|\D+/g) ?? []).join(' ');
}
