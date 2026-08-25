'use client';

import { fromMolblock } from '@rotamer/core';
import type { EditorStore } from '@rotamer/editor2d';
import { Button } from '@rotamer/ui';
import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import styles from './SmilesInput.module.css';
import type { ChemistryConnection } from './use-chemistry-client';

export interface SmilesInputProps {
  readonly store: EditorStore;
  readonly connection: ChemistryConnection;
}

/**
 * Carregar molécula colando SMILES.
 *
 * É o que preenche a tela em branco para quem já chega com o composto em mãos
 * — o usuário avançado não quer missão, quer importar (ver `DECISOES.md` D-09).
 *
 * Quem lê o SMILES e desenha o esqueleto plano é o RDKit; o que chega aqui é o
 * molblock já sanitizado, que vira grafo.
 */
export function SmilesInput({ store, connection }: SmilesInputProps): ReactElement {
  const [text, setText] = useState('');
  const [queued, setQueued] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const client = connection.status === 'ready' ? connection.client : null;

  // Colar antes de o motor subir não é erro: a molécula fica na fila e entra
  // assim que o worker responde. Num celular fraco essa espera é a regra.
  useEffect(() => {
    if (queued === null || !client) return;

    let alive = true;
    const load = async (): Promise<void> => {
      const result = await client.analyze(queued);
      if (!alive) return;

      if (!result.ok) {
        setError(result.error.message);
        setQueued(null);
        return;
      }

      store.getState().commit(fromMolblock(result.molecule.molblock));
      store.getState().frame();
      setError(null);
      setText('');
      setQueued(null);
    };

    void load();
    return () => {
      alive = false;
    };
  }, [queued, client, store]);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const smiles = text.trim();
    if (smiles === '') return;

    setError(null);
    setQueued(smiles);
  };

  const waiting = queued !== null;

  return (
    <form className={styles.form} onSubmit={submit}>
      <input
        className={styles.field}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
        placeholder="Colar SMILES"
        aria-label="Carregar molécula a partir de SMILES"
        data-testid="entrada-smiles"
        spellCheck={false}
        autoComplete="off"
      />
      <Button type="submit" size="small" variant="secondary" disabled={waiting}>
        {waiting ? 'Carregando…' : 'Carregar'}
      </Button>
      {error !== null && (
        <p className={styles.error} data-testid="erro-smiles">
          {error}
        </p>
      )}
    </form>
  );
}
