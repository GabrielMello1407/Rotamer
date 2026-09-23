import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  isLocale,
  languageTag,
  LOCALE_NAMES,
  LOCALES,
  negotiateLocale,
} from '../src/locale';
import { formatDate, formatInteger, formatNumber } from '../src/format';
import { list, plural } from '../src/plural';

describe('qual idioma entregar', () => {
  it('sem pedido nenhum, entrega o idioma em que o produto foi escrito', () => {
    expect(negotiateLocale(null)).toBe('pt-BR');
    expect(negotiateLocale('')).toBe('pt-BR');
    expect(DEFAULT_LOCALE).toBe('pt-BR');
  });

  it('atende o inglês de quem pede inglês', () => {
    expect(negotiateLocale('en-US,en;q=0.9')).toBe('en');
  });

  /** Quem pede português de Portugal lê português do Brasil sem reclamar; inglês, não. */
  it('qualquer variante de português cai em pt-BR', () => {
    expect(negotiateLocale('pt-PT,pt;q=0.9,en;q=0.8')).toBe('pt-BR');
    expect(negotiateLocale('pt')).toBe('pt-BR');
  });

  it('respeita a ordem de preferência, não a ordem de escrita', () => {
    expect(negotiateLocale('de;q=0.9,en;q=0.8,pt-BR;q=0.7')).toBe('en');
    expect(negotiateLocale('en;q=0.3,pt-BR;q=0.8')).toBe('pt-BR');
  });

  it('idioma que não falamos não derruba nada', () => {
    expect(negotiateLocale('ja,ko;q=0.8')).toBe('pt-BR');
    expect(negotiateLocale('lixo;;;q=')).toBe('pt-BR');
  });

  it('reconhece só os idiomas que existem', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('pt-BR')).toBe(true);
    expect(isLocale('pt')).toBe(false);
    expect(isLocale(null)).toBe(false);
  });

  /** Nome de idioma não se traduz: é justamente quem não lê a tela que procura o seu. */
  it('cada idioma se chama pelo próprio nome', () => {
    expect(LOCALE_NAMES['pt-BR']).toBe('Português');
    expect(LOCALE_NAMES.en).toBe('English');
  });

  it('a etiqueta do HTML serve ao Intl', () => {
    for (const locale of LOCALES) {
      expect(() => new Intl.NumberFormat(languageTag(locale))).not.toThrow();
    }
  });
});

describe('número e data no idioma de quem lê', () => {
  /**
   * 46,07 e 46.07 são o mesmo número escrito em dois idiomas. Mostrar vírgula
   * decimal a quem lê inglês é mostrar um número errado, e número errado num
   * produto de química encerra o assunto.
   */
  it('a massa do etanol troca de separador decimal', () => {
    expect(formatNumber('pt-BR', 46.07, 2)).toBe('46,07');
    expect(formatNumber('en', 46.07, 2)).toBe('46.07');
  });

  it('contagem não ganha casa decimal', () => {
    expect(formatInteger('pt-BR', 2)).toBe('2');
    expect(formatInteger('en', 2)).toBe('2');
  });

  /** 09/21 e 21/09 são a mesma data lida ao contrário. O mês por extenso desfaz o nó. */
  it('a data não deixa dia e mês trocarem de lugar', () => {
    const date = new Date(Date.UTC(2026, 8, 21, 12));
    expect(formatDate('pt-BR', date)).toBe('21/09/2026');
    expect(formatDate('en', date)).toMatch(/Sep 21, 2026/);
  });
});

describe('concordância', () => {
  it('um é singular; zero e muitos são plural, nos dois idiomas', () => {
    expect(plural(1, 'tentativa', 'tentativas')).toBe('tentativa');
    expect(plural(0, 'tentativa', 'tentativas')).toBe('tentativas');
    expect(plural(2, 'attempt', 'attempts')).toBe('attempts');
  });

  it('a lista falada usa o "e" de cada idioma', () => {
    expect(list('pt-BR', ['C', 'N', 'O'])).toBe('C, N e O');
    expect(list('en', ['C', 'N', 'O'])).toBe('C, N, and O');
  });
});
