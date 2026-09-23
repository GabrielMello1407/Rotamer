/**
 * `@rotamer/quests` — missões declarativas e pontuação.
 *
 * A nota da missão sai daqui, nunca do LLM. A mesma `spec` roda no cliente,
 * para resposta instantânea, e de novo no servidor antes de gravar a tentativa.
 *
 * O que decide — condição, trilha, dificuldade — não fala idioma nenhum. O que
 * se lê na tela é derivado da condição (`goalLabel`) ou escrito à mão nos dois
 * idiomas (`catalogText`), e entra pela camada que sabe quem está lendo.
 */
export { CATALOG, catalogFor, findQuest, findSpec, localize, questsOfTrack } from './catalog';
export { catalogText } from './catalog-text';
export { countElements, meets } from './conditions';
export { evaluateAnalysis, evaluateQuest } from './evaluate';
export { extractGoals } from './extract';
export { goalLabel, trackNames } from './messages';
export type { CandidateGoal, CandidateKind } from './extract';
export type {
  Assessable,
  Condition,
  Goal,
  GoalResult,
  LocalizedGoal,
  MeasurableDescriptor,
  Quest,
  QuestResult,
  QuestSpec,
  Range,
  Track,
} from './types';
