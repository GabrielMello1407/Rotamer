import type { ReactElement } from 'react';

export interface LogoProps {
  /** Lado do símbolo em pixels. Abaixo de 32 px, use o favicon. */
  readonly size?: number;
  readonly className?: string | undefined;
  /** Símbolo puramente decorativo, ao lado do wordmark escrito. */
  readonly decorative?: boolean;
}

/**
 * Projeção de Newman na conformação escalonada.
 *
 * O círculo é o átomo de trás; as três hastes que saem do centro são as
 * ligações do átomo da frente, em turquesa; as três que saem da borda são as de
 * trás, na cor do texto. **A cor separa profundidade — nunca inverta**, porque
 * inverter faz o átomo de trás parecer o da frente e o desenho passa a estar
 * quimicamente errado.
 */
export function Logo({ size = 96, className, decorative = false }: LogoProps): ReactElement {
  const accessibility = decorative
    ? ({ 'aria-hidden': true } as const)
    : ({ role: 'img', 'aria-label': 'Rotamer' } as const);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={className}
      style={{ color: 'var(--ink-900)' }}
      {...accessibility}
    >
      {/* ligações do átomo de trás */}
      <g stroke="currentColor" strokeWidth="5" strokeLinecap="round">
        <line x1="70.52" y1="35" x2="83.51" y2="27.5" />
        <line x1="48" y1="74" x2="48" y2="89" />
        <line x1="25.48" y1="35" x2="12.49" y2="27.5" />
      </g>
      {/* átomo de trás */}
      <circle cx="48" cy="48" r="26" fill="none" stroke="currentColor" strokeWidth="5" />
      {/* ligações do átomo da frente, a 60° das de trás */}
      <g stroke="var(--brand)" strokeWidth="5" strokeLinecap="round">
        <line x1="48" y1="48" x2="48" y2="22" />
        <line x1="48" y1="48" x2="70.52" y2="61" />
        <line x1="48" y1="48" x2="25.48" y2="61" />
      </g>
    </svg>
  );
}
