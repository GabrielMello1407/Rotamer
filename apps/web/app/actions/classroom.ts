'use server';

import { z } from 'zod';
import { findQuest } from '@rotamer/quests';
import { currentProfile } from '../../lib/auth';
import { generateCode, normalizeCode } from '../../lib/code';
import { db, hasDatabase } from '../../lib/db';

/**
 * Turmas.
 *
 * O que faz a escola comprar não é o editor: é o professor conseguir ver onde a
 * turma dele travou. Uma turma é uma lista de alunos e um código que ele escreve
 * no quadro — sem convite por e-mail, pela mesma razão da recuperação de senha
 * (D-19): em muita escola o aluno não tem caixa de entrada, e a que tem não abre
 * na aula.
 *
 * **O professor vê progresso, não vê molécula.** Quais missões cada aluno
 * cumpriu, onde ele parou e quando foi a última vez que apareceu. O que o aluno
 * desenhou fora da missão é trabalho dele, e não vira tela de acompanhamento
 * (D-22).
 */

/** Seis caracteres: curto para ditar, e 31⁶ ≈ 887 milhões de combinações. */
const CODE_LENGTH = 6;

const createSchema = z.object({
  name: z.string().trim().min(2, 'Dê um nome à turma.').max(80, 'Nome de turma muito longo.'),
});

const joinSchema = z.object({
  code: z.string().trim().min(1, 'Digite o código da turma.').max(20),
});

export interface ClassroomSummary {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly students: number;
  readonly createdAt: string;
}

export type CreateOutcome =
  | { readonly status: 'created'; readonly classroom: ClassroomSummary }
  | { readonly status: 'rejected'; readonly reason: string };

export async function createClassroom(input: { name: string }): Promise<CreateOutcome> {
  if (!hasDatabase()) return { status: 'rejected', reason: 'Indisponível neste ambiente.' };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 'rejected', reason: parsed.error.issues[0]?.message ?? 'Pedido mal formado.' };
  }

  const teacher = await requireTeacher();
  if (teacher === null) {
    return {
      status: 'rejected',
      reason: 'Só conta de professor abre turma. Fale com quem administra o Rotamer da escola.',
    };
  }

  // Colisão de código é rara e barata de resolver: tenta de novo em vez de
  // devolver erro para alguém que não fez nada de errado.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateCode(CODE_LENGTH);

    try {
      const row = await db.classroom.create({
        data: { name: parsed.data.name, teacherId: teacher.id, code },
        select: { id: true, name: true, code: true, createdAt: true },
      });

      return {
        status: 'created',
        classroom: { ...row, createdAt: row.createdAt.toISOString(), students: 0 },
      };
    } catch {
      // Código repetido: sorteia outro.
    }
  }

  return { status: 'rejected', reason: 'Não consegui gerar um código agora. Tente de novo.' };
}

export type JoinOutcome =
  | { readonly status: 'joined'; readonly name: string }
  | { readonly status: 'already'; readonly name: string }
  | { readonly status: 'rejected'; readonly reason: string };

/** Entrar numa turma com o código que o professor escreveu no quadro. */
export async function joinClassroom(input: { code: string }): Promise<JoinOutcome> {
  if (!hasDatabase()) return { status: 'rejected', reason: 'Indisponível neste ambiente.' };

  const parsed = joinSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 'rejected', reason: parsed.error.issues[0]?.message ?? 'Pedido mal formado.' };
  }

  const profile = await currentProfile();
  if (profile === null) return { status: 'rejected', reason: 'Entre na sua conta primeiro.' };

  const classroom = await db.classroom.findUnique({
    where: { code: normalizeCode(parsed.data.code) },
    select: { id: true, name: true, teacherId: true, archivedAt: true },
  });

  if (classroom === null || classroom.archivedAt !== null) {
    return { status: 'rejected', reason: 'Esse código não abre nenhuma turma. Confira com o professor.' };
  }

  if (classroom.teacherId === profile.id) {
    return { status: 'rejected', reason: 'Esta turma é sua — você já a vê na lista.' };
  }

  const existing = await db.enrollment.findUnique({
    where: { classroomId_profileId: { classroomId: classroom.id, profileId: profile.id } },
  });

  if (existing) return { status: 'already', name: classroom.name };

  await db.enrollment.create({ data: { classroomId: classroom.id, profileId: profile.id } });
  return { status: 'joined', name: classroom.name };
}

/** As turmas de quem está entrando: as que ele dá, e as em que ele estuda. */
export async function readClassrooms(): Promise<{
  readonly teaching: readonly ClassroomSummary[];
  readonly attending: readonly ClassroomSummary[];
}> {
  if (!hasDatabase()) return { teaching: [], attending: [] };

  const profile = await currentProfile();
  if (profile === null) return { teaching: [], attending: [] };

  const teaching = await db.classroom.findMany({
    where: { teacherId: profile.id, archivedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      code: true,
      createdAt: true,
      _count: { select: { enrollments: true } },
    },
  });

  const attending = await db.enrollment.findMany({
    where: { profileId: profile.id },
    orderBy: { joinedAt: 'desc' },
    select: {
      classroom: {
        select: {
          id: true,
          name: true,
          code: true,
          createdAt: true,
          _count: { select: { enrollments: true } },
        },
      },
    },
  });

  return {
    teaching: teaching.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      students: row._count.enrollments,
      createdAt: row.createdAt.toISOString(),
    })),
    attending: attending.map(({ classroom }) => ({
      id: classroom.id,
      name: classroom.name,
      // O aluno não precisa do código depois de já ter entrado.
      code: '',
      students: classroom._count.enrollments,
      createdAt: classroom.createdAt.toISOString(),
    })),
  };
}

export interface StudentProgress {
  readonly name: string;
  /** Missões cumpridas, pelo slug. */
  readonly passed: readonly string[];
  /**
   * Missões que a pessoa tentou e não cumpriu.
   *
   * É a informação que faz o painel existir: não é quem acertou, é **onde a
   * turma parou**.
   */
  readonly stuck: readonly string[];
  /** Última tentativa, em ISO 8601 — ou `null` para quem entrou e não desenhou. */
  readonly lastSeen: string | null;
}

export interface ClassroomBoard {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly students: readonly StudentProgress[];
  /** Quantos alunos travaram em cada missão, do pior caso para o melhor. */
  readonly hardest: readonly { readonly slug: string; readonly title: string; readonly stuck: number }[];
}

/**
 * O quadro da turma.
 *
 * Só o professor daquela turma vê. Uma consulta por turma, não uma por aluno: a
 * lista de tentativas vem inteira e é agrupada aqui.
 */
export async function readClassroomBoard(id: string): Promise<ClassroomBoard | null> {
  if (!hasDatabase()) return null;

  const profile = await currentProfile();
  if (profile === null) return null;

  const classroom = await db.classroom.findFirst({
    where: { id, teacherId: profile.id },
    select: {
      id: true,
      name: true,
      code: true,
      enrollments: {
        orderBy: { joinedAt: 'asc' },
        select: { profileId: true, profile: { select: { displayName: true } } },
      },
    },
  });

  if (classroom === null) return null;

  const ids = classroom.enrollments.map((entry) => entry.profileId);

  // Duas leituras e nenhum laço por aluno: tentativas dizem quem cumpriu,
  // aberturas dizem quem chegou a tentar.
  const [attempts, opened] =
    ids.length === 0
      ? [[], []]
      : await Promise.all([
          db.attempt.findMany({
            where: { profileId: { in: ids } },
            orderBy: { createdAt: 'asc' },
            select: { profileId: true, questSlug: true, passed: true, createdAt: true },
          }),
          db.questOpen.findMany({
            where: { profileId: { in: ids } },
            select: { profileId: true, questSlug: true },
          }),
        ]);

  const byStudent = new Map<string, { passed: Set<string>; tried: Set<string>; last: Date | null }>();
  for (const id of ids) {
    byStudent.set(id, { passed: new Set(), tried: new Set(), last: null });
  }

  for (const entry of opened) {
    byStudent.get(entry.profileId)?.tried.add(entry.questSlug);
  }

  for (const attempt of attempts) {
    const entry = byStudent.get(attempt.profileId);
    if (!entry) continue;

    entry.tried.add(attempt.questSlug);
    if (attempt.passed) entry.passed.add(attempt.questSlug);
    entry.last = attempt.createdAt;
  }

  const stuckCount = new Map<string, number>();

  const students = classroom.enrollments.map((enrollment) => {
    const entry = byStudent.get(enrollment.profileId);
    const passed = [...(entry?.passed ?? [])];
    const stuck = [...(entry?.tried ?? [])].filter((slug) => !entry?.passed.has(slug));

    for (const slug of stuck) {
      stuckCount.set(slug, (stuckCount.get(slug) ?? 0) + 1);
    }

    return {
      name: enrollment.profile.displayName,
      passed,
      stuck,
      lastSeen: entry?.last?.toISOString() ?? null,
    };
  });

  const hardest = [...stuckCount.entries()]
    .map(([slug, stuck]) => ({
      slug,
      title: findQuest(slug)?.title ?? slug,
      stuck,
    }))
    .sort((first, second) => second.stuck - first.stuck);

  return { id: classroom.id, name: classroom.name, code: classroom.code, students, hardest };
}

/** `null` quando quem pediu não é professor. */
async function requireTeacher(): Promise<{ readonly id: string } | null> {
  const profile = await currentProfile();
  if (profile === null) return null;

  const row = await db.profile.findUnique({
    where: { id: profile.id },
    select: { role: true },
  });

  return row?.role === 'professor' ? { id: profile.id } : null;
}
