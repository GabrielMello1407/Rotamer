import { dictionary, pick } from '../dictionary';
import type { Locale } from '../locale';

/**
 * As frases da química — o único dicionário que mora aqui e não junto do código
 * que o usa.
 *
 * O motivo é a regra de dependência: `core` não depende de ninguém, nem deste
 * pacote. Então ele decide e devolve **código** (`valence_exceeded`) com os
 * números que justificam a recusa, e é aqui que o código vira frase. O núcleo
 * continua rodando em teste de linha de comando sem uma palavra de interface
 * dentro dele.
 *
 * O erro explica a química, não o código: "o átomo de C tem 5 ligações, mas
 * suporta no máximo 4", nunca "valence error".
 */
export const chemistryMessages = dictionary({
  'pt-BR': {
    error: {
      empty: 'Não há nenhum átomo para analisar.',
      invalid_syntax:
        'Não consegui ler essa estrutura. Verifique se todos os anéis estão fechados e se os símbolos dos elementos existem.',
      valence_exceeded: (symbol: string, bonds: number, max: number) =>
        `O átomo de ${symbol} tem ${String(bonds)} ligações, mas suporta no máximo ${String(max)}.`,
      valence_exceeded_generic: 'Há um átomo com mais ligações do que o elemento suporta.',
      impossible_aromaticity:
        'Há um anel marcado como aromático que não fecha: não existe alternância de ligações simples e duplas que satisfaça a valência de todos os átomos dele.',
      invalid_structure:
        'Essa estrutura não passa na verificação química: os átomos estão legíveis, mas o arranjo entre eles não descreve uma molécula possível.',
      geometry_unavailable:
        'Não consegui calcular a forma desta molécula no espaço. Os descritores continuam valendo.',
      conformer_unavailable:
        'Não consegui encontrar um arranjo tridimensional para esta estrutura. Ela continua valendo como fórmula: o que falta é a forma no espaço.',
      engine_unavailable: 'O motor de química não respondeu a tempo.',
    },

    /**
     * Nome de grupo funcional. A perícia é do RDKit, casando SMARTS; o que há
     * aqui é como cada grupo se chama em cada idioma.
     */
    group: {
      alcohol: 'álcool',
      phenol: 'fenol',
      ether: 'éter',
      aldehyde: 'aldeído',
      ketone: 'cetona',
      carboxylicAcid: 'ácido carboxílico',
      ester: 'éster',
      anhydride: 'anidrido',
      amide: 'amida',
      primaryAmine: 'amina primária',
      secondaryAmine: 'amina secundária',
      tertiaryAmine: 'amina terciária',
      nitrile: 'nitrila',
      nitro: 'nitro',
      haloalkane: 'haleto',
      alkene: 'alceno',
      alkyne: 'alcino',
      thiol: 'tiol',
      sulfide: 'sulfeto',
    },
  },

  en: {
    error: {
      empty: 'There is no atom to analyze.',
      invalid_syntax:
        'I could not read this structure. Check that every ring is closed and that the element symbols exist.',
      valence_exceeded: (symbol: string, bonds: number, max: number) =>
        `The ${symbol} atom has ${String(bonds)} bonds, but it supports at most ${String(max)}.`,
      valence_exceeded_generic: 'One atom has more bonds than its element supports.',
      impossible_aromaticity:
        'A ring is marked as aromatic, but the bonds do not add up: no alternation of single and double bonds satisfies the valence of all its atoms.',
      invalid_structure:
        'This structure does not pass the chemistry check: the atoms are readable, but the arrangement between them does not describe a possible molecule.',
      geometry_unavailable:
        'I could not work out the shape of this molecule in space. The descriptors still hold.',
      conformer_unavailable:
        'I could not find a three-dimensional arrangement for this structure. It still holds as a formula: what is missing is the shape in space.',
      engine_unavailable: 'The chemistry engine did not answer in time.',
    },

    group: {
      alcohol: 'alcohol',
      phenol: 'phenol',
      ether: 'ether',
      aldehyde: 'aldehyde',
      ketone: 'ketone',
      carboxylicAcid: 'carboxylic acid',
      ester: 'ester',
      anhydride: 'anhydride',
      amide: 'amide',
      primaryAmine: 'primary amine',
      secondaryAmine: 'secondary amine',
      tertiaryAmine: 'tertiary amine',
      nitrile: 'nitrile',
      nitro: 'nitro',
      haloalkane: 'haloalkane',
      alkene: 'alkene',
      alkyne: 'alkyne',
      thiol: 'thiol',
      sulfide: 'sulfide',
    },
  },
});

/**
 * Os códigos de recusa que o núcleo devolve.
 *
 * A lista é declarada de novo aqui, e não importada de `@rotamer/core`, porque
 * este pacote não depende de ninguém — do contrário o `core` passaria a ter uma
 * dependência pelo caminho de volta. `test/chemistry.test.ts` lê o arquivo de
 * tipos do núcleo e falha se um código novo aparecer lá sem frase aqui.
 */
export type ChemistryErrorCode =
  | 'empty'
  | 'invalid_syntax'
  | 'valence_exceeded'
  | 'impossible_aromaticity'
  | 'invalid_structure'
  | 'geometry_unavailable'
  | 'conformer_unavailable';

/** O átomo que o núcleo conseguiu apontar como culpado, quando há um. */
export interface OffendingAtomLike {
  readonly symbol: string;
  readonly bonds: number;
  readonly max: number;
}

export interface ChemistryErrorLike {
  readonly code: ChemistryErrorCode;
  readonly atom?: OffendingAtomLike;
}

/**
 * A recusa do núcleo, dita no idioma de quem desenhou.
 *
 * Nenhum número sai daqui: `bonds` e `max` vieram calculados do RDKit e só são
 * costurados na frase.
 */
export function chemistryErrorText(locale: Locale, error: ChemistryErrorLike): string {
  const messages = pick(chemistryMessages, locale).error;

  if (error.code === 'valence_exceeded') {
    const { atom } = error;
    return atom === undefined
      ? messages.valence_exceeded_generic
      : messages.valence_exceeded(atom.symbol, atom.bonds, atom.max);
  }

  return messages[error.code];
}

/** O nome do grupo funcional, a partir do identificador que o núcleo devolve. */
export function functionalGroupName(locale: Locale, id: string): string {
  const names: Record<string, string> = pick(chemistryMessages, locale).group;
  return names[id] ?? id;
}
