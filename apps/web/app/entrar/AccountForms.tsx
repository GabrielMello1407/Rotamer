'use client';

import { Button, Card, Label } from '@rotamer/ui';
import { useActionState, type ReactElement } from 'react';
import { signIn, signUp, type AccountState } from '../actions/account';
import styles from './page.module.css';

const EMPTY: AccountState = { error: null };

/**
 * Entrar e criar conta, lado a lado.
 *
 * A conta serve para guardar progresso; o editor inteiro continua funcionando
 * sem ela. Ninguém precisa se cadastrar para desenhar.
 */
export function AccountForms(): ReactElement {
  const [signInState, submitSignIn, signingIn] = useActionState(signIn, EMPTY);
  const [signUpState, submitSignUp, signingUp] = useActionState(signUp, EMPTY);

  return (
    <div className={styles.forms}>
      <Card title="entrar">
        <form className={styles.form} action={submitSignIn}>
          <label className={styles.field}>
            <Label>e-mail</Label>
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
            <Label>senha</Label>
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
            {signingIn ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </Card>

      <Card title="criar conta">
        <form className={styles.form} action={submitSignUp}>
          <label className={styles.field}>
            <Label>como quer ser chamado</Label>
            <input
              className={styles.input}
              name="displayName"
              autoComplete="name"
              required
              data-testid="criar-nome"
            />
          </label>

          <label className={styles.field}>
            <Label>e-mail</Label>
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
            <Label>senha</Label>
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
            <Label>escola ou instituição</Label>
            <input
              className={styles.input}
              name="institution"
              autoComplete="organization"
              data-testid="criar-instituicao"
            />
            <span className={styles.note}>Opcional. Serve para acompanhar a turma depois.</span>
          </label>

          {signUpState.error !== null && (
            <p className={styles.error} data-testid="erro-criar">
              {signUpState.error}
            </p>
          )}

          <Button type="submit" variant="secondary" disabled={signingUp}>
            {signingUp ? 'Criando…' : 'Criar conta'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
