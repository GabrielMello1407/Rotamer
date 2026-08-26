import { Logo } from '@rotamer/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactElement } from 'react';
import { currentProfile } from '../../lib/auth';
import { db, hasDatabase } from '../../lib/db';
import { IssueCode } from './IssueCode';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Códigos de senha · Rotamer',
  description: 'Emitir código de troca de senha para alguém da turma.',
};

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

  const teacher = row?.role === 'professor';
  const school = row?.institution?.trim() ?? '';

  return (
    <main className={styles.page}>
      <Link className={styles.identity} href="/">
        <Logo size={32} decorative />
        <span className={styles.wordmark}>Rotamer</span>
      </Link>

      <div>
        <h1 className={styles.title}>Códigos de senha</h1>
        <p className={styles.intro}>
          Quem esqueceu a senha troca em <code>/senha</code> com um código entregue em mãos. Não há
          e-mail no caminho — em muita escola o aluno não tem caixa de entrada própria, e a que tem
          não abre na aula.
        </p>
      </div>

      {teacher && school !== '' && <IssueCode />}

      {teacher && school === '' && (
        <p className={styles.aviso} data-testid="sem-escola">
          Sua conta está sem escola preenchida, e o código só vale para alguém da mesma escola.
          Peça a quem administra o Rotamer da sua escola para preencher esse campo na sua conta.
        </p>
      )}

      {!teacher && (
        <p className={styles.aviso} data-testid="sem-permissao">
          Só conta de professor emite código. Se você dá aula e precisa disso, fale com quem
          administra o Rotamer da sua escola — a promoção é feita no servidor, de propósito.
        </p>
      )}

      <p className={styles.note}>
        O código vale por um dia, serve uma vez só e aparece uma vez só. Emitir um novo para a
        mesma pessoa invalida o anterior, e trocar a senha encerra as sessões abertas dela.
      </p>
    </main>
  );
}
