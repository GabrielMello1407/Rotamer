'use client';

import { Button, Label } from '@rotamer/ui';
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

const DATE = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

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
        setNote(`Turma "${outcome.classroom.name}" aberta. O código é ${outcome.classroom.code}.`);
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
      setNote(
        outcome.status === 'joined'
          ? `Você entrou em "${outcome.name}".`
          : `Você já estava em "${outcome.name}".`,
      );
      router.refresh();
    });
  };

  return (
    <div className={styles.panels}>
      {teacher && (
        <section className={styles.panel} data-testid="minhas-turmas">
          <h2 className={styles.title}>Turmas que você dá</h2>

          {teaching.length === 0 ? (
            <p className={styles.quiet}>Nenhuma turma aberta ainda.</p>
          ) : (
            <ul className={styles.list}>
              {teaching.map((classroom) => (
                <li key={classroom.id} className={styles.row} data-testid={`turma-${classroom.code}`}>
                  <Link className={styles.name} href={`/turmas/${classroom.id}`}>
                    {classroom.name}
                  </Link>
                  <span className={styles.code}>{classroom.code}</span>
                  <span className={styles.count}>
                    {classroom.students === 1 ? '1 aluno' : `${String(classroom.students)} alunos`}
                  </span>
                  <span className={styles.date}>{DATE.format(new Date(classroom.createdAt))}</span>
                </li>
              ))}
            </ul>
          )}

          <form className={styles.form} onSubmit={abrir}>
            <label className={styles.field}>
              <Label>nome da turma</Label>
              <input
                className={styles.input}
                name="name"
                placeholder="3º A — manhã"
                required
                data-testid="nome-da-turma"
              />
            </label>
            <Button type="submit" disabled={pending}>
              {pending ? 'Abrindo…' : 'Abrir turma'}
            </Button>
          </form>

          <p className={styles.note}>
            O código aparece na lista. Escreva no quadro: é com ele que o aluno entra, sem e-mail
            no caminho.
          </p>

          <p className={styles.note}>
            <Link className={styles.link} href="/codigos" data-testid="ir-para-codigos">
              {messages.classrooms.codesLink}
            </Link>{' '}
            — {messages.classrooms.codesHint}
          </p>
        </section>
      )}

      {!teacher && (
        <section className={styles.panel} data-testid="como-virar-professor">
          <h2 className={styles.title}>{messages.classrooms.notTeacherTitle}</h2>
          <p className={styles.quiet}>{messages.classrooms.notTeacherBody}</p>
          <p className={styles.note}>{messages.classrooms.notTeacherHow}</p>
        </section>
      )}

      <section className={styles.panel} data-testid="turmas-que-frequento">
        <h2 className={styles.title}>Turmas em que você está</h2>

        {attending.length === 0 ? (
          <p className={styles.quiet}>Você ainda não entrou em nenhuma turma.</p>
        ) : (
          <ul className={styles.list}>
            {attending.map((classroom) => (
              <li key={classroom.id} className={styles.row}>
                <span className={styles.name}>{classroom.name}</span>
                <span className={styles.count}>
                  {classroom.students === 1 ? '1 aluno' : `${String(classroom.students)} alunos`}
                </span>
              </li>
            ))}
          </ul>
        )}

        <form className={styles.form} onSubmit={entrar}>
          <label className={styles.field}>
            <Label>código da turma</Label>
            <input
              className={[styles.input, styles.codeInput].join(' ')}
              name="code"
              placeholder="XXXXXX"
              autoComplete="off"
              spellCheck={false}
              required
              data-testid="codigo-da-turma"
            />
          </label>
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? 'Entrando…' : 'Entrar na turma'}
          </Button>
        </form>

        <p className={styles.note}>
          O professor vê quais missões você cumpriu e onde parou. O que você desenha fora das
          missões é seu, e não aparece para ninguém.
        </p>
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
