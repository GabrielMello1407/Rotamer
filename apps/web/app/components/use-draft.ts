'use client';

import type { MoleculeGraph } from '@rotamer/core';
import type { EditorStore } from '@rotamer/editor2d';
import { useEffect } from 'react';

/**
 * O rascunho.
 *
 * Trocar de aplicativo no celular descarrega a aba, e sem isto o aluno perde o
 * desenho. Como o grafo é a única fonte de verdade e é serializável, guardar o
 * trabalho é guardar um objeto — descritores, geometria e vibração são
 * recalculados a partir dele quando a página volta.
 *
 * Fica no navegador, não no servidor: rascunho é de quem está desenhando, e o
 * produto funciona inteiro sem conta.
 */

const KEY = 'rotamer-rascunho';

/**
 * Apaga o rascunho guardado no navegador.
 *
 * Chamado ao sair da conta. O editor funciona sem conta e o rascunho é
 * conveniência local, mas sair é um "terminei aqui" deliberado — e numa máquina
 * de laboratório de escola, o próximo aluno senta na mesma cadeira. Deixar a
 * molécula de quem saiu na tela é entregar o trabalho dele a outra pessoa.
 */
export function forgetDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Navegador com armazenamento bloqueado: não havia rascunho para apagar.
  }
}
const VERSION = 1;

/** Espera o traço parar antes de gravar. */
const QUIET_MS = 600;

interface Draft {
  readonly version: number;
  readonly graph: MoleculeGraph;
}

function readDraft(): MoleculeGraph | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return null;

    const draft = JSON.parse(raw) as Draft;
    if (draft.version !== VERSION) return null;

    const graph = draft.graph;
    if (!Array.isArray(graph.atoms) || !Array.isArray(graph.bonds)) return null;
    if (typeof graph.nextId !== 'number') return null;

    return graph;
  } catch {
    // Armazenamento bloqueado ou conteúdo estragado: começa em branco, sem
    // reclamar. Rascunho perdido é chato; tela travada é pior.
    return null;
  }
}

function writeDraft(graph: MoleculeGraph): void {
  try {
    if (graph.atoms.length === 0) {
      localStorage.removeItem(KEY);
      return;
    }

    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, graph } satisfies Draft));
  } catch {
    // Sem espaço ou sem permissão: o desenho continua na tela.
  }
}

/**
 * Restaura o rascunho ao abrir e o mantém salvo enquanto se desenha.
 *
 * Quem chega por link com `?smiles=` não tem rascunho restaurado: o link é uma
 * intenção explícita e ganha da última coisa que ficou na tela.
 */
export function useDraft(store: EditorStore, restore: boolean): void {
  useEffect(() => {
    if (!restore) return;

    const draft = readDraft();
    if (draft !== null && draft.atoms.length > 0) {
      store.getState().amend(draft);
      store.getState().frame();
    }
  }, [store, restore]);

  useEffect(() => {
    let timer: number | undefined;

    const unsubscribe = store.subscribe((state, previous) => {
      if (state.graph === previous.graph) return;

      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        writeDraft(store.getState().graph);
      }, QUIET_MS);
    });

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [store]);
}
