import { Logo } from '@rotamer/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactElement } from 'react';
import { currentProfile } from '../../lib/auth';
import { db, hasDatabase } from '../../lib/db';
import { serverMessages } from '../../lib/locale';
import { teaches } from '../../lib/roles';
import { IssueCode } from './IssueCode';
import { codesMessages } from './messages';
import { LanguageSwitch } from '../components/LanguageSwitch';
import styles from './page.module.css';

/** Título e descrição também são texto de produto, lidos no idioma de quem chega. */
export async function generateMetadata(): Promise<Metadata> {
  const m = await serverMessages(codesMessages);
  return { title: m.metaTitle, description: m.metaDescription };
}

/**
 * A página do professor.
 *
 * Quem emite código de senha precisa ser professor — e professor não se
 * autodeclara: quem promove é `apps/web/scripts/promote-teacher.mjs`, rodado por quem tem
 * acesso ao servidor. Sem isso, a tela vira um jeito de tomar a conta alheia
 * (D-19).
 */
export default async function CodesPage(): Promise<ReactElement> {
  if (!hasDatabase()) redirect('/');

  const profile = await currentProfile();
  if (profile === null) redirect('/entrar');

  const row = await db.profile.findUnique({
    where: { id: profile.id },
    select: { role: true, institution: true },
  });

  const teacher = teaches(row?.role);
  const school = row?.institution?.trim() ?? '';
  const m = await serverMessages(codesMessages);

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
        <p className={styles.intro}>
          {m.introBefore} <code>/senha</code> {m.introAfter}
        </p>
      </div>

      {teacher && school !== '' && <IssueCode />}

      {teacher && school === '' && (
        <p className={styles.aviso} data-testid="sem-escola">
          {m.noSchool}
        </p>
      )}

      {!teacher && (
        <p className={styles.aviso} data-testid="sem-permissao">
          {m.noPermission}
        </p>
      )}

      <p className={styles.note}>{m.note}</p>
    </main>
  );
}
