'use client';

import { Button } from '@rotamer/ui';
import type { ReactElement } from 'react';
import { useStore } from 'zustand';
import styles from './Toolbar.module.css';
import type { EditorStore } from './store';

export interface ToolbarProps {
  readonly store: EditorStore;
  readonly className?: string | undefined;
}

/**
 * Os elementos que aparecem em prova de orgânica, na ordem em que aparecem.
 * Mais que isso vira tabela periódica na tela, e aí a criação some no meio da
 * ferramenta.
 */
const ELEMENTS = ['C', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I'] as const;

/** Barra discreta de ferramentas. A tela de desenho é que é o objeto principal. */
export function Toolbar({ store, className }: ToolbarProps): ReactElement {
  const element = useStore(store, (state) => state.element);
  const tool = useStore(store, (state) => state.tool);
  const canUndo = useStore(store, (state) => state.past.length > 0);
  const canRedo = useStore(store, (state) => state.future.length > 0);
  const hasAtoms = useStore(store, (state) => state.graph.atoms.length > 0);

  return (
    <div
      className={[styles.toolbar, className].filter(Boolean).join(' ')}
      role="toolbar"
      aria-label="Ferramentas"
    >
      <div className={styles.group}>
        {ELEMENTS.map((symbol) => (
          <Button
            key={symbol}
            size="small"
            variant="secondary"
            className={styles.element}
            aria-pressed={element === symbol && tool === 'structure'}
            title={`Desenhar ${symbol}`}
            onClick={() => {
              store.getState().setElement(symbol);
              store.getState().setTool('structure');
            }}
          >
            {symbol}
          </Button>
        ))}
      </div>

      <span className={styles.divider} aria-hidden="true" />

      <div className={styles.group}>
        <Button
          size="small"
          variant="secondary"
          className={styles.tool}
          aria-pressed={tool === 'erase'}
          title="Apagar átomo ou ligação (E)"
          onClick={() => {
            store.getState().setTool(tool === 'erase' ? 'structure' : 'erase');
          }}
        >
          Apagar
        </Button>
      </div>

      <span className={styles.divider} aria-hidden="true" />

      <div className={styles.group}>
        <Button
          size="small"
          variant="ghost"
          disabled={!canUndo}
          title="Desfazer (Ctrl+Z)"
          onClick={() => {
            store.getState().undo();
          }}
        >
          Desfazer
        </Button>
        <Button
          size="small"
          variant="ghost"
          disabled={!canRedo}
          title="Refazer (Ctrl+Shift+Z)"
          onClick={() => {
            store.getState().redo();
          }}
        >
          Refazer
        </Button>
        <Button
          size="small"
          variant="ghost"
          disabled={!hasAtoms}
          title="Enquadrar a molécula (F)"
          onClick={() => {
            store.getState().frame();
          }}
        >
          Enquadrar
        </Button>
        <Button
          size="small"
          variant="ghost"
          disabled={!hasAtoms}
          title="Começar de novo"
          onClick={() => {
            store.getState().clear();
          }}
        >
          Limpar
        </Button>
      </div>
    </div>
  );
}
