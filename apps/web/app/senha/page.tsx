import { Logo } from '@rotamer/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { PasswordReset } from './PasswordReset';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Trocar a senha · Rotamer',
  description: 'Troque a senha com o código que o professor entregou.',
};

/**
 * Recuperar a senha sem e-mail.
 *
 * Quem esqueceu a senha pede um código ao professor e troca aqui. Não existe
 * link enviado por e-mail, e a tela diz isso em vez de deixar a pessoa
 * esperando uma mensagem que nunca vai chegar (D-19).
 */
export default function PasswordPage(): ReactElement {
  return (
    <main className={styles.page}>
      <Link className={styles.identity} href="/">
        <Logo size={32} decorative />
        <span className={styles.wordmark}>Rotamer</span>
      </Link>

      <div>
        <h1 className={styles.title}>Trocar a senha</h1>
        <p className={styles.intro}>
          Peça um código ao professor da turma. Ele vale por um dia e serve uma vez só — não há
          e-mail no caminho, então nada precisa chegar na sua caixa de entrada.
        </p>
      </div>

      <PasswordReset />

      <p className={styles.note}>
        Lembrou a senha?{' '}
        <Link className={styles.link} href="/entrar">
          Entrar
        </Link>
        .
      </p>
    </main>
  );
}
