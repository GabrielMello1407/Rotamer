'use client';

import { Button } from '@rotamer/ui';
import { useSyncExternalStore, type ReactElement } from 'react';
import styles from './ThemeToggle.module.css';

/** Três estados: o sistema decide, ou a pessoa decide. */
type Theme = 'system' | 'light' | 'dark';

const OPTIONS: readonly { readonly theme: Theme; readonly text: string }[] = [
  { theme: 'system', text: 'Sistema' },
  { theme: 'light', text: 'Claro' },
  { theme: 'dark', text: 'Escuro' },
];

const STORAGE_KEY = 'rotamer-theme';

/**
 * O tema vive no atributo `data-theme` do elemento raiz — escrito antes da
 * primeira pintura pelo script do layout. Ler dali, em vez de guardar uma cópia
 * em estado, evita que a tela mostre um tema enquanto o documento está em outro.
 */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => {
    observer.disconnect();
  };
}

function readTheme(): Theme {
  const marked = document.documentElement.getAttribute('data-theme');
  return marked === 'light' || marked === 'dark' ? marked : 'system';
}

/** No servidor não existe escolha: o padrão é deixar o sistema decidir. */
function readThemeOnServer(): Theme {
  return 'system';
}

function apply(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }

  try {
    if (theme === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Sem armazenamento a escolha vale só para esta visita.
  }
}

/**
 * Claro e escuro sempre juntos, e "sistema" como padrão — que não marca nada e
 * deixa o `prefers-color-scheme` responder.
 */
export function ThemeToggle(): ReactElement {
  const theme = useSyncExternalStore(subscribe, readTheme, readThemeOnServer);

  return (
    <div className={styles.toggle} role="group" aria-label="Tema">
      {OPTIONS.map((option) => (
        <Button
          key={option.theme}
          variant="ghost"
          size="small"
          className={styles.option}
          aria-pressed={theme === option.theme}
          onClick={() => {
            apply(option.theme);
          }}
        >
          {option.text}
        </Button>
      ))}
    </div>
  );
}
