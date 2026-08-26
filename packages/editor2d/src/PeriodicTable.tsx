'use client';

import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import {
  blockOf,
  COMMON_ELEMENTS,
  ELEMENT_NAMES,
  INNER_PERIODS,
  PERIODIC_TABLE,
  type TableEntry,
} from './elements-table';
import styles from './PeriodicTable.module.css';

export interface PeriodicTableProps {
  /** O elemento ativo agora, para a célula aparecer marcada. */
  readonly selected: string;
  readonly onSelect: (symbol: string) => void;
  readonly onClose: () => void;
}

const COMMON = new Set<string>(COMMON_ELEMENTS);
const INNER = new Set<number>(INNER_PERIODS);

/** Sem acento e em minúscula: quem digita "silicio" quer achar silício. */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * A tabela periódica inteira.
 *
 * A barra mostra os elementos da orgânica; quem precisa de ferro, silício ou
 * qualquer outro abre isto. A grade é a de sempre — grupo na coluna, período na
 * linha, lantanídeos e actinídeos nas duas faixas de baixo — porque é essa que
 * está pregada na parede da sala, e reaprender a posição do ferro não é parte da
 * tarefa de quem veio desenhar uma molécula.
 *
 * Célula sem moldura, só o número pequeno e o símbolo: cento e dezoito caixas
 * com borda viram uma parede. O bloco (s, p, d, f) aparece como um tom de fundo,
 * que é a informação que ajuda a achar sem competir com o símbolo.
 */
export function PeriodicTable({ selected, onSelect, onClose }: PeriodicTableProps): ReactElement {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  // A tabela cobre a página inteira, e a barra de ferramentas onde o botão vive
  // é uma caixa pequena e transformada — dentro dela, `position: fixed` passa a
  // se medir pela barra, não pela janela. Por isso ela sai do fluxo por portal.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape fecha, e o foco entra na busca: quem abriu já pode digitar o nome.
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const matches = useMemo(() => {
    const term = fold(search.trim());
    if (term === '') return null;

    return new Set(
      PERIODIC_TABLE.filter(
        (entry) =>
          fold(entry.symbol).startsWith(term) ||
          fold(ELEMENT_NAMES[entry.symbol] ?? '').includes(term) ||
          String(entry.z) === term,
      ).map((entry) => entry.symbol),
    );
  }, [search]);

  const only = matches !== null && matches.size === 1 ? [...matches][0] : null;

  const main = PERIODIC_TABLE.filter((entry) => !INNER.has(entry.period));
  const inner = PERIODIC_TABLE.filter((entry) => INNER.has(entry.period));

  const cell = (entry: TableEntry, row: number): ReactElement => {
    const name = ELEMENT_NAMES[entry.symbol] ?? entry.symbol;
    const dimmed = matches !== null && !matches.has(entry.symbol);

    return (
      <button
        key={entry.z}
        type="button"
        className={[
          styles.cell,
          COMMON.has(entry.symbol) ? styles.common : null,
          dimmed ? styles.dimmed : null,
        ]
          .filter(Boolean)
          .join(' ')}
        style={
          {
            '--group': entry.group,
            '--period': row,
          } as Record<string, string | number>
        }
        data-block={blockOf(entry)}
        aria-pressed={selected === entry.symbol}
        aria-label={`${name}, símbolo ${entry.symbol}, número atômico ${String(entry.z)}`}
        title={name}
        data-testid={`elemento-${entry.symbol}`}
        onClick={() => {
          onSelect(entry.symbol);
        }}
      >
        <span className={styles.number}>{entry.z}</span>
        <span className={styles.symbol} style={{ color: `var(--cpk-ink-${entry.symbol.toLowerCase()})` }}>
          {entry.symbol}
        </span>
      </button>
    );
  };

  if (!mounted) return <></>;

  return createPortal(
    <div
      className={styles.backdrop}
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="Tabela periódica"
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Tabela periódica</h2>

          <input
            className={styles.search}
            type="search"
            value={search}
            placeholder="Buscar por nome, símbolo ou número"
            aria-label="Buscar elemento"
            data-testid="buscar-elemento"
            autoFocus
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            onKeyDown={(event) => {
              // Um resultado só e Enter: escolhe sem precisar do mouse.
              if (event.key === 'Enter' && only !== undefined && only !== null) onSelect(only);
            }}
          />

          <button
            type="button"
            className={styles.close}
            aria-label="Fechar a tabela periódica"
            onClick={onClose}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.closeIcon}>
              <path
                d="M4 4l8 8M12 4l-8 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className={styles.grid} data-testid="tabela-periodica">
          {main.map((entry) => cell(entry, entry.period))}
        </div>

        <div className={[styles.grid, styles.innerBlock].join(' ')}>
          {inner.map((entry) => cell(entry, entry.period - 7))}
        </div>

        <p className={styles.note}>
          Escolher um elemento fecha a tabela e passa a desenhar com ele. Quem decide se a
          molécula resultante existe continua sendo o RDKit.
        </p>
      </div>
    </div>,
    document.body,
  );
}
