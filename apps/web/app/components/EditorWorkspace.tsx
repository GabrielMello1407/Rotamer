'use client';

import { Editor2D, Toolbar, createEditorStore } from '@rotamer/editor2d';
import { Viewer3D } from '@rotamer/viewer3d';
import { useMemo, type ReactElement } from 'react';
import { useStore } from 'zustand';
import styles from './EditorWorkspace.module.css';
import { MoleculeMetrics } from './MoleculeMetrics';
import { useChemistryClient } from './use-chemistry-client';
import { useMolecule } from './use-molecule';

/**
 * A bancada: desenho, métricas e a cena 3D.
 *
 * O grafo do editor é a única coisa que existe de verdade aqui. Tudo o que
 * aparece ao lado — fórmula, massa, descritores, conformação — é derivado dele
 * pelo worker e recalculável a qualquer momento.
 */
export function EditorWorkspace(): ReactElement {
  const store = useMemo(() => createEditorStore(), []);
  const graph = useStore(store, (state) => state.graph);

  const connection = useChemistryClient();
  const { analysis, geometry, pending } = useMolecule(graph, connection);

  return (
    <div className={styles.workspace}>
      <MoleculeMetrics
        analysis={analysis}
        pending={pending}
        waitingForEngine={connection.status === 'loading' && graph.atoms.length > 0}
      />

      <div className={styles.stage}>
        <div className={styles.canvasArea}>
          <Toolbar store={store} className={styles.toolbar} />
          <Editor2D store={store} />
        </div>

        <div className={styles.side}>
          <Viewer3D geometry={geometry} />
        </div>
      </div>
    </div>
  );
}
