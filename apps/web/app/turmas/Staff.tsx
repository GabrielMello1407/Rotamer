'use client';

import { Button, Label } from '@rotamer/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent, type ReactElement } from 'react';
import {
  demoteToStudent,
  findSchoolAccount,
  promoteToTeacher,
  type StaffMember,
} from '../actions/staff';
import { messages } from './messages';
import styles from './page.module.css';

export interface StaffProps {
  readonly institution: string;
  readonly staff: readonly StaffMember[];
}

const DATE = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

interface Candidate {
  readonly email: string;
  readonly name: string;
}

/**
 * Quem dá aula na escola, para o administrador (D-29).
 *
 * A tela tem **dois passos** de propósito: digitar o e-mail confere de quem ele
 * é, e só depois de ver o nome é que se promove. O risco aqui não é invasão — o
 * servidor já recusa quem não é administrador, quem é de outra escola e quem
 * pediria administrador. O risco é dedo: promover a conta errada por uma letra,
 * e dar a essa pessoa o poder de emitir código de senha de um aluno.
 *
 * Nome **e** e-mail aparecem em cada linha. Só o nome deixaria duas professoras
 * homônimas indistinguíveis na hora de rebaixar — o contrário do que os dois
 * passos existem para fazer.
 */
export function Staff({ institution, staff }: StaffProps): ReactElement {
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [leaving, setLeaving] = useState<StaffMember | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const check = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('email');
    const email = typeof value === 'string' ? value.trim().toLowerCase() : '';

    startTransition(async () => {
      const outcome = await findSchoolAccount({ email });

      if (outcome.status === 'rejected') {
        setCandidate(null);
        setNote(null);
        setError(outcome.reason);
        return;
      }

      if (outcome.teaching) {
        setCandidate(null);
        setNote(null);
        setError(messages.staff.alreadyTeaching);
        return;
      }

      setError(null);
      setNote(null);
      setCandidate({ email, name: outcome.name });
    });
  };

  const promote = (): void => {
    if (candidate === null) return;
    const { email } = candidate;

    startTransition(async () => {
      const outcome = await promoteToTeacher({ email });
      setCandidate(null);

      if (outcome.status === 'rejected') {
        setNote(null);
        setError(outcome.reason);
        return;
      }

      setError(null);
      setNote(messages.staff.promoted(outcome.name));
      router.refresh();
    });
  };

  const demote = (): void => {
    if (leaving === null) return;
    const { email } = leaving;

    startTransition(async () => {
      const outcome = await demoteToStudent({ email });
      setLeaving(null);

      if (outcome.status === 'rejected') {
        setNote(null);
        setError(outcome.reason);
        return;
      }

      setError(null);
      setNote(messages.staff.demoted(outcome.name));
      router.refresh();
    });
  };

  return (
    <section className={styles.panel} data-testid="professores-da-escola">
      <h2 className={styles.title}>{messages.staff.heading}</h2>
      <p className={styles.quiet}>{institution}</p>

      {/* Não há estado vazio: quem lê esta seção é administrador da escola, e
          por isso aparece nela — a lista tem no mínimo uma linha, a dele. */}
      <ul className={styles.list}>
        {staff.map((member) => (
          <li key={member.id} className={styles.staffRow}>
            <span className={styles.staffWho}>
              <span className={styles.name}>
                {member.name}
                {member.administrator && (
                  <span className={styles.chip}>{messages.staff.administratorChip}</span>
                )}
              </span>
              <span className={styles.staffEmail}>{member.email}</span>
            </span>
            <span className={styles.trail}>
              {member.grantedBy === null || member.grantedAt === null
                ? messages.staff.grantedByTerminal
                : messages.staff.grantedBy(
                    member.grantedBy,
                    DATE.format(new Date(member.grantedAt)),
                  )}
            </span>
            {/* Sem `Rebaixar` para administrador: nem para outro, nem para si
                mesmo. As duas recusas também valem no servidor. */}
            {member.administrator ? (
              <span />
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  setLeaving(member);
                  setCandidate(null);
                }}
                disabled={pending}
                data-testid={`rebaixar-${member.email}`}
              >
                {messages.staff.demote}
              </Button>
            )}
          </li>
        ))}
      </ul>

      <form className={styles.form} onSubmit={check}>
        <label className={styles.field}>
          <Label>{messages.staff.emailLabel}</Label>
          <input
            className={styles.input}
            name="email"
            type="email"
            autoComplete="off"
            required
            data-testid="promover-email"
          />
        </label>
        <Button type="submit" disabled={pending} data-testid="conferir-conta">
          {pending ? messages.staff.checking : messages.staff.check}
        </Button>
      </form>

      {candidate !== null && (
        <div className={styles.confirm} data-testid="confirmar-professor">
          <p className={styles.confirmTitle}>{messages.staff.confirm(candidate.name)}</p>
          <p className={styles.staffEmail}>{candidate.email}</p>
          <div className={styles.buttons}>
            <Button onClick={promote} disabled={pending} data-testid="promover-confirmado">
              {pending ? messages.staff.promoting : messages.staff.promote}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setCandidate(null);
              }}
              disabled={pending}
            >
              {messages.staff.cancel}
            </Button>
          </div>
        </div>
      )}

      {leaving !== null && (
        <div className={styles.confirm} data-testid="confirmar-rebaixamento">
          <p className={styles.confirmTitle}>
            {messages.staff.demoteConfirm(leaving.name, leaving.email)}
          </p>
          <p className={styles.note}>{messages.staff.demoteBody}</p>
          <div className={styles.buttons}>
            <Button onClick={demote} disabled={pending} data-testid="rebaixar-confirmado">
              {messages.staff.demote}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setLeaving(null);
              }}
              disabled={pending}
            >
              {messages.staff.cancel}
            </Button>
          </div>
        </div>
      )}

      <p className={styles.note}>{messages.staff.warning}</p>
      <p className={styles.note}>{messages.staff.ceiling}</p>

      {note !== null && (
        <p className={styles.ok} data-testid="aviso-professores">
          {note}
        </p>
      )}

      {error !== null && (
        <p className={styles.error} data-testid="erro-professores">
          {error}
        </p>
      )}
    </section>
  );
}
