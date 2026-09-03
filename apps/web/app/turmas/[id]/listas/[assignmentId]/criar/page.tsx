import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import type { ReactElement } from 'react';
import { currentProfile } from '../../../../../../lib/auth';
import { hasDatabase } from '../../../../../../lib/db';
import { readAssignments } from '../../../../../actions/assignment';
import { EditorWorkspace } from '../../../../../components/EditorWorkspace';

interface PageProps {
  readonly params: Promise<{ readonly id: string; readonly assignmentId: string }>;
}

export const metadata: Metadata = {
  title: 'Criar missão · Rotamer',
  description: 'Desenhe a resposta — os objetivos saem dela.',
};

/**
 * "Criar missão desenhando" (§6.3) — a mesma bancada do aluno, só que quem
 * está na tela é o professor e o que ele desenha é a resposta.
 */
export default async function CreateTeacherQuestPage({ params }: PageProps): Promise<ReactElement> {
  if (!hasDatabase()) redirect('/');

  const profile = await currentProfile();
  if (profile === null) redirect('/entrar');

  const { id: classroomId, assignmentId } = await params;

  const assignments = await readAssignments({ classroomId });
  const assignment = assignments.find((entry) => entry.id === assignmentId);
  if (assignment === undefined) notFound();

  return (
    <EditorWorkspace
      accountName={profile.displayName}
      showAccount={false}
      authoring={{ assignmentId, assignmentTitle: assignment.title, classroomId }}
    />
  );
}
