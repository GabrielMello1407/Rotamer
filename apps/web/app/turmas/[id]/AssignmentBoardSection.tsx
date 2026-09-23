import type { ReactElement } from 'react';
import type { AssignmentBoard } from '../../actions/assignment';
import { serverMessages } from '../../../lib/locale';
import { messages } from '../messages';
import styles from './AssignmentBoardSection.module.css';

export interface AssignmentBoardSectionProps {
  readonly assignmentTitle: string;
  readonly board: AssignmentBoard;
}

const MARKS: Readonly<Record<'met' | 'stuck' | 'untouched', string>> = {
  met: '✓',
  stuck: '•',
  untouched: '–',
};

/**
 * O quadro do professor, por lista (§6.5).
 *
 * Progresso, nunca molécula (D-22): três estados por célula, cada um com
 * forma além da cor — cor sozinha não passa em deuteranopia nem em projetor
 * de sala.
 *
 * Componente de servidor assíncrono, não de cliente: nada aqui reage a
 * clique, e `serverMessages` evita arrastar o `Provider` de idioma para uma
 * tabela que só lê e desenha.
 */
export async function AssignmentBoardSection({
  assignmentTitle,
  board,
}: AssignmentBoardSectionProps): Promise<ReactElement> {
  const m = await serverMessages(messages);

  const LABEL_FOR: Readonly<Record<'met' | 'stuck' | 'untouched', (name: string, position: number) => string>> = {
    met: m.board.metLabel,
    stuck: m.board.stuckLabel,
    untouched: m.board.untouchedLabel,
  };

  return (
    <section className={styles.panel} data-testid="quadro-da-lista">
      <h2 className={styles.title}>{assignmentTitle}</h2>

      {board.hardest.length > 0 && (
        <div className={styles.stuckBlock}>
          <p className={styles.stuckHeading}>{m.board.stuckHeading}</p>
          <ul className={styles.stuckList}>
            {board.hardest.map((entry) => (
              <li key={entry.position} className={styles.stuckRow}>
                <span className={styles.stuckTitle}>
                  {entry.position}. {entry.title}
                </span>
                <span className={styles.stuckCount}>{m.board.stuckCount(entry.stuck)}</span>
              </li>
            ))}
          </ul>
          <p className={styles.note}>{m.board.stuckNote}</p>
        </div>
      )}

      {board.students.length === 0 ? (
        // O mesmo texto de turma sem aluno da porta de entrada
        // (`/turmas/[id]`), não uma segunda frase para a mesma situação.
        <p className={styles.empty}>{m.empty.noStudents}</p>
      ) : board.students.every((student) => student.cells.every((cell) => cell === 'untouched')) ? (
        // A matriz existiria, toda em "não abriu" — dizer isso em uma linha é
        // mais honesto do que uma grade inteira de traços (§6.6).
        <p className={styles.empty} data-testid="ninguem-abriu">
          {m.board.emptyOpened}
        </p>
      ) : (
        <>
          <p className={styles.legend}>{m.board.legend}</p>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={[styles.head, styles.sticky].join(' ')}>{m.board.tableWho}</th>
                  {board.items.map((item) => (
                    <th key={item.questSlug} className={styles.head} title={item.title}>
                      {item.position}
                    </th>
                  ))}
                  <th className={styles.head}>{m.board.metCountHeading}</th>
                </tr>
              </thead>
              <tbody>
                {board.students.map((student) => {
                  const met = student.cells.filter((cell) => cell === 'met').length;

                  return (
                    <tr key={student.name} className={styles.line}>
                      <td className={[styles.cell, styles.sticky].join(' ')}>{student.name}</td>
                      {student.cells.map((cell, index) => {
                        const item = board.items[index];
                        return (
                          <td key={item?.questSlug ?? index} className={styles.cell}>
                            <span
                              className={[styles.mark, styles[cell] ?? ''].join(' ')}
                              aria-label={
                                item !== undefined ? LABEL_FOR[cell](student.name, item.position) : undefined
                              }
                            >
                              {MARKS[cell]}
                            </span>
                          </td>
                        );
                      })}
                      <td className={[styles.cell, styles.number].join(' ')}>
                        {met} / {board.items.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className={styles.note}>{m.board.footer}</p>
    </section>
  );
}
