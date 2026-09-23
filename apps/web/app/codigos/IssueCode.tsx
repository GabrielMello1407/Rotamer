'use client';

import { languageTag } from '@rotamer/i18n';
import { useLocale, useMessages } from '@rotamer/i18n/react';
import { Button, Label } from '@rotamer/ui';
import { useMemo, useState, useTransition, type FormEvent, type ReactElement } from 'react';
import { issueResetCode } from '../actions/recovery';
import { codesMessages } from './messages';
import styles from './page.module.css';

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
  const locale = useLocale();
  const m = useMessages(codesMessages);
  const [issued, setIssued] = useState<Issued | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Sem hora "curta" pronta em `@rotamer/i18n` — a data das outras telas não
  // leva hora e minuto. `languageTag(locale)` é o que impede o `pt-BR` de
  // ficar escrito à mão aqui (ver `docs/IDIOMAS.md`).
  const when = useMemo(
    () =>
      new Intl.DateTimeFormat(languageTag(locale), {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [locale],
  );

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
          <Label>{m.emailLabel}</Label>
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
          {pending ? m.issuing : m.issue}
        </Button>
      </form>

      {error !== null && (
        <p className={styles.error} data-testid="erro-codigo">
          {error}
        </p>
      )}

      {issued !== null && (
        <div className={styles.issued} data-testid="codigo-emitido">
          <Label>{m.codeOf(issued.forName)}</Label>
          <p className={styles.code}>{issued.code}</p>
          <p className={styles.note}>{m.validUntil(when.format(new Date(issued.expiresAt)))}</p>
        </div>
      )}
    </div>
  );
}
