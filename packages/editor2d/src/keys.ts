/**
 * Os atalhos do editor: quais são, e quando uma tecla vale como atalho.
 *
 * Este arquivo é a fonte única. A tabela de elementos já viveu em três cópias —
 * o comportamento no `Editor2D`, o selo do botão na `Toolbar` e a folha de
 * ajuda em `Shortcuts` — e as três precisavam ser editadas juntas, sem nada
 * que reclamasse quando uma ficava para trás. Agora as três leem daqui.
 */

/**
 * A letra de cada elemento, na ordem em que a folha de ajuda os mostra.
 *
 * São os elementos que aparecem em aula de orgânica, cada um na inicial do
 * próprio símbolo — que é o que a pessoa já teria escrito à mão. `L` é o cloro
 * e `B` é o bromo porque `C` já é o carbono, o mais usado de todos.
 */
export const ELEMENT_SHORTCUTS: readonly {
  /** A tecla, em maiúscula, do jeito que se mostra na tela. */
  readonly key: string;
  readonly symbol: string;
  /** O nome em português, para a folha de ajuda. */
  readonly name: string;
}[] = [
  { key: 'C', symbol: 'C', name: 'carbono' },
  { key: 'N', symbol: 'N', name: 'nitrogênio' },
  { key: 'O', symbol: 'O', name: 'oxigênio' },
  { key: 'S', symbol: 'S', name: 'enxofre' },
  { key: 'P', symbol: 'P', name: 'fósforo' },
  { key: 'F', symbol: 'F', name: 'flúor' },
  { key: 'L', symbol: 'Cl', name: 'cloro' },
  { key: 'B', symbol: 'Br', name: 'bromo' },
  { key: 'I', symbol: 'I', name: 'iodo' },
  { key: 'H', symbol: 'H', name: 'hidrogênio' },
];

/** O símbolo que a tecla escolhe, ou `undefined` se ela não for de elemento. */
export function elementForKey(key: string): string | undefined {
  return ELEMENT_SHORTCUTS.find((entry) => entry.key.toLowerCase() === key)?.symbol;
}

/** A tecla que escolhe este elemento, ou o próprio símbolo quando não há uma. */
export function keyForElement(symbol: string): string {
  return ELEMENT_SHORTCUTS.find((entry) => entry.symbol === symbol)?.key ?? symbol;
}

/**
 * Quando uma tecla é atalho, e quando é só uma letra.
 *
 * Os atalhos do editor valem na página inteira — teclar `O` funciona sem clicar
 * na tela de desenho antes. O preço disso é ter que dizer onde eles não valem, e
 * são dois lugares: dentro de um campo de texto, onde `o` é a letra o; e com uma
 * folha aberta por cima, onde quem manda é a folha.
 */
export function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
}

/**
 * Alguma folha ou menu está aberto por cima?
 *
 * `dialog` é a tabela periódica e a folha de atalhos; `menu` é o menu do botão
 * direito e o de exemplos da barra de cima. Os dois têm a própria saída no
 * Escape, e sem esta pergunta a mesma tecla fecharia o menu **e** faria o que o
 * editor faz com Escape — soltar a seleção que a pessoa nem sabia que ia
 * perder.
 */
export function isSheetOpen(): boolean {
  return document.querySelector('[role="dialog"], [role="menu"]') !== null;
}

/** A tecla vale como atalho agora? */
export function shortcutsApply(target: EventTarget | null): boolean {
  return !isTyping(target) && !isSheetOpen();
}
