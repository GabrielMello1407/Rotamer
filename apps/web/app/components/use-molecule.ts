'use client';

import {
  isEmpty,
  toMolblock,
  topologyKey,
  type AnalysisResult,
  type DynamicsTrajectory,
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
  /** A vibração, que chega depois da forma. */
  readonly trajectory: DynamicsTrajectory | null;
  /** Verdadeiro enquanto o worker ainda não respondeu sobre este desenho. */
  readonly pending: boolean;
}

const NOTHING: MoleculeReading = {
  analysis: null,
  geometry: null,
  trajectory: null,
  pending: false,
};

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
  onHydrogens?: (hydrogens: ReadonlyMap<number, number>) => void,
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

        // Os hidrogênios voltam para o desenho: é o que faz o rótulo escrever
        // `OH` em vez de `O`. A ordem é a mesma do molblock, que saiu do grafo.
        if (analysis.ok && onHydrogens) {
          onHydrogens(
            new Map(
              graph.atoms.map((atom, index) => [
                atom.id,
                analysis.molecule.atomHydrogens[index] ?? 0,
              ]),
            ),
          );
        }

        if (!analysis.ok) {
          shownTopology.current = null;
          setReading({ analysis, geometry: null, trajectory: null, pending: false });
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

        if (!conformation.ok) {
          shownTopology.current = null;
          setReading({ analysis, geometry: null, trajectory: null, pending: false });
          return;
        }

        shownTopology.current = topology;
        setReading({ analysis, geometry: conformation.geometry, trajectory: null, pending: false });

        // A vibração vem depois: a forma aparece e começa a dobrar enquanto o
        // worker ainda está integrando a dinâmica. Quando ela chega, a cena
        // troca de regime sem interromper nada.
        const vibration = await client.dynamics(molblock);
        if (!alive || !vibration.ok) return;

        setReading((current) =>
          current.geometry === conformation.geometry
            ? { ...current, trajectory: vibration.trajectory }
            : current,
        );
      };

      void read();
    }, QUIET_MS);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [molblock, topology, empty, client, graph.atoms, onHydrogens]);

  // Tela em branco não guarda leitura antiga: apagar tudo apaga os números.
  return empty ? NOTHING : reading;
}
