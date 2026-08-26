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
 * Quantas vezes tentar antes de desistir.
 *
 * O worker pode não responder por motivo passageiro: em desenvolvimento o
 * empacotador compila o arquivo na primeira visita e às vezes passa do tempo; em
 * produção, uma rede ruim pode perder o pedaço de código no meio do caminho.
 * Desistir na primeira faz a tela dizer que o navegador não dá conta quando o
 * que houve foi um tropeço — e a segunda tentativa custa nada, porque o que já
 * chegou está em cache.
 */
const ATTEMPTS = 2;

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
    let current: Worker | null = null;

    const fail = (detail: string): void => {
      console.error(`worker de química: ${detail}`);
      if (alive) setConnection({ status: 'failed', client: null, message: FAILURE_MESSAGE });
    };

    /** Uma tentativa completa: subir o worker, apresentar-se e aquecer o RDKit. */
    const attempt = async (): Promise<string> => {
      const worker = new Worker(new URL('../chemistry.worker.ts', import.meta.url), {
        name: 'chemistry',
      });

      current?.terminate();
      current = worker;

      // Sem isto, um worker que morre ao carregar deixa a promessa do Comlink
      // pendurada para sempre e a tela fica "carregando" sem nunca falhar.
      const broke = new Promise<never>((_, reject) => {
        worker.addEventListener('error', (event: ErrorEvent) => {
          reject(new Error(event.message || 'erro ao carregar o worker'));
        });
        worker.addEventListener('messageerror', () => {
          reject(new Error('mensagem do worker não pôde ser lida'));
        });
      });

      // Registrado antes de qualquer mensagem, senão o aviso de "estou ouvindo"
      // chega antes de alguém estar esperando por ele.
      const ready = whenChemistryReady(worker);
      const client = connectChemistry(worker);

      await Promise.race([ready, broke]);
      await client.configure(new URL('/chem/', window.location.href).href);
      const version = await client.warmUp();

      if (alive) setConnection({ status: 'ready', client, version });
      return version;
    };

    const start = async (): Promise<void> => {
      for (let round = 1; round <= ATTEMPTS; round += 1) {
        try {
          await attempt();
          return;
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);

          if (!alive) return;
          if (round === ATTEMPTS) {
            fail(detail);
            return;
          }

          console.warn(`worker de química: ${detail} — tentando de novo`);
        }
      }
    };

    void start();

    return () => {
      alive = false;
      current?.terminate();
    };
  }, []);

  return connection;
}
