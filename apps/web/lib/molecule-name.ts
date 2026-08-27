/**
 * As regras do apelido.
 *
 * O produto não calcula nome de composto — não existe motor de nomenclatura
 * IUPAC aqui dentro. O que existe é autoria: quem desenha uma estrutura válida
 * que ninguém tinha desenhado antes pode batizá-la, e o apelido aparece sempre
 * com o nome de quem deu (D-15).
 *
 * Por isso as regras abaixo impedem o apelido de **se passar por** nomenclatura:
 * fórmula, SMILES e nome sistemático são recusados. Um apelido que parece nome
 * de verdade é pior do que apelido nenhum.
 */

export const NAME_MIN = 2;
export const NAME_MAX = 40;

export type NameProblem =
  | 'curto'
  | 'longo'
  | 'caracteres'
  | 'parece-formula'
  | 'parece-sistematico';

const ALLOWED = /^[\p{L}\p{N} '’·-]+$/u;

/**
 * `C9H8O4`, `CH4`, `NaCl`, `CCO`: notação, não apelido.
 *
 * A forma — símbolo de elemento repetido — sozinha também bate com `Na` e `Ba`,
 * que são sódio e bário e também são nome curto de gente. O que separa os dois
 * é a quantidade: **um símbolo só, sem número, é palavra**; a partir de dois
 * símbolos, ou com número no meio, é notação química e nenhum apelido precisa
 * dessa forma. `CCO` é SMILES do etanol e cai por aí, com dois símbolos ou
 * mais.
 */
const FORMULA_LIKE = /^[A-Z][a-z]?\d*([A-Z][a-z]?\d*)*$/;
const ATOM_GROUP = /[A-Z][a-z]?\d*/g;

/**
 * Nomenclatura sistemática de verdade tem uma costura que palavra do português
 * não tem: raiz de cadeia carbônica, **infixo de saturação** e sufixo de
 * função, encaixados nessa ordem e sem nada entre eles — but·an·ol, et·an·al,
 * prop·an·ona, 2-metil·but·an·o.
 *
 * É o infixo que faz o trabalho. Sem ele, "raiz + sufixo" também casava com
 * `Nonato` (non·ato) e `Decano` (dec·ano), e a regra voltava a recusar o nome
 * da pessoa — o defeito que ela existe para eliminar. Com ele, `Mariano`,
 * `Fabiano`, `Juliana` e `Camila` passam, porque em nenhuma delas a raiz está
 * colada no infixo.
 *
 * `Decano` continua recusado, e está certo: decano **é** o alcano de dez
 * carbonos. Onde a palavra do dia a dia e o nome do composto são a mesma
 * palavra, o produto trata como composto.
 *
 * A âncora é só no fim, para pegar o nome com prefixo — `2-metilbutano` termina
 * em but·an·o do mesmo jeito. Nenhuma expressão regular sobre morfologia do
 * português separa os dois casos sem errar de um lado ou do outro, e a decisão
 * do D-15 (27/08/2026) é preferir o erro de deixar passar: o apelido nunca
 * aparece sozinho na tela, e é a autoria ao lado — "batizada por Camila" — que
 * protege contra a confusão.
 */
const CHAIN_ROOT = 'met|et|prop|but|pent|hex|hept|oct|non|dec';
const SATURATION = 'an|en|in';
const CHAIN_SUFFIX = 'ol|al|ona|oico|oíco|amina|amida|oato|ato|ila|ilo|o|a';
const SYSTEMATIC_CHAIN = new RegExp(
  `(?:${CHAIN_ROOT})(?:${SATURATION})(?:${CHAIN_SUFFIX})$`,
  'i',
);

/**
 * O outro jeito de um nome ser sistemático: substituinte inteiro colado no
 * sufixo, sem cadeia no meio — metil·amina, benzo·ato, cloro·amida. Aqui a
 * palavra precisa ser **só isso**, do começo ao fim, para `Fenilando` não cair.
 */
const SUBSTITUENT_ROOT =
  'metil|etil|propil|butil|fenil|benzo|benz|cloro|bromo|fluor|nitro|hidroxi';
const SYSTEMATIC_GROUP = new RegExp(
  `^(?:${SUBSTITUENT_ROOT})(?:amina|amida|oato|ato|ila|ilo|a|o)$`,
  'i',
);

/**
 * Localizador numérico no começo — "2-", "2,3-". Só conta como marca de
 * nomenclatura quando o resto da palavra também é sistemático: "3-Marias" é
 * apelido, "2-metilbutano" não.
 */
const LOCANT = /^\d+(?:,\d+)*-/;

export interface NameCheck {
  readonly ok: boolean;
  readonly problem?: NameProblem;
  readonly message?: string;
}

const MESSAGES: Readonly<Record<NameProblem, string>> = {
  curto: `O apelido precisa de pelo menos ${String(NAME_MIN)} letras.`,
  longo: `O apelido não pode passar de ${String(NAME_MAX)} caracteres.`,
  caracteres: 'Use letras, números, espaço e hífen — nada além disso.',
  'parece-formula': 'Isso é uma fórmula, não um apelido. A fórmula o RDKit já calcula.',
  'parece-sistematico':
    'Isso é nome de composto, não apelido: a palavra é uma cadeia de carbono com terminação de função química (butanol é but- de quatro carbonos mais -ol de álcool). Um nome assim passaria por nomenclatura, e o Rotamer não calcula nomenclatura. Escolha outra palavra.',
};

export function checkName(raw: string): NameCheck {
  const name = raw.trim();

  if (name.length < NAME_MIN) return fail('curto');
  if (name.length > NAME_MAX) return fail('longo');
  if (!ALLOWED.test(name)) return fail('caracteres');

  // Um símbolo de elemento sozinho e sem número é palavra ("Na", "Ba"); dois ou
  // mais, ou qualquer número no meio, é notação — fórmula ou SMILES.
  const joined = name.replace(/\s/g, '');
  if (FORMULA_LIKE.test(joined) && atomLike(joined)) return fail('parece-formula');

  // Uma palavra só, costurada como nomenclatura, é o caso perigoso: "butanol"
  // passaria por nome de verdade. "Molécula do Pedro" não, e "Camila",
  // "Girassol", "Nonato" e "farol" também não.
  const words = name.split(/\s+/);
  if (words.length === 1 && systematic(name)) return fail('parece-sistematico');

  return { ok: true };
}

/** Dois símbolos de elemento ou mais, ou qualquer número: é notação. */
function atomLike(joined: string): boolean {
  if (/\d/.test(joined)) return true;

  return (joined.match(ATOM_GROUP) ?? []).length >= 2;
}

/** A palavra é nomenclatura sistemática — pelas duas costuras possíveis. */
function systematic(name: string): boolean {
  const withoutLocant = name.replace(LOCANT, '');

  return SYSTEMATIC_CHAIN.test(withoutLocant) || SYSTEMATIC_GROUP.test(withoutLocant);
}

function fail(problem: NameProblem): NameCheck {
  return { ok: false, problem, message: MESSAGES[problem] };
}

/** Espaços colapsados; o resto vem como a pessoa escreveu. */
export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}
