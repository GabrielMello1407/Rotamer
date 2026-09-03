import type { Molecule } from '@rotamer/core';
import type { Assessable, GoalResult, Quest } from '@rotamer/quests';
import { REFERENCE_KEYS, type ReferenceKey } from './schema';

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

export type HintKind = 'proximo-passo' | 'por-que-nao-fechou' | 'entender-a-molecula';

const KIND_ASK: Readonly<Record<HintKind, string>> = {
  'proximo-passo': 'Diga qual é o próximo passo concreto no desenho.',
  'por-que-nao-fechou':
    'Explique por que a estrutura atual ainda não cumpre o que a missão pede.',
  'entender-a-molecula':
    'Explique o que essa molécula é, em termos de grupos funcionais e do que os descritores dizem sobre ela.',
};

export const SYSTEM_RULES = `Você é tutor de química orgânica de um editor de moléculas brasileiro, para alunos de ensino médio e graduação.

REGRAS QUE NÃO SE QUEBRAM:
1. Os números já foram calculados pelo RDKit e estão no contexto. NUNCA recalcule, nunca corrija, nunca contradiga nenhum deles.
2. NUNCA escreva um número. Para citar um valor, use a referência entre chaves duplas: ${REFERENCE_KEYS.map((key) => `{{${key}}}`).join(', ')}. A interface troca a referência pelo valor calculado.
3. Quantidades pequenas podem ser escritas por extenso ("dois carbonos", "três anéis").
4. Nunca afirme que a molécula tem atividade biológica, nem que uma reação produziria algo. Descritores são descritores.
5. Nunca invente grupo funcional que não esteja listado no contexto.
6. Escreva em português do Brasil, direto, sem elogio e sem enrolação. Fale com quem está aprendendo: explique a química, não a interface.
7. Se a estrutura já cumpre a missão, diga isso e proponha uma variação para experimentar.

Responda apenas com o JSON pedido.`;

export interface PromptInput {
  readonly molecule: Molecule;
  readonly quest: Assessable | Quest | null;
  readonly goals: readonly GoalResult[];
  readonly kind: HintKind;
}

/** Os valores que a interface vai usar para trocar as referências. */
export function referenceValues(molecule: Molecule): Record<ReferenceKey, string> {
  const number = (value: number, decimals: number): string =>
    new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);

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
export function buildPrompt({ molecule, quest, goals, kind }: PromptInput): string {
  const values = referenceValues(molecule);
  const groups =
    molecule.groups.length === 0
      ? 'nenhum grupo funcional reconhecido'
      : molecule.groups
          .map((group) => (group.count > 1 ? `${group.name} (${String(group.count)}×)` : group.name))
          .join(', ');

  const lines = [
    'ESTRUTURA ATUAL (calculada pelo RDKit, não recalcule):',
    `- fórmula: ${values.formula}`,
    `- SMILES: ${molecule.smiles}`,
    `- massa molar: ${values.molarMass}`,
    `- TPSA: ${values.tpsa}`,
    `- logP: ${values.logP}`,
    `- ligações rotacionáveis: ${values.rotatableBonds}`,
    `- anéis: ${values.rings} (aromáticos: ${values.aromaticRings})`,
    `- doadores de ligação de hidrogênio: ${values.hbDonors}`,
    `- aceitadores: ${values.hbAcceptors}`,
    `- grupos funcionais: ${groups}`,
  ];

  if (quest !== null && hasTeacherFacingText(quest)) {
    lines.push(
      '',
      `MISSÃO: ${quest.title}`,
      `Enunciado: ${quest.brief}`,
      'Objetivos, com o veredito que o motor de missões já deu:',
      ...goals.map((goal) => `- [${goal.met ? 'cumprido' : 'em aberto'}] ${goal.label}`),
    );
  } else if (quest !== null) {
    // R-9: missão `professor:` — nem título, nem enunciado, escrito por um
    // professor, chega ao modelo. Só os rótulos gerados dos objetivos, que
    // saíram do RDKit (`extractGoals`), não de texto livre.
    lines.push(
      '',
      'MISSÃO EM CURSO, de um professor — o enunciado dela é do professor e não entra aqui.',
      'Objetivos, com o veredito que o motor de missões já deu:',
      ...goals.map((goal) => `- [${goal.met ? 'cumprido' : 'em aberto'}] ${goal.label}`),
    );
  } else {
    lines.push('', 'Não há missão em curso: a pessoa está desenhando livremente.');
  }

  lines.push('', `PEDIDO: ${KIND_ASK[kind]}`);

  return lines.join('\n');
}
