'use client';

import { Button } from '@rotamer/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactElement } from 'react';
import { createAssignment, type AssignmentSummary } from '../../actions/assignment';
import { messages } from '../messages';
import styles from './AssignmentsSection.module.css';

export interface AssignmentsSectionProps {
  readonly classroomId: string;
  readonly assignments: readonly AssignmentSummary[];
}

const WHEN = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });

/**
 * "Listas da turma" — a porta de entrada do professor (§6.1).
 *
 * Fica entre o título da turma e o quadro geral: é aqui que o professor
 * monta a sequência de missões de uma aula, do catálogo, desenhando a
 * resposta, ou misturando os dois (D-25).
 */
export function AssignmentsSection({ classroomId, assignments }: AssignmentsSectionProps): ReactElement {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get('title');
    if (typeof name !== 'string') return;

    setCreating(true);
    setError(null);

    void createAssignment({ classroomId, title: name }).then((outcome) => {
      setCreating(false);
      if (outcome.status === 'rejected') {
        setError(outcome.reason);
        return;
      }
      router.push(`/turmas/${classroomId}/listas/${outcome.id}`);
    });
  };

  return (
    <section className={styles.panel} data-testid="listas-da-turma">
      <div className={styles.header}>
        <h2 className={styles.title}>{messages.classroomSection.heading}</h2>
        <form className={styles.newForm} onSubmit={create}>
          <input
            className={styles.newInput}
            name="title"
            placeholder={messages.classroomSection.namePlaceholder}
            aria-label="Nome da nova lista"
            required
            minLength={2}
            data-testid="nome-nova-lista"
          />
          <Button type="submit" size="small" disabled={creating} data-testid="criar-lista">
            {messages.classroomSection.newButton}
          </Button>
        </form>
      </div>

      {assignments.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{messages.classroomSection.emptyTitle}</p>
          <p className={styles.emptyBody}>{messages.classroomSection.emptyBody}</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {assignments.map((assignment) => (
            <li key={assignment.id} className={styles.row} data-testid={`lista-${assignment.id}`}>
              <Link className={styles.name} href={`/turmas/${classroomId}/listas/${assignment.id}`}>
                {assignment.title}
              </Link>
              <span
                className={[
                  styles.chip,
                  assignment.publishedAt === null ? styles.chipDraft : styles.chipPublished,
                ].join(' ')}
                data-testid={`estado-lista-${assignment.id}`}
              >
                {assignment.publishedAt === null
                  ? messages.classroomSection.draftChip
                  : messages.classroomSection.publishedChip}
              </span>
              <span className={styles.count}>{messages.classroomSection.itemCount(assignment.items.length)}</span>
              <span className={styles.date}>
                {assignment.publishedAt === null ? '' : WHEN.format(new Date(assignment.publishedAt))}
              </span>
            </li>
          ))}
        </ul>
      )}

      {error !== null && (
        <p className={styles.error} data-testid="erro-nova-lista">
          {error}
        </p>
      )}

      <p className={styles.footer}>{messages.classroomSection.footer}</p>
    </section>
  );
}
