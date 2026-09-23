import { dictionaryDivergences } from '@rotamer/i18n';
import { describe, expect, it } from 'vitest';
import { libraryMessages } from './messages';

describe('a estante fala os dois idiomas', () => {
  it('nenhuma chave sem par, nenhum texto vazio', () => {
    expect(dictionaryDivergences(libraryMessages)).toEqual([]);
  });

  it('a contagem concorda em número nos dois idiomas', () => {
    expect(libraryMessages['pt-BR'].count(1)).toContain('1 estrutura guardada');
    expect(libraryMessages['pt-BR'].count(2)).toContain('2 estruturas guardadas');
    expect(libraryMessages.en.count(1)).toContain('1 saved structure');
    expect(libraryMessages.en.count(2)).toContain('2 saved structures');
  });
});
