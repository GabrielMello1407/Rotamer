'use client';

import { useLocale, useMessages } from '@rotamer/i18n/react';
import { useMemo, useState, type ReactElement } from 'react';
import { ELEMENT_SEARCH_ALIASES, elementName } from './element-names';
import {
  blockOf,
  COMMON_ELEMENTS,
  INNER_PERIODS,
  PERIODIC_TABLE,
  type TableEntry,
} from './elements-table';
import { periodicTableMessages } from './messages';
import { Popover } from './Popover';
import styles from './PeriodicTable.module.css';

export interface PeriodicTableProps {
  /** O elemento ativo agora, para a célula aparecer marcada. */
  readonly selected: string;
  /** O botão que abriu — a caixa sai dele. */
  readonly anchor: HTMLElement | null;
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
 *
 * Ela sai do botão, e não do meio da tela: era um modal de tela cheia que
 * escurecia a bancada inteira para mostrar uma grade. Escolher silício é escolha
 * comum, feita no meio do desenho — a molécula continua visível ao lado.
 */
export function PeriodicTable({
  selected,
  anchor,
  onSelect,
  onClose,
}: PeriodicTableProps): ReactElement {
  const locale = useLocale();
  const messages = useMessages(periodicTableMessages);
  const [search, setSearch] = useState('');

  /**
   * A busca acha pelo nome no idioma da tela, e também pelo do outro idioma:
   * quem aprendeu química em inglês digita "sulfur" mesmo com a tela em
   * português, e o contrário também acontece. Custa nada e evita tabela vazia.
   */
  const matches = useMemo(() => {
    const term = fold(search.trim());
    if (term === '') return null;

    return new Set(
      PERIODIC_TABLE.filter(
        (entry) =>
          fold(entry.symbol).startsWith(term) ||
          fold(elementName('pt-BR', entry.symbol)).includes(term) ||
          fold(elementName('en', entry.symbol)).includes(term) ||
          (ELEMENT_SEARCH_ALIASES[entry.symbol] ?? []).some((alias) => alias.includes(term)) ||
          String(entry.z) === term,
      ).map((entry) => entry.symbol),
    );
  }, [search]);

  const only = matches !== null && matches.size === 1 ? [...matches][0] : null;

  const main = PERIODIC_TABLE.filter((entry) => !INNER.has(entry.period));
  const inner = PERIODIC_TABLE.filter((entry) => INNER.has(entry.period));

  const cell = (entry: TableEntry, row: number): ReactElement => {
    const name = elementName(locale, entry.symbol);
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
        aria-label={messages.cell(name, entry.symbol, entry.z)}
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

  return (
    <Popover
      anchor={anchor}
      label={messages.title}
      className={styles.sheet}
      onClose={onClose}
    >
      <div className={styles.header}>
        <input
          className={styles.search}
          type="search"
          value={search}
          placeholder={messages.searchPlaceholder}
          aria-label={messages.searchLabel}
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
      </div>

      <div className={styles.grid} data-testid="tabela-periodica">
        {main.map((entry) => cell(entry, entry.period))}
      </div>

      <div className={[styles.grid, styles.innerBlock].join(' ')}>
        {inner.map((entry) => cell(entry, entry.period - 7))}
      </div>
    </Popover>
  );
}
