/**
 * O SMILES dentro do endereço.
 *
 * A página pública é função pura da cadeia que está na URL, então a cadeia
 * precisa atravessar inteira. Duas ressalvas do caminho:
 *
 * - `encodeURIComponent` resolve parênteses, `=`, `#` e `/`.
 * - A barra invertida, que marca geometria cis/trans, **não sobrevive**: o
 *   navegador normaliza `\` antes mesmo de a requisição sair. Por isso ela viaja
 *   como `~`, que não existe na sintaxe SMILES e volta ao original no servidor.
 */

const BACKSLASH = '\\';
const STAND_IN = '~';

export function encodeSmiles(smiles: string): string {
  return encodeURIComponent(smiles.split(BACKSLASH).join(STAND_IN));
}

export function decodeSmiles(segment: string): string {
  return decodeURIComponent(segment).split(STAND_IN).join(BACKSLASH);
}

/** O endereço público de uma molécula. */
export function moleculePath(smiles: string): string {
  return `/m/${encodeSmiles(smiles)}`;
}
