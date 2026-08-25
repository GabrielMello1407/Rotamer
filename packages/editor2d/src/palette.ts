/**
 * As cores do desenho saem dos tokens, nunca de hex escrito aqui.
 *
 * As CPK pertencem ao átomo e só aparecem no átomo — é a única camada do
 * produto que pode usá-las. Se a interface pintasse de vermelho em outro lugar,
 * o vermelho deixaria de significar oxigênio.
 */

export interface EditorPalette {
  readonly surface: string;
  readonly line: string;
  readonly ink: string;
  readonly inkSoft: string;
  readonly brand: string;
  readonly danger: string;
  readonly font: string;
  readonly cpk: Readonly<Record<string, string>>;
}

const CPK_TOKENS: Readonly<Record<string, string>> = {
  H: '--cpk-h',
  C: '--cpk-c',
  N: '--cpk-n',
  O: '--cpk-o',
  F: '--cpk-f',
  P: '--cpk-p',
  S: '--cpk-s',
  Cl: '--cpk-cl',
  Br: '--cpk-br',
  I: '--cpk-i',
};

/** Lê os tokens já resolvidos pelo tema em vigor. */
export function readPalette(element: Element): EditorPalette {
  const style = getComputedStyle(element);
  const token = (name: string, fallback: string): string => {
    const value = style.getPropertyValue(name).trim();
    return value === '' ? fallback : value;
  };

  const ink = token('--ink-900', '#12131A');

  const cpk: Record<string, string> = {};
  for (const [symbol, name] of Object.entries(CPK_TOKENS)) {
    cpk[symbol] = token(name, ink);
  }

  return {
    surface: token('--surface', '#FFFFFF'),
    line: token('--line', '#E2E4EF'),
    ink,
    inkSoft: token('--ink-400', '#6E7189'),
    brand: token('--brand', '#00A98F'),
    danger: token('--danger', '#DE1A4E'),
    font: token('--font-ui', 'sans-serif'),
    cpk,
  };
}

/** A cor do elemento. Elemento fora da tabela CPK usa a cor do texto. */
export function colorOf(palette: EditorPalette, element: string): string {
  return palette.cpk[element] ?? palette.ink;
}
