import { type ReactElement } from 'react';
import { Popover } from './Popover';
import styles from './Shortcuts.module.css';

export interface ShortcutsProps {
  /** O botão que abriu — a caixa sai dele. */
  readonly anchor: HTMLElement | null;
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
 * do produto, é a cola que se olha uma vez e não se olha mais — e por isso ela
 * sai do botão, ao lado da bancada, em vez de cobrir a tela inteira.
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
      ['V', 'selecionar um pedaço'],
      ['W', 'cunha e traço'],
      ['E', 'apagar'],
    ],
  },
  {
    title: 'na tela',
    rows: [
      ['0', 'enquadrar a molécula'],
      ['Ctrl+A', 'selecionar tudo'],
      ['Delete', 'apagar a seleção, ou o que está sob o cursor'],
      ['Ctrl+Z', 'desfazer'],
      ['Ctrl+Shift+Z', 'refazer'],
      ['Esc', 'fechar'],
    ],
  },
];

export function Shortcuts({ anchor, onClose }: ShortcutsProps): ReactElement {
  return (
    <Popover anchor={anchor} label="Atalhos" className={styles.sheet} onClose={onClose}>
      <h2 className={styles.title}>Atalhos</h2>

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
    </Popover>
  );
}
