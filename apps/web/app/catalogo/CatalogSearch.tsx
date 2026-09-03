'use client';

import { Label } from '@rotamer/ui';
import Link from 'next/link';
import { useEffect, useState, type ReactElement } from 'react';
import { readCatalog, type CatalogEntry } from '../actions/assignment';
import { messages } from '../turmas/messages';
import styles from './page.module.css';

export interface CatalogSearchProps {
  readonly initialEntries: readonly CatalogEntry[];
}

const TRACK_NAMES: Readonly<Record<string, string>> = {
  structure: 'Estrutura',
  geometry: 'Geometria',
  property: 'Propriedade',
};

/** Silêncio antes de perguntar de novo — a mesma ideia do debounce do editor, sem ser química. */
const QUIET_MS = 200;

/**
 * A busca do catálogo (D-26, D-27) — por nome, trilha ou grupo funcional.
 *
 * A busca já acontece no servidor (`readCatalog`), sobre título e os rótulos
 * **gerados** dos objetivos — nunca sobre texto digitado num campo de
 * etiqueta.
 */
export function CatalogSearch({ initialEntries }: CatalogSearchProps): ReactElement {
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<readonly CatalogEntry[]>(initialEntries);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void readCatalog({ query }).then(setEntries);
    }, QUIET_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className={styles.wrap}>
      <label className={styles.searchField}>
        <Label>{messages.catalog.searchLabel}</Label>
        <input
          className={styles.searchInput}
          value={query}
          placeholder={messages.catalog.searchPlaceholder}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          data-testid="busca-catalogo"
        />
      </label>

      {entries.length === 0 ? (
        <p className={styles.empty}>{messages.catalog.empty}</p>
      ) : (
        <ul className={styles.list} data-testid="resultado-catalogo">
          {entries.map((entry) => (
            <li key={entry.slug} className={styles.row} data-testid={`catalogo-resultado-${entry.slug}`}>
              <Link className={styles.name} href={`/?missao=${encodeURIComponent(entry.slug)}`}>
                {entry.title}
              </Link>

              <div className={styles.meta}>
                {entry.track !== undefined && <span className={styles.track}>{TRACK_NAMES[entry.track]}</span>}
                {entry.byTeacher !== null && (
                  <span className={styles.author}>
                    {messages.catalog.byTeacher(entry.byTeacher.name, entry.byTeacher.institution)}
                  </span>
                )}
              </div>

              {entry.labels.length > 0 && (
                <ul className={styles.labels}>
                  {entry.labels.map((label) => (
                    <li key={label} className={styles.label}>
                      {label}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
