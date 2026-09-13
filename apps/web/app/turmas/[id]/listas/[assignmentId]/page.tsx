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
  readonly searchParams: Promise<{ readonly feito?: string; readonly posicao?: string }>;
}

/**
 * O único código que este `feito` aceita hoje.
 *
 * Fechado de propósito: a tela nunca escreve o valor do query string direto,
 * só o traduz por `messages.ts` — um link forjado com outro `feito`, ou sem
 * `posicao` numérica, não vira faixa nenhuma. Quando outra ação da lista
 * precisar de uma faixa parecida, o código novo entra aqui, não como texto
 * livre na URL.
 */
const KNOWN_DONE_CODES = new Set(['missao-criada']);

function parseEnteredAtPosition(feito: string | undefined, posicao: string | undefined): number | undefined {
  if (feito === undefined || !KNOWN_DONE_CODES.has(feito) || posicao === undefined) return undefined;

  const parsed = Number(posicao);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export const metadata: Metadata = {
  title: 'Lista · Rotamer',
  description: 'Monte a sequência de missões da aula.',
};

/**
 * A lista, do lado do professor (§6.2 de `docs/ROTEIROS.md`).
 *
 * Não existe leitura por `id` isolado (§5.2 não lista uma), então a busca aqui
 * é "todas as listas da turma, filtre a que interessa": mais uma consulta que
 * o ideal, mas nenhuma além das que já existem.
 *
 * `includeArchived` é o que faz esta página sobreviver ao arquivamento. Sem
 * ele, arquivar e recarregar dava 404 numa lista que a tela acabara de dizer
 * que "some das duas telas até você desarquivar" — e o botão de desarquivar
 * só existia enquanto a aba ficasse aberta.
 */
export default async function AssignmentPage({ params, searchParams }: PageProps): Promise<ReactElement> {
  if (!hasDatabase()) redirect('/');

  const profile = await currentProfile();
  if (profile === null) redirect('/entrar');

  const { id: classroomId, assignmentId } = await params;
  const { feito, posicao } = await searchParams;
  const enteredAtPosition = parseEnteredAtPosition(feito, posicao);

  const [assignments, { teaching }] = await Promise.all([
    readAssignments({ classroomId, includeArchived: true }),
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
      archived={assignment.archivedAt !== null}
      enteredAtPosition={enteredAtPosition}
    />
  );
}
