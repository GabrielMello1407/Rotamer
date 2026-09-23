'use client';

import { LOCALE_NAMES, LOCALES, type Locale } from '@rotamer/i18n';
import { useLocale, useMessages } from '@rotamer/i18n/react';
import { useRouter } from 'next/navigation';
import { useTransition, type ReactElement } from 'react';
import { chooseLocale } from '../actions/locale';
import styles from './LanguageSwitch.module.css';
import { languageSwitchMessages } from './messages';

export interface LanguageSwitchProps {
  /**
   * Classe de quem hospeda o botão. A barra do editor passa a dela, para o
   * botão ter a mesma altura e o mesmo peso dos vizinhos; sem ela, vale o
   * formato de pílula, que é o que os cabeçalhos das páginas usam.
   */
  readonly className?: string | undefined;
}

/**
 * O botão de idioma que fica à vista em toda tela.
 *
 * Mostra o nome do **outro** idioma, escrito nele mesmo: numa tela em português
 * o botão diz "English", e numa em inglês diz "Português". É o que procura quem
 * não está entendendo a tela — e é justamente por não a entender que a pessoa
 * precisa achar a palavra do idioma dela, não a do idioma atual.
 *
 * O seletor com as duas opções lado a lado (`LanguageToggle`) continua no
 * painel de análise e na página de marca. Este aqui existe porque a primeira
 * versão do produto bilíngue só tinha aquele, no rodapé de um painel que
 * começa fechado — e ninguém achava onde trocar o idioma.
 *
 * Com dois idiomas, "o outro" é um só. Se entrar um terceiro, este botão vira
 * menu.
 */
export function LanguageSwitch({ className }: LanguageSwitchProps): ReactElement {
  const locale = useLocale();
  const messages = useMessages(languageSwitchMessages);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const next: Locale = LOCALES.find((option) => option !== locale) ?? locale;

  const choose = (): void => {
    startTransition(async () => {
      // A escolha vai para o servidor e a página é pedida de novo: metade do
      // texto é renderizada lá, e trocar só o que está no navegador deixaria
      // a tela com os dois idiomas misturados.
      await chooseLocale(next);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      className={className ?? styles.switch}
      lang={next}
      title={messages.switchTo(LOCALE_NAMES[next])}
      disabled={pending}
      data-testid="trocar-idioma"
      onClick={choose}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.icon}>
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M1.75 8h12.5M8 1.75c1.8 1.7 2.7 3.8 2.7 6.25S9.8 12.55 8 14.25M8 1.75C6.2 3.45 5.3 5.55 5.3 8s.9 4.55 2.7 6.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
      <span>{LOCALE_NAMES[next]}</span>
    </button>
  );
}
