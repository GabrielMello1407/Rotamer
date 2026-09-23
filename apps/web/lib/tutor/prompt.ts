import type { Molecule } from '@rotamer/core';
import { formatNumber, functionalGroupName, pick, type Locale } from '@rotamer/i18n';
import type { Assessable, Quest } from '@rotamer/quests';
import { tutorPromptMessages } from './messages';
import { type ReferenceKey } from './schema';

/**
 * O prompt do tutor.
 *
 * Ele recebe os descritores **já calculados** e é instruído a nunca recalcular
 * nem contradizer. O modelo não é consultado sobre validade, valência, fórmula,
 * massa ou nota: essas perguntas já foram respondidas pelo RDKit e pelo motor de
 * missões antes de este texto existir.
 */

/**
 * `Quest` (catálogo) tem `title` e `brief`; `Assessable` (missão de professor,
 * via `resolveQuest`) não tem nenhum dos dois campos — nem por engano um texto
 * de professor chegaria ao modelo (R-9). A checagem é de tipo porque a
 * ausência do campo já é a trava: não existe jeito de ler `brief` de uma
 * missão de professor por aqui.
 */
function hasTeacherFacingText(quest: Assessable | Quest): quest is Quest {
  return 'title' in quest && 'brief' in quest;
}

/**
 * O `kind` é chave de dado — é ele que a rota recebe e que o cache guarda — e
 * por isso continua o mesmo nos dois idiomas. O pedido que o modelo lê é que
 * muda.
 */
export type HintKind = 'proximo-passo' | 'por-que-nao-fechou' | 'entender-a-molecula';

const KIND_ASK: Readonly<
  Record<HintKind, 'askNextStep' | 'askWhyNotClosed' | 'askWhatIsThis'>
> = {
  'proximo-passo': 'askNextStep',
  'por-que-nao-fechou': 'askWhyNotClosed',
  'entender-a-molecula': 'askWhatIsThis',
};

/** As regras que o modelo recebe, no idioma em que ele deve responder. */
export function systemRules(locale: Locale): string {
  return pick(tutorPromptMessages, locale).systemRules;
}

export interface PromptInput {
  readonly molecule: Molecule;
  readonly quest: Assessable | Quest | null;
  /**
   * Os objetivos já com veredito e com a frase.
   *
   * A frase vem de fora porque `GoalResult` não a carrega — veredito é o mesmo
   * em qualquer idioma, e o rótulo é derivado da condição por quem sabe em que
   * idioma o modelo vai responder.
   */
  readonly goals: readonly { readonly met: boolean; readonly label: string }[];
  readonly kind: HintKind;
  /** O idioma em que o modelo deve responder. */
  readonly locale: Locale;
}

/**
 * Os valores que a interface vai usar para trocar as referências.
 *
 * Estes saem no idioma de quem lê — é o que aparece na tela no lugar de
 * `{{tpsa}}`, e 46,07 é o número certo para quem lê português. Os números que
 * vão **dentro** do prompt são outros: ver `promptValues`.
 */
export function referenceValues(locale: Locale, molecule: Molecule): Record<ReferenceKey, string> {
  return valuesWith((value, decimals) => formatNumber(locale, value, decimals), molecule);
}

/**
 * Os mesmos valores, mas para o prompt: **sempre com ponto decimal**.
 *
 * Não é detalhe de estilo. `46,07` num prompt pode ser lido pelo modelo como
 * dois números, ou como quarenta e seis e sete — e o modelo é instruído a nunca
 * recalcular justamente porque não se pode confiar nele para isso. Ponto
 * decimal em qualquer idioma tira a ambiguidade da entrada; a saída continua
 * sem número nenhum, porque a regra 2 o proíbe de escrever um.
 */
function promptValues(molecule: Molecule): Record<ReferenceKey, string> {
  return valuesWith((value, decimals) => value.toFixed(decimals), molecule);
}

function valuesWith(
  number: (value: number, decimals: number) => string,
  molecule: Molecule,
): Record<ReferenceKey, string> {
  const d = molecule.descriptors;

  return {
    formula: molecule.formula,
    molarMass: `${number(d.molarMass, 2)} g/mol`,
    tpsa: `${number(d.tpsa, 2)} Å²`,
    logP: number(d.logP, 2),
    rotatableBonds: number(d.rotatableBonds, 0),
    hbDonors: number(d.hbDonors, 0),
    hbAcceptors: number(d.hbAcceptors, 0),
    rings: number(d.rings, 0),
    aromaticRings: number(d.aromaticRings, 0),
    heavyAtoms: number(d.heavyAtoms, 0),
    inchiKey: molecule.inchiKey,
  };
}

/** O contexto que vai junto com o pedido: tudo já calculado. */
export function buildPrompt({ molecule, quest, goals, kind, locale }: PromptInput): string {
  const m = pick(tutorPromptMessages, locale);
  const values = promptValues(molecule);

  const groups =
    molecule.groups.length === 0
      ? m.noGroups
      : molecule.groups
          .map((group) => {
            const name = functionalGroupName(locale, group.id);
            return group.count > 1 ? m.groupTimes(name, group.count) : name;
          })
          .join(', ');

  const verdict = (goal: { readonly met: boolean; readonly label: string }): string =>
    `- [${goal.met ? m.goalMet : m.goalOpen}] ${goal.label}`;

  const lines = [
    m.contextHeading,
    `- ${m.contextFormula}: ${values.formula}`,
    `- ${m.contextSmiles}: ${molecule.smiles}`,
    `- ${m.contextMolarMass}: ${values.molarMass}`,
    `- ${m.contextTpsa}: ${values.tpsa}`,
    `- ${m.contextLogP}: ${values.logP}`,
    `- ${m.contextRotatable}: ${values.rotatableBonds}`,
    `- ${m.contextRings(values.rings, values.aromaticRings)}`,
    `- ${m.contextDonors}: ${values.hbDonors}`,
    `- ${m.contextAcceptors}: ${values.hbAcceptors}`,
    `- ${m.contextGroups}: ${groups}`,
  ];

  if (quest !== null && hasTeacherFacingText(quest)) {
    lines.push('', m.questHeading(quest.title), m.questBrief(quest.brief), m.goalsHeading,
      ...goals.map(verdict));
  } else if (quest !== null) {
    // R-9: missão `professor:` — nem título, nem enunciado, escrito por um
    // professor, chega ao modelo. Só os rótulos gerados dos objetivos, que
    // saíram do RDKit (`extractGoals`), não de texto livre.
    lines.push('', m.teacherQuestHeading, m.goalsHeading, ...goals.map(verdict));
  } else {
    lines.push('', m.noQuest);
  }

  lines.push('', m.ask(m[KIND_ASK[kind]]));

  return lines.join('\n');
}
