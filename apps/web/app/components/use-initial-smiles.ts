'use client';

import { fromMolblock } from '@rotamer/core';
import type { EditorStore } from '@rotamer/editor2d';
import { useEffect, useRef } from 'react';
import type { ChemistryConnection } from './use-chemistry-client';

/**
 * Abre a molécula que veio no endereço: `/?smiles=...`.
 *
 * É o caminho de volta da página pública para o editor — o professor manda o
 * link, o aluno abre e já pode mexer na estrutura.
 */
export function useInitialSmiles(store: EditorStore, connection: ChemistryConnection): void {
  const loaded = useRef(false);
  const client = connection.status === 'ready' ? connection.client : null;

  useEffect(() => {
    if (loaded.current || !client) return;

    const smiles = new URLSearchParams(window.location.search).get('smiles');
    if (smiles === null || smiles.trim() === '') return;

    loaded.current = true;

    const open = async (): Promise<void> => {
      const result = await client.analyze(smiles);
      if (!result.ok) return;

      store.getState().commit(fromMolblock(result.molecule.molblock));
      store.getState().frame();
    };

    void open();
  }, [client, store]);
}
