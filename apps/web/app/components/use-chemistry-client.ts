'use client';

import { connectChemistry, whenChemistryReady, type ChemistryClient } from '@rotamer/core/chemistry/client';
import { useEffect, useState } from 'react';

/** Onde está o motor de química neste momento. */
export type ChemistryConnection =
  | { readonly status: 'loading'; readonly client: null }
  | { readonly status: 'ready'; readonly client: ChemistryClient; readonly version: string }
  | { readonly status: 'failed'; readonly client: null; readonly message: string };

const FAILURE_MESSAGE = 'Não foi possível carregar o motor de química neste navegador.';

/**
 * Sobe o worker de química **depois da primeira pintura** e o mantém vivo
 * enquanto a página estiver aberta.
 *
 * A ordem importa: a tela de desenho aparece e já aceita traço antes de os
 * quase 7 MB de WebAssembly subirem. Num celular fraco em 3G é a diferença
 * entre desenhar em três segundos e esperar quinze olhando para o vazio.
 */
export function useChemistryClient(): ChemistryConnection {
  const [connection, setConnection] = useState<ChemistryConnection>({
    status: 'loading',
    client: null,
  });

  useEffect(() => {
    let alive = true;
    const worker = new Worker(new URL('../chemistry.worker.ts', import.meta.url), {
      name: 'chemistry',
    });

    const fail = (detail: string): void => {
      console.error(`worker de química: ${detail}`);
      if (alive) setConnection({ status: 'failed', client: null, message: FAILURE_MESSAGE });
    };

    // Sem isto, um worker que morre ao carregar deixa a promessa do Comlink
    // pendurada para sempre e a tela fica "carregando" sem nunca falhar.
    worker.addEventListener('error', (event: ErrorEvent) => {
      fail(event.message || 'erro ao carregar o worker');
    });
    worker.addEventListener('messageerror', () => {
      fail('mensagem do worker não pôde ser lida');
    });

    // Registrado antes de qualquer mensagem, senão o aviso de "estou ouvindo"
    // chega antes de alguém estar esperando por ele.
    const ready = whenChemistryReady(worker);
    const client = connectChemistry(worker);

    const start = async (): Promise<void> => {
      try {
        await ready;
        await client.configure(new URL('/chem/', window.location.href).href);
        const version = await client.warmUp();
        if (alive) setConnection({ status: 'ready', client, version });
      } catch (error) {
        fail(error instanceof Error ? error.message : String(error));
      }
    };

    void start();

    return () => {
      alive = false;
      worker.terminate();
    };
  }, []);

  return connection;
}
