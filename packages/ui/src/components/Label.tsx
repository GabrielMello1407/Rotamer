import type { HTMLAttributes, ReactElement } from 'react';
import styles from './Label.module.css';

export type LabelProps = HTMLAttributes<HTMLSpanElement>;

/** Rótulo em caixa alta. Nunca passa de três palavras. */
export function Label({ className, ...rest }: LabelProps): ReactElement {
  return <span className={[styles.label, className].filter(Boolean).join(' ')} {...rest} />;
}
