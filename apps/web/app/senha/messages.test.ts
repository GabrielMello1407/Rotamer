import { dictionaryDivergences } from '@rotamer/i18n';
import { describe, expect, it } from 'vitest';
import { passwordMessages } from './messages';

describe('a página de trocar a senha fala os dois idiomas', () => {
  it('nenhuma chave sem par, nenhum texto vazio', () => {
    expect(dictionaryDivergences(passwordMessages)).toEqual([]);
  });
});
