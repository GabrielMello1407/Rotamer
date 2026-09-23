import { dictionaryDivergences } from '@rotamer/i18n';
import { describe, expect, it } from 'vitest';
import { ELEMENT_SEARCH_ALIASES, elementName, elementNames } from '../src/element-names';
import { PERIODIC_TABLE } from '../src/elements-table';
import { ELEMENT_SHORTCUTS } from '../src/keys';
import {
  canvasMessages,
  contextMenuMessages,
  periodicTableMessages,
  ringMessages,
  shortcutsMessages,
  toolbarMessages,
} from '../src/messages';

describe('o editor fala os dois idiomas', () => {
  it('a barra de ferramentas não tem chave sem par nem texto vazio', () => {
    expect(dictionaryDivergences(toolbarMessages)).toEqual([]);
  });

  it('os anéis prontos idem', () => {
    expect(dictionaryDivergences(ringMessages)).toEqual([]);
  });

  it('a tabela periódica idem', () => {
    expect(dictionaryDivergences(periodicTableMessages)).toEqual([]);
  });

  it('a tela de desenho idem', () => {
    expect(dictionaryDivergences(canvasMessages)).toEqual([]);
  });

  it('o menu do botão direito idem', () => {
    expect(dictionaryDivergences(contextMenuMessages)).toEqual([]);
  });

  it('a folha de atalhos idem', () => {
    expect(dictionaryDivergences(shortcutsMessages)).toEqual([]);
  });

  it('os nomes de elemento idem', () => {
    expect(dictionaryDivergences(elementNames)).toEqual([]);
  });
});

describe('os nomes de elemento', () => {
  /**
   * A tabela tem 118 células e a busca acha pelo nome. Um elemento sem nome em
   * um dos idiomas não some da grade — ele simplesmente deixa de ser
   * encontrável, e quem procura conclui que a ferramenta não tem o elemento.
   */
  it('cobrem os 118 elementos da tabela, nos dois idiomas', () => {
    for (const entry of PERIODIC_TABLE) {
      expect(elementName('pt-BR', entry.symbol)).not.toBe(entry.symbol);
      expect(elementName('en', entry.symbol)).not.toBe(entry.symbol);
    }

    expect(PERIODIC_TABLE).toHaveLength(118);
  });

  /** A grafia do inglês é a da IUPAC, que não é a mais comum nos Estados Unidos. */
  it('usam a grafia da IUPAC no inglês', () => {
    expect(elementName('en', 'Al')).toBe('Aluminium');
    expect(elementName('en', 'S')).toBe('Sulfur');
    expect(elementName('en', 'Cs')).toBe('Caesium');
  });

  /** Quem aprendeu química nos Estados Unidos digita a grafia americana. */
  it('a busca aceita também a grafia americana de alumínio e césio', () => {
    expect(ELEMENT_SEARCH_ALIASES['Al']).toContain('aluminum');
    expect(ELEMENT_SEARCH_ALIASES['Cs']).toContain('cesium');
  });

  it('o símbolo desconhecido volta como ele mesmo, sem quebrar a tela', () => {
    expect(elementName('pt-BR', 'Zz')).toBe('Zz');
    expect(elementName('en', 'Zz')).toBe('Zz');
  });
});

describe('a folha de atalhos', () => {
  /**
   * A tecla é a mesma em qualquer idioma — é a inicial do símbolo, não do nome.
   * `L` é o cloro porque `C` já é o carbono, e isso não muda em inglês.
   */
  it('a tecla de elemento não depende de idioma, mas o nome dela sim', () => {
    const cloro = ELEMENT_SHORTCUTS.find((entry) => entry.symbol === 'Cl');

    expect(cloro?.key).toBe('L');
    expect(elementName('pt-BR', 'Cl')).toBe('Cloro');
    expect(elementName('en', 'Cl')).toBe('Chlorine');
  });
});

describe('a contagem da seleção', () => {
  /**
   * "1 átomo selecionados" é o tipo de descuido que uma sala inteira copia. O
   * português concorda em gênero e número; o inglês não concorda com nada, e
   * cada um escreve a sua frase.
   */
  it('concorda em gênero e número em português', () => {
    const pt = canvasMessages['pt-BR'];

    expect(pt.selected(1, 0)).toBe('1 átomo selecionado');
    expect(pt.selected(2, 0)).toBe('2 átomos selecionados');
    expect(pt.selected(0, 1)).toBe('1 ligação selecionada');
    expect(pt.selected(0, 3)).toBe('3 ligações selecionadas');
    expect(pt.selected(2, 1)).toBe('2 átomos e 1 ligação selecionados');
  });

  it('e conta certo em inglês', () => {
    const en = canvasMessages.en;

    expect(en.selected(1, 0)).toBe('1 atom selected');
    expect(en.selected(2, 0)).toBe('2 atoms selected');
    expect(en.selected(0, 1)).toBe('1 bond selected');
    expect(en.selected(2, 1)).toBe('2 atoms and 1 bond selected');
  });
});
