import { languageTag, type Locale } from './locale';

/**
 * Formatação de número por idioma.
 *
 * Não é detalhe de estilo: 46,07 e 46.07 são o mesmo número escrito em dois
 * idiomas, e mostrar vírgula decimal a quem lê inglês é mostrar um número
 * errado. Os formatadores do `Intl` são caros de construir e o produto refaz a
 * faixa de métricas a cada 120 ms — por isso ficam em cache.
 */
const cache = new Map<string, Intl.NumberFormat>();

export function numberFormat(locale: Locale, fractionDigits = 1): Intl.NumberFormat {
  const key = `${locale}:${String(fractionDigits)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const format = new Intl.NumberFormat(languageTag(locale), {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  cache.set(key, format);
  return format;
}

/** Número com casas decimais fixas, no idioma de quem lê. */
export function formatNumber(locale: Locale, value: number, fractionDigits = 1): string {
  return numberFormat(locale, fractionDigits).format(value);
}

/** Inteiro sem casa decimal — contagem de anel, de átomo, de tentativa. */
export function formatInteger(locale: Locale, value: number): string {
  return numberFormat(locale, 0).format(value);
}

const dates = new Map<string, Intl.DateTimeFormat>();

/**
 * Data curta. pt-BR escreve 21/09/2026 e o inglês escreve Sep 21, 2026 —
 * 09/21 e 21/09 são a mesma data lida ao contrário, e o mês por extenso é o
 * único jeito de nenhum dos dois ler errado.
 */
export function formatDate(locale: Locale, value: Date): string {
  const cached = dates.get(locale);
  const format =
    cached ??
    new Intl.DateTimeFormat(languageTag(locale), {
      day: '2-digit',
      month: locale === 'en' ? 'short' : '2-digit',
      year: 'numeric',
    });
  if (!cached) dates.set(locale, format);

  return format.format(value);
}
