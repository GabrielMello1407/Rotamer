'use client';

import { Label } from '@rotamer/ui';
import type { ReactElement } from 'react';
import type { StudentAssignment } from '../actions/assignment';
import { messages } from '../turmas/messages';
import styles from './StudentAssignmentsSection.module.css';

export interface StudentAssignmentsSectionProps {
  readonly slug: string;
  readonly onSlug: (slug: string) => void;
  /** Slugs já cumpridos — o mesmo `done` que a estante de missões já lê. */
  readonly done: ReadonlySet<string>;
  readonly assignments: readonly StudentAssignment[];
}

/**
 * "Da sua turma" (§6.4) — acima do catálogo, porque é o que a aula está
 * fazendo agora. Sem cadeado: qualquer item abre em qualquer ordem.
 */
export function StudentAssignmentsSection({
  slug,
  onSlug,
  done,
  assignments,
}: StudentAssignmentsSectionProps): ReactElement | null {
  if (assignments.length === 0) return null;

  return (
    <div className={styles.wrap} data-testid="da-sua-turma">
      {assignments.map((assignment) => {
        const met = assignment.items.filter((item) => done.has(item.questSlug)).length;
        const total = assignment.items.length;
        const closed = met === total;

        return (
          <section key={`${assignment.title}-${assignment.classroomName}`} className={styles.panel}>
            <div className={styles.header}>
              <Label>{messages.studentAssignments.heading}</Label>
              <span className={styles.progress} data-testid="progresso-da-turma">
                {messages.studentAssignments.progress(met, total)}
              </span>
            </div>

            <p className={styles.title}>
              {assignment.title} · {assignment.classroomName}
            </p>

            <ul className={styles.list} role="radiogroup" aria-label={assignment.title}>
              {assignment.items.map((item) => {
                const isDone = done.has(item.questSlug);
                const current = item.questSlug === slug;

                return (
                  <li key={item.questSlug}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={current}
                      className={[styles.row, current ? styles.rowCurrent : null].filter(Boolean).join(' ')}
                      onClick={() => {
                        onSlug(item.questSlug);
                      }}
                      data-testid={`item-turma-${item.questSlug}`}
                    >
                      <span
                        className={[styles.mark, isDone ? styles.markMet : null].filter(Boolean).join(' ')}
                        aria-hidden="true"
                      >
                        {isDone ? '✓' : ''}
                      </span>
                      <span className={styles.position}>{item.position}</span>
                      <span className={styles.itemTitle}>
                        {item.title}
                        {item.byTeacher !== null && (
                          <span className={styles.byTeacher}>{messages.studentAssignments.byTeacherLabel}</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {closed && (
              <p className={styles.closed} data-testid="lista-fechada">
                {messages.studentAssignments.listClosed(assignment.title)}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
