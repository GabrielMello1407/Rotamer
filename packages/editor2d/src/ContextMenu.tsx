import { useLocale, useMessages } from '@rotamer/i18n/react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import styles from './ContextMenu.module.css';
import { elementName } from './element-names';
import { INNER_PERIODS, PERIODIC_TABLE, blockOf } from './elements-table';
import { contextMenuMessages, toolbarMessages } from './messages';

/**
 * O menu do botão direito.
 *
 * Ele existe porque as ferramentas da barra são modos: para trocar uma ligação
 * de ordem é preciso estar na ferramenta certa e clicar no lugar certo, e quem
 * está aprendendo não sabe qual é a ferramenta certa. Apontar no que se quer
 * mudar e ler as opções daquilo é o caminho curto.
 *
 * O menu **não decide química**. Ele só chama as mesmas ações do grafo que a
 * barra chama; quem diz se o resultado existe continua sendo o RDKit, depois.
 */

export interface MenuItem {
  readonly kind: 'item';
  readonly label: string;
  /** Marcado quando esta já é a situação do que foi apontado. */
  readonly active?: boolean;
  readonly danger?: boolean;
  readonly testId?: string;
  readonly onPick: () => void;
}

export interface MenuElements {
  readonly kind: 'elements';
  readonly active: string | null;
  readonly onPick: (symbol: string) => void;
}

export interface MenuTitle {
  readonly kind: 'title';
  readonly label: string;
}

export type MenuEntry = MenuItem | MenuElements | MenuTitle | { readonly kind: 'divider' };

export interface ContextMenuProps {
  /** Onde o menu abre, em coordenadas da janela. */
  readonly x: number;
  readonly y: number;
  readonly entries: readonly MenuEntry[];
  readonly onClose: () => void;
}

/** Folga da borda da janela: menu colado no canto fica difícil de mirar. */
const MARGIN = 8;

export function ContextMenu({ x, y, entries, onClose }: ContextMenuProps): ReactElement {
  const labels = useMessages(contextMenuMessages);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [place, setPlace] = useState({ left: x, top: y });

  useEffect(() => {
    setMounted(true);
  }, []);

  /*
   * O menu cabe na janela.
   *
   * Aberto perto da borda de baixo, ele sairia da tela e as últimas opções
   * ficariam inalcançáveis — e é justamente no pé da tela que a molécula
   * costuma estar, porque a faixa de números empurra o desenho para cima.
   */
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const box = sheet.getBoundingClientRect();
    const left = Math.min(x, window.innerWidth - box.width - MARGIN);
    const top = Math.min(y, window.innerHeight - box.height - MARGIN);

    setPlace({ left: Math.max(MARGIN, left), top: Math.max(MARGIN, top) });
  }, [x, y, mounted, entries]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };

    // Qualquer clique fora fecha, e o gesto que fecha não vale como clique no
    // que está atrás: quem errou o menu não quer desenhar um átomo por engano.
    const onDown = (event: PointerEvent): void => {
      if (sheetRef.current?.contains(event.target as Node) === true) return;

      event.preventDefault();
      event.stopPropagation();
      onClose();
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('resize', onClose);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  if (!mounted) return <></>;

  return createPortal(
    <div
      ref={sheetRef}
      className={styles.menu}
      style={{ left: `${String(place.left)}px`, top: `${String(place.top)}px` }}
      role="menu"
      aria-label={labels.label}
      data-testid="menu-contexto"
    >
      {entries.map((entry, index) => {
        if (entry.kind === 'divider') {
          return <span key={`divisor-${String(index)}`} className={styles.divider} />;
        }

        if (entry.kind === 'title') {
          return (
            <p key={`titulo-${entry.label}`} className={styles.title}>
              {entry.label}
            </p>
          );
        }

        if (entry.kind === 'elements') {
          return (
            <MiniTable
              key={`elementos-${String(index)}`}
              active={entry.active}
              onPick={(symbol) => {
                entry.onPick(symbol);
                onClose();
              }}
            />
          );
        }

        return (
          <button
            key={entry.label}
            type="button"
            role="menuitem"
            className={[styles.item, entry.danger === true ? styles.danger : null]
              .filter(Boolean)
              .join(' ')}
            aria-current={entry.active === true}
            data-testid={entry.testId}
            onClick={() => {
              entry.onPick();
              onClose();
            }}
          >
            <span className={styles.label}>{entry.label}</span>
            {entry.active === true && (
              <span className={styles.check} aria-hidden="true">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}

/**
 * A tabela periódica inteira, do tamanho de um menu.
 *
 * Ela cabe aqui porque a forma da tabela **é** a informação: quem procura o
 * enxofre procura embaixo do oxigênio, não numa lista alfabética. Uma fileira de
 * nove elementos comuns economizaria espaço e tiraria justamente isso.
 *
 * O símbolo leva a cor CPK porque o símbolo é o átomo. O fundo e a borda da
 * célula, não — cor CPK em superfície de interface faz o vermelho deixar de
 * significar oxigênio.
 */
function MiniTable({
  active,
  onPick,
}: {
  readonly active: string | null;
  readonly onPick: (symbol: string) => void;
}): ReactElement {
  const locale = useLocale();
  const menuText = useMessages(toolbarMessages);
  const inner = new Set<number>(INNER_PERIODS);
  const main = PERIODIC_TABLE.filter((entry) => !inner.has(entry.period));
  const bottom = PERIODIC_TABLE.filter((entry) => inner.has(entry.period));

  const cell = (entry: (typeof PERIODIC_TABLE)[number], row: number): ReactElement => (
    <button
      key={entry.z}
      type="button"
      role="menuitemradio"
      aria-checked={active === entry.symbol}
      className={styles.cell}
      style={
        {
          '--group': entry.group,
          '--period': row,
          color: `var(--cpk-ink-${entry.symbol.toLowerCase()})`,
        } as Record<string, string | number>
      }
      data-block={blockOf(entry)}
      title={`${elementName(locale, entry.symbol)} · ${String(entry.z)}`}
      aria-label={menuText.element(elementName(locale, entry.symbol), entry.symbol)}
      data-testid={`menu-elemento-${entry.symbol}`}
      onClick={() => {
        onPick(entry.symbol);
      }}
    >
      {entry.symbol}
    </button>
  );

  return (
    <div className={styles.table}>
      <div className={styles.grid}>{main.map((entry) => cell(entry, entry.period))}</div>

      {/* Lantanídeos e actinídeos embaixo, como em toda tabela impressa: no
          lugar deles a tabela teria catorze colunas a mais. */}
      <div className={[styles.grid, styles.bottom].join(' ')}>
        {bottom.map((entry) => cell(entry, entry.period - 7))}
      </div>
    </div>
  );
}
