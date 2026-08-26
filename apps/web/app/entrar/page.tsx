import { Logo } from '@rotamer/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { AccountForms } from './AccountForms';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Entrar · Rotamer',
  description: 'Conta para guardar o progresso nas missões. O editor funciona sem ela.',
};

/**
 * A conta é opcional de propósito: o produto abre e desenha sem cadastro.
 * Entrar serve para guardar o que já foi cumprido.
 */
export default function AccountPage(): ReactElement {
  return (
    <main className={styles.page}>
      <Link className={styles.identity} href="/">
        <Logo size={32} decorative />
        <span className={styles.wordmark}>Rotamer</span>
      </Link>

      <p className={styles.intro}>
        A conta guarda o progresso das missões e as moléculas que você salvar. Para desenhar,
        calcular descritores e ver a forma no espaço, ela não é necessária.
      </p>

      <AccountForms />

      <p className={styles.note}>
        É professor e quer entender o que dá para fazer em aula?{' '}
        <Link className={styles.link} href="/escolas">
          A página para escolas
        </Link>{' '}
        conta o que o produto faz — e o que ele não faz.
      </p>
    </main>
  );
}
