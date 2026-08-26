'use client';

import { Button, Label } from '@rotamer/ui';
import Link from 'next/link';
import { useState, useTransition, type FormEvent, type ReactElement } from 'react';
import { resetPassword } from '../actions/recovery';
import styles from './page.module.css';

/** `FormData` devolve arquivo também; aqui só interessa o que for texto. */
function fieldText(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === 'string' ? value : '';
}

/**
 * Trocar a senha com o código que o professor entregou.
 *
 * Três campos e nenhuma promessa de e-mail: quem perdeu a senha pede o código
 * na sala, digita aqui e entra de novo (D-19).
 */
export function PasswordReset(): ReactElement {
  const [error, setError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const [pending, startTransition] = useTransition();

  if (changed) {
    return (
      <div className={styles.done} data-testid="senha-trocada">
        <p className={styles.ok}>Senha trocada. As sessões antigas foram encerradas.</p>
        <Link className={styles.link} href="/entrar">
          Entrar com a senha nova
        </Link>
      </div>
    );
  }

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const outcome = await resetPassword({
        email: fieldText(form, 'email'),
        code: fieldText(form, 'code'),
        password: fieldText(form, 'password'),
      });

      if (outcome.status === 'changed') {
        setError(null);
        setChanged(true);
        return;
      }

      setError(outcome.reason);
    });
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.field}>
        <Label>e-mail da conta</Label>
        <input
          className={styles.input}
          name="email"
          type="email"
          autoComplete="email"
          required
          data-testid="senha-email"
        />
      </label>

      <label className={styles.field}>
        <Label>código do professor</Label>
        <input
          className={[styles.input, styles.code].join(' ')}
          name="code"
          autoComplete="off"
          spellCheck={false}
          placeholder="XXXX-XXXX"
          required
          data-testid="senha-codigo"
        />
      </label>

      <label className={styles.field}>
        <Label>senha nova</Label>
        <input
          className={styles.input}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          data-testid="senha-nova"
        />
      </label>

      <Button type="submit" disabled={pending}>
        {pending ? 'Trocando…' : 'Trocar a senha'}
      </Button>

      {error !== null && (
        <p className={styles.error} data-testid="erro-senha">
          {error}
        </p>
      )}
    </form>
  );
}
