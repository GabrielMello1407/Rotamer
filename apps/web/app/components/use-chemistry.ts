'use client';

import type { AnalysisResult } from '@rotamer/core';
import { connectChemistry, whenChemistryReady } from '@rotamer/core/chemistry/client';
import { useEffect, useState } from 'react';

/** Onde está o motor de química neste momento. */
export type ChemistryState =
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly version: string; readonly result: AnalysisResult }
  | { readonly phase: 'failed'; readonly message: string };

const FAILURE_MESSAGE = 'Não foi possível carregar o motor de química neste navegador.';

/**
 * Sobe o worker de química **depois da primeira pintura** e analisa uma
 * estrutura.
 *
 * O `useEffect` é o que garante a ordem: a página aparece primeiro, os quase
 * 7 MB de WebAssembly sobem depois. Num celular fraco em 3G é a diferença entre
 * uma tela em três segundos e uma tela em quinze.
 */
export function useChemistry(input: string): ChemistryState {
  const [state, setState] = useState<ChemistryState>({ phase: 'loading' });

  useEffect(() => {
    let alive = true;
    const worker = new Worker(new URL('../chemistry.worker.ts', import.meta.url), {
      name: 'chemistry',
    });

    // Sem isto, um worker que morre ao carregar deixa a promessa do Comlink
    // pendurada para sempre e a tela fica "carregando" sem nunca falhar.
    const fail = (detail: string): void => {
      console.error(`worker de química: ${detail}`);
      if (alive) setState({ phase: 'failed', message: FAILURE_MESSAGE });
    };

    worker.addEventListener('error', (event: ErrorEvent) => {
      fail(event.message || 'erro ao carregar o worker');
    });
    worker.addEventListener('messageerror', () => {
      fail('mensagem do worker não pôde ser lida');
    });

    // Registrado antes de qualquer mensagem, senão o aviso de "estou ouvindo"
    // chega antes de alguém estar esperando por ele.
    const ready = whenChemistryReady(worker);
    const chemistry = connectChemistry(worker);

    const run = async (): Promise<void> => {
      try {
        await ready;
        await chemistry.configure(new URL('/rdkit/', window.location.href).href);
        const version = await chemistry.warmUp();
        const result = await chemistry.analyze(input);
        if (alive) setState({ phase: 'ready', version, result });
      } catch (error) {
        fail(error instanceof Error ? error.message : String(error));
      }
    };

    void run();

    return () => {
      alive = false;
      worker.terminate();
    };
  }, [input]);

  return state;
}
