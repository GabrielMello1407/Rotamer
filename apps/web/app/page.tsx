import type { ReactElement } from 'react';
import { currentProfile } from '../lib/auth';
import { hasDatabase } from '../lib/db';
import { EditorWorkspace } from './components/EditorWorkspace';

/**
 * A tela de desenho ocupa tudo; o resto se afasta.
 *
 * Sem cadastro, sem porta de entrada: quem abre o endereço já pode desenhar. A
 * página não tem cabeçalho próprio — a faixa de cima é parte da bancada, porque
 * ela precisa mostrar a fórmula da molécula que está sendo desenhada agora.
 */
export default async function EditorPage(): Promise<ReactElement> {
  // Sem banco configurado, a parte de conta simplesmente não aparece — o
  // editor continua inteiro.
  const profile = hasDatabase() ? await currentProfile() : null;

  return (
    <main>
      <EditorWorkspace accountName={profile?.displayName ?? null} showAccount={hasDatabase()} />
    </main>
  );
}
