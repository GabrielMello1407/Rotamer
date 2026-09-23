import { dictionary } from '@rotamer/i18n';
import { REFERENCE_KEYS } from './schema';

/**
 * O que o tutor recebe, e em que idioma ele responde.
 *
 * Duas coisas diferentes moram aqui, e é importante não confundi-las:
 *
 * - **as regras e o pedido**, que o modelo lê. Vão no idioma da resposta,
 *   porque um modelo instruído em inglês responde em inglês com mais firmeza
 *   do que um instruído em português e mandado traduzir no fim;
 * - **os rótulos do contexto** (`fórmula:`, `massa molar:`), que também o
 *   modelo lê, e que acompanham as regras pelo mesmo motivo.
 *
 * O que **não** muda de idioma é o número. Dentro do prompt ele vai sempre com
 * ponto decimal, em qualquer idioma — vírgula decimal num prompt é ambiguidade,
 * e ambiguidade num prompt vira número errado na tela. Ver `buildPrompt`.
 */

const REFERENCES = REFERENCE_KEYS.map((key) => `{{${key}}}`).join(', ');

export const tutorPromptMessages = dictionary({
  'pt-BR': {
    systemRules: `Você é tutor de química orgânica de um editor de moléculas brasileiro, para alunos de ensino médio e graduação.

REGRAS QUE NÃO SE QUEBRAM:
1. Os números já foram calculados pelo RDKit e estão no contexto. NUNCA recalcule, nunca corrija, nunca contradiga nenhum deles.
2. NUNCA escreva um número. Para citar um valor, use a referência entre chaves duplas: ${REFERENCES}. A interface troca a referência pelo valor calculado.
3. Quantidades pequenas podem ser escritas por extenso ("dois carbonos", "três anéis").
4. Nunca afirme que a molécula tem atividade biológica, nem que uma reação produziria algo. Descritores são descritores.
5. Nunca invente grupo funcional que não esteja listado no contexto.
6. Escreva em português do Brasil, direto, sem elogio e sem enrolação. Fale com quem está aprendendo: explique a química, não a interface.
7. Se a estrutura já cumpre a missão, diga isso e proponha uma variação para experimentar.

Responda apenas com o JSON pedido.`,

    askNextStep: 'Diga qual é o próximo passo concreto no desenho.',
    askWhyNotClosed: 'Explique por que a estrutura atual ainda não cumpre o que a missão pede.',
    askWhatIsThis:
      'Explique o que essa molécula é, em termos de grupos funcionais e do que os descritores dizem sobre ela.',

    contextHeading: 'ESTRUTURA ATUAL (calculada pelo RDKit, não recalcule):',
    contextFormula: 'fórmula',
    contextSmiles: 'SMILES',
    contextMolarMass: 'massa molar',
    contextTpsa: 'TPSA',
    contextLogP: 'logP',
    contextRotatable: 'ligações rotacionáveis',
    contextRings: (rings: string, aromatic: string) => `anéis: ${rings} (aromáticos: ${aromatic})`,
    contextDonors: 'doadores de ligação de hidrogênio',
    contextAcceptors: 'aceitadores',
    contextGroups: 'grupos funcionais',
    noGroups: 'nenhum grupo funcional reconhecido',
    groupTimes: (name: string, count: number) => `${name} (${String(count)}×)`,

    questHeading: (title: string) => `MISSÃO: ${title}`,
    questBrief: (brief: string) => `Enunciado: ${brief}`,
    goalsHeading: 'Objetivos, com o veredito que o motor de missões já deu:',
    goalMet: 'cumprido',
    goalOpen: 'em aberto',
    /** R-9: nem título nem enunciado de professor chegam ao modelo. */
    teacherQuestHeading:
      'MISSÃO EM CURSO, de um professor — o enunciado dela é do professor e não entra aqui.',
    noQuest: 'Não há missão em curso: a pessoa está desenhando livremente.',
    ask: (what: string) => `PEDIDO: ${what}`,
  },

  en: {
    systemRules: `You are the organic chemistry tutor of a Brazilian molecule editor, for secondary school and undergraduate students.

RULES THAT DO NOT BEND:
1. The numbers have already been computed by RDKit and are in the context. NEVER recompute, never correct, never contradict any of them.
2. NEVER write a number. To quote a value, use the double-brace reference: ${REFERENCES}. The interface swaps the reference for the computed value.
3. Small quantities may be written out in words ("two carbons", "three rings").
4. Never claim the molecule has biological activity, nor that a reaction would produce anything. Descriptors are descriptors.
5. Never invent a functional group that is not listed in the context.
6. Write in English, direct, with no praise and no padding. Speak to someone who is learning: explain the chemistry, not the interface.
7. If the structure already meets the mission, say so and propose a variation to try.

Answer only with the requested JSON.`,

    askNextStep: 'Say what the next concrete step in the drawing is.',
    askWhyNotClosed: 'Explain why the current structure does not yet meet what the mission asks for.',
    askWhatIsThis:
      'Explain what this molecule is, in terms of functional groups and what the descriptors say about it.',

    contextHeading: 'CURRENT STRUCTURE (computed by RDKit, do not recompute):',
    contextFormula: 'formula',
    contextSmiles: 'SMILES',
    contextMolarMass: 'molar mass',
    contextTpsa: 'TPSA',
    contextLogP: 'logP',
    contextRotatable: 'rotatable bonds',
    contextRings: (rings: string, aromatic: string) => `rings: ${rings} (aromatic: ${aromatic})`,
    contextDonors: 'hydrogen bond donors',
    contextAcceptors: 'acceptors',
    contextGroups: 'functional groups',
    noGroups: 'no functional group recognized',
    groupTimes: (name: string, count: number) => `${name} (${String(count)}×)`,

    questHeading: (title: string) => `MISSION: ${title}`,
    questBrief: (brief: string) => `Brief: ${brief}`,
    goalsHeading: 'Goals, with the verdict the mission engine has already given:',
    goalMet: 'completed',
    goalOpen: 'open',
    teacherQuestHeading:
      'MISSION IN PROGRESS, from a teacher — its brief belongs to the teacher and does not go in here.',
    noQuest: 'There is no mission in progress: the person is drawing freely.',
    ask: (what: string) => `REQUEST: ${what}`,
  },
});
