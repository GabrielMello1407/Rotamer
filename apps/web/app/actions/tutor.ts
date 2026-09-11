'use server';

import { evaluateQuest } from '@rotamer/quests';
import { z } from 'zod';
import { currentProfile } from '../../lib/auth';
import { analyzeOnServer } from '../../lib/chemistry-server';
import { db, hasDatabase } from '../../lib/db';
import { resolveQuest, studentQuestAccess } from '../../lib/quest-resolve';
import { askGemini, tutorAvailable, tutorModel } from '../../lib/tutor/gemini';
import { buildPrompt, referenceValues, type HintKind } from '../../lib/tutor/prompt';
import { tutorHintSchema, type TutorHint } from '../../lib/tutor/schema';
import type { ReferenceKey } from '../../lib/tutor/schema';

/**
 * O tutor.
 *
 * O núcleo determinístico já decidiu tudo o que importa antes desta função
 * existir: se a molécula é válida, quais são os descritores, se a missão foi
 * cumprida. O que o modelo faz aqui é explicar — e a interface marca em âmbar.
 *
 * Três defesas, nesta ordem: cache por molécula, missão e tipo de ajuda; teto de
 * pedidos por pessoa por dia; e o schema fechado, que recusa resposta com número
 * solto em vez de tentar consertar.
 */

const DEFAULT_LIMIT = 30;

/** Mesma recusa de `saveAttempt`/`openQuest` (R-8): existência não se entrega em pista. */
const QUEST_NOT_FOUND = 'Essa missão não existe.';

const schema = z.object({
  molblock: z.string().min(1).max(200_000),
  questSlug: z.string().max(80).nullable(),
  kind: z.enum(['proximo-passo', 'por-que-nao-fechou', 'entender-a-molecula']),
});

export interface TutorAnswer {
  readonly hint: TutorHint;
  /** Valores calculados que substituem as referências no texto. */
  readonly values: Readonly<Partial<Record<ReferenceKey, string>>>;
  /** Verdadeiro quando a resposta veio do cache, sem novo pedido ao modelo. */
  readonly cached: boolean;
}

export type TutorOutcome =
  | { readonly status: 'ok'; readonly answer: TutorAnswer }
  /** Sem chave configurada: o produto segue com as dicas escritas à mão. */
  | { readonly status: 'unavailable' }
  /** Passou do teto do dia. */
  | { readonly status: 'limit' }
  | { readonly status: 'rejected'; readonly reason: string };

export async function askTutor(input: {
  molblock: string;
  questSlug: string | null;
  kind: HintKind;
}): Promise<TutorOutcome> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { status: 'rejected', reason: 'Pedido mal formado.' };
  if (!tutorAvailable()) return { status: 'unavailable' };

  const profile = await currentProfile();

  // R-7: a quarta porta do aluno. Resolvido antes de qualquer análise — uma
  // missão fora do alcance não ganha nem o trabalho do RDKit.
  //
  // Esta checagem de conta precisa vir **antes** de
  // `resolveQuest` tocar o banco. Antes, uma conta anônima recebia
  // "Essa missão não existe." para um slug `professor:` forjado, e "Missão de
  // turma precisa de conta." para um slug `professor:` real — a diferença
  // entre as duas frases já entregava se a missão existe, para quem nem tem
  // conta. Aqui o teste é só sintático (o prefixo do slug), então a resposta
  // para uma conta anônima é sempre a mesma, exista ou não a missão.
  if (parsed.data.questSlug !== null && parsed.data.questSlug.startsWith('professor:') && profile === null) {
    return { status: 'rejected', reason: 'Missão de turma precisa de conta.' };
  }

  const quest = parsed.data.questSlug === null ? null : await resolveQuest(parsed.data.questSlug);
  if (parsed.data.questSlug !== null && quest === null) {
    return { status: 'rejected', reason: QUEST_NOT_FOUND };
  }

  if (quest !== null && quest.slug.startsWith('professor:') && profile !== null) {
    if (!(await studentQuestAccess(profile.id, quest.slug))) {
      return { status: 'rejected', reason: QUEST_NOT_FOUND };
    }
  }

  const analysis = await analyzeOnServer(parsed.data.molblock);
  if (!analysis.ok) {
    // Estrutura inválida não vai para o modelo: o erro de química já foi
    // explicado pelo motor determinístico, e explicar de novo só confunde.
    return { status: 'rejected', reason: analysis.error.message };
  }

  const { molecule } = analysis;
  const goals = quest === null ? [] : evaluateQuest(quest, molecule).goals;
  const values = referenceValues(molecule);
  const slug = quest?.slug ?? 'livre';

  const cached = await readCache(molecule.inchiKey, slug, parsed.data.kind);
  if (cached !== null) {
    return { status: 'ok', answer: { hint: cached, values, cached: true } };
  }

  if (profile !== null && !(await withinDailyLimit(profile.id))) {
    return { status: 'limit' };
  }

  const generated = await askGemini(buildPrompt({ molecule, quest, goals, kind: parsed.data.kind }));
  if (generated === null) return { status: 'unavailable' };

  await writeCache(molecule.inchiKey, slug, parsed.data.kind, generated.hint);

  return { status: 'ok', answer: { hint: generated.hint, values, cached: false } };
}

/** O mesmo erro na mesma missão não paga duas vezes. */
async function readCache(
  inchiKey: string,
  questSlug: string,
  kind: HintKind,
): Promise<TutorHint | null> {
  if (!hasDatabase()) return null;

  const row = await db.tutorHint
    .findUnique({ where: { inchiKey_questSlug_kind: { inchiKey, questSlug, kind } } })
    .catch(() => null);

  if (row === null) return null;

  // O que está guardado passa pelo schema de novo: cache antigo não é passe
  // livre para texto que hoje seria recusado.
  const parsed = tutorHintSchema.safeParse(row.payload);
  return parsed.success ? parsed.data : null;
}

async function writeCache(
  inchiKey: string,
  questSlug: string,
  kind: HintKind,
  hint: TutorHint,
): Promise<void> {
  if (!hasDatabase()) return;

  await db.tutorHint
    .upsert({
      where: { inchiKey_questSlug_kind: { inchiKey, questSlug, kind } },
      create: { inchiKey, questSlug, kind, payload: hint, model: tutorModel() },
      update: { payload: hint, model: tutorModel() },
    })
    .catch(() => null);
}

/** Teto de gasto por pessoa por dia, com degradação para as dicas escritas. */
async function withinDailyLimit(profileId: string): Promise<boolean> {
  if (!hasDatabase()) return true;

  const limit = Number.parseInt(process.env['TUTOR_DAILY_LIMIT'] ?? '', 10);
  const ceiling = Number.isNaN(limit) ? DEFAULT_LIMIT : limit;

  const today = new Date();
  const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  const usage = await db.tutorUsage
    .upsert({
      where: { profileId_day: { profileId, day } },
      create: { profileId, day, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    })
    .catch(() => null);

  return usage === null || usage.count <= ceiling;
}
