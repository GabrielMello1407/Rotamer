'use server';

import { chemistryErrorText, pick, type Locale } from '@rotamer/i18n';
import { CATALOG, evaluateQuest, extractGoals, findQuest, goalLabel, localize } from '@rotamer/quests';
import type { Condition, Goal, Track } from '@rotamer/quests';
import { z } from 'zod';
import type { Prisma } from '../../generated/prisma/client';
import { currentProfile } from '../../lib/auth';
import { analyzeOnServer } from '../../lib/chemistry-server';
import { db, hasDatabase } from '../../lib/db';
import { resolveQuest, studentQuestAccess, validateAuthoredGoals } from '../../lib/quest-resolve';
import {
  ownedAssignment,
  ownedAssignmentAnyState,
  ownedClassroom,
  ownedTeacherQuest,
  requireTeacher,
} from '../../lib/roles';
import { currentLocale } from '../../lib/locale';
import { assignmentMessages, sharedMessages } from './messages';
import { messages } from '../turmas/messages';

/**
 * Listas da turma (D-25) e catálogo compartilhado (D-27) — o professor monta,
 * o aluno resolve, e o que ele publica pode alcançar qualquer turma.
 *
 * Cada ação de escrita tem a mesma forma: papel primeiro, dono depois
 * (R-5) — `requireTeacher` diz que a conta tem o papel; `owned*` (`lib/roles`)
 * diz que a linha específica é dela. Nenhuma escrita pula essa ordem.
 *
 * A parte que decide química nunca é digitada (D-01, D-25): a resposta de uma
 * missão de professor é sempre desenhada, sempre reanalisada pelo RDKit aqui
 * dentro, e os objetivos vêm sempre de `extractGoals` rodando de novo sobre
 * essa análise — nunca do `Condition` que o cliente mandou (R-1).
 */

// ---------------------------------------------------------------- limites

const TITLE_MAX = 80;
const BRIEF_MAX = 500;
const HINT_MAX = 200;
const HINTS_MAX_COUNT = 3;
const GOALS_MAX_COUNT = 10;
const MOLBLOCK_MAX_BYTES = 20 * 1024;
const MAX_HEAVY_ATOMS = 100;
const MAX_ACTIVE_TEACHER_QUESTS = 200;
const MAX_ASSIGNMENTS_PER_CLASSROOM = 50;
const MAX_ITEMS_PER_ASSIGNMENT = 30;
const MAX_AUTHORING_SAVES_PER_DAY = 200;
const REPORT_REASON_MAX = 200;
const MAX_REPORTS_PER_DAY = 10;
const CHECK_QUEST_LIMIT = 120;
const CHECK_QUEST_WINDOW_MS = 60 * 1000;

/** Janela usada pelos dois tetos "por dia" que rodam em memória ou em contagem por período. */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const TEACHER_PREFIX = 'professor:';

/**
 * O texto desta ação, no idioma de quem pediu.
 *
 * Toda recusa daqui sai como frase pronta — o cliente recebe algo para mostrar,
 * não um código para traduzir. `errors` traz as recusas que a tela das turmas
 * já escrevia (R-8: a mesma frase para "não existe" e "não é sua"), e `shared`
 * as que se repetem entre ações.
 */
async function textFor(): Promise<{
  readonly locale: Locale;
  readonly m: ReturnType<typeof pick<(typeof assignmentMessages)['pt-BR']>>;
  readonly shared: ReturnType<typeof pick<(typeof sharedMessages)['pt-BR']>>;
  readonly errors: ReturnType<typeof pick<(typeof messages)['pt-BR']>>['errors'];
}> {
  const locale = await currentLocale();

  return {
    locale,
    m: pick(assignmentMessages, locale),
    shared: pick(sharedMessages, locale),
    errors: pick(messages, locale).errors,
  };
}

// -------------------------------------------------------------- texto (R-13/R-14)

/** Controles `U+0000–U+001F`, menos `\n` (`U+000A`). */
// eslint-disable-next-line no-control-regex -- R-13 pede exatamente para recusar estes caracteres.
const DISALLOWED_CONTROLS = /[\u0000-\u0009\u000B-\u001F]/;
/** Bidi — `U+202A–U+202E` (embutir/sobrepor direção) e `U+2066–U+2069` (isolar). */
const BIDI_MARKS = /[\u202A-\u202E\u2066-\u2069]/g;
const LINK_PATTERN = /https?:\/\//i;

/**
 * NFC, sem marca de direção de texto e sem mais de duas quebras de linha
 * seguidas. Não mexe em maiúscula, pontuação nem espaço simples — é limpeza
 * de caractere de controle, não de estilo.
 */
function normalizeText(raw: string): string {
  return raw.normalize('NFC').replace(BIDI_MARKS, '').replace(/\n{3,}/g, '\n\n');
}

interface TextCheck {
  readonly ok: boolean;
  readonly value: string;
  readonly reason?: 'controle' | 'vazio' | 'longo';
}

function checkPlainText(raw: string, max: number): TextCheck {
  const value = normalizeText(raw);

  if (DISALLOWED_CONTROLS.test(value)) return { ok: false, value, reason: 'controle' };
  if (value.trim().length === 0) return { ok: false, value, reason: 'vazio' };
  if (value.length > max) return { ok: false, value, reason: 'longo' };

  return { ok: true, value };
}

function textProblemMessage(
  check: TextCheck,
  empty: string,
  long: string,
  control: string,
): string {
  if (check.reason === 'vazio') return empty;
  if (check.reason === 'longo') return long;
  return control;
}

function containsLink(text: string): boolean {
  return LINK_PATTERN.test(text);
}

// --------------------------------------------------------------- zod

const cuid = z.string().cuid();

const createAssignmentSchema = z.object({
  classroomId: cuid,
  title: z.string().trim().min(2).max(TITLE_MAX),
});

const renameAssignmentSchema = z.object({
  assignmentId: cuid,
  title: z.string().trim().min(2).max(TITLE_MAX),
});

const createTeacherQuestSchema = z.object({
  assignmentId: cuid,
  title: z.string().min(1).max(500),
  brief: z.string().min(1).max(5_000),
  hints: z.array(z.string().max(2_000)).max(HINTS_MAX_COUNT),
  molblock: z.string().min(1).max(200_000),
  goalIds: z.array(z.string().min(1)).min(1).max(GOALS_MAX_COUNT),
});

const updateTeacherQuestTextSchema = z.object({
  teacherQuestId: cuid,
  title: z.string().min(1).max(500),
  brief: z.string().min(1).max(5_000),
  hints: z.array(z.string().max(2_000)).max(HINTS_MAX_COUNT),
});

const teacherQuestIdSchema = z.object({ teacherQuestId: cuid });

const addItemSchema = z.object({
  assignmentId: cuid,
  questSlug: z.string().min(1).max(80),
});

const moveItemSchema = z.object({
  assignmentId: cuid,
  itemId: cuid,
  direction: z.enum(['up', 'down']),
});

const removeItemSchema = z.object({ assignmentId: cuid, itemId: cuid });
const publishAssignmentSchema = z.object({ assignmentId: cuid });
const archiveAssignmentSchema = z.object({ assignmentId: cuid });
const unarchiveAssignmentSchema = z.object({ assignmentId: cuid });
const readAssignmentsSchema = z.object({ classroomId: cuid, includeArchived: z.boolean().optional() });
const readAssignmentBoardSchema = z.object({ assignmentId: cuid });
const checkQuestSchema = z.object({
  questSlug: z.string().min(1).max(80),
  molblock: z.string().min(1).max(200_000),
});

// --------------------------------------------------------------- tipos comuns

export type OkOutcome = { readonly status: 'ok' } | { readonly status: 'rejected'; readonly reason: string };

/**
 * Contagem de "salvamentos de autoria" nas últimas 24 h (R-12).
 *
 * A versão anterior contava `TeacherQuest` **distintas** tocadas hoje — uma
 * mesma missão salva 300 vezes no mesmo dia contava 1, porque `createdAt`/
 * `updatedAt` são propriedade da linha, não do evento. Um teto de taxa
 * precisa contar toda escrita — criar **e** editar —, não a linha.
 *
 * Sem uma tabela de evento (a migração aditiva desta onda, D-27, só traz
 * `TeacherQuest.catalogedAt` e `QuestReport` — nenhuma tabela de contagem),
 * o mesmo padrão que R-15 já usa em `classroom.ts` (teto de códigos errados)
 * resolve: um `Map` no processo, suficiente enquanto a instância roda um
 * container só do app (D-11).
 *
 * **Limitação conhecida, decidida por escrito — não defeito escondido.** Este
 * `Map` mora em memória: reiniciar o processo zera a janela, e ele não é
 * compartilhado entre processos. Decisão explícita: **não persistir agora**
 * — a migração já cresceu nesta entrega (D-27), e a instância roda um
 * processo só (D-11). Isso precisa virar tabela no dia em que o app ganhar
 * mais de um container, ou o container passar a reiniciar com frequência o
 * bastante para a janela de 24 h perder sentido — registrado no
 * `docs/FORA-DE-ESCOPO.md`.
 */
const authoringSaves = new Map<string, number[]>();

function authoringSavesToday(teacherId: string): number {
  const now = Date.now();
  const saves = (authoringSaves.get(teacherId) ?? []).filter((at) => now - at < ONE_DAY_MS);
  authoringSaves.set(teacherId, saves);
  return saves.length;
}

/** Registra uma escrita de autoria — chamado só depois que ela realmente aconteceu. */
function registerAuthoringSave(teacherId: string): void {
  const saves = authoringSaves.get(teacherId) ?? [];
  saves.push(Date.now());
  authoringSaves.set(teacherId, saves);
}

/**
 * Teto de `checkQuest` — 120 conferências por conta por minuto.
 *
 * `checkQuest` não grava nada (nem `Attempt`, nem `QuestOpen`): é a mesma
 * reavaliação de `saveAttempt`, só que sem persistir, para o aluno conferir
 * "cheguei?" sem contar como tentativa. Sem teto, é RDKit no servidor a cada
 * tecla — barato por chamada, caro em volume.
 *
 * **A contagem precisa vir antes de qualquer trabalho.** A versão anterior só
 * contava depois do acesso (missão `professor:`) e da análise passarem, e só
 * por `profile.id` — então quem não tinha conta, ou mandava molblock inválido
 * de propósito, martelava o RDKit do servidor sem nunca entrar no teto.
 * `checkQuestKey` resolve a chave (conta ou IP) e `checkQuest` chama
 * `tooManyQuestChecks`/`registerQuestCheck` antes de resolver a missão, checar
 * acesso ou tocar o RDKit — molblock inválido conta contra o teto igual a um
 * molblock válido.
 *
 * Mesmo padrão de `authoringSaves` e `wrongCodeAttempts` (`classroom.ts`, R-15):
 * um `Map` no processo. **Limitação conhecida:** reiniciar o container zera a
 * janela, e não há coordenação entre processos — aceitável enquanto a
 * instância roda um processo só (D-11); vira tabela no dia em que isso mudar.
 */
const questChecks = new Map<string, number[]>();

/**
 * A chave do teto é a conta — e só a conta.
 *
 * Anônimo não conferencia nada aqui: missão do catálogo é avaliada no próprio
 * navegador, e a única missão que precisa do servidor para decidir — a de
 * InChIKey, R-4 — é de professor, que exige conta para ser alcançada (D-26,
 * R-7). Então chamada anônima é recusada antes de qualquer trabalho, sem teto
 * por IP: chavear por `x-forwarded-for` seria chavear pelo que o cliente
 * escreve, e um `Map` alimentado por atacante cresce sem parar.
 */
function checkQuestKey(profileId: string): string {
  return `conta:${profileId}`;
}

function tooManyQuestChecks(key: string): boolean {
  const now = Date.now();
  const checks = (questChecks.get(key) ?? []).filter((at) => now - at < CHECK_QUEST_WINDOW_MS);

  // Janela vazia some do mapa: o que fica é limitado pelo número de contas que
  // conferiram no último minuto, não pelo histórico do processo.
  if (checks.length === 0) questChecks.delete(key);
  else questChecks.set(key, checks);

  return checks.length >= CHECK_QUEST_LIMIT;
}

function registerQuestCheck(key: string): void {
  const checks = questChecks.get(key) ?? [];
  checks.push(Date.now());
  questChecks.set(key, checks);
}

/** Títulos de missão `professor:`, buscados com `select` explícito (R-3) — nunca a resposta. */
/**
 * O texto de cada missão de professor citada por estes slugs.
 *
 * Traz enunciado e dicas junto do título porque é o professor dono quem lê
 * esta tela, e é nela que ele edita — a promessa de "título, enunciado e
 * dicas continuam editáveis" some se a tela não souber o que está escrito.
 * **R-3 continua inteira:** `answerMolblock` e `answerInchiKey` não entram
 * neste `select`, e nenhum caminho de aluno passa por aqui.
 */
async function teacherTextsFor(slugs: readonly string[]): Promise<Map<string, TeacherQuestText>> {
  const ids = slugs
    .filter((slug) => slug.startsWith(TEACHER_PREFIX))
    .map((slug) => slug.slice(TEACHER_PREFIX.length));

  if (ids.length === 0) return new Map();

  const rows = await db.teacherQuest.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true, brief: true, hints: true, archivedAt: true },
  });

  return new Map(
    rows.map((row) => [
      `${TEACHER_PREFIX}${row.id}`,
      {
        title: row.title,
        brief: row.brief,
        hints: Array.isArray(row.hints) ? (row.hints as string[]) : [],
        archived: row.archivedAt !== null,
      },
    ] as const),
  );
}

interface TeacherQuestText {
  readonly title: string;
  readonly brief: string;
  readonly hints: readonly string[];
  readonly archived: boolean;
}

function itemView(
  slug: string,
  texts: ReadonlyMap<string, TeacherQuestText>,
  locale: Locale,
): Omit<AssignmentItemView, 'id' | 'position' | 'questSlug'> {
  if (slug.startsWith(TEACHER_PREFIX)) {
    const text = texts.get(slug);
    return {
      title: text?.title ?? slug,
      origin: 'teacher',
      brief: text?.brief ?? '',
      hints: text?.hints ?? [],
      archived: text?.archived ?? false,
    };
  }

  return { title: findQuest(slug, locale)?.title ?? slug, origin: 'catalog', brief: '', hints: [], archived: false };
}

// ================================================================== createAssignment

export type CreateAssignmentOutcome =
  | { readonly status: 'created'; readonly id: string }
  | { readonly status: 'rejected'; readonly reason: string };

export async function createAssignment(input: {
  classroomId: string;
  title: string;
}): Promise<CreateAssignmentOutcome> {
  const t = await textFor();
  if (!hasDatabase()) return { status: 'rejected', reason: t.shared.unavailable };

  const parsed = createAssignmentSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 'rejected', reason: parsed.error.issues[0]?.message ?? t.shared.malformed };
  }

  // R-5: papel é pré-requisito, dono é a autorização.
  const teacher = await requireTeacher();
  if (teacher === null) {
    return { status: 'rejected', reason: t.m.onlyTeacherBuildsAssignment };
  }

  const classroom = await ownedClassroom(parsed.data.classroomId, teacher.id);
  if (classroom === null) {
    return { status: 'rejected', reason: t.m.notYourClassroom };
  }

  return db.$transaction(async (tx) => {
    // R-12: 50 listas por turma, conferido dentro da transação.
    const count = await tx.assignment.count({ where: { classroomId: classroom.id, archivedAt: null } });
    if (count >= MAX_ASSIGNMENTS_PER_CLASSROOM) {
      return {
        status: 'rejected',
        reason: t.m.assignmentLimitPerClassroom(MAX_ASSIGNMENTS_PER_CLASSROOM),
      } as const;
    }

    const row = await tx.assignment.create({
      data: { classroomId: classroom.id, createdById: teacher.id, title: parsed.data.title },
      select: { id: true },
    });

    return { status: 'created', id: row.id } as const;
  });
}

// ================================================================== renameAssignment

export async function renameAssignment(input: { assignmentId: string; title: string }): Promise<OkOutcome> {
  const t = await textFor();
  if (!hasDatabase()) return { status: 'rejected', reason: t.shared.unavailable };

  const parsed = renameAssignmentSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 'rejected', reason: parsed.error.issues[0]?.message ?? t.shared.malformed };
  }

  const teacher = await requireTeacher();
  if (teacher === null) return { status: 'rejected', reason: t.m.onlyTeacherEditsAssignment };

  const assignment = await ownedAssignment(parsed.data.assignmentId, teacher.id);
  if (assignment === null) return { status: 'rejected', reason: t.m.notYourAssignment };

  await db.assignment.update({ where: { id: assignment.id }, data: { title: parsed.data.title } });
  return { status: 'ok' };
}

// ================================================================== createTeacherQuest

export type CreateTeacherQuestOutcome =
  | { readonly status: 'created'; readonly questSlug: string; readonly position: number }
  | { readonly status: 'rejected'; readonly reason: string };

export async function createTeacherQuest(input: {
  assignmentId: string;
  title: string;
  brief: string;
  hints: readonly string[];
  molblock: string;
  goalIds: readonly string[];
}): Promise<CreateTeacherQuestOutcome> {
  const t = await textFor();
  if (!hasDatabase()) return { status: 'rejected', reason: t.shared.unavailable };

  const parsed = createTeacherQuestSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 'rejected', reason: parsed.error.issues[0]?.message ?? t.shared.malformed };
  }

  const teacher = await requireTeacher();
  if (teacher === null) return { status: 'rejected', reason: t.m.onlyTeacherCreatesQuest };

  const assignment = await ownedAssignment(parsed.data.assignmentId, teacher.id);
  if (assignment === null) return { status: 'rejected', reason: t.m.notYourAssignment };

  // R-13: título, enunciado e dicas passam pela mesma limpeza antes de qualquer outra checagem.
  const title = checkPlainText(parsed.data.title, TITLE_MAX);
  if (!title.ok) {
    return {
      status: 'rejected',
      reason: textProblemMessage(title, t.errors.emptyTitleOrBrief, t.m.titleTooLong(TITLE_MAX), t.m.controlCharacter),
    };
  }

  const brief = checkPlainText(parsed.data.brief, BRIEF_MAX);
  if (!brief.ok) {
    return {
      status: 'rejected',
      reason: textProblemMessage(brief, t.errors.emptyTitleOrBrief, t.m.briefTooLong(BRIEF_MAX), t.m.controlCharacter),
    };
  }
  // R-14: enunciado e dicas são nó de texto — sem link.
  if (containsLink(brief.value)) return { status: 'rejected', reason: t.errors.linkRejected };

  const hints: string[] = [];
  for (const raw of parsed.data.hints) {
    const hint = checkPlainText(raw, HINT_MAX);
    if (!hint.ok) {
      return {
        status: 'rejected',
        reason: textProblemMessage(
          hint,
          t.m.hintEmpty,
          t.m.hintTooLong(HINT_MAX),
          t.m.controlCharacter,
        ),
      };
    }
    if (containsLink(hint.value)) return { status: 'rejected', reason: t.errors.linkRejected };
    hints.push(hint.value);
  }

  // A resposta nunca é digitada — é desenhada, e é o RDKit quem decide se ela existe (D-01).
  const analysis = await analyzeOnServer(parsed.data.molblock);
  if (!analysis.ok) return { status: 'rejected', reason: chemistryErrorText(t.locale, analysis.error) };

  const { molecule } = analysis;

  // R-12: tamanho e átomos pesados, medidos no que o RDKit aceitou — nunca no que o cliente alegou.
  if (Buffer.byteLength(molecule.molblock, 'utf8') > MOLBLOCK_MAX_BYTES) {
    return { status: 'rejected', reason: t.m.answerTooLarge };
  }
  if (molecule.descriptors.heavyAtoms > MAX_HEAVY_ATOMS) {
    return {
      status: 'rejected',
      reason: t.m.answerTooManyAtoms(molecule.descriptors.heavyAtoms, MAX_HEAVY_ATOMS),
    };
  }

  // R-1 e R-2, em `validateAuthoredGoals`: regenera os
  // candidatos a partir desta mesma molécula, aceita só `id` presente ali, e
  // confere que a própria resposta cumpre o que foi marcado.
  const candidates = new Map(extractGoals(molecule).map((candidate) => [candidate.id, candidate] as const));
  const validated = validateAuthoredGoals(candidates, parsed.data.goalIds, molecule, t.locale);
  if (validated.status === 'rejected') return { status: 'rejected', reason: validated.reason };

  const goals: Goal[] = [...validated.goals];

  // O teto diário conta toda escrita de autoria, em memória — ver
  // `authoringSavesToday`. Checado antes da transação porque não depende do
  // banco; o registro (`registerAuthoringSave`) só acontece depois do sucesso.
  if (authoringSavesToday(teacher.id) >= MAX_AUTHORING_SAVES_PER_DAY) {
    return { status: 'rejected', reason: t.m.authoringDailyLimit };
  }

  const outcome = await db.$transaction(async (tx) => {
    // R-12: tetos, todos conferidos dentro da transação.
    const [activeQuests, itemCount] = await Promise.all([
      tx.teacherQuest.count({ where: { teacherId: teacher.id, archivedAt: null } }),
      tx.assignmentItem.count({ where: { assignmentId: assignment.id } }),
    ]);

    if (activeQuests >= MAX_ACTIVE_TEACHER_QUESTS) {
      return {
        status: 'rejected',
        reason: t.m.activeQuestLimit(MAX_ACTIVE_TEACHER_QUESTS),
      } as const;
    }
    if (itemCount >= MAX_ITEMS_PER_ASSIGNMENT) {
      return {
        status: 'rejected',
        reason: t.m.itemsPerAssignmentLimit(MAX_ITEMS_PER_ASSIGNMENT),
      } as const;
    }

    const quest = await tx.teacherQuest.create({
      data: {
        teacherId: teacher.id,
        title: title.value,
        brief: brief.value,
        hints,
        // `Goal[]` é uma estrutura fechada e serializável; o `Json` do Prisma
        // não overlapa o bastante para uma conversão direta.
        goals: goals as unknown as Prisma.InputJsonValue,
        answerMolblock: molecule.molblock,
        answerInchiKey: molecule.inchiKey,
      },
      select: { id: true },
    });

    const questSlug = `${TEACHER_PREFIX}${quest.id}`;

    const item = await tx.assignmentItem.create({
      data: { assignmentId: assignment.id, position: itemCount + 1, questSlug },
      select: { position: true },
    });

    return { status: 'created', questSlug, position: item.position } as const;
  });

  if (outcome.status === 'created') registerAuthoringSave(teacher.id);
  return outcome;
}

// ================================================================== updateTeacherQuestText

export async function updateTeacherQuestText(input: {
  teacherQuestId: string;
  title: string;
  brief: string;
  hints: readonly string[];
}): Promise<OkOutcome> {
  const t = await textFor();
  if (!hasDatabase()) return { status: 'rejected', reason: t.shared.unavailable };

  const parsed = updateTeacherQuestTextSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 'rejected', reason: parsed.error.issues[0]?.message ?? t.shared.malformed };
  }

  const teacher = await requireTeacher();
  if (teacher === null) return { status: 'rejected', reason: t.m.onlyTeacherEditsQuest };

  const quest = await ownedTeacherQuest(parsed.data.teacherQuestId, teacher.id);
  if (quest === null) return { status: 'rejected', reason: t.m.notYourQuest };

  const title = checkPlainText(parsed.data.title, TITLE_MAX);
  if (!title.ok) {
    return {
      status: 'rejected',
      reason: textProblemMessage(title, t.errors.emptyTitleOrBrief, t.m.titleTooLong(TITLE_MAX), t.m.controlCharacter),
    };
  }

  const brief = checkPlainText(parsed.data.brief, BRIEF_MAX);
  if (!brief.ok) {
    return {
      status: 'rejected',
      reason: textProblemMessage(brief, t.errors.emptyTitleOrBrief, t.m.briefTooLong(BRIEF_MAX), t.m.controlCharacter),
    };
  }
  if (containsLink(brief.value)) return { status: 'rejected', reason: t.errors.linkRejected };

  const hints: string[] = [];
  for (const raw of parsed.data.hints) {
    const hint = checkPlainText(raw, HINT_MAX);
    if (!hint.ok) {
      return {
        status: 'rejected',
        reason: textProblemMessage(
          hint,
          t.m.hintEmpty,
          t.m.hintTooLong(HINT_MAX),
          t.m.controlCharacter,
        ),
      };
    }
    if (containsLink(hint.value)) return { status: 'rejected', reason: t.errors.linkRejected };
    hints.push(hint.value);
  }

  // Mesmo teto diário de `createTeacherQuest`, contado em memória —
  // editar conta tanto quanto criar.
  if (authoringSavesToday(teacher.id) >= MAX_AUTHORING_SAVES_PER_DAY) {
    return { status: 'rejected', reason: t.m.authoringDailyLimit };
  }

  await db.$transaction(async (tx) => {
    await tx.teacherQuest.update({
      where: { id: quest.id },
      data: { title: title.value, brief: brief.value, hints },
    });

    // R-10: texto novo invalida a explicação em cache do tutor para esta missão.
    await tx.tutorHint.deleteMany({ where: { questSlug: `${TEACHER_PREFIX}${quest.id}` } });
  });

  registerAuthoringSave(teacher.id);
  return { status: 'ok' };
}

// ================================================================== archiveTeacherQuest

export async function archiveTeacherQuest(input: { teacherQuestId: string }): Promise<OkOutcome> {
  const t = await textFor();
  if (!hasDatabase()) return { status: 'rejected', reason: t.shared.unavailable };

  const parsed = teacherQuestIdSchema.safeParse(input);
  if (!parsed.success) return { status: 'rejected', reason: t.shared.malformed };

  const teacher = await requireTeacher();
  if (teacher === null) return { status: 'rejected', reason: t.m.onlyTeacherArchivesQuest };

  const quest = await ownedTeacherQuest(parsed.data.teacherQuestId, teacher.id);
  if (quest === null) return { status: 'rejected', reason: t.m.notYourQuest };

  await db.teacherQuest.update({ where: { id: quest.id }, data: { archivedAt: new Date() } });
  return { status: 'ok' };
}

// ================================================================== unarchiveTeacherQuest

/**
 * Desarquiva uma missão do professor — simétrica a `archiveTeacherQuest`.
 *
 * `publishToCatalog` recusa missão arquivada com
 * "Desarquive antes de publicar", e até aqui não existia ação nenhuma que
 * fizesse isso — a mensagem mandava um caminho que não existia. Desarquivar
 * só tira a missão do estado arquivado; não muda `catalogedAt` nem os
 * objetivos, e uma lista publicada que já usa esta missão nunca deixou de
 * funcionar (§3.5 de `docs/ROTEIROS.md` — arquivar não tira de mais nada).
 *
 * Desarquivar bota a missão de volta em
 * "ativa" — o mesmo teto de `MAX_ACTIVE_TEACHER_QUESTS` que `createTeacherQuest`
 * confere (R-12) precisa ser conferido aqui também, e do mesmo jeito: dentro
 * da transação que faz a escrita, contando `archivedAt: null` no momento
 * exato do `update`.
 */
export async function unarchiveTeacherQuest(input: { teacherQuestId: string }): Promise<OkOutcome> {
  const t = await textFor();
  if (!hasDatabase()) return { status: 'rejected', reason: t.shared.unavailable };

  const parsed = teacherQuestIdSchema.safeParse(input);
  if (!parsed.success) return { status: 'rejected', reason: t.shared.malformed };

  const teacher = await requireTeacher();
  if (teacher === null) return { status: 'rejected', reason: t.m.onlyTeacherUnarchivesQuest };

  // `ownedTeacherQuest` não filtra por `archivedAt` (roles.ts) — precisa
  // continuar achando a missão mesmo arquivada, que é justamente o caso
  // que esta ação existe para resolver.
  const quest = await ownedTeacherQuest(parsed.data.teacherQuestId, teacher.id);
  if (quest === null) return { status: 'rejected', reason: t.m.notYourQuest };

  return db.$transaction(async (tx) => {
    // R-12: mesmo teto de `createTeacherQuest`, conferido dentro da transação.
    const activeQuests = await tx.teacherQuest.count({ where: { teacherId: teacher.id, archivedAt: null } });
    if (activeQuests >= MAX_ACTIVE_TEACHER_QUESTS) {
      return {
        status: 'rejected',
        reason: t.m.activeQuestLimitToUnarchive(MAX_ACTIVE_TEACHER_QUESTS),
      } as const;
    }

    await tx.teacherQuest.update({ where: { id: quest.id }, data: { archivedAt: null } });
    return { status: 'ok' } as const;
  });
}

// ================================================================== addItem

export type AddItemOutcome =
  | { readonly status: 'added'; readonly position: number }
  | { readonly status: 'rejected'; readonly reason: string };

export async function addItem(input: { assignmentId: string; questSlug: string }): Promise<AddItemOutcome> {
  const t = await textFor();
  if (!hasDatabase()) return { status: 'rejected', reason: t.shared.unavailable };

  const parsed = addItemSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 'rejected', reason: parsed.error.issues[0]?.message ?? t.shared.malformed };
  }

  const teacher = await requireTeacher();
  if (teacher === null) return { status: 'rejected', reason: t.m.onlyTeacherBuildsAssignment };

  const assignment = await ownedAssignment(parsed.data.assignmentId, teacher.id);
  if (assignment === null) return { status: 'rejected', reason: t.m.notYourAssignment };

  const { questSlug } = parsed.data;
  let title: string;

  if (questSlug.startsWith(TEACHER_PREFIX)) {
    // R-6: dono da lista **e** dono da missão.
    const id = questSlug.slice(TEACHER_PREFIX.length);
    const quest = await db.teacherQuest.findFirst({
      where: { id, teacherId: teacher.id },
      select: { id: true, title: true },
    });
    if (quest === null) return { status: 'rejected', reason: t.m.notYourQuest };
    title = quest.title;
  } else {
    const catalogQuest = findQuest(questSlug, t.locale);
    if (!catalogQuest) return { status: 'rejected', reason: t.errors.questNotFound };
    title = catalogQuest.title;
  }

  return db.$transaction(async (tx) => {
    const existing = await tx.assignmentItem.findFirst({
      where: { assignmentId: assignment.id, questSlug },
      select: { id: true },
    });
    if (existing !== null) {
      return {
        status: 'rejected',
        reason: t.errors.slugRepeated(title),
      } as const;
    }

    // R-12: 30 itens por lista, conferido dentro da transação.
    const count = await tx.assignmentItem.count({ where: { assignmentId: assignment.id } });
    if (count >= MAX_ITEMS_PER_ASSIGNMENT) {
      return {
        status: 'rejected',
        reason: t.m.itemsPerAssignmentLimit(MAX_ITEMS_PER_ASSIGNMENT),
      } as const;
    }

    const item = await tx.assignmentItem.create({
      data: { assignmentId: assignment.id, position: count + 1, questSlug },
      select: { position: true },
    });

    return { status: 'added', position: item.position } as const;
  });
}

// ================================================================== moveItem

export async function moveItem(input: {
  assignmentId: string;
  itemId: string;
  direction: 'up' | 'down';
}): Promise<OkOutcome> {
  const t = await textFor();
  if (!hasDatabase()) return { status: 'rejected', reason: t.shared.unavailable };

  const parsed = moveItemSchema.safeParse(input);
  if (!parsed.success) return { status: 'rejected', reason: t.shared.malformed };

  const teacher = await requireTeacher();
  if (teacher === null) return { status: 'rejected', reason: t.m.onlyTeacherEditsAssignment };

  const assignment = await ownedAssignment(parsed.data.assignmentId, teacher.id);
  if (assignment === null) return { status: 'rejected', reason: t.m.notYourAssignment };

  return db.$transaction(async (tx) => {
    const items = await tx.assignmentItem.findMany({
      where: { assignmentId: assignment.id },
      orderBy: { position: 'asc' },
      select: { id: true, position: true },
    });

    const index = items.findIndex((item) => item.id === parsed.data.itemId);
    if (index === -1) return { status: 'rejected', reason: t.m.itemNotFound } as const;

    const neighborIndex = parsed.data.direction === 'up' ? index - 1 : index + 1;
    if (neighborIndex < 0 || neighborIndex >= items.length) return { status: 'ok' } as const;

    const current = items[index];
    const neighbor = items[neighborIndex];
    if (current === undefined || neighbor === undefined) return { status: 'ok' } as const;

    /*
     * Três passos, não dois: `@@unique([assignmentId, position])` não deixa
     * duas linhas com o mesmo par ao mesmo tempo, então trocar direto
     * colidiria no meio da troca. Uma posição provisória, fora do intervalo
     * válido (nunca `> 0`), abre espaço.
     */
    await tx.assignmentItem.update({ where: { id: current.id }, data: { position: -1 } });
    await tx.assignmentItem.update({ where: { id: neighbor.id }, data: { position: current.position } });
    await tx.assignmentItem.update({ where: { id: current.id }, data: { position: neighbor.position } });

    return { status: 'ok' } as const;
  });
}

// ================================================================== removeItem

export async function removeItem(input: { assignmentId: string; itemId: string }): Promise<OkOutcome> {
  const t = await textFor();
  if (!hasDatabase()) return { status: 'rejected', reason: t.shared.unavailable };

  const parsed = removeItemSchema.safeParse(input);
  if (!parsed.success) return { status: 'rejected', reason: t.shared.malformed };

  const teacher = await requireTeacher();
  if (teacher === null) return { status: 'rejected', reason: t.m.onlyTeacherEditsAssignment };

  const assignment = await ownedAssignment(parsed.data.assignmentId, teacher.id);
  if (assignment === null) return { status: 'rejected', reason: t.m.notYourAssignment };

  await db.$transaction(async (tx) => {
    await tx.assignmentItem.deleteMany({ where: { id: parsed.data.itemId, assignmentId: assignment.id } });

    const remaining = await tx.assignmentItem.findMany({
      where: { assignmentId: assignment.id },
      orderBy: { position: 'asc' },
      select: { id: true, position: true },
    });

    // Compacta as posições para continuarem 1, 2, 3… sem buraco. A nova
    // posição nunca é maior que a antiga, e atualizar em ordem crescente
    // nunca colide com uma linha que ainda não foi atualizada.
    for (const [index, item] of remaining.entries()) {
      const nextPosition = index + 1;
      if (item.position !== nextPosition) {
        await tx.assignmentItem.update({ where: { id: item.id }, data: { position: nextPosition } });
      }
    }
  });

  return { status: 'ok' };
}

// ================================================================== publishAssignment

export type PublishOutcome =
  | { readonly status: 'published'; readonly at: string }
  | { readonly status: 'rejected'; readonly reason: string };

export async function publishAssignment(input: { assignmentId: string }): Promise<PublishOutcome> {
  const t = await textFor();
  if (!hasDatabase()) return { status: 'rejected', reason: t.shared.unavailable };

  const parsed = publishAssignmentSchema.safeParse(input);
  if (!parsed.success) return { status: 'rejected', reason: t.shared.malformed };

  const teacher = await requireTeacher();
  if (teacher === null) return { status: 'rejected', reason: t.m.onlyTeacherPublishesAssignment };

  const assignment = await ownedAssignment(parsed.data.assignmentId, teacher.id);
  if (assignment === null) return { status: 'rejected', reason: t.m.notYourAssignment };

  const count = await db.assignmentItem.count({ where: { assignmentId: assignment.id } });
  if (count === 0) {
    return { status: 'rejected', reason: t.errors.publishEmpty };
  }

  const row = await db.assignment.update({
    where: { id: assignment.id },
    data: { publishedAt: new Date() },
    select: { publishedAt: true },
  });

  return { status: 'published', at: (row.publishedAt ?? new Date()).toISOString() };
}

// ================================================================== archiveAssignment

export async function archiveAssignment(input: { assignmentId: string }): Promise<OkOutcome> {
  const t = await textFor();
  if (!hasDatabase()) return { status: 'rejected', reason: t.shared.unavailable };

  const parsed = archiveAssignmentSchema.safeParse(input);
  if (!parsed.success) return { status: 'rejected', reason: t.shared.malformed };

  const teacher = await requireTeacher();
  if (teacher === null) return { status: 'rejected', reason: t.m.onlyTeacherArchivesAssignment };

  const assignment = await ownedAssignment(parsed.data.assignmentId, teacher.id);
  if (assignment === null) return { status: 'rejected', reason: t.m.notYourAssignment };

  await db.assignment.update({ where: { id: assignment.id }, data: { archivedAt: new Date() } });
  return { status: 'ok' };
}

// ================================================================== unarchiveAssignment

/**
 * Desarquiva uma lista — simétrica a `archiveAssignment`, que sem isto não
 * tinha volta.
 *
 * Do mesmo jeito que `unarchiveTeacherQuest`: `ownedAssignmentAnyState`
 * (`roles.ts`) não filtra por `archivedAt`, porque precisa continuar achando
 * a lista mesmo arquivada — é justamente o caso que esta ação resolve. E o
 * teto de R-12 (50 listas por turma) é conferido dentro da transação, porque
 * desarquivar bota a lista de volta em "ativa" na turma.
 */
export async function unarchiveAssignment(input: { assignmentId: string }): Promise<OkOutcome> {
  const t = await textFor();
  if (!hasDatabase()) return { status: 'rejected', reason: t.shared.unavailable };

  const parsed = unarchiveAssignmentSchema.safeParse(input);
  if (!parsed.success) return { status: 'rejected', reason: t.shared.malformed };

  const teacher = await requireTeacher();
  if (teacher === null) return { status: 'rejected', reason: t.m.onlyTeacherUnarchivesAssignment };

  const assignment = await ownedAssignmentAnyState(parsed.data.assignmentId, teacher.id);
  if (assignment === null) return { status: 'rejected', reason: t.m.notYourAssignment };

  const full = await db.assignment.findUnique({
    where: { id: assignment.id },
    select: { classroomId: true },
  });
  if (full === null) return { status: 'rejected', reason: t.m.notYourAssignment };

  return db.$transaction(async (tx) => {
    // R-12: mesmo teto de `createAssignment`, conferido dentro da transação.
    const count = await tx.assignment.count({ where: { classroomId: full.classroomId, archivedAt: null } });
    if (count >= MAX_ASSIGNMENTS_PER_CLASSROOM) {
      return {
        status: 'rejected',
        reason: t.m.assignmentLimitToUnarchive(MAX_ASSIGNMENTS_PER_CLASSROOM),
      } as const;
    }

    await tx.assignment.update({ where: { id: assignment.id }, data: { archivedAt: null } });
    return { status: 'ok' } as const;
  });
}

// ================================================================== readAssignments

export interface AssignmentItemView {
  /**
   * O `id` da linha de `AssignmentItem` — acrescentado pelo `frontend` nesta
   * onda. `moveItem` e `removeItem` pedem `itemId` (§5.2), e sem ele nesta
   * leitura a tela não tinha como montar "subir/descer/remover" (§6.2): a
   * `position` sozinha não endereça a linha porque ela muda a cada
   * reordenação. Não é dado sensível — é o identificador interno da posição,
   * nunca a resposta (R-3 continua sobre `answerMolblock`/`answerInchiKey`).
   */
  readonly id: string;
  readonly position: number;
  readonly questSlug: string;
  readonly title: string;
  readonly origin: 'catalog' | 'teacher';
  /**
   * Enunciado, dicas e estado de arquivo — só de missão de professor; de
   * catálogo vêm vazios. É o que a tela precisa para editar sem uma segunda
   * viagem ao servidor a cada linha.
   */
  readonly brief: string;
  readonly hints: readonly string[];
  readonly archived: boolean;
}

export interface AssignmentSummary {
  readonly id: string;
  readonly title: string;
  readonly items: readonly AssignmentItemView[];
  readonly publishedAt: string | null;
  /** `null` quando ativa. Presente só quando `includeArchived` pediu a lista arquivada junto. */
  readonly archivedAt: string | null;
}

/**
 * R-3: `answerMolblock` e `answerInchiKey` não entram em nenhum `select` daqui.
 *
 * `includeArchived` existe porque, sem ele, uma lista arquivada some das duas
 * telas (§3.5 do `docs/ROTEIROS.md`) e o professor não tinha como achá-la de
 * volta para `unarchiveAssignment`. Continua vindo **junto** com as ativas
 * quando pedido — não substitui a leitura padrão — e cada lista carrega
 * `archivedAt`, para a tela distinguir sem adivinhar pela ausência na lista
 * padrão.
 */
export async function readAssignments(input: {
  classroomId: string;
  includeArchived?: boolean;
}): Promise<readonly AssignmentSummary[]> {
  const locale = await currentLocale();
  if (!hasDatabase()) return [];

  const parsed = readAssignmentsSchema.safeParse(input);
  if (!parsed.success) return [];

  const teacher = await requireTeacher();
  if (teacher === null) return [];

  const classroom = await ownedClassroom(parsed.data.classroomId, teacher.id);
  if (classroom === null) return [];

  const assignments = await db.assignment.findMany({
    where: parsed.data.includeArchived === true ? { classroomId: classroom.id } : { classroomId: classroom.id, archivedAt: null },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      publishedAt: true,
      archivedAt: true,
      items: { orderBy: { position: 'asc' }, select: { id: true, position: true, questSlug: true } },
    },
  });

  const allSlugs = assignments.flatMap((assignment) => assignment.items.map((item) => item.questSlug));
  const texts = await teacherTextsFor(allSlugs);

  return assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    publishedAt: assignment.publishedAt?.toISOString() ?? null,
    archivedAt: assignment.archivedAt?.toISOString() ?? null,
    items: assignment.items.map((item) => ({
      id: item.id,
      position: item.position,
      questSlug: item.questSlug,
      ...itemView(item.questSlug, texts, locale),
    })),
  }));
}

// ================================================================== readAssignmentBoard

export interface AssignmentBoardStudent {
  readonly name: string;
  readonly cells: readonly ('met' | 'stuck' | 'untouched')[];
}

export interface AssignmentBoard {
  readonly items: readonly AssignmentItemView[];
  readonly students: readonly AssignmentBoardStudent[];
  readonly hardest: readonly { readonly position: number; readonly title: string; readonly stuck: number }[];
}

/** D-22: molécula nenhuma aqui — só os três estados por item e aluno. */
export async function readAssignmentBoard(input: { assignmentId: string }): Promise<AssignmentBoard | null> {
  const locale = await currentLocale();
  if (!hasDatabase()) return null;

  const parsed = readAssignmentBoardSchema.safeParse(input);
  if (!parsed.success) return null;

  const teacher = await requireTeacher();
  if (teacher === null) return null;

  const assignment = await ownedAssignment(parsed.data.assignmentId, teacher.id);
  if (assignment === null) return null;

  const full = await db.assignment.findUnique({
    where: { id: assignment.id },
    select: {
      classroomId: true,
      items: { orderBy: { position: 'asc' }, select: { id: true, position: true, questSlug: true } },
    },
  });
  if (full === null) return null;

  const texts = await teacherTextsFor(full.items.map((item) => item.questSlug));
  const items: AssignmentItemView[] = full.items.map((item) => ({
    id: item.id,
    position: item.position,
    questSlug: item.questSlug,
    ...itemView(item.questSlug, texts, locale),
  }));

  const slugs = items.map((item) => item.questSlug);

  const enrollments = await db.enrollment.findMany({
    where: { classroomId: full.classroomId },
    orderBy: { joinedAt: 'asc' },
    select: { profileId: true, profile: { select: { displayName: true } } },
  });
  const ids = enrollments.map((entry) => entry.profileId);

  const [attempts, opened] =
    ids.length === 0 || slugs.length === 0
      ? [[], []]
      : await Promise.all([
          db.attempt.findMany({
            where: { profileId: { in: ids }, questSlug: { in: slugs } },
            select: { profileId: true, questSlug: true, passed: true },
          }),
          db.questOpen.findMany({
            where: { profileId: { in: ids }, questSlug: { in: slugs } },
            select: { profileId: true, questSlug: true },
          }),
        ]);

  const byStudent = new Map<string, { passed: Set<string>; tried: Set<string> }>();
  for (const id of ids) byStudent.set(id, { passed: new Set(), tried: new Set() });

  for (const entry of opened) byStudent.get(entry.profileId)?.tried.add(entry.questSlug);
  for (const attempt of attempts) {
    const entry = byStudent.get(attempt.profileId);
    if (!entry) continue;
    entry.tried.add(attempt.questSlug);
    if (attempt.passed) entry.passed.add(attempt.questSlug);
  }

  const stuckCount = new Map<string, number>();

  const students = enrollments.map((enrollment) => {
    const entry = byStudent.get(enrollment.profileId);

    const cells = items.map((item): 'met' | 'stuck' | 'untouched' => {
      if (entry?.passed.has(item.questSlug) === true) return 'met';
      if (entry?.tried.has(item.questSlug) === true) {
        stuckCount.set(item.questSlug, (stuckCount.get(item.questSlug) ?? 0) + 1);
        return 'stuck';
      }
      return 'untouched';
    });

    return { name: enrollment.profile.displayName, cells };
  });

  const hardest = items
    .map((item) => ({ position: item.position, title: item.title, stuck: stuckCount.get(item.questSlug) ?? 0 }))
    .filter((entry) => entry.stuck > 0)
    .sort((first, second) => second.stuck - first.stuck);

  return { items, students, hardest };
}

// ================================================================== readStudentAssignments

/**
 * O objetivo do jeito que o aluno pode ver — R-4.
 *
 * Marcado como InChIKey, `condition` não viaja: o cliente recebe só `{id,
 * label}` e o veredito vem sempre do servidor. Para os outros tipos a
 * condição não conta nada que o rótulo já não conte, então ela viaja — é o
 * que permite o cliente conferir localmente, sem rodar o RDKit de novo, e
 * ainda assim `saveAttempt` reavalia tudo antes de gravar.
 */
export interface StudentGoalView {
  readonly id: string;
  readonly label: string;
  readonly condition?: Condition;
}

/**
 * O objetivo como o aluno o recebe.
 *
 * O rótulo é montado **aqui**, no servidor, porque o objetivo de InChIKey nunca
 * manda a condição para o cliente (R-4) — sem a condição, o navegador não teria
 * como escrever a frase. Quem sabe o idioma de quem pediu é o servidor, e é ele
 * que a escreve.
 */
function clientGoal(goal: Goal, locale: Locale): StudentGoalView {
  const label = goalLabel(locale, goal.condition);

  if (goal.condition.kind === 'inchiKey') return { id: goal.id, label };
  return { id: goal.id, label, condition: goal.condition };
}

/**
 * Quem escreveu uma missão de professor, para a autoria viajar junto (D-27).
 *
 * "Nunca sem": onde uma missão `professor:` sai para uma conta que não é a
 * do autor — `readCatalog`, `readStudentAssignments`, a leitura pelo aluno —,
 * este par acompanha. É a regra do D-15 aplicada a conteúdo: o que um humano
 * assinou não circula sem a assinatura.
 *
 * `institution` é `string | null`, nunca string
 * vazia. O D-27 exige instituição preenchida para **publicar no catálogo**
 * (`publishToCatalog`) — isso já é imposto lá, e é por isso que `readCatalog`
 * sempre traz uma instituição de verdade. **Fora do catálogo** — item de uma
 * lista da própria turma —, o aluno já conhece o professor por estar
 * matriculado nela, e a instituição pode faltar sem que isso quebre nada:
 * `null` diz isso, e a tela escreve só o nome. Uma string vazia (`''`)
 * confundiria "não preenchida" com "preenchida como nada", e obrigaria quem
 * lê a tratar os dois casos como se fossem diferentes.
 */
export interface TeacherAuthor {
  readonly name: string;
  readonly institution: string | null;
}

export interface StudentAssignmentItem {
  readonly position: number;
  readonly questSlug: string;
  readonly title: string;
  readonly byTeacher: TeacherAuthor | null;
  readonly goals: readonly StudentGoalView[];
}

/**
 * O que o painel do aluno recebe.
 *
 * `inClassroom` existe porque lista vazia tem duas causas com respostas
 * diferentes na tela (§6.6): quem não entrou em turma nenhuma precisa do
 * código do professor; quem entrou está esperando ele publicar.
 */
export interface StudentAssignments {
  readonly inClassroom: boolean;
  readonly assignments: readonly StudentAssignment[];
}

export interface StudentAssignment {
  readonly title: string;
  readonly classroomName: string;
  readonly items: readonly StudentAssignmentItem[];
}

interface TeacherQuestFacts {
  readonly title: string;
  readonly goals: readonly Goal[];
  readonly byTeacher: TeacherAuthor;
}

/** R-3: mesmo `select` explícito, sem `answerMolblock` nem `answerInchiKey`. */
async function teacherFactsFor(slugs: readonly string[]): Promise<Map<string, TeacherQuestFacts>> {
  const ids = slugs
    .filter((slug) => slug.startsWith(TEACHER_PREFIX))
    .map((slug) => slug.slice(TEACHER_PREFIX.length));

  if (ids.length === 0) return new Map();

  const rows = await db.teacherQuest.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      title: true,
      goals: true,
      teacher: { select: { displayName: true, institution: true } },
    },
  });

  return new Map<string, TeacherQuestFacts>(
    rows.map((row) => [
      `${TEACHER_PREFIX}${row.id}`,
      {
        title: row.title,
        goals: row.goals as unknown as readonly Goal[],
        byTeacher: { name: row.teacher.displayName, institution: row.teacher.institution },
      },
    ]),
  );
}

function studentItem(
  position: number,
  questSlug: string,
  teacherFacts: ReadonlyMap<string, TeacherQuestFacts>,
  locale: Locale,
): StudentAssignmentItem {
  if (questSlug.startsWith(TEACHER_PREFIX)) {
    const facts = teacherFacts.get(questSlug);
    return {
      position,
      questSlug,
      title: facts?.title ?? questSlug,
      byTeacher: facts?.byTeacher ?? null,
      goals: (facts?.goals ?? []).map((goal) => clientGoal(goal, locale)),
    };
  }

  const quest = findQuest(questSlug, locale);
  return {
    position,
    questSlug,
    title: quest?.title ?? questSlug,
    byTeacher: null,
    goals: (quest?.goals ?? []).map((goal) => clientGoal(goal, locale)),
  };
}

/** Não devolve `answerMolblock`, `answerInchiKey`, nem `condition` de objetivo InChIKey (R-4). */
const SEM_TURMA: StudentAssignments = { inClassroom: false, assignments: [] };

export async function readStudentAssignments(): Promise<StudentAssignments> {
  if (!hasDatabase()) return SEM_TURMA;

  const locale = await currentLocale();

  const profile = await currentProfile();
  if (profile === null) return SEM_TURMA;

  const enrollments = await db.enrollment.findMany({
    where: { profileId: profile.id, classroom: { archivedAt: null } },
    select: { classroom: { select: { id: true, name: true } } },
  });
  if (enrollments.length === 0) return SEM_TURMA;

  const classroomIds = enrollments.map((entry) => entry.classroom.id);
  const classroomNames = new Map(enrollments.map((entry) => [entry.classroom.id, entry.classroom.name] as const));

  const assignments = await db.assignment.findMany({
    where: { classroomId: { in: classroomIds }, publishedAt: { not: null }, archivedAt: null },
    orderBy: { createdAt: 'asc' },
    select: {
      classroomId: true,
      title: true,
      items: { orderBy: { position: 'asc' }, select: { position: true, questSlug: true } },
    },
  });

  const allSlugs = assignments.flatMap((assignment) => assignment.items.map((item) => item.questSlug));
  const teacherFacts = await teacherFactsFor(allSlugs);

  return {
    inClassroom: true,
    assignments: assignments.map((assignment) => ({
      title: assignment.title,
      classroomName: classroomNames.get(assignment.classroomId) ?? '',
      items: assignment.items.map((item) =>
        studentItem(item.position, item.questSlug, teacherFacts, locale),
      ),
    })),
  };
}

// ================================================================== readQuestDetail

/**
 * O objetivo, do jeito reduzido que basta para a lista de "objetivos que dá
 * para cobrar" mostrar ao aluno — nunca a `Condition` inteira.
 */
export interface StudentQuestGoalView {
  readonly id: string;
  readonly label: string;
}

export interface StudentQuestDetail {
  readonly slug: string;
  readonly title: string;
  readonly brief: string;
  readonly hints: readonly string[];
  readonly byTeacher: TeacherAuthor | null;
  readonly goals: readonly StudentQuestGoalView[];
}

export type ReadQuestDetailOutcome =
  | { readonly status: 'ok'; readonly quest: StudentQuestDetail }
  | { readonly status: 'rejected'; readonly reason: string };

const readQuestDetailSchema = z.object({ questSlug: z.string().min(1).max(80) });

/**
 * A leitura da missão pelo aluno — a terceira porta da cadeia do R-7 (achado
 * 2 do `reviewer`: até aqui não existia jeito de o aluno ler título,
 * enunciado e dicas de uma missão `professor:` antes de tentar).
 *
 * Catálogo do produto é livre (§9.3): não precisa de conta. Missão
 * `professor:` precisa, e a checagem de conta vem **antes** de tocar o banco
 * — a mesma defesa de `askTutor`: uma conta anônima não pode
 * distinguir "existe, mas você não alcança" de "não existe" pela resposta.
 *
 * R-3: nunca `answerMolblock`/`answerInchiKey`. R-4: nunca `condition`, só
 * `{id, label}` — esta tela não precisa avaliar nada, só descrever.
 */
export async function readQuestDetail(input: { questSlug: string }): Promise<ReadQuestDetailOutcome> {
  const t = await textFor();
  if (!hasDatabase()) return { status: 'rejected', reason: t.shared.unavailable };

  const parsed = readQuestDetailSchema.safeParse(input);
  if (!parsed.success) return { status: 'rejected', reason: t.errors.questNotFound };

  const { questSlug } = parsed.data;

  if (!questSlug.startsWith(TEACHER_PREFIX)) {
    const catalogQuest = findQuest(questSlug, t.locale);
    if (!catalogQuest) return { status: 'rejected', reason: t.errors.questNotFound };

    return {
      status: 'ok',
      quest: {
        slug: catalogQuest.slug,
        title: catalogQuest.title,
        brief: catalogQuest.brief,
        hints: catalogQuest.hints,
        byTeacher: null,
        goals: catalogQuest.goals.map((goal) => ({ id: goal.id, label: goal.label })),
      },
    };
  }

  const profile = await currentProfile();
  if (profile === null) {
    return { status: 'rejected', reason: t.errors.anonymousTeacherQuest };
  }

  if (!(await studentQuestAccess(profile.id, questSlug))) {
    return { status: 'rejected', reason: t.errors.questNotFound };
  }

  const id = questSlug.slice(TEACHER_PREFIX.length);
  const row = await db.teacherQuest.findUnique({
    where: { id },
    // R-3: nunca `answerMolblock`/`answerInchiKey` aqui.
    select: {
      title: true,
      brief: true,
      hints: true,
      goals: true,
      teacher: { select: { displayName: true, institution: true } },
    },
  });
  if (row === null) return { status: 'rejected', reason: t.errors.questNotFound };

  const goals = (row.goals as unknown as readonly Goal[]).map((goal) => ({
    id: goal.id,
    label: goalLabel(t.locale, goal.condition),
  }));

  return {
    status: 'ok',
    quest: {
      slug: questSlug,
      title: row.title,
      brief: row.brief,
      hints: row.hints as unknown as readonly string[],
      byTeacher: { name: row.teacher.displayName, institution: row.teacher.institution },
      goals,
    },
  };
}

// ================================================================== checkQuest

/**
 * Conferir se um desenho cumpre uma missão, **sem** gravar nada.
 *
 * Mesma reavaliação de `saveAttempt`: o molblock passa de novo pelo RDKit no
 * servidor e a mesma `evaluateQuest` decide, nunca o cliente. A diferença é
 * que esta ação não persiste — nenhum `Attempt`, nenhum `QuestOpen`, nenhuma
 * chamada a `rememberMolecule`. É "cheguei?" sem contar como tentativa.
 *
 * Mesma cadeia de acesso das outras portas (R-7, R-8): slug de catálogo é
 * livre; slug `professor:` exige conta com acesso, e a recusa é a mesma frase
 * para slug inexistente e para slug fora do alcance.
 */
export interface CheckQuestOutcome {
  readonly status: 'ok';
  readonly passed: boolean;
  /** Só `id` e veredito: a frase de cada objetivo o cliente já tem, e casa por `id`. */
  readonly goals: readonly { readonly id: string; readonly met: boolean }[];
}

export type CheckQuestResult = CheckQuestOutcome | { readonly status: 'rejected'; readonly reason: string };

export async function checkQuest(input: { questSlug: string; molblock: string }): Promise<CheckQuestResult> {
  const t = await textFor();
  if (!hasDatabase()) return { status: 'rejected', reason: t.shared.unavailable };

  const parsed = checkQuestSchema.safeParse(input);
  if (!parsed.success) return { status: 'rejected', reason: t.shared.malformed };

  // Sem conta, sem conferência — e sem trabalho nenhum antes de dizer isso:
  // nem resolver a missão, nem RDKit. A recusa é a mesma frase de missão que
  // não existe (R-8), para a ação não virar oráculo de existência.
  const profile = await currentProfile();
  if (profile === null) return { status: 'rejected', reason: t.errors.questNotFound };

  // Contado ANTES de qualquer trabalho — resolver a missão, checar acesso e
  // rodar o RDKit vêm todos depois. Molblock inválido conta igual, porque
  // também pagaria o custo do RDKit.
  const key = checkQuestKey(profile.id);
  if (tooManyQuestChecks(key)) {
    return { status: 'rejected', reason: t.m.tooManyQuestChecks };
  }
  registerQuestCheck(key);

  const quest = await resolveQuest(parsed.data.questSlug, t.locale);
  if (!quest) return { status: 'rejected', reason: t.errors.questNotFound };

  // R-7/R-8: missão de professor exige acesso; catálogo continua livre.
  if (quest.slug.startsWith(TEACHER_PREFIX) && !(await studentQuestAccess(profile.id, quest.slug))) {
    return { status: 'rejected', reason: t.errors.questNotFound };
  }

  const analysis = await analyzeOnServer(parsed.data.molblock);
  if (!analysis.ok) return { status: 'rejected', reason: chemistryErrorText(t.locale, analysis.error) };

  const result = evaluateQuest(quest, analysis.molecule);

  return {
    status: 'ok',
    passed: result.passed,
    // Veredito é o mesmo em qualquer idioma; a frase de cada objetivo o cliente
    // já tem, vinda da lista ou do catálogo, e casa por `id`.
    goals: result.goals,
  };
}

// ================================================================== publishToCatalog

/**
 * Publicar uma missão própria no catálogo compartilhado (D-27).
 *
 * Opt-in por missão, nunca por padrão: `catalogedAt` nasce nulo em
 * `createTeacherQuest`, e só um professor mexendo nesta ação específica
 * muda isso. Exige `Profile.institution` preenchida — autoria sem
 * instituição não entra no catálogo — e a missão não pode estar arquivada.
 */
export async function publishToCatalog(input: { teacherQuestId: string }): Promise<OkOutcome> {
  const t = await textFor();
  if (!hasDatabase()) return { status: 'rejected', reason: t.shared.unavailable };

  const parsed = teacherQuestIdSchema.safeParse(input);
  if (!parsed.success) return { status: 'rejected', reason: t.shared.malformed };

  const teacher = await requireTeacher();
  if (teacher === null) return { status: 'rejected', reason: t.m.onlyTeacherPublishesToCatalog };

  const quest = await ownedTeacherQuest(parsed.data.teacherQuestId, teacher.id);
  if (quest === null) return { status: 'rejected', reason: t.m.notYourQuest };

  const full = await db.teacherQuest.findUnique({
    where: { id: quest.id },
    select: { archivedAt: true, teacher: { select: { institution: true } } },
  });
  if (full === null) return { status: 'rejected', reason: t.m.notYourQuest };

  if (full.archivedAt !== null) {
    return {
      status: 'rejected',
      reason: t.m.archivedQuestCannotPublish,
    };
  }
  if (full.teacher.institution === null || full.teacher.institution.trim() === '') {
    return {
      status: 'rejected',
      reason: t.m.institutionRequiredToPublish,
    };
  }

  await db.teacherQuest.update({ where: { id: quest.id }, data: { catalogedAt: new Date() } });
  return { status: 'ok' };
}

// ================================================================== withdrawFromCatalog

/**
 * Retirar uma missão do catálogo. Desfaz `publishToCatalog`, missão a
 * missão, quando o professor quiser (D-27).
 *
 * **Retirar encerra o acesso pelo catálogo.** Quem só alcançava esta missão
 * porque ela estava catalogada deixa de alcançar — "já abriu" não é chave de
 * acesso (`studentQuestAccess`). Quem chega por uma lista publicada da
 * própria turma continua, porque esse caminho nunca dependeu do catálogo.
 */
export async function withdrawFromCatalog(input: { teacherQuestId: string }): Promise<OkOutcome> {
  const t = await textFor();
  if (!hasDatabase()) return { status: 'rejected', reason: t.shared.unavailable };

  const parsed = teacherQuestIdSchema.safeParse(input);
  if (!parsed.success) return { status: 'rejected', reason: t.shared.malformed };

  const teacher = await requireTeacher();
  if (teacher === null) return { status: 'rejected', reason: t.m.onlyTeacherWithdrawsFromCatalog };

  const quest = await ownedTeacherQuest(parsed.data.teacherQuestId, teacher.id);
  if (quest === null) return { status: 'rejected', reason: t.m.notYourQuest };

  await db.teacherQuest.update({ where: { id: quest.id }, data: { catalogedAt: null } });
  return { status: 'ok' };
}

// ================================================================== reportQuest

const reportQuestSchema = z.object({
  questSlug: z.string().min(1).max(80),
  reason: z.string().min(1).max(REPORT_REASON_MAX),
});

/**
 * Denunciar uma missão do catálogo (D-27) — quinta porta da cadeia do R-7.
 *
 * Qualquer conta que alcance a missão pode denunciar; a checagem é a mesma
 * de `studentQuestAccess`, e a recusa de slug fora do alcance é a mesma
 * frase uniforme de sempre (R-8) — denunciar não é um jeito novo de
 * descobrir se um slug existe. Não existe tela de moderação nesta fatia: o
 * que existe é o rastro (quem, quando, o motivo) e o teto contra abuso.
 */
export async function reportQuest(input: { questSlug: string; reason: string }): Promise<OkOutcome> {
  const t = await textFor();
  if (!hasDatabase()) return { status: 'rejected', reason: t.shared.unavailable };

  const parsed = reportQuestSchema.safeParse(input);
  if (!parsed.success) return { status: 'rejected', reason: t.shared.malformed };

  const profile = await currentProfile();
  if (profile === null) return { status: 'rejected', reason: t.m.signInToReport };

  const { questSlug } = parsed.data;

  if (questSlug.startsWith(TEACHER_PREFIX)) {
    if (!(await studentQuestAccess(profile.id, questSlug))) {
      return { status: 'rejected', reason: t.errors.questNotFound };
    }
  } else if (!findQuest(questSlug, t.locale)) {
    return { status: 'rejected', reason: t.errors.questNotFound };
  }

  const reason = checkPlainText(parsed.data.reason, REPORT_REASON_MAX);
  if (!reason.ok) {
    return {
      status: 'rejected',
      reason: textProblemMessage(
        reason,
        t.m.reportReasonEmpty,
        t.m.reportReasonTooLong(REPORT_REASON_MAX),
        t.m.controlCharacter,
      ),
    };
  }

  return db.$transaction(async (tx) => {
    // Teto de 10 denúncias por conta por dia, conferido dentro da transação (R-12).
    const since = new Date(Date.now() - ONE_DAY_MS);
    const countToday = await tx.questReport.count({ where: { reporterId: profile.id, createdAt: { gte: since } } });
    if (countToday >= MAX_REPORTS_PER_DAY) {
      return {
        status: 'rejected',
        reason: t.m.reportLimitPerDay(MAX_REPORTS_PER_DAY),
      } as const;
    }

    await tx.questReport.create({ data: { questSlug, reporterId: profile.id, reason: reason.value } });
    return { status: 'ok' } as const;
  });
}

// ================================================================== readCatalog

/** Uma entrada do catálogo buscável (D-26, D-27) — produto ou professor. */
export interface CatalogEntry {
  readonly slug: string;
  readonly title: string;
  readonly track?: Track;
  readonly byTeacher: TeacherAuthor | null;
  readonly labels: readonly string[];
}

const readCatalogSchema = z.object({ query: z.string().max(200).optional() });

/** Marcas diacríticas combinantes (`U+0300–U+036F`) — o que sobra de um acento depois do NFD separar a letra base. */
const COMBINING_MARKS = /[\u0300-\u036f]/g;

/** Sem acento e sem caixa — "ester" acha "éster" tanto quanto "Éster". */
function normalizeSearch(text: string): string {
  return text.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase();
}

/**
 * O catálogo buscável — as missões do produto e as de professor publicadas
 * (D-26, D-27). É de quem tem conta: sem uma, a lista vem vazia, como as
 * outras leituras desta ação fazem quando não há sessão.
 *
 * R-3/R-4: nunca `answerMolblock`, `answerInchiKey` nem `condition` — só
 * `labels`, os rótulos gerados, que é como a busca acha "algo com éster" sem
 * que ninguém tenha digitado a palavra num campo de etiqueta.
 */
export async function readCatalog(input: { query?: string } = {}): Promise<readonly CatalogEntry[]> {
  if (!hasDatabase()) return [];

  const locale = await currentLocale();

  const parsed = readCatalogSchema.safeParse(input);
  if (!parsed.success) return [];

  const profile = await currentProfile();
  if (profile === null) return [];

  const productEntries: CatalogEntry[] = CATALOG.map((spec) => {
    const quest = localize(spec, locale);

    return {
      slug: quest.slug,
      title: quest.title,
      track: quest.track,
      byTeacher: null,
      labels: quest.goals.map((goal) => goal.label),
    };
  });

  const teacherRows = await db.teacherQuest.findMany({
    where: { catalogedAt: { not: null }, archivedAt: null },
    select: {
      id: true,
      title: true,
      goals: true,
      teacher: { select: { displayName: true, institution: true } },
    },
  });

  // Publicar já exige instituição preenchida (D-27); o filtro aqui é defesa a
  // mais, para uma instituição apagada depois de publicar não vazar autoria
  // incompleta em vez de simplesmente sumir da lista.
  const teacherEntries: CatalogEntry[] = teacherRows
    .filter((row) => row.teacher.institution !== null && row.teacher.institution.trim() !== '')
    .map((row) => ({
      slug: `${TEACHER_PREFIX}${row.id}`,
      title: row.title,
      byTeacher: { name: row.teacher.displayName, institution: row.teacher.institution },
      labels: (row.goals as unknown as readonly Goal[]).map((goal) =>
        goalLabel(locale, goal.condition),
      ),
    }));

  const all = [...productEntries, ...teacherEntries];

  const needle = parsed.data.query ? normalizeSearch(parsed.data.query) : '';
  if (needle === '') return all;

  return all.filter((entry) => {
    const haystack = [entry.title, ...entry.labels].map(normalizeSearch);
    return haystack.some((text) => text.includes(needle));
  });
}