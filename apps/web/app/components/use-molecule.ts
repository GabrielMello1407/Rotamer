'use client';

import {
  isEmpty,
  toMolblock,
  topologyKey,
  type AnalysisResult,
  type Geometry,
  type MoleculeGraph,
} from '@rotamer/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChemistryConnection } from './use-chemistry-client';

/**
 * Silêncio antes de perguntar ao RDKit.
 *
 * Debounce por intenção, não por tempo redondo: 120 ms é o intervalo em que a
 * pessoa parou de traçar. Perguntar a cada movimento do ponteiro desperdiça o
 * worker e faz o número piscar na tela.
 */
const QUIET_MS = 120;

export interface MoleculeReading {
  /** O que o RDKit respondeu sobre o desenho atual. */
  readonly analysis: AnalysisResult | null;
  /** Conformação da topologia atual, quando ela é válida. */
  readonly geometry: Geometry | null;
  /** Verdadeiro enquanto o worker ainda não respondeu sobre este desenho. */
  readonly pending: boolean;
}

const NOTHING: MoleculeReading = { analysis: null, geometry: null, pending: false };

/**
 * Lê a molécula desenhada: descritores sempre, geometria só quando a topologia
 * muda.
 *
 * Arrastar um átomo pela tela não muda a molécula — muda o desenho. Recalcular
 * conformação nesse caso seria queimar worker à toa e fazer a cena 3D pular sem
 * motivo nenhum.
 */
export function useMolecule(
  graph: MoleculeGraph,
  connection: ChemistryConnection,
): MoleculeReading {
  const [reading, setReading] = useState<MoleculeReading>(NOTHING);

  const molblock = useMemo(() => toMolblock(graph), [graph]);
  const topology = useMemo(() => topologyKey(graph), [graph]);
  const empty = isEmpty(graph);

  const shownTopology = useRef<string | null>(null);
  const client = connection.status === 'ready' ? connection.client : null;

  useEffect(() => {
    if (empty) {
      shownTopology.current = null;
      return;
    }
    if (!client) return;

    let alive = true;

    const timer = setTimeout(() => {
      const read = async (): Promise<void> => {
        setReading((current) => ({ ...current, pending: true }));

        const analysis = await client.analyze(molblock);
        if (!alive) return;

        if (!analysis.ok) {
          shownTopology.current = null;
          setReading({ analysis, geometry: null, pending: false });
          return;
        }

        // Geometria só quando a topologia muda. Mesma molécula com o desenho
        // remexido: a cena 3D continua exatamente onde estava.
        if (shownTopology.current === topology) {
          setReading((current) => ({ ...current, analysis, pending: false }));
          return;
        }

        const conformation = await client.geometry(molblock);
        if (!alive) return;

        if (conformation.ok) {
          shownTopology.current = topology;
          setReading({ analysis, geometry: conformation.geometry, pending: false });
        } else {
          shownTopology.current = null;
          setReading({ analysis, geometry: null, pending: false });
        }
      };

      void read();
    }, QUIET_MS);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [molblock, topology, empty, client]);

  // Tela em branco não guarda leitura antiga: apagar tudo apaga os números.
  return empty ? NOTHING : reading;
}
