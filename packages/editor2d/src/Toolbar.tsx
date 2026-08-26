'use client';

import { useState, type ReactElement, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { COMMON_ELEMENTS } from './elements-table';
import { PeriodicTable } from './PeriodicTable';
import styles from './Toolbar.module.css';
import type { EditorStore } from './store';
import { RING_KINDS, ringLabel, type RingKind } from './templates';

export interface ToolbarProps {
  readonly store: EditorStore;
  readonly className?: string | undefined;
}

/**
 * Os quatro elementos que aparecem em quase toda estrutura de orgânica ficam à
 * mão; o resto da tabela abre num painel. Encher a barra com cento e dezoito
 * botões faria a criação sumir no meio da ferramenta.
 */
const ELEMENTS = COMMON_ELEMENTS.slice(0, 4);

/**
 * A barra de ferramentas, em pé na borda da tela de desenho.
 *
 * Vertical porque a tela de desenho é larga e rasa: uma barra deitada em cima
 * rouba justamente a altura que falta para a molécula crescer. Ícone sem
 * legenda, com o nome no `title` e no rótulo acessível — quem desenha aprende os
 * três botões na primeira sessão e não precisa ler a palavra "Desfazer" mil
 * vezes depois disso.
 */
export function Toolbar({ store, className }: ToolbarProps): ReactElement {
  const [tableOpen, setTableOpen] = useState(false);
  const element = useStore(store, (state) => state.element);
  const tool = useStore(store, (state) => state.tool);
  const canUndo = useStore(store, (state) => state.past.length > 0);
  const canRedo = useStore(store, (state) => state.future.length > 0);
  const hasAtoms = useStore(store, (state) => state.graph.atoms.length > 0);

  const listed = ELEMENTS.includes(element as (typeof ELEMENTS)[number]);

  return (
    <div
      className={[styles.rail, className].filter(Boolean).join(' ')}
      role="toolbar"
      aria-label="Ferramentas"
      aria-orientation="vertical"
    >
      <div className={styles.group}>
        <RailButton
          label="Desenhar (D)"
          name="Desenhar"
          pressed={tool === 'structure'}
          onClick={() => {
            store.getState().setTool('structure');
          }}
        >
          <svg viewBox="0 0 18 18" aria-hidden="true" className={styles.icon}>
            <path
              d="M3 15l1-3.4L11.6 4a1.6 1.6 0 0 1 2.3 2.3L6.4 14 3 15z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </RailButton>

        <RailButton
          label="Mover átomo ou a vista (M)"
          name="Mover"
          pressed={tool === 'move'}
          onClick={() => {
            store.getState().setTool('move');
          }}
        >
          <svg viewBox="0 0 18 18" aria-hidden="true" className={styles.icon}>
            <path
              d="M9 2.5v13M2.5 9h13M9 2.5 6.8 4.7M9 2.5l2.2 2.2M9 15.5l-2.2-2.2M9 15.5l2.2-2.2M2.5 9l2.2-2.2M2.5 9l2.2 2.2M15.5 9l-2.2-2.2M15.5 9l-2.2 2.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </RailButton>

        <RailButton
          label="Cunha e traço: estereoquímica (W)"
          name="Estereoquímica"
          pressed={tool === 'stereo'}
          onClick={() => {
            store.getState().setTool(tool === 'stereo' ? 'structure' : 'stereo');
          }}
        >
          <svg viewBox="0 0 18 18" aria-hidden="true" className={styles.icon}>
            {/* A cunha cheia, com a ponta fina no centro estereogênico. */}
            <path d="M3.5 14.5 14 5.5l1.2 3.6-8.4 6.4z" fill="currentColor" stroke="none" />
          </svg>
        </RailButton>

        <RailButton
          label="Apagar átomo ou ligação (E)"
          name="Apagar"
          pressed={tool === 'erase'}
          onClick={() => {
            store.getState().setTool(tool === 'erase' ? 'structure' : 'erase');
          }}
        >
          <svg viewBox="0 0 18 18" aria-hidden="true" className={styles.icon}>
            <path
              d="M7.4 14.5H15M3.2 12.2l6-6a1.6 1.6 0 0 1 2.3 0l2.3 2.3a1.6 1.6 0 0 1 0 2.3l-3.9 3.9H5.5l-2.3-2.5z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </RailButton>
      </div>

      <span className={styles.divider} aria-hidden="true" />

      <div className={styles.group}>
        {ELEMENTS.map((symbol) => (
          <button
            key={symbol}
            type="button"
            className={[styles.button, styles.element].join(' ')}
            data-element={symbol}
            aria-pressed={element === symbol && tool !== 'erase'}
            title={`Desenhar ${symbol}`}
            onClick={() => {
              store.getState().setElement(symbol);
              store.getState().setTool('structure');
            }}
          >
            {symbol}
          </button>
        ))}

        <button
          type="button"
          className={[styles.button, styles.element, listed ? null : styles.chosen]
            .filter(Boolean)
            .join(' ')}
          data-element={listed ? undefined : element}
          aria-pressed={!listed}
          title="Tabela periódica inteira"
          aria-label="Abrir a tabela periódica"
          data-testid="abrir-tabela"
          onClick={() => {
            setTableOpen(true);
          }}
        >
          {listed ? '···' : element}
        </button>
      </div>

      <span className={styles.divider} aria-hidden="true" />

      <div className={styles.group}>
        {RING_KINDS.map((kind) => (
          <RailButton
            key={kind}
            label={`Inserir ${ringLabel(kind)}`}
            name={`Inserir ${ringLabel(kind)}`}
            pressed={false}
            testId={`anel-${kind}`}
            onClick={() => {
              store.getState().addRing(kind);
            }}
          >
            <RingIcon kind={kind} />
          </RailButton>
        ))}
      </div>

      <span className={styles.divider} aria-hidden="true" />

      <div className={styles.group}>
        <RailButton
          label="Desfazer (Ctrl+Z)"
          name="Desfazer"
          pressed={false}
          disabled={!canUndo}
          onClick={() => {
            store.getState().undo();
          }}
        >
          <svg viewBox="0 0 18 18" aria-hidden="true" className={styles.icon}>
            <path
              d="M6 5.5 3 8.5l3 3M3.2 8.5h6.6a4 4 0 0 1 0 8H8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </RailButton>

        <RailButton
          label="Refazer (Ctrl+Shift+Z)"
          name="Refazer"
          pressed={false}
          disabled={!canRedo}
          onClick={() => {
            store.getState().redo();
          }}
        >
          <svg viewBox="0 0 18 18" aria-hidden="true" className={styles.icon}>
            <path
              d="M12 5.5l3 3-3 3M14.8 8.5H8.2a4 4 0 0 0 0 8H10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </RailButton>

        <RailButton
          label="Enquadrar a molécula (F)"
          name="Enquadrar"
          pressed={false}
          disabled={!hasAtoms}
          onClick={() => {
            store.getState().frame();
          }}
        >
          <svg viewBox="0 0 18 18" aria-hidden="true" className={styles.icon}>
            <path
              d="M3 6.5V3h3.5M15 6.5V3h-3.5M3 11.5V15h3.5M15 11.5V15h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </RailButton>

        <RailButton
          label="Nova molécula — limpa a tela, e Ctrl+Z traz de volta"
          name="Nova molécula"
          pressed={false}
          disabled={!hasAtoms}
          onClick={() => {
            store.getState().clear();
          }}
        >
          <svg viewBox="0 0 18 18" aria-hidden="true" className={styles.icon}>
            <path
              d="M4 5.5h10M7.5 5.5V4h3v1.5M5.5 5.5l.7 9h5.6l.7-9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </RailButton>
      </div>

      {tableOpen && (
        <PeriodicTable
          selected={element}
          onSelect={(symbol) => {
            store.getState().setElement(symbol);
            store.getState().setTool('structure');
            setTableOpen(false);
          }}
          onClose={() => {
            setTableOpen(false);
          }}
        />
      )}
    </div>
  );
}

interface RailButtonProps {
  /** O que aparece ao parar o cursor: pode trazer o atalho junto. */
  readonly label: string;
  /** O nome que o leitor de tela anuncia. Curto, sem atalho. */
  readonly name: string;
  readonly pressed: boolean;
  readonly disabled?: boolean;
  readonly testId?: string;
  readonly onClick: () => void;
  readonly children: ReactNode;
}

function RailButton({
  label,
  name,
  pressed,
  disabled = false,
  testId,
  onClick,
  children,
}: RailButtonProps): ReactElement {
  return (
    <button
      type="button"
      className={styles.button}
      aria-pressed={pressed}
      aria-label={name}
      title={label}
      disabled={disabled}
      data-testid={testId}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** O ícone do anel: o próprio polígono, com o que o distingue por dentro. */
function RingIcon({ kind }: { readonly kind: RingKind }): ReactElement {
  const sides = kind === 'cyclopentane' ? 5 : 6;
  const points: string[] = [];

  for (let vertex = 0; vertex < sides; vertex += 1) {
    const angle = -Math.PI / 2 + (2 * Math.PI * vertex) / sides;
    points.push(`${String(9 + Math.cos(angle) * 6.4)},${String(9 + Math.sin(angle) * 6.4)}`);
  }

  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className={styles.icon}>
      <polygon
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* O círculo no meio é como o livro desenha aromático. */}
      {(kind === 'benzene' || kind === 'pyridine') && (
        <circle cx="9" cy="9" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.1" />
      )}
      {kind === 'pyridine' && (
        <text x="9" y="4.4" textAnchor="middle" fontSize="5.2" fill="currentColor">
          N
        </text>
      )}
    </svg>
  );
}
