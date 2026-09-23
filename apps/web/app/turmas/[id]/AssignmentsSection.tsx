'use client';

import { Button } from '@rotamer/ui';
import { useFormatters, useMessages } from '@rotamer/i18n/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactElement } from 'react';
import { createAssignment, unarchiveAssignment, type AssignmentSummary } from '../../actions/assignment';
import { messages } from '../messages';
import styles from './AssignmentsSection.module.css';

export interface AssignmentsSectionProps {
  readonly classroomId: string;
  /**
   * Vem de `readAssignments({ classroomId, includeArchived: true })` (achado
   * 5): a arquivada precisa continuar visível **aqui**, senão não há como
   * chegar em `unarchiveAssignment` — a ação existia sem tela nenhuma que a
   * chamasse. Ativas e arquivadas se separam por `archivedAt`.
   */
  readonly assignments: readonly AssignmentSummary[];
}

/**
 * "Listas da turma" — a porta de entrada do professor (§6.1).
 *
 * Fica entre o título da turma e o quadro geral: é aqui que o professor
 * monta a sequência de missões de uma aula, do catálogo, desenhando a
 * resposta, ou misturando os dois (D-25).
 */
export function AssignmentsSection({ classroomId, assignments }: AssignmentsSectionProps): ReactElement {
  const router = useRouter();
  const m = useMessages(messages);
  const { date } = useFormatters();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [unarchiving, setUnarchiving] = useState<string | null>(null);

  const active = assignments.filter((assignment) => assignment.archivedAt === null);
  const archived = assignments.filter((assignment) => assignment.archivedAt !== null);

  const unarchive = (assignmentId: string): void => {
    setError(null);
    setUnarchiving(assignmentId);
    void unarchiveAssignment({ assignmentId }).then((outcome) => {
      setUnarchiving(null);
      if (outcome.status === 'rejected') {
        setError(outcome.reason);
        return;
      }
      router.refresh();
    });
  };

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
        <h2 className={styles.title}>{m.classroomSection.heading}</h2>
        <form className={styles.newForm} onSubmit={create}>
          <input
            className={styles.newInput}
            name="title"
            placeholder={m.classroomSection.namePlaceholder}
            aria-label={m.classroomSection.newNameAriaLabel}
            required
            minLength={2}
            data-testid="nome-nova-lista"
          />
          <Button type="submit" size="small" disabled={creating} data-testid="criar-lista">
            {m.classroomSection.newButton}
          </Button>
        </form>
      </div>

      {active.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{m.classroomSection.emptyTitle}</p>
          <p className={styles.emptyBody}>{m.classroomSection.emptyBody}</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {active.map((assignment) => (
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
                {assignment.publishedAt === null ? m.classroomSection.draftChip : m.classroomSection.publishedChip}
              </span>
              <span className={styles.count}>{m.classroomSection.itemCount(assignment.items.length)}</span>
              <span className={styles.date}>
                {assignment.publishedAt === null ? '' : date(new Date(assignment.publishedAt))}
              </span>
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <div className={styles.archived}>
          <button
            type="button"
            className={styles.archivedToggle}
            aria-expanded={archivedOpen}
            onClick={() => {
              setArchivedOpen((current) => !current);
            }}
            data-testid="listas-arquivadas-toggle"
          >
            {m.classroomSection.archivedHeading(archived.length)}
          </button>

          {archivedOpen && (
            <ul className={styles.list} data-testid="listas-arquivadas">
              {archived.map((assignment) => (
                <li key={assignment.id} className={styles.row} data-testid={`lista-arquivada-${assignment.id}`}>
                  <span className={styles.name}>{assignment.title}</span>
                  <Button
                    size="small"
                    variant="ghost"
                    disabled={unarchiving === assignment.id}
                    onClick={() => {
                      unarchive(assignment.id);
                    }}
                    data-testid={`desarquivar-${assignment.id}`}
                  >
                    {m.classroomSection.unarchive}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error !== null && (
        <p className={styles.error} data-testid="erro-nova-lista">
          {error}
        </p>
      )}

      <p className={styles.footer}>{m.classroomSection.footer}</p>
    </section>
  );
}
