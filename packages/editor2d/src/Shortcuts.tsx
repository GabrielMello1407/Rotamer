import { useEffect, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import styles from './Shortcuts.module.css';

export interface ShortcutsProps {
  readonly onClose: () => void;
}

/**
 * A folha de atalhos.
 *
 * Os atalhos existiam antes desta tela — o que não existia era como descobri-los
 * sem ler o código. Uma missão chega a dizer "tecle O", o que só é justo se a
 * pessoa souber que teclar faz alguma coisa.
 *
 * A lista é curta de propósito: o que acelera desenhar. Ela não é documentação
 * do produto, é a cola que se olha uma vez e não se olha mais.
 */

interface Group {
  readonly title: string;
  readonly rows: readonly (readonly [string, string])[];
}

const GROUPS: readonly Group[] = [
  {
    title: 'elementos',
    rows: [
      ['C', 'carbono'],
      ['N', 'nitrogênio'],
      ['O', 'oxigênio'],
      ['S', 'enxofre'],
      ['P', 'fósforo'],
      ['F', 'flúor'],
      ['L', 'cloro'],
      ['B', 'bromo'],
      ['I', 'iodo'],
      ['H', 'hidrogênio'],
    ],
  },
  {
    title: 'ferramentas',
    rows: [
      ['D', 'desenhar'],
      ['M', 'mover átomo ou a vista'],
      ['W', 'cunha e traço'],
      ['E', 'apagar'],
    ],
  },
  {
    title: 'na tela',
    rows: [
      ['0', 'enquadrar a molécula'],
      ['Delete', 'apagar o que está sob o cursor'],
      ['Ctrl+Z', 'desfazer'],
      ['Ctrl+Shift+Z', 'refazer'],
      ['Esc', 'fechar'],
    ],
  },
];

export function Shortcuts({ onClose }: ShortcutsProps): ReactElement {
  // O portal só existe no navegador: no servidor não há `document.body` para
  // receber a folha.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  if (!mounted) return <></>;

  return createPortal(
    <div
      className={styles.backdrop}
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label="Atalhos">
        <div className={styles.header}>
          <h2 className={styles.title}>Atalhos</h2>
          <button
            type="button"
            className={styles.close}
            aria-label="Fechar os atalhos"
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

        <div className={styles.groups}>
          {GROUPS.map((group) => (
            <section key={group.title} className={styles.group}>
              <h3 className={styles.groupTitle}>{group.title}</h3>

              <dl className={styles.rows}>
                {group.rows.map(([key, what]) => (
                  <div key={key} className={styles.row}>
                    <dt>
                      <kbd className={styles.key}>{key}</kbd>
                    </dt>
                    <dd className={styles.what}>{what}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <p className={styles.quiet}>
          As letras valem em qualquer lugar da página, menos enquanto você escreve num campo de
          texto.
        </p>
      </div>
    </div>,
    document.body,
  );
}
