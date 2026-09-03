import 'server-only';
import { currentProfile } from './auth';
import { db } from './db';

/**
 * Papel e dono, para as escritas de turma, lista e missão de professor.
 *
 * **Papel é pré-requisito, dono é a autorização (R-5).** `requireTeacher`
 * sozinho nunca autoriza uma escrita: ele só diz que a conta tem o papel
 * `professor`, do jeito que o script `promote-teacher.mjs` marcou no banco —
 * nunca autodeclarado (D-19). Cada ação de escrita começa por um `owned*`, que
 * confere que a linha específica (a turma, a lista, a missão) pertence a quem
 * pediu. Um professor tem papel; só o dono de uma turma pode escrever nela.
 */

export interface Owner {
  readonly id: string;
}

/** `null` quando quem pediu não é professor. Extraído de `actions/classroom.ts`. */
export async function requireTeacher(): Promise<Owner | null> {
  const profile = await currentProfile();
  if (profile === null) return null;

  const row = await db.profile.findUnique({
    where: { id: profile.id },
    select: { role: true },
  });

  return row?.role === 'professor' ? { id: profile.id } : null;
}

/** A turma, só se `profileId` for o professor dono dela e ela não estiver arquivada. */
export async function ownedClassroom(id: string, profileId: string): Promise<Owner | null> {
  const row = await db.classroom.findFirst({
    where: { id, teacherId: profileId, archivedAt: null },
    select: { id: true },
  });

  return row;
}

/** A lista, só se `profileId` for quem a criou e ela não estiver arquivada. */
export async function ownedAssignment(id: string, profileId: string): Promise<Owner | null> {
  const row = await db.assignment.findFirst({
    where: { id, createdById: profileId, archivedAt: null },
    select: { id: true },
  });

  return row;
}

/** A missão do professor, só se `profileId` for quem a escreveu. */
export async function ownedTeacherQuest(id: string, profileId: string): Promise<Owner | null> {
  const row = await db.teacherQuest.findFirst({
    where: { id, teacherId: profileId },
    select: { id: true },
  });

  return row;
}
