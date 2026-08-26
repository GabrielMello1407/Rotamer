'use client';

import { Button, Formula } from '@rotamer/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type ReactElement } from 'react';
import { forgetMolecule } from '../actions/library';
import styles from './page.module.css';

export interface LibraryRow {
  readonly inchiKey: string;
  readonly smiles: string;
  readonly formula: string;
  readonly molarMass: number;
  readonly savedAt: string;
  readonly name: string | null;
  readonly namedBy: string | null;
  /** Abrir no editor. */
  readonly href: string;
  /** A página pública da estrutura. */
  readonly publicHref: string;
}

export interface LibraryListProps {
  readonly molecules: readonly LibraryRow[];
}

const DATE = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
const MASS = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * A lista da estante.
 *
 * Tirar da estante acontece aqui, no cliente, porque é a única coisa desta
 * página que muda estado — e a confirmação é local: quem clicou em tirar vê o
 * pedido de confirmação na própria linha, não numa janela por cima da tela.
 */
export function LibraryList({ molecules }: LibraryListProps): ReactElement {
  const router = useRouter();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <ul className={styles.list} data-testid="minhas-moleculas">
      {molecules.map((molecule) => (
        <li key={molecule.inchiKey} className={styles.row} data-testid={`guardada-${molecule.formula}`}>
          <Link className={styles.open} href={molecule.href}>
            <Formula value={molecule.formula} className={styles.formula} />
            {molecule.name !== null && (
              <span className={styles.name}>
                {molecule.name}
                {molecule.namedBy !== null && (
                  <span className={styles.by}> · batizada por {molecule.namedBy}</span>
                )}
              </span>
            )}
          </Link>

          <span className={styles.mass}>
            {molecule.molarMass > 0 ? `${MASS.format(molecule.molarMass)} g/mol` : '—'}
          </span>

          <span className={styles.date}>{DATE.format(new Date(molecule.savedAt))}</span>

          <span className={styles.actions}>
            <Link className={styles.link} href={molecule.publicHref}>
              Página pública
            </Link>

            {confirming === molecule.inchiKey ? (
              <>
                <Button
                  size="small"
                  variant="ghost"
                  disabled={pending}
                  data-testid={`confirmar-tirar-${molecule.formula}`}
                  onClick={() => {
                    startTransition(async () => {
                      await forgetMolecule({ inchiKey: molecule.inchiKey });
                      setConfirming(null);
                      router.refresh();
                    });
                  }}
                >
                  Tirar mesmo
                </Button>
                <Button
                  size="small"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => {
                    setConfirming(null);
                  }}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                size="small"
                variant="ghost"
                data-testid={`tirar-${molecule.formula}`}
                onClick={() => {
                  setConfirming(molecule.inchiKey);
                }}
              >
                Tirar da estante
              </Button>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
