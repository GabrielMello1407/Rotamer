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

/** Alguma folha modal está aberta? */
export function isSheetOpen(): boolean {
  return document.querySelector('[role="dialog"]') !== null;
}

/** A tecla vale como atalho agora? */
export function shortcutsApply(target: EventTarget | null): boolean {
  return !isTyping(target) && !isSheetOpen();
}
