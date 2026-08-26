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

/**
 * `--cpk-ink-fe` para o ferro.
 *
 * A variante escrita, não a da esfera: no desenho o elemento é uma letra sobre
 * a superfície, e hidrogênio branco sobre papel branco não se lê. Todos os 118
 * existem; não há lista curta aqui.
 */
function cpkToken(symbol: string): string {
  return `--cpk-ink-${symbol.toLowerCase()}`;
}

/** Lê os tokens já resolvidos pelo tema em vigor. */
export function readPalette(element: Element): EditorPalette {
  const style = getComputedStyle(element);
  const token = (name: string, fallback: string): string => {
    const value = style.getPropertyValue(name).trim();
    return value === '' ? fallback : value;
  };

  const ink = token('--ink-900', '#12131A');

  // A leitura é sob demanda e fica guardada: são 118 elementos, e uma molécula
  // usa meia dúzia. Ler todos a cada repintura seria trabalho jogado fora.
  const cache = new Map<string, string>();
  const cpk = new Proxy<Record<string, string>>(
    {},
    {
      get(_target, key: string): string | undefined {
        if (typeof key !== 'string') return undefined;

        const known = cache.get(key);
        if (known !== undefined) return known;

        const value = style.getPropertyValue(cpkToken(key)).trim();
        if (value === '') return undefined;

        cache.set(key, value);
        return value;
      },
    },
  );

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
