'use server';

import { evaluateQuest } from '@rotamer/quests';
import { z } from 'zod';
import { currentProfile } from '../../lib/auth';
import { analyzeOnServer } from '../../lib/chemistry-server';
import { db } from '../../lib/db';
import { rememberMolecule } from '../../lib/molecule-store';
import { resolveQuest, studentQuestAccess } from '../../lib/quest-resolve';
import { messages } from '../turmas/messages';

/**
 * Gravar uma tentativa de missão.
 *
 * **Nunca confie na avaliação do cliente.** O navegador manda o desenho, não a
 * nota: aqui o molblock passa de novo pelo RDKit e a mesma `spec` da missão é
 * reavaliada antes de qualquer coisa ir para o banco.
 */

/** Mesma recusa para os dois casos (R-8): diferenciar vira oráculo de existência. */
const QUEST_NOT_FOUND = messages.errors.questNotFound;

const schema = z.object({
  // R-16: sem `.max()` o slug vinha de constante do catálogo; agora ele
  // também vem de dado (`professor:<cuid>`), e uma string sem teto é entrada
  // não validada.
  questSlug: z.string().min(1).max(80),
  molblock: z.string().min(1).max(200_000),
  elapsedMs: z.number().int().min(0).max(86_400_000),
});

export type AttemptOutcome =
  | { readonly status: 'saved'; readonly score: number; readonly passed: boolean }
  | { readonly status: 'anonymous' }
  | { readonly status: 'rejected'; readonly reason: string };

export async function saveAttempt(input: {
  questSlug: string;
  molblock: string;
  elapsedMs: number;
}): Promise<AttemptOutcome> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { status: 'rejected', reason: 'Tentativa mal formada.' };

  const profile = await currentProfile();
  if (profile === null) return { status: 'anonymous' };

  const quest = await resolveQuest(parsed.data.questSlug);
  if (!quest) return { status: 'rejected', reason: QUEST_NOT_FOUND };

  // R-7: a mesma recusa serve para slug inexistente e para slug de uma turma
  // em que o aluno não está matriculado (ou não publicada, ou arquivada) —
  // diferenciar contaria a existência de uma turma que não é dele (R-8).
  if (!(await studentQuestAccess(profile.id, quest.slug))) {
    return { status: 'rejected', reason: QUEST_NOT_FOUND };
  }

  const analysis = await analyzeOnServer(parsed.data.molblock);
  if (!analysis.ok) return { status: 'rejected', reason: analysis.error.message };

  // A nota sai daqui, do motor de missões rodando no servidor sobre os números
  // que o RDKit acabou de calcular.
  const result = evaluateQuest(quest, analysis.molecule);
  const molecule = await rememberMolecule(profile.id, analysis.molecule);

  await db.attempt.create({
    data: {
      profileId: profile.id,
      questSlug: quest.slug,
      moleculeId: molecule.id,
      score: result.score,
      passed: result.passed,
      elapsedMs: parsed.data.elapsedMs,
    },
  });

  return { status: 'saved', score: result.score, passed: result.passed };
}

const openSchema = z.object({ questSlug: z.string().min(1).max(80) });

/**
 * Registra que alguém abriu uma missão.
 *
 * É o outro lado da tentativa: o painel da turma precisa saber onde a aula
 * parou, não só quem chegou ao fim, e "abriu e não cumpriu" é a definição de
 * travar que ele usa (D-22). Sem conta, não grava nada.
 */
export async function openQuest(input: { questSlug: string }): Promise<void> {
  const parsed = openSchema.safeParse(input);
  if (!parsed.success) return;

  const profile = await currentProfile();
  if (profile === null) return;

  const quest = await resolveQuest(parsed.data.questSlug);
  if (!quest) return;

  // R-7: mesma cadeia de acesso que `saveAttempt` — abrir uma missão de outra
  // turma não grava nada, silenciosamente, como o resto desta função já faz
  // para slug inválido.
  if (!(await studentQuestAccess(profile.id, quest.slug))) return;

  await db.questOpen
    .upsert({
      where: {
        profileId_questSlug: { profileId: profile.id, questSlug: parsed.data.questSlug },
      },
      create: { profileId: profile.id, questSlug: parsed.data.questSlug },
      update: {},
    })
    .catch(() => null);
}

export interface QuestProgress {
  readonly questSlug: string;
  readonly bestScore: number;
  readonly passed: boolean;
}

/** O que a pessoa já cumpriu, para a missão abrir sabendo onde ela parou. */
export async function readProgress(): Promise<readonly QuestProgress[]> {
  const profile = await currentProfile();
  if (profile === null) return [];

  const rows = await db.attempt.groupBy({
    by: ['questSlug'],
    where: { profileId: profile.id },
    _max: { score: true },
  });

  const passedRows = await db.attempt.findMany({
    where: { profileId: profile.id, passed: true },
    select: { questSlug: true },
    distinct: ['questSlug'],
  });

  const passed = new Set(passedRows.map((row) => row.questSlug));

  return rows.map((row) => ({
    questSlug: row.questSlug,
    bestScore: row._max.score ?? 0,
    passed: passed.has(row.questSlug),
  }));
}
