import 'server-only';
import { currentProfile } from './auth';
import { db } from './db';

/**
 * Papel e dono, para as escritas de turma, lista e missão de professor.
 *
 * **Papel é pré-requisito, dono é a autorização (R-5).** `requireTeacher`
 * sozinho nunca autoriza uma escrita: ele só diz que a conta dá aula, do jeito
 * que o script `promote-teacher.mjs` ou um administrador da escola marcou no
 * banco — nunca autodeclarado (D-19, D-29). Cada ação de escrita começa por um
 * `owned*`, que confere que a linha específica (a turma, a lista, a missão)
 * pertence a quem pediu. Um professor tem papel; só o dono de uma turma pode
 * escrever nela.
 */

/**
 * Os papéis que dão aula.
 *
 * Administrador **é** professor, mais a capacidade de promover os professores da
 * própria escola (D-29). Escrever o papel como duas comparações soltas pelo
 * código foi o que quase custou a turma do administrador: cada `=== 'professor'`
 * esquecido o teria deixado sem turma, sem lista e sem código de senha.
 */
export const TEACHING_ROLES = ['professor', 'administrador'] as const;

export type TeachingRole = (typeof TEACHING_ROLES)[number];

/** Se o papel guardado dá aula. É a única leitura desse valor que o produto faz. */
export function teaches(role: string | null | undefined): boolean {
  return TEACHING_ROLES.includes((role ?? '') as TeachingRole);
}

/** Se o papel guardado administra a escola — quem promove professor pela tela (D-29). */
export function administers(role: string | null | undefined): boolean {
  return role === 'administrador';
}

export interface Owner {
  readonly id: string;
}

/** `null` quando quem pediu não dá aula. Extraído de `actions/classroom.ts`. */
export async function requireTeacher(): Promise<Owner | null> {
  const profile = await currentProfile();
  if (profile === null) return null;

  const row = await db.profile.findUnique({
    where: { id: profile.id },
    select: { role: true },
  });

  return teaches(row?.role) ? { id: profile.id } : null;
}

export interface Administrator {
  readonly id: string;
  /** Nunca vazia: administrador sem escola não tem a quem promover (D-29). */
  readonly institution: string;
}

/**
 * `null` quando quem pediu não é administrador da escola dele.
 *
 * A escola precisa estar preenchida porque ela é o recorte de tudo que o
 * administrador alcança. Sem ela, "professores da minha escola" não tem
 * resposta, e a ação teria de escolher entre não achar ninguém e achar todo
 * mundo — a segunda seria um furo.
 */
export async function requireAdministrator(): Promise<Administrator | null> {
  const profile = await currentProfile();
  if (profile === null) return null;

  const row = await db.profile.findUnique({
    where: { id: profile.id },
    select: { role: true, institution: true },
  });

  if (row === null || !administers(row.role)) return null;

  const institution = row.institution?.trim() ?? '';
  return institution === '' ? null : { id: profile.id, institution };
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

/**
 * A lista, só se `profileId` for quem a criou — em qualquer estado, inclusive
 * arquivada. Existe só para `unarchiveAssignment`, do mesmo jeito que
 * `ownedTeacherQuest` já não filtra por `archivedAt` para `unarchiveTeacherQuest`
 * poder achar a missão que ela existe para desarquivar.
 */
export async function ownedAssignmentAnyState(id: string, profileId: string): Promise<Owner | null> {
  const row = await db.assignment.findFirst({
    where: { id, createdById: profileId },
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
