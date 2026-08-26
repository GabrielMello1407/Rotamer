import { Button } from '@rotamer/ui';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { signOut } from '../actions/account';
import styles from './AccountMenu.module.css';

export interface AccountMenuProps {
  readonly displayName: string | null;
}

/**
 * Quem está usando, se alguém entrou.
 *
 * Sem conta o produto funciona inteiro — por isso aqui não existe muro, só um
 * convite discreto.
 */
export function AccountMenu({ displayName }: AccountMenuProps): ReactElement {
  if (displayName === null) {
    return (
      <Link className={styles.link} href="/entrar" data-testid="entrar">
        Entrar
      </Link>
    );
  }

  return (
    <div className={styles.menu}>
      <Link className={styles.link} href="/minhas" data-testid="minhas">
        Minhas moléculas
      </Link>
      <span className={styles.name} data-testid="conta">
        {displayName}
      </span>
      <form action={signOut}>
        <Button type="submit" size="small" variant="ghost">
          Sair
        </Button>
      </form>
    </div>
  );
}
