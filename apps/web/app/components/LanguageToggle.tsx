'use client';

import { LOCALE_NAMES, LOCALES, type Locale } from '@rotamer/i18n';
import { useLocale, useMessages } from '@rotamer/i18n/react';
import { Button } from '@rotamer/ui';
import { useRouter } from 'next/navigation';
import { useTransition, type ReactElement } from 'react';
import { chooseLocale } from '../actions/locale';
import styles from './LanguageToggle.module.css';
import { languageToggleMessages } from './messages';

/**
 * A troca de idioma.
 *
 * Grava a escolha no servidor e pede a página de novo: metade do texto do
 * produto é renderizada lá, e trocar só o que está no navegador deixaria a
 * barra em inglês e o enunciado da missão em português.
 *
 * O nome de cada idioma aparece no próprio idioma. Quem procura o seletor é
 * justamente quem não está entendendo a tela.
 */
export function LanguageToggle(): ReactElement {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const messages = useMessages(languageToggleMessages);

  const choose = (next: Locale): void => {
    if (next === locale) return;

    startTransition(async () => {
      await chooseLocale(next);
      router.refresh();
    });
  };

  return (
    <div className={styles.toggle} role="group" aria-label={messages.label}>
      {LOCALES.map((option) => (
        <Button
          key={option}
          variant="ghost"
          size="small"
          className={styles.option}
          lang={option}
          disabled={pending}
          aria-pressed={locale === option}
          onClick={() => {
            choose(option);
          }}
        >
          {LOCALE_NAMES[option]}
        </Button>
      ))}
    </div>
  );
}
