import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import type { ReactElement } from 'react';
import { currentProfile } from '../../../../../lib/auth';
import { hasDatabase } from '../../../../../lib/db';
import { readAssignments } from '../../../../actions/assignment';
import { readClassrooms } from '../../../../actions/classroom';
import { Assignment } from './Assignment';

interface PageProps {
  readonly params: Promise<{ readonly id: string; readonly assignmentId: string }>;
  readonly searchParams: Promise<{ readonly entered?: string }>;
}

export const metadata: Metadata = {
  title: 'Lista · Rotamer',
  description: 'Monte a sequência de missões da aula.',
};

/**
 * A lista, do lado do professor (§6.2 de `docs/ROTEIROS.md`).
 *
 * `readAssignments` só devolve lista com `archivedAt: null` — não existe
 * leitura por `id` isolado (§5.2 não lista uma). Por isso a busca aqui é
 * "todas as listas da turma, filtre a que interessa": mais uma consulta que
 * o ideal, mas nenhuma além das que já existem.
 */
export default async function AssignmentPage({ params, searchParams }: PageProps): Promise<ReactElement> {
  if (!hasDatabase()) redirect('/');

  const profile = await currentProfile();
  if (profile === null) redirect('/entrar');

  const { id: classroomId, assignmentId } = await params;
  const { entered } = await searchParams;

  const [assignments, { teaching }] = await Promise.all([
    readAssignments({ classroomId }),
    readClassrooms(),
  ]);

  const assignment = assignments.find((entry) => entry.id === assignmentId);
  if (assignment === undefined) notFound();

  const classroom = teaching.find((entry) => entry.id === classroomId);
  if (classroom === undefined) notFound();

  return (
    <Assignment
      assignmentId={assignment.id}
      classroomId={classroomId}
      classroomName={classroom.name}
      studentCount={classroom.students}
      initialTitle={assignment.title}
      initialItems={assignment.items}
      initialPublishedAt={assignment.publishedAt}
      archived={false}
      enteredNotice={entered}
    />
  );
}
