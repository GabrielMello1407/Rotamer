import { Logo } from '@rotamer/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { serverMessages } from '../../lib/locale';
import { AccountForms } from './AccountForms';
import { accountMessages } from './messages';
import { LanguageSwitch } from '../components/LanguageSwitch';
import styles from './page.module.css';

/** Título e descrição também são texto de produto, lidos no idioma de quem chega. */
export async function generateMetadata(): Promise<Metadata> {
  const m = await serverMessages(accountMessages);
  return { title: m.metaTitle, description: m.metaDescription };
}

/**
 * A conta é opcional de propósito: o produto abre e desenha sem cadastro.
 * Entrar serve para guardar o que já foi cumprido.
 */
export default async function AccountPage(): Promise<ReactElement> {
  const m = await serverMessages(accountMessages);

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <Link className={styles.identity} href="/">
          <Logo size={32} decorative />
          <span className={styles.wordmark}>Rotamer</span>
        </Link>
        <LanguageSwitch />
      </div>

      <p className={styles.intro}>{m.intro}</p>

      <AccountForms />

      <p className={styles.note}>
        {m.schoolNoteBefore}{' '}
        <Link className={styles.link} href="/escolas">
          {m.schoolNoteLink}
        </Link>{' '}
        {m.schoolNoteAfter}
      </p>
    </main>
  );
}
