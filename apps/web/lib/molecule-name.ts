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

/** `C9H8O4`, `CC(=O)O` e afins: notação, não apelido. */
const FORMULA_LIKE = /^[A-Z][a-z]?\d*([A-Z][a-z]?\d*)*$/;

/**
 * Terminações de nomenclatura sistemática.
 *
 * Não é para bloquear palavra: é para o apelido não sair parecendo o nome que o
 * produto não sabe calcular.
 */
const SYSTEMATIC = /(ano|eno|ino|ol|al|ona|oico|oíco|amina|amida|ato|ila|ilo)$/i;

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
    'Isso parece nome sistemático. O Rotamer não calcula nomenclatura, então o apelido não pode se passar por ela.',
};

export function checkName(raw: string): NameCheck {
  const name = raw.trim();

  if (name.length < NAME_MIN) return fail('curto');
  if (name.length > NAME_MAX) return fail('longo');
  if (!ALLOWED.test(name)) return fail('caracteres');
  if (FORMULA_LIKE.test(name.replace(/\s/g, ''))) return fail('parece-formula');

  // Uma palavra só, terminando como nomenclatura, é o caso perigoso: "butanol"
  // passaria por nome de verdade. "Molécula do Pedro" não.
  const words = name.split(/\s+/);
  if (words.length === 1 && SYSTEMATIC.test(name)) return fail('parece-sistematico');

  return { ok: true };
}

function fail(problem: NameProblem): NameCheck {
  return { ok: false, problem, message: MESSAGES[problem] };
}

/** Espaços colapsados; o resto vem como a pessoa escreveu. */
export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}
