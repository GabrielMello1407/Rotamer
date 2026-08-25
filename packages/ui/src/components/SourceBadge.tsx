import type { ReactElement } from 'react';
import styles from './SourceBadge.module.css';

export type Source = 'computed' | 'generated';

export interface SourceBadgeProps {
  readonly source: Source;
  readonly className?: string | undefined;
}

const TEXT: Readonly<Record<Source, string>> = {
  computed: 'calculado',
  generated: 'hipótese da IA',
};

const DESCRIPTION: Readonly<Record<Source, string>> = {
  computed: 'Valor calculado pelo RDKit ou pelo motor de missões.',
  generated: 'Texto gerado por modelo de linguagem. É hipótese, não medida.',
};

/**
 * Indicador de origem — verde para calculado, âmbar para gerado.
 *
 * É a regra do produto virando pixel: todo bloco de análise na tela declara de
 * onde veio. O núcleo determinístico decide; a IA explica, e o selo diz qual é
 * qual sem o usuário precisar adivinhar.
 */
export function SourceBadge({ source, className }: SourceBadgeProps): ReactElement {
  return (
    <span
      className={[styles.badge, styles[source], className].filter(Boolean).join(' ')}
      title={DESCRIPTION[source]}
    >
      <span className={styles.dot} aria-hidden="true" />
      {TEXT[source]}
    </span>
  );
}
