'use client';

import type { AnalysisResult } from '@rotamer/core';
import { useMessages } from '@rotamer/i18n/react';
import { Button } from '@rotamer/ui';
import { useState, type ReactElement } from 'react';
import { moleculePath } from '../../lib/molecule-url';
import { shareLinkMessages } from './messages';

export interface ShareLinkProps {
  readonly analysis: AnalysisResult | null;
}

/**
 * O endereço público da molécula desenhada.
 *
 * A página pública não guarda nada: o SMILES canônico vai na própria URL, e o
 * servidor recalcula tudo na hora. Duas pessoas que desenharem a mesma molécula
 * de jeitos diferentes chegam ao mesmo link.
 */
export function ShareLink({ analysis }: ShareLinkProps): ReactElement | null {
  const messages = useMessages(shareLinkMessages);
  const [copied, setCopied] = useState(false);

  if (analysis === null || !analysis.ok) return null;

  const path = moleculePath(analysis.molecule.smiles);

  const copy = (): void => {
    const address = new URL(path, window.location.href).href;

    const finish = (): void => {
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    };

    // Área de transferência bloqueada não é erro: a página pública abre do mesmo
    // jeito pelo link ao lado.
    void navigator.clipboard?.writeText(address).then(finish, () => {
      window.open(address, '_blank', 'noopener');
    });
  };

  return (
    <Button size="small" variant="ghost" onClick={copy} data-testid="compartilhar">
      {copied ? messages.copied : messages.share}
    </Button>
  );
}
