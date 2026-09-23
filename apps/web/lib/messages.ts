import { dictionary, pick, type Locale } from '@rotamer/i18n';

/**
 * As recusas que nascem em `lib`, antes de qualquer tela.
 *
 * São poucas e todas de servidor: entram numa `reason` que a ação devolve ao
 * cliente já como frase pronta, no idioma de quem pediu.
 */
export const questResolveMessages = dictionary({
  'pt-BR': {
    goalNotFromMolecule: 'Um dos objetivos não veio da molécula desenhada e foi recusado.',
    inchiKeyMustBeAlone:
      'Marcado, «é exatamente esta molécula» precisa ser o único objetivo da missão.',
    /**
     * A recusa nomeia o objetivo que não fecha. Sem o nome, o professor teria
     * de adivinhar qual dos que marcou está errado — e a missão já foi
     * recusada inteira.
     */
    answerDoesNotMeet: (goal: string) =>
      `Esta missão não é cumprida nem pela sua própria resposta. O objetivo «${goal}» não fecha com a molécula que você desenhou, então ninguém conseguiria cumpri-la. Nada foi salvo: desmarque esse objetivo ou ajuste o desenho.`,
  },

  en: {
    goalNotFromMolecule: 'One of the goals did not come from the molecule drawn, and was refused.',
    inchiKeyMustBeAlone:
      'Ticked, «is exactly this molecule» has to be the only goal of the mission.',
    answerDoesNotMeet: (goal: string) =>
      `Not even your own answer completes this mission. The goal «${goal}» does not hold for the molecule you drew, so nobody could complete it. Nothing was saved: untick that goal or adjust the drawing.`,
  },
});

/**
 * Por que um apelido foi recusado.
 *
 * `checkName` devolve o **código** do problema, não a frase — a checagem é a
 * mesma em qualquer idioma, e a explicação não. A do "parece sistemático" é
 * longa de propósito: ela precisa ensinar por que `butanol` não é apelido, ou
 * a pessoa só entende que a ferramenta não a deixa escrever.
 */
export const nicknameMessages = dictionary({
  'pt-BR': {
    curto: (min: number) => `O apelido precisa de pelo menos ${String(min)} letras.`,
    longo: (max: number) => `O apelido não pode passar de ${String(max)} caracteres.`,
    caracteres: 'Use letras, números, espaço e hífen — nada além disso.',
    parecerFormula: 'Isso é uma fórmula, não um apelido. A fórmula o RDKit já calcula.',
    parecerSistematico:
      'Isso é nome de composto, não apelido: a palavra é uma cadeia de carbono com terminação de função química (butanol é but- de quatro carbonos mais -ol de álcool). Um nome assim passaria por nomenclatura, e o Rotamer não calcula nomenclatura. Escolha outra palavra.',
  },

  en: {
    curto: (min: number) => `A nickname needs at least ${String(min)} letters.`,
    longo: (max: number) => `A nickname cannot go past ${String(max)} characters.`,
    caracteres: 'Use letters, numbers, spaces and hyphens — nothing beyond that.',
    parecerFormula: 'That is a formula, not a nickname. RDKit already computes the formula.',
    parecerSistematico:
      'That is a compound name, not a nickname: the word is a carbon chain with a functional-group ending (butanol is but- for four carbons plus -ol for alcohol). A name like that would be nomenclature, and Rotamer does not compute nomenclature. Pick another word.',
  },
});

/** A frase da recusa, a partir do código que `checkName` devolveu. */
export function nicknameProblemText(
  locale: Locale,
  problem: 'curto' | 'longo' | 'caracteres' | 'parece-formula' | 'parece-sistematico',
  limits: { readonly min: number; readonly max: number },
): string {
  const m = pick(nicknameMessages, locale);

  switch (problem) {
    case 'curto':
      return m.curto(limits.min);
    case 'longo':
      return m.longo(limits.max);
    case 'caracteres':
      return m.caracteres;
    case 'parece-formula':
      return m.parecerFormula;
    default:
      return m.parecerSistematico;
  }
}
