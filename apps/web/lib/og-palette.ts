/**
 * A paleta da imagem de compartilhamento.
 *
 * Exceção consciente à regra de não escrever cor no código: a imagem é gerada
 * fora do navegador, e o rasterizador não enxerga variável CSS. Os valores
 * abaixo são cópia literal de `packages/ui/src/tokens.css` — se um token mudar
 * lá, este arquivo precisa acompanhar.
 */
export const OG = {
  /** `--bg` do tema escuro. */
  background: '#0D0E14',
  /** `--surface` do tema escuro. */
  surface: '#171A24',
  /** `--line` do tema escuro. */
  line: '#272B38',
  /** `--ink-900` do tema escuro. */
  ink: '#ECEDF5',
  /** `--ink-500` do tema escuro. */
  inkSoft: '#9598AE',
  /** `--flame-cobre`: a cor da marca. */
  brand: '#00A98F',
  /** `--ink-cobre` do tema escuro. */
  brandInk: '#35D8BC',
} as const;
