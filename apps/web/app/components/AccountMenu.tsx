'use client';

import { Button } from '@rotamer/ui';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { signOut } from '../actions/account';
import { forgetDraft } from './use-draft';
import styles from './AccountMenu.module.css';

export interface AccountMenuProps {
  readonly displayName: string | null;
  /**
   * Chamado ao sair, antes de a sessão terminar.
   *
   * Sair é um "terminei aqui" deliberado, e a bancada precisa esvaziar junto: a
   * sessão morre no servidor, mas a árvore da página sobrevive à navegação e o
   * desenho continuaria na tela para quem sentar depois.
   */
  readonly onSignOut?: () => void;
}

/**
 * Quem está usando, se alguém entrou.
 *
 * Sem conta o produto funciona inteiro — por isso aqui não existe muro, só um
 * convite discreto.
 */
export function AccountMenu({ displayName, onSignOut }: AccountMenuProps): ReactElement {
  if (displayName === null) {
    return (
      <Link className={styles.link} href="/entrar" data-testid="entrar">
        Entrar
      </Link>
    );
  }

  return (
    <div className={styles.menu}>
      <Link className={styles.link} href="/turmas" data-testid="turmas">
        Turmas
      </Link>
      <Link className={styles.link} href="/minhas" data-testid="minhas">
        Minhas moléculas
      </Link>
      <span className={styles.name} data-testid="conta">
        {displayName}
      </span>
      <form
        action={signOut}
        onSubmit={() => {
          // O rascunho vive no navegador e não sai com a sessão: quem sai da
          // conta leva o desenho junto, senão o próximo que sentar na máquina
          // encontra a molécula de outra pessoa na tela.
          forgetDraft();
          onSignOut?.();
        }}
      >
        <Button type="submit" size="small" variant="ghost">
          Sair
        </Button>
      </form>
    </div>
  );
}
