import { useLocale, useMessages } from '@rotamer/i18n/react';
import { type ReactElement } from 'react';
import { elementName } from './element-names';
import { ELEMENT_SHORTCUTS } from './keys';
import { shortcutsMessages } from './messages';
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

export function Shortcuts({ anchor, onClose }: ShortcutsProps): ReactElement {
  const locale = useLocale();
  const messages = useMessages(shortcutsMessages);

  /*
   * A tecla vem de `keys.ts` e o que ela faz vem do dicionário. É o que
   * mantém a promessa da folha: tecla nova aparece aqui sozinha, e frase nova
   * não compila sem os dois idiomas.
   */
  const groups: readonly Group[] = [
    {
      title: messages.elements,
      rows: ELEMENT_SHORTCUTS.map(
        (entry) => [entry.key, elementName(locale, entry.symbol).toLocaleLowerCase(locale)] as const,
      ),
    },
    {
      title: messages.tools,
      rows: [
        ['D', messages.draw],
        ['M', messages.move],
        ['V', messages.select],
        ['W', messages.stereo],
        ['E', messages.erase],
      ],
    },
    {
      title: messages.onScreen,
      rows: [
        ['0', messages.fit],
        ['Ctrl+A', messages.selectAll],
        ['Delete', messages.deleteSelection],
        ['Ctrl+Z', messages.undo],
        ['Ctrl+Shift+Z', messages.redo],
        ['Ctrl+Y', messages.redoToo],
        ['Esc', messages.close],
      ],
    },
  ];

  return (
    <Popover anchor={anchor} label={messages.title} className={styles.sheet} onClose={onClose}>
      <h2 className={styles.title}>{messages.title}</h2>

      <div className={styles.groups}>
        {groups.map((group) => (
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

      <p className={styles.quiet}>{messages.footnote}</p>
    </Popover>
  );
}
