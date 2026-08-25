import type { ButtonHTMLAttributes, ReactElement } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'medium' | 'small';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
}

/**
 * Botão. O primário é a única superfície turquesa da tela — a cor da marca é
 * também a cor da ação, e nenhuma cor CPK entra aqui.
 */
export function Button({
  variant = 'secondary',
  size = 'medium',
  className,
  type = 'button',
  ...rest
}: ButtonProps): ReactElement {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  return <button className={classes} type={type} {...rest} />;
}
