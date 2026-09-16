import { Logo } from '@rotamer/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { ReactElement } from 'react';
import { CATALOG } from '@rotamer/quests';
import { readAssignmentBoard, readAssignments } from '../../actions/assignment';
import { readClassroomBoard } from '../../actions/classroom';
import { currentProfile } from '../../../lib/auth';
import { hasDatabase } from '../../../lib/db';
import { messages } from '../messages';
import { AssignmentBoardSection } from './AssignmentBoardSection';
import { AssignmentsSection } from './AssignmentsSection';
import styles from './page.module.css';

interface PageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export const metadata: Metadata = {
  title: 'Turma · Rotamer',
  description: 'Onde a turma parou.',
};

const WHEN = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * O quadro da turma.
 *
 * A pergunta que ele responde não é "quem foi melhor": é **onde a turma parou**.
 * Por isso a primeira coisa da tela é a lista de missões em que mais gente
 * travou — é ali que a próxima aula começa.
 *
 * O professor vê progresso de missão. O que o aluno desenhou fora disso é
 * trabalho dele e não aparece aqui (D-22).
 */
export default async function ClassroomPage({ params }: PageProps): Promise<ReactElement> {
  if (!hasDatabase()) redirect('/');

  const profile = await currentProfile();
  if (profile === null) redirect('/entrar');

  const { id } = await params;
  const board = await readClassroomBoard(id);
  if (board === null) notFound();

  // O catálogo mora no código, não no banco (D-12): a tela lê direto dele.
  const titles = new Map(CATALOG.map((quest) => [quest.slug, quest.title]));
  const total = titles.size;

  /*
   * "Listas da turma" (§6.1) e o quadro por lista publicada (§6.5).
   *
   * `includeArchived` traz as arquivadas junto — sem isso não
   * havia tela nenhuma de onde chamar `unarchiveAssignment`. O quadro por
   * lista continua só sobre as ativas: uma lista arquivada, mesmo que tenha
   * sido publicada um dia, não é mais o que a turma está fazendo agora.
   */
  const allAssignments = await readAssignments({ classroomId: id, includeArchived: true });
  const assignments = allAssignments.filter((assignment) => assignment.archivedAt === null);
  const published = assignments.filter((assignment) => assignment.publishedAt !== null);
  const assignmentBoards = await Promise.all(
    published.map(async (assignment) => ({
      assignment,
      board: await readAssignmentBoard({ assignmentId: assignment.id }),
    })),
  );

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link className={styles.identity} href="/turmas">
          <Logo size={28} />
          <span className={styles.wordmark}>Rotamer</span>
        </Link>

        <span className={styles.headerActions}>
          {/* O professor chega aqui pela turma e daqui precisa alcançar os
              códigos de senha: a página não tinha link em lugar nenhum. */}
          <Link className={styles.headerLink} href="/codigos" data-testid="codigos-da-turma">
            {messages.classrooms.codesLink}
          </Link>
          <span className={styles.code} data-testid="codigo-visivel">
            {board.code}
          </span>
        </span>
      </header>

      <div>
        <h1 className={styles.heading}>{board.name}</h1>
        <p className={styles.intro} data-testid="resumo-turma">
          {board.students.length === 0
            ? messages.empty.noStudents
            : `${String(board.students.length)} ${board.students.length === 1 ? 'aluno' : 'alunos'}, de ${String(total)} missões no catálogo.`}
        </p>
      </div>

      <AssignmentsSection classroomId={id} assignments={allAssignments} />

      {assignmentBoards.map(({ assignment, board: assignmentBoard }) =>
        assignmentBoard === null ? null : (
          <AssignmentBoardSection key={assignment.id} assignmentTitle={assignment.title} board={assignmentBoard} />
        ),
      )}

      {board.hardest.length > 0 && (
        <section className={styles.panel} data-testid="onde-travou">
          <h2 className={styles.title}>Onde a turma travou</h2>
          <ul className={styles.stuck}>
            {board.hardest.map((entry) => (
              <li key={entry.slug} className={styles.stuckRow}>
                <span className={styles.questName}>{entry.title}</span>
                <span className={styles.stuckCount}>
                  {entry.stuck === 1 ? '1 aluno' : `${String(entry.stuck)} alunos`}
                </span>
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            Travar é ter tentado e não ter cumprido — quem nem abriu a missão não conta aqui. É
            desta lista que sai o assunto da próxima aula.
          </p>
        </section>
      )}

      {board.students.length > 0 && (
        <section className={styles.panel} data-testid="quadro-da-turma">
          <h2 className={styles.title}>Aluno a aluno</h2>

          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.head}>quem</th>
                <th className={styles.head}>cumpridas</th>
                <th className={styles.head}>travado em</th>
                <th className={styles.head}>última vez</th>
              </tr>
            </thead>
            <tbody>
              {board.students.map((student) => (
                <tr key={student.name} className={styles.line}>
                  <td className={styles.cell}>{student.name}</td>
                  <td className={[styles.cell, styles.number].join(' ')}>
                    {student.passed.length} / {total}
                  </td>
                  <td className={styles.cell}>
                    {student.stuck.length === 0 ? (
                      <span className={styles.quiet}>—</span>
                    ) : (
                      student.stuck.map((slug) => titles.get(slug) ?? slug).join(', ')
                    )}
                  </td>
                  <td className={[styles.cell, styles.number].join(' ')}>
                    {student.lastSeen === null ? (
                      <span className={styles.quiet}>nunca</span>
                    ) : (
                      WHEN.format(new Date(student.lastSeen))
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <p className={styles.note}>
        O que aparece aqui é progresso de missão, avaliado no servidor a cada tentativa. As
        moléculas que a pessoa desenha fora das missões são trabalho dela e não entram nesta tela.
      </p>
    </main>
  );
}
