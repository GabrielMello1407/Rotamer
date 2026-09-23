import { Logo } from '@rotamer/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactElement } from 'react';
import { readClassrooms } from '../actions/classroom';
import { readSchoolStaff } from '../actions/staff';
import { currentProfile } from '../../lib/auth';
import { db, hasDatabase } from '../../lib/db';
import { serverMessages } from '../../lib/locale';
import { administers, teaches } from '../../lib/roles';
import { Classrooms } from './Classrooms';
import { messages } from './messages';
import { Staff } from './Staff';
import { LanguageSwitch } from '../components/LanguageSwitch';
import styles from './page.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const m = await serverMessages(messages);
  return { title: m.classrooms.pageMetaTitle, description: m.classrooms.pageMetaDescription };
}

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

  // Só o administrador tem esta seção (D-29), e só para ele vale a consulta: a
  // ação confere o papel de novo por conta dela, mas quem é aluno não precisa
  // pagar uma ida ao banco para descobrir que não tem nada a ver com isso.
  const staff = administers(row?.role) ? await readSchoolStaff() : null;

  const m = await serverMessages(messages);

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
        <h1 className={styles.heading}>{m.classrooms.heading}</h1>
        <p className={styles.intro}>{m.classrooms.intro}</p>
      </div>

      <Classrooms teaching={teaching} attending={attending} teacher={teaches(row?.role)} />

      {staff?.status === 'ok' && <Staff institution={staff.institution} staff={staff.staff} />}
    </main>
  );
}
