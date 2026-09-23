'use client';

import { Button, Label } from '@rotamer/ui';
import { useFormatters, useMessages } from '@rotamer/i18n/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent, type ReactElement } from 'react';
import { createClassroom, joinClassroom, type ClassroomSummary } from '../actions/classroom';
import { messages } from './messages';
import styles from './page.module.css';

export interface ClassroomsProps {
  readonly teaching: readonly ClassroomSummary[];
  readonly attending: readonly ClassroomSummary[];
  readonly teacher: boolean;
}

function fieldText(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === 'string' ? value : '';
}

/**
 * As turmas de quem entrou.
 *
 * Professor abre turma e recebe um código para escrever no quadro; aluno digita
 * o código e entra. Não há convite por e-mail — é a mesma razão da recuperação
 * de senha (D-19).
 */
export function Classrooms({ teaching, attending, teacher }: ClassroomsProps): ReactElement {
  const router = useRouter();
  const m = useMessages(messages);
  const { date } = useFormatters();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const abrir = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = fieldText(form, 'name');

    startTransition(async () => {
      const outcome = await createClassroom({ name });

      if (outcome.status === 'created') {
        setError(null);
        setNote(m.classrooms.created(outcome.classroom.name, outcome.classroom.code));
        router.refresh();
        return;
      }

      setNote(null);
      setError(outcome.reason);
    });
  };

  const entrar = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = fieldText(form, 'code');

    startTransition(async () => {
      const outcome = await joinClassroom({ code });

      if (outcome.status === 'rejected') {
        setNote(null);
        setError(outcome.reason);
        return;
      }

      setError(null);
      setNote(outcome.status === 'joined' ? m.classrooms.joined(outcome.name) : m.classrooms.alreadyJoined(outcome.name));
      router.refresh();
    });
  };

  return (
    <div className={styles.panels}>
      {teacher && (
        <section className={styles.panel} data-testid="minhas-turmas">
          <h2 className={styles.title}>{m.classrooms.teachingHeading}</h2>

          {teaching.length === 0 ? (
            <p className={styles.quiet}>{m.classrooms.teachingEmpty}</p>
          ) : (
            <ul className={styles.list}>
              {teaching.map((classroom) => (
                <li key={classroom.id} className={styles.row} data-testid={`turma-${classroom.code}`}>
                  <Link className={styles.name} href={`/turmas/${classroom.id}`}>
                    {classroom.name}
                  </Link>
                  <span className={styles.code}>{classroom.code}</span>
                  <span className={styles.count}>{m.classrooms.studentCount(classroom.students)}</span>
                  <span className={styles.date}>{date(new Date(classroom.createdAt))}</span>
                </li>
              ))}
            </ul>
          )}

          <form className={styles.form} onSubmit={abrir}>
            <label className={styles.field}>
              <Label>{m.classrooms.nameLabel}</Label>
              <input
                className={styles.input}
                name="name"
                placeholder={m.classrooms.namePlaceholder}
                required
                data-testid="nome-da-turma"
              />
            </label>
            <Button type="submit" disabled={pending}>
              {pending ? m.classrooms.opening : m.classrooms.openButton}
            </Button>
          </form>

          <p className={styles.note}>{m.classrooms.codeNote}</p>

          <p className={styles.note}>
            <Link className={styles.link} href="/codigos" data-testid="ir-para-codigos">
              {m.classrooms.codesLink}
            </Link>{' '}
            — {m.classrooms.codesHint}
          </p>
        </section>
      )}

      {!teacher && (
        <section className={styles.panel} data-testid="como-virar-professor">
          <h2 className={styles.title}>{m.classrooms.notTeacherTitle}</h2>
          <p className={styles.quiet}>{m.classrooms.notTeacherBody}</p>
          <p className={styles.note}>{m.classrooms.notTeacherHow}</p>
        </section>
      )}

      <section className={styles.panel} data-testid="turmas-que-frequento">
        <h2 className={styles.title}>{m.classrooms.attendingHeading}</h2>

        {attending.length === 0 ? (
          <p className={styles.quiet}>{m.classrooms.attendingEmpty}</p>
        ) : (
          <ul className={styles.list}>
            {attending.map((classroom) => (
              <li key={classroom.id} className={styles.row}>
                <span className={styles.name}>{classroom.name}</span>
                <span className={styles.count}>{m.classrooms.studentCount(classroom.students)}</span>
              </li>
            ))}
          </ul>
        )}

        <form className={styles.form} onSubmit={entrar}>
          <label className={styles.field}>
            <Label>{m.classrooms.codeLabel}</Label>
            <input
              className={[styles.input, styles.codeInput].join(' ')}
              name="code"
              placeholder={m.classrooms.codePlaceholder}
              autoComplete="off"
              spellCheck={false}
              required
              data-testid="codigo-da-turma"
            />
          </label>
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? m.classrooms.joining : m.classrooms.joinButton}
          </Button>
        </form>

        <p className={styles.note}>{m.classrooms.attendingNote}</p>
      </section>

      {note !== null && (
        <p className={styles.ok} data-testid="aviso-turma">
          {note}
        </p>
      )}

      {error !== null && (
        <p className={styles.error} data-testid="erro-turma">
          {error}
        </p>
      )}
    </div>
  );
}
