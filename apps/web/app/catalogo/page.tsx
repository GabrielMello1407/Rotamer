import { Logo } from '@rotamer/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactElement } from 'react';
import { readCatalog } from '../actions/assignment';
import { currentProfile } from '../../lib/auth';
import { hasDatabase } from '../../lib/db';
import { messages } from '../turmas/messages';
import { CatalogSearch } from './CatalogSearch';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Catálogo · Rotamer',
  description: 'Todas as missões que dá para resolver, com busca.',
};

/**
 * O catálogo buscável (D-26, D-27) — de quem tem conta.
 *
 * Traz as missões do produto e as que professores publicaram, com autoria
 * visível sempre que a missão for de professor. O aluno com professor já viu
 * a lista da turma primeiro, no `QuestPanel`; aqui é "tudo o que existe para
 * fazer".
 */
export default async function CatalogPage(): Promise<ReactElement> {
  if (!hasDatabase()) redirect('/');

  const profile = await currentProfile();
  if (profile === null) redirect('/entrar');

  const entries = await readCatalog();

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link className={styles.identity} href="/">
          <Logo size={28} />
          <span className={styles.wordmark}>Rotamer</span>
        </Link>

        <span className={styles.who}>{profile.displayName}</span>
      </header>

      <div>
        <h1 className={styles.title}>{messages.catalog.pageTitle}</h1>
      </div>

      <CatalogSearch initialEntries={entries} />
    </main>
  );
}
