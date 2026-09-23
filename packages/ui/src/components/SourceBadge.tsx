import { pick, type Locale } from '@rotamer/i18n';
import type { ReactElement } from 'react';
import { sourceBadgeMessages } from '../messages';
import styles from './SourceBadge.module.css';

export type Source = 'computed' | 'generated';

export interface SourceBadgeProps {
  readonly source: Source;
  /**
   * O idioma vem por prop, e não de um contexto de React, porque o selo
   * aparece também em página renderizada no servidor — a da molécula pública.
   * Contexto não atravessa essa fronteira; prop atravessa.
   */
  readonly locale: Locale;
  readonly className?: string | undefined;
}

/**
 * Indicador de origem — verde para calculado, âmbar para gerado.
 *
 * É a regra do produto virando pixel: todo bloco de análise na tela declara de
 * onde veio. O núcleo determinístico decide; a IA explica, e o selo diz qual é
 * qual sem o usuário precisar adivinhar.
 */
export function SourceBadge({ source, locale, className }: SourceBadgeProps): ReactElement {
  const messages = pick(sourceBadgeMessages, locale);
  const title = source === 'computed' ? messages.computedTitle : messages.generatedTitle;

  return (
    <span
      className={[styles.badge, styles[source], className].filter(Boolean).join(' ')}
      title={title}
    >
      <span className={styles.dot} aria-hidden="true" />
      {messages[source]}
    </span>
  );
}
