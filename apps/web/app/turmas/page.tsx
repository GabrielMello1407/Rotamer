import { Logo } from '@rotamer/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactElement } from 'react';
import { readClassrooms } from '../actions/classroom';
import { currentProfile } from '../../lib/auth';
import { db, hasDatabase } from '../../lib/db';
import { Classrooms } from './Classrooms';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Turmas · Rotamer',
  description: 'Abrir turma, entrar numa turma e ver onde a turma parou.',
};

/**
 * Turmas.
 *
 * O que faz uma escola adotar o produto não é o editor: é o professor conseguir
 * ver onde a turma travou. A tela é a mesma para os dois lados — quem dá aula abre turma,
 * quem estuda entra com o código (D-22).
 */
export default async function ClassroomsPage(): Promise<ReactElement> {
  if (!hasDatabase()) redirect('/');

  const profile = await currentProfile();
  if (profile === null) redirect('/entrar');

  const row = await db.profile.findUnique({
    where: { id: profile.id },
    select: { role: true },
  });

  const { teaching, attending } = await readClassrooms();

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
        <h1 className={styles.heading}>Turmas</h1>
        <p className={styles.intro}>
          O professor abre a turma e escreve o código no quadro; quem estuda entra digitando esse
          código. Não há convite por e-mail, pelo mesmo motivo da troca de senha: em muita escola o
          aluno não tem caixa de entrada, e a que tem não abre na aula.
        </p>
      </div>

      <Classrooms teaching={teaching} attending={attending} teacher={row?.role === 'professor'} />
    </main>
  );
}
