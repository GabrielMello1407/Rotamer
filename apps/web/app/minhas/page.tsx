import { Logo } from '@rotamer/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactElement } from 'react';
import { readLibrary } from '../actions/library';
import { currentProfile } from '../../lib/auth';
import { hasDatabase } from '../../lib/db';
import { serverMessages } from '../../lib/locale';
import { encodeSmiles } from '../../lib/molecule-url';
import { LibraryList } from './LibraryList';
import { libraryMessages } from './messages';
import { LanguageSwitch } from '../components/LanguageSwitch';
import styles from './page.module.css';

/** Título e descrição também são texto de produto, lidos no idioma de quem chega. */
export async function generateMetadata(): Promise<Metadata> {
  const m = await serverMessages(libraryMessages);
  return { title: m.metaTitle, description: m.metaDescription };
}

/**
 * A estante.
 *
 * Renderizada no servidor porque a lista é do banco e não muda com o desenho:
 * quem chega aqui já sabe o que quer ver. Cada linha abre no editor — o grafo
 * volta pelo SMILES, e tudo o mais é recalculado a partir dele.
 */
export default async function LibraryPage(): Promise<ReactElement> {
  if (!hasDatabase()) redirect('/');

  const profile = await currentProfile();
  if (profile === null) redirect('/entrar');

  const molecules = await readLibrary();
  const m = await serverMessages(libraryMessages);

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link className={styles.identity} href="/">
          <Logo size={28} />
          <span className={styles.wordmark}>Rotamer</span>
        </Link>

        <span className={styles.end}>
          <LanguageSwitch />
          <span className={styles.who}>{profile.displayName}</span>
        </span>
      </header>

      <div>
        <h1 className={styles.title}>{m.heading}</h1>
        <p className={styles.subtitle}>
          {molecules.length === 0 ? m.empty : m.count(molecules.length)}
        </p>
      </div>

      {molecules.length > 0 && (
        <LibraryList
          molecules={molecules.map((molecule) => ({
            ...molecule,
            href: `/?smiles=${encodeURIComponent(molecule.smiles)}`,
            publicHref: `/m/${encodeSmiles(molecule.smiles)}`,
          }))}
        />
      )}

      <p className={styles.note}>{m.note}</p>
    </main>
  );
}
