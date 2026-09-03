import type { AnalysisResult, Molecule } from '@rotamer/core';
import { meets } from './conditions';
import type { Assessable, GoalResult, QuestResult } from './types';

/**
 * O veredito da missão.
 *
 * **Nunca o LLM.** A nota sai daqui, de comparação com número calculado, e a
 * mesma função roda no cliente para resposta instantânea e no servidor antes de
 * gravar a tentativa.
 *
 * Recebe `Assessable` — só `slug` e `goals` — e não `Quest`: uma missão de
 * professor não tem `track` nem `difficulty`, e o veredito não precisa deles
 * (§4.4).
 */
export function evaluateQuest(quest: Assessable, molecule: Molecule): QuestResult {
  const goals: GoalResult[] = quest.goals.map((goal) => ({
    id: goal.id,
    label: goal.label,
    met: meets(goal.condition, molecule),
  }));

  const met = goals.filter((goal) => goal.met).length;
  const total = goals.length;

  return {
    slug: quest.slug,
    goals,
    passed: total > 0 && met === total,
    met,
    // Proporcional e explicável: cada objetivo vale a mesma fatia de 100.
    score: total === 0 ? 0 : Math.round((met / total) * 100),
  };
}

/**
 * O veredito a partir do que o worker respondeu.
 *
 * Estrutura inválida não reprova a missão: ela ainda não é uma molécula, e o
 * erro de química já está sendo mostrado em outro lugar da tela.
 *
 * Recebe `Assessable`, como `evaluateQuest` (achado 5 do `reviewer`): uma
 * missão de professor também passa por aqui — o painel local do aluno reage à
 * digitação sem esperar o servidor, e não tinha por que só a `Quest` do
 * catálogo ganhar essa resposta instantânea.
 */
export function evaluateAnalysis(quest: Assessable, analysis: AnalysisResult | null): QuestResult {
  if (analysis === null || !analysis.ok) {
    return {
      slug: quest.slug,
      goals: quest.goals.map((goal) => ({ id: goal.id, label: goal.label, met: false })),
      passed: false,
      met: 0,
      score: 0,
    };
  }

  return evaluateQuest(quest, analysis.molecule);
}
