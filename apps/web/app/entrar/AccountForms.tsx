'use client';

import { useMessages } from '@rotamer/i18n/react';
import { Button, Card, Label } from '@rotamer/ui';
import Link from 'next/link';
import { useActionState, type ReactElement } from 'react';
import { signIn, signUp, type AccountState } from '../actions/account';
import { accountMessages } from './messages';
import styles from './page.module.css';

const EMPTY: AccountState = { error: null };

/**
 * Entrar e criar conta, lado a lado.
 *
 * A conta serve para guardar progresso; o editor inteiro continua funcionando
 * sem ela. Ninguém precisa se cadastrar para desenhar.
 */
export function AccountForms(): ReactElement {
  const m = useMessages(accountMessages);
  const [signInState, submitSignIn, signingIn] = useActionState(signIn, EMPTY);
  const [signUpState, submitSignUp, signingUp] = useActionState(signUp, EMPTY);

  return (
    <div className={styles.forms}>
      <Card title={m.signIn.cardTitle}>
        <form className={styles.form} action={submitSignIn}>
          <label className={styles.field}>
            <Label>{m.signIn.email}</Label>
            <input
              className={styles.input}
              name="email"
              type="email"
              autoComplete="email"
              required
              data-testid="entrar-email"
            />
          </label>

          <label className={styles.field}>
            <Label>{m.signIn.password}</Label>
            <input
              className={styles.input}
              name="password"
              type="password"
              autoComplete="current-password"
              required
              data-testid="entrar-senha"
            />
          </label>

          {signInState.error !== null && (
            <p className={styles.error} data-testid="erro-entrar">
              {signInState.error}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={signingIn}>
            {signingIn ? m.signIn.submitting : m.signIn.submit}
          </Button>

          {/* Sem e-mail no caminho: quem esqueceu a senha pede um código ao
              professor da turma e troca na hora (D-19). */}
          <p className={styles.note}>
            {m.signIn.forgot}{' '}
            <Link className={styles.link} href="/senha" data-testid="esqueci-senha">
              {m.signIn.forgotLink}
            </Link>
            .
          </p>
        </form>
      </Card>

      <Card title={m.signUp.cardTitle}>
        <form className={styles.form} action={submitSignUp}>
          <label className={styles.field}>
            <Label>{m.signUp.displayName}</Label>
            <input
              className={styles.input}
              name="displayName"
              autoComplete="name"
              required
              data-testid="criar-nome"
            />
          </label>

          <label className={styles.field}>
            <Label>{m.signUp.email}</Label>
            <input
              className={styles.input}
              name="email"
              type="email"
              autoComplete="email"
              required
              data-testid="criar-email"
            />
          </label>

          <label className={styles.field}>
            <Label>{m.signUp.password}</Label>
            <input
              className={styles.input}
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              data-testid="criar-senha"
            />
          </label>

          <label className={styles.field}>
            <Label>{m.signUp.institution}</Label>
            <input
              className={styles.input}
              name="institution"
              autoComplete="organization"
              data-testid="criar-instituicao"
            />
            <span className={styles.note}>{m.signUp.institutionHint}</span>
          </label>

          {signUpState.error !== null && (
            <p className={styles.error} data-testid="erro-criar">
              {signUpState.error}
            </p>
          )}

          <Button type="submit" variant="secondary" disabled={signingUp}>
            {signingUp ? m.signUp.submitting : m.signUp.submit}
          </Button>
        </form>
      </Card>
    </div>
  );
}
