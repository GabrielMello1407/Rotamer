import { Logo } from '@rotamer/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactElement } from 'react';
import { readLibrary } from '../actions/library';
import { currentProfile } from '../../lib/auth';
import { hasDatabase } from '../../lib/db';
import { encodeSmiles } from '../../lib/molecule-url';
import { LibraryList } from './LibraryList';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Minhas moléculas · Rotamer',
  description: 'As estruturas que você guardou.',
};

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
        <h1 className={styles.title}>Minhas moléculas</h1>
        <p className={styles.subtitle}>
          {molecules.length === 0
            ? 'Nada guardado ainda. No editor, abra a análise e use "Guardar" para deixar uma estrutura aqui.'
            : `${String(molecules.length)} ${molecules.length === 1 ? 'estrutura guardada' : 'estruturas guardadas'}. Abrir traz o desenho de volta para o editor.`}
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

      <p className={styles.note}>
        O que fica guardado é o grafo. Fórmula, massa e descritores são derivados dele pelo RDKit e
        recalculados sempre que a molécula abre — nada aqui é um número guardado que possa
        envelhecer sozinho.
      </p>
    </main>
  );
}
