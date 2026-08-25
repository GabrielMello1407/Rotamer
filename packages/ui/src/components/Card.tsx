import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import styles from './Card.module.css';
import { Label } from './Label';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Rótulo em caixa alta no topo do cartão. */
  readonly title?: string;
  /** O que aparece à direita do título — em geral um selo de origem. */
  readonly accessory?: ReactNode;
  /** Cartão que flutua sobre a tela ganha raio maior e sombra. */
  readonly floating?: boolean;
}

/** Superfície de conteúdo. Dois níveis de elevação, nunca três. */
export function Card({
  title,
  accessory,
  floating = false,
  className,
  children,
  ...rest
}: CardProps): ReactElement {
  const classes = [styles.card, floating ? styles.floating : null, className]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classes} {...rest}>
      {(title !== undefined || accessory !== undefined) && (
        <header className={styles.header}>
          {title !== undefined && <Label>{title}</Label>}
          {accessory}
        </header>
      )}
      {children}
    </section>
  );
}
