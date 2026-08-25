'use client';

import type { AnalysisResult } from '@rotamer/core';
import { Button } from '@rotamer/ui';
import { useState, type ReactElement } from 'react';
import type { ChemistryConnection } from './use-chemistry-client';
import styles from './ExportMenu.module.css';

export interface ExportMenuProps {
  readonly analysis: AnalysisResult | null;
  readonly connection: ChemistryConnection;
}

/**
 * Levar a molécula embora.
 *
 * "Uma molécula construída no Rotamer aparece num slide de aula" é um dos sinais
 * de que o produto está funcionando — e sem exportar, o professor tira print da
 * tela inteira, com barra de ferramentas e tudo.
 *
 * São duas saídas diferentes de propósito: o SVG é o desenho que o RDKit faz da
 * estrutura, limpo e em qualidade de publicação; o PNG é a tela como está, com o
 * traço da pessoa. Slide pede o primeiro; caderno, às vezes, o segundo.
 */
export function ExportMenu({ analysis, connection }: ExportMenuProps): ReactElement | null {
  const [busy, setBusy] = useState(false);

  if (analysis === null || !analysis.ok) return null;

  const base = `rotamer-${analysis.molecule.formula}`;

  const saveSvg = (): void => {
    if (connection.status !== 'ready') return;

    setBusy(true);
    const run = async (): Promise<void> => {
      const svg = await connection.client.depict(analysis.molecule.molblock);
      if (svg !== null) {
        download(new Blob([svg], { type: 'image/svg+xml' }), `${base}.svg`);
      }
      setBusy(false);
    };

    void run();
  };

  const savePng = (): void => {
    const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="tela-de-desenho"]');
    if (canvas === null) return;

    canvas.toBlob((blob) => {
      if (blob !== null) download(blob, `${base}.png`);
    }, 'image/png');
  };

  return (
    <div className={styles.menu}>
      <Button size="small" variant="ghost" disabled={busy} onClick={saveSvg} data-testid="baixar-svg">
        {busy ? 'Gerando…' : 'SVG'}
      </Button>
      <Button size="small" variant="ghost" onClick={savePng} data-testid="baixar-png">
        PNG
      </Button>
    </div>
  );
}

/** Entrega o arquivo ao navegador e limpa o endereço temporário. */
function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();

  // Sem isto o blob fica pendurado na memória até a aba fechar.
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
