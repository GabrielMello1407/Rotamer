import { dictionaryDivergences } from '@rotamer/i18n';
import { describe, expect, it } from 'vitest';
import { accountMessages } from './messages';

describe('a página de entrar e criar conta fala os dois idiomas', () => {
  it('nenhuma chave sem par, nenhum texto vazio', () => {
    expect(dictionaryDivergences(accountMessages)).toEqual([]);
  });
});
