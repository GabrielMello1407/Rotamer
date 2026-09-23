import { dictionaryDivergences } from '@rotamer/i18n';
import { describe, expect, it } from 'vitest';
import { brandMessages } from './messages';

describe('a página de marca fala os dois idiomas', () => {
  it('nenhuma chave sem par, nenhum texto vazio', () => {
    expect(dictionaryDivergences(brandMessages)).toEqual([]);
  });
});
