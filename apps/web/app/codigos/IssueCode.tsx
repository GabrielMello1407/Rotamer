'use client';

import { Button, Label } from '@rotamer/ui';
import { useState, useTransition, type FormEvent, type ReactElement } from 'react';
import { issueResetCode } from '../actions/recovery';
import styles from './page.module.css';

const WHEN = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

interface Issued {
  readonly code: string;
  readonly forName: string;
  readonly expiresAt: string;
}

/**
 * Emitir um código para alguém da turma.
 *
 * O código aparece **uma vez** e não fica guardado em lugar nenhum onde dê para
 * ler de novo — no banco fica só o resumo dele. Se a tela fechar antes de
 * anotar, emite-se outro; o anterior morre nesse momento.
 */
export function IssueCode(): ReactElement {
  const [issued, setIssued] = useState<Issued | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = form.get('email');
    const email = typeof value === 'string' ? value : '';

    startTransition(async () => {
      const outcome = await issueResetCode({ email });

      if (outcome.status === 'issued') {
        setError(null);
        setIssued({
          code: outcome.code,
          forName: outcome.forName,
          expiresAt: outcome.expiresAt,
        });
        return;
      }

      setIssued(null);
      setError(outcome.reason);
    });
  };

  return (
    <div className={styles.panel}>
      <form className={styles.form} onSubmit={submit}>
        <label className={styles.field}>
          <Label>e-mail de quem perdeu a senha</Label>
          <input
            className={styles.input}
            name="email"
            type="email"
            autoComplete="off"
            required
            data-testid="codigo-email"
          />
        </label>

        <Button type="submit" disabled={pending}>
          {pending ? 'Emitindo…' : 'Emitir código'}
        </Button>
      </form>

      {error !== null && (
        <p className={styles.error} data-testid="erro-codigo">
          {error}
        </p>
      )}

      {issued !== null && (
        <div className={styles.issued} data-testid="codigo-emitido">
          <Label>código de {issued.forName}</Label>
          <p className={styles.code}>{issued.code}</p>
          <p className={styles.note}>
            Vale até {WHEN.format(new Date(issued.expiresAt))} e serve uma vez só. Anote agora:
            esta é a única vez que ele aparece — no banco fica só o resumo dele.
          </p>
        </div>
      )}
    </div>
  );
}
