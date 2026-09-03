'use client';

import { CATALOG, type Track } from '@rotamer/quests';
import { Popover } from '@rotamer/editor2d';
import { Button } from '@rotamer/ui';
import { useMemo, useState, type ReactElement } from 'react';
import { addItem } from '../../../../actions/assignment';
import { messages } from '../../../messages';
import styles from './CatalogPicker.module.css';

export interface CatalogPickerProps {
  readonly assignmentId: string;
  /** Slugs já presentes na lista — aparecem marcados e desabilitados. */
  readonly existingSlugs: ReadonlySet<string>;
  readonly anchor: HTMLElement | null;
  readonly onClose: () => void;
  /**
   * Chamado uma vez, depois que todos os acréscimos marcados terminam.
   *
   * `addItem` não devolve o `id` da linha criada — só `position` (§5.2) — e
   * "subir/descer/remover" (§6.2) precisam do `id`. Em vez de a tela montar um
   * item incompleto, quem chama pede a leitura de novo ao servidor.
   */
  readonly onAdded: () => void;
}

const TRACKS: readonly { readonly value: Track | 'all'; readonly label: string }[] = [
  { value: 'all', label: messages.catalogPicker.trackAll },
  { value: 'structure', label: messages.catalogPicker.trackStructure },
  { value: 'geometry', label: messages.catalogPicker.trackGeometry },
  { value: 'property', label: messages.catalogPicker.trackProperty },
];

/**
 * "Escolher do catálogo" — popover ancorado no botão da lista (§6.2).
 *
 * Este é o catálogo **do produto** (`CATALOG`, em `@rotamer/quests`), o mesmo
 * que o `QuestPanel` já usa fora de turma — não o catálogo buscável de D-26/
 * D-27, que também traz missão de professor. Aqui não existe filtro
 * "Otimização": aquela trilha não tem missão (D-09), e um filtro vazio
 * insinuaria que teria.
 */
export function CatalogPicker({
  assignmentId,
  existingSlugs,
  anchor,
  onClose,
  onAdded,
}: CatalogPickerProps): ReactElement {
  const [track, setTrack] = useState<Track | 'all'>('all');
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = useMemo(
    () =>
      CATALOG.filter((quest) => (track === 'all' ? true : quest.track === track)).filter(
        (quest) => !existingSlugs.has(quest.slug),
      ),
    [track, existingSlugs],
  );

  const toggle = (slug: string): void => {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const confirm = (): void => {
    if (checked.size === 0 || pending) return;
    setPending(true);
    setError(null);

    const run = async (): Promise<void> => {
      for (const quest of CATALOG) {
        if (!checked.has(quest.slug)) continue;

        // Cada adição depende da posição que a anterior deixou — sequencial de propósito.
        const outcome = await addItem({ assignmentId, questSlug: quest.slug });
        if (outcome.status === 'rejected') {
          setError(outcome.reason);
          setPending(false);
          return;
        }
      }

      setPending(false);
      onAdded();
      onClose();
    };

    void run();
  };

  return (
    <Popover anchor={anchor} label={messages.catalogPicker.label} onClose={onClose} testId="catalogo-popover">
      <div className={styles.box}>
        <div className={styles.tracks} role="tablist" aria-label="Filtrar por trilha">
          {TRACKS.map((entry) => (
            <button
              key={entry.value}
              type="button"
              role="tab"
              aria-selected={track === entry.value}
              className={styles.trackChip}
              onClick={() => {
                setTrack(entry.value);
              }}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className={styles.list} data-testid="lista-catalogo">
          {available.length === 0 && <p className={styles.empty}>{messages.catalogPicker.emptyFiltered}</p>}

          {available.map((quest) => (
            <label key={quest.slug} className={styles.item}>
              <input
                type="checkbox"
                checked={checked.has(quest.slug)}
                onChange={() => {
                  toggle(quest.slug);
                }}
                data-testid={`catalogo-item-${quest.slug}`}
              />
              <span className={styles.itemTitle}>{quest.title}</span>
            </label>
          ))}

          {[...existingSlugs]
            .map((slug) => CATALOG.find((quest) => quest.slug === slug))
            .filter((quest): quest is (typeof CATALOG)[number] => quest !== undefined && (track === 'all' || quest.track === track))
            .map((quest) => (
              <div key={quest.slug} className={[styles.item, styles.itemDisabled].join(' ')}>
                <input type="checkbox" checked disabled />
                <span className={styles.itemTitle}>{quest.title}</span>
                <span className={styles.tag}>{messages.catalogPicker.alreadyInList}</span>
              </div>
            ))}
        </div>

        {error !== null && <p className={styles.error}>{error}</p>}

        <div className={styles.footer}>
          <Button
            size="small"
            onClick={confirm}
            disabled={checked.size === 0 || pending}
            data-testid="acrescentar-catalogo"
          >
            {messages.catalogPicker.addButton(checked.size)}
          </Button>
          <Button size="small" variant="ghost" onClick={onClose}>
            {messages.catalogPicker.cancel}
          </Button>
        </div>
      </div>
    </Popover>
  );
}
