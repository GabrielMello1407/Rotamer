'use client';

import { createContext, createElement, useContext, useMemo, type ReactElement, type ReactNode } from 'react';
import { pick, type Dictionary, type MessageTree } from './dictionary';
import { DEFAULT_LOCALE, type Locale } from './locale';
import { formatDate, formatInteger, formatNumber } from './format';

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export interface I18nProviderProps {
  readonly locale: Locale;
  readonly children: ReactNode;
}

/**
 * O idioma escolhido, entregue à árvore de componentes de cliente.
 *
 * Quem decide é o servidor, lendo o cookie: a página já chega no idioma certo e
 * não troca de texto depois da hidratação.
 */
export function I18nProvider({ locale, children }: I18nProviderProps): ReactElement {
  return createElement(LocaleContext.Provider, { value: locale }, children);
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** O dicionário do componente, no idioma de quem está lendo. */
export function useMessages<T extends MessageTree>(entries: Dictionary<T>): T {
  const locale = useContext(LocaleContext);
  return pick(entries, locale);
}

export interface Formatters {
  /**
   * O idioma corrente, para quem precisa montar um formatador próprio — o
   * número de onda da espectroscopia, por exemplo, que se escreve sem
   * separador de milhar e não cabe nos três daqui.
   */
  readonly locale: Locale;
  /** Número com casas decimais fixas. */
  readonly number: (value: number, fractionDigits?: number) => string;
  /** Contagem, sem casa decimal. */
  readonly integer: (value: number) => string;
  readonly date: (value: Date) => string;
}

/** Os formatadores presos ao idioma corrente. */
export function useFormatters(): Formatters {
  const locale = useLocale();

  return useMemo(
    () => ({
      locale,
      number: (value: number, fractionDigits = 1) => formatNumber(locale, value, fractionDigits),
      integer: (value: number) => formatInteger(locale, value),
      date: (value: Date) => formatDate(locale, value),
    }),
    [locale],
  );
}
