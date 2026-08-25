/**
 * `@rotamer/quests` — missões declarativas e pontuação.
 *
 * A nota da missão sai daqui, nunca do LLM. A mesma `spec` roda no cliente,
 * para resposta instantânea, e de novo no servidor antes de gravar a tentativa.
 */
export { CATALOG, findQuest, questsOfTrack } from './catalog';
export { countElements, meets } from './conditions';
export { evaluateAnalysis, evaluateQuest } from './evaluate';
export type {
  Condition,
  Goal,
  GoalResult,
  MeasurableDescriptor,
  Quest,
  QuestResult,
  Range,
  Track,
} from './types';
