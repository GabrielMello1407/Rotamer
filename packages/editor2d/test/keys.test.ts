import { describe, expect, it } from 'vitest';
import { ELEMENT_SHORTCUTS, elementForKey, keyForElement } from '../src/keys';

/**
 * O que este teste protege é a fonte única.
 *
 * A tabela de elementos já viveu em três cópias — o comportamento, o selo do
 * botão e a folha de ajuda — e nada reclamava quando uma ficava para trás. O
 * sintoma disso é o pior possível numa tela de ensino: a ajuda promete uma
 * tecla, a pessoa tecla, e não acontece nada.
 */
describe('atalhos de elemento', () => {
  it('a tecla leva ao elemento, e o elemento leva de volta à tecla', () => {
    for (const { key, symbol } of ELEMENT_SHORTCUTS) {
      expect(elementForKey(key.toLowerCase())).toBe(symbol);
      expect(keyForElement(symbol)).toBe(key);
    }
  });

  it('nenhuma tecla escolhe dois elementos', () => {
    const keys = ELEMENT_SHORTCUTS.map((entry) => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('cloro e bromo cedem a inicial ao carbono', () => {
    // `c` é o elemento mais usado de todos; cloro e bromo ficam com a segunda
    // letra do símbolo. É a razão de a tabela não ser só a inicial de cada um.
    expect(elementForKey('c')).toBe('C');
    expect(elementForKey('l')).toBe('Cl');
    expect(elementForKey('b')).toBe('Br');
  });

  it('tecla que não é de elemento não escolhe nada', () => {
    // `d`, `m`, `v`, `w` e `e` são ferramentas: se uma delas devolvesse
    // elemento, escolher a borracha trocaria o átomo ativo.
    for (const key of ['d', 'm', 'v', 'w', 'e', '0', 'z']) {
      expect(elementForKey(key)).toBeUndefined();
    }
  });

  it('elemento sem atalho devolve o próprio símbolo, para o botão não mentir', () => {
    expect(keyForElement('Si')).toBe('Si');
  });
});
