import { Logo } from '@rotamer/ui';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { EditorWorkspace } from './components/EditorWorkspace';
import { ThemeToggle } from './components/ThemeToggle';
import styles from './page.module.css';

/**
 * A tela de desenho ocupa tudo; o resto se afasta.
 *
 * Sem cadastro, sem porta de entrada: quem abre o endereço já pode desenhar.
 */
export default function EditorPage(): ReactElement {
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <div className={styles.identity}>
          <Logo size={40} />
          <div>
            <h1 className={styles.wordmark}>Rotamer</h1>
            <p className={styles.tagline}>
              Desenhe em 2D. A forma no espaço aparece ao lado, calculada.
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          <Link className={styles.link} href="/marca">
            Marca e tokens
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <EditorWorkspace />
    </main>
  );
}
