import { Logo } from '@rotamer/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { serverMessages } from '../../lib/locale';
import { passwordMessages } from './messages';
import { PasswordReset } from './PasswordReset';
import { LanguageSwitch } from '../components/LanguageSwitch';
import styles from './page.module.css';

/** Título e descrição também são texto de produto, lidos no idioma de quem chega. */
export async function generateMetadata(): Promise<Metadata> {
  const m = await serverMessages(passwordMessages);
  return { title: m.metaTitle, description: m.metaDescription };
}

/**
 * Recuperar a senha sem e-mail.
 *
 * Quem esqueceu a senha pede um código ao professor e troca aqui. Não existe
 * link enviado por e-mail, e a tela diz isso em vez de deixar a pessoa
 * esperando uma mensagem que nunca vai chegar (D-19).
 */
export default async function PasswordPage(): Promise<ReactElement> {
  const m = await serverMessages(passwordMessages);

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <Link className={styles.identity} href="/">
          <Logo size={32} decorative />
          <span className={styles.wordmark}>Rotamer</span>
        </Link>
        <LanguageSwitch />
      </div>

      <div>
        <h1 className={styles.title}>{m.heading}</h1>
        <p className={styles.intro}>{m.intro}</p>
      </div>

      <PasswordReset />

      <p className={styles.note}>
        {m.rememberedBefore}{' '}
        <Link className={styles.link} href="/entrar">
          {m.rememberedLink}
        </Link>
        .
      </p>
    </main>
  );
}
