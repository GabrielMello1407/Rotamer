/**
 * Os idiomas que o Rotamer fala.
 *
 * pt-BR é o idioma em que o produto foi escrito e continua sendo o padrão: a
 * sala de aula que motivou o Rotamer é brasileira. O inglês existe para que a
 * mesma instância sirva quem não lê português — e para que qualquer pessoa
 * possa subir a sua sem traduzir nada à mão.
 */
export const LOCALES = ['pt-BR', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

/** O idioma de quem não escolheu nenhum e cujo navegador não pede outro. */
export const DEFAULT_LOCALE: Locale = 'pt-BR';

/**
 * Onde a escolha fica guardada.
 *
 * É cookie, e não `localStorage` como o tema, porque o servidor precisa ler o
 * idioma: metade do texto do produto é renderizada no servidor, e a nota de
 * missão é reavaliada lá. Com o idioma só no navegador, a página chegaria em
 * português e trocaria depois da hidratação.
 */
export const LOCALE_COOKIE = 'rotamer-locale';

/** Um ano: a escolha de idioma não é sessão, é preferência. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * O nome de cada idioma **no próprio idioma**.
 *
 * Nome de idioma não se traduz: quem não lê português precisa reconhecer
 * "English" numa tela em português, e é justamente por não a entender que
 * está procurando o seletor.
 */
export const LOCALE_NAMES: Readonly<Record<Locale, string>> = {
  'pt-BR': 'Português',
  en: 'English',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * O idioma que o navegador pede, quando ainda não houve escolha.
 *
 * Lê `Accept-Language` na ordem de preferência declarada e devolve o primeiro
 * idioma que sabemos falar. `pt` em qualquer variante — `pt`, `pt-PT`, `pt-BR` —
 * cai em pt-BR: é melhor entregar português do Brasil a quem pede português de
 * Portugal do que entregar inglês.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag = '', ...parameters] = part.trim().split(';');
      const quality = parameters
        .map((parameter) => /^\s*q=([\d.]+)\s*$/.exec(parameter))
        .find((match) => match !== null);

      return { tag: tag.trim().toLowerCase(), quality: quality ? Number(quality[1]) : 1 };
    })
    .filter((entry) => entry.tag !== '' && Number.isFinite(entry.quality) && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const base = tag.split('-')[0];
    if (base === 'pt') return 'pt-BR';
    if (base === 'en') return 'en';
  }

  return DEFAULT_LOCALE;
}

/**
 * A etiqueta BCP 47 que vai no `lang` do HTML e nos formatadores do `Intl`.
 *
 * Hoje é o próprio código; existe como função porque o dia em que entrar um
 * idioma cujo código interno não sirva de etiqueta, o conserto é aqui.
 */
export function languageTag(locale: Locale): string {
  return locale;
}
