import { dictionaryDivergences } from '@rotamer/i18n';
import { describe, expect, it } from 'vitest';
import { viewerMessages } from '../src/messages';

describe('a cena fala os dois idiomas', () => {
  it('não tem chave sem par nem texto vazio', () => {
    expect(dictionaryDivergences(viewerMessages)).toEqual([]);
  });

  /**
   * Os botões da cena aparecem como ícone: o rótulo **é** o que o leitor de
   * tela lê. Um rótulo que ficasse para trás deixaria a cena acessível em um
   * idioma só, e isso não apareceria olhando para a tela.
   */
  it('todo rótulo de botão da cena existe nos dois', () => {
    for (const key of ['vibrate', 'spaceFilling', 'showHydrogens', 'recenter', 'expand', 'shrink']) {
      expect(viewerMessages['pt-BR'][key as 'vibrate']).toBeTruthy();
      expect(viewerMessages.en[key as 'vibrate']).toBeTruthy();
    }
  });

  it('a contagem de átomos concorda em número nos dois idiomas', () => {
    expect(viewerMessages['pt-BR'].atoms(1)).toBe('1 átomo');
    expect(viewerMessages['pt-BR'].atoms(9)).toBe('9 átomos');
    expect(viewerMessages.en.atoms(1)).toBe('1 atom');
    expect(viewerMessages.en.atoms(9)).toBe('9 atoms');
  });
});
