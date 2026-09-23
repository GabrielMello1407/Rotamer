'use client';

import {
  isEmpty,
  toMolblock,
  topologyKey,
  type AnalysisResult,
  type ChemistryErrorCode,
  type DynamicsTrajectory,
  type Geometry,
  type MoleculeGraph,
  type NormalModes,
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
  /** Os modos normais, que chegam por último — são os mais caros de calcular. */
  readonly modes: NormalModes | null;
  /**
   * Por que não há forma no espaço, quando a estrutura é válida mas a geometria
   * não saiu — elemento fora do campo de força, por exemplo. A cena mostra este
   * texto no lugar do convite genérico.
   */
  /**
   * O código da recusa da geometria, quando a forma no espaço não saiu.
   *
   * Código, não frase: o gancho sabe **que** falhou e quem sabe dizer isso no
   * idioma de quem está lendo é a tela, por `chemistryErrorText`.
   */
  readonly geometryError: ChemistryErrorCode | null;
  /** Verdadeiro enquanto o worker ainda não respondeu sobre este desenho. */
  readonly pending: boolean;
}

const NOTHING: MoleculeReading = {
  analysis: null,
  geometry: null,
  trajectory: null,
  modes: null,
  geometryError: null,
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
  onStereo?: (
    atoms: ReadonlyMap<number, string>,
    bonds: ReadonlyMap<number, string>,
  ) => void,
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

        // E a configuração de cada centro volta junto: `R`, `S`, ou `?` para o
        // centro que existe e que o desenho não definiu. Quem atribui é o RDKit
        // pela regra CIP; o editor só escreve a letra ao lado do átomo.
        if (analysis.ok && onStereo) {
          const labels = new Map<number, string>();

          for (const entry of analysis.molecule.stereo.atoms) {
            const atom = graph.atoms[entry.index];
            if (atom) labels.set(atom.id, entry.label);
          }

          // A dupla vem identificada pelos dois átomos; aqui ela vira o
          // identificador da ligação, que é o que o desenho conhece.
          const bonds = new Map<number, string>();

          for (const entry of analysis.molecule.stereo.bonds) {
            const [first, second] = entry.atoms;
            const left = graph.atoms[first]?.id;
            const right = graph.atoms[second]?.id;
            if (left === undefined || right === undefined) continue;

            const bond = graph.bonds.find(
              (candidate) =>
                (candidate.from === left && candidate.to === right) ||
                (candidate.from === right && candidate.to === left),
            );

            if (bond) bonds.set(bond.id, entry.label);
          }

          onStereo(labels, bonds);
        }

        if (!analysis.ok) {
          shownTopology.current = null;
          setReading({
            analysis,
            geometry: null,
            trajectory: null,
            modes: null,
            geometryError: null,
            pending: false,
          });
          return;
        }

        // Geometria só quando a topologia muda. Mesma molécula com o desenho
        // remexido: a cena 3D continua exatamente onde estava.
        if (shownTopology.current === topology) {
          setReading((current) => ({ ...current, analysis, pending: false }));
          return;
        }

        /*
         * Os números aparecem antes da forma.
         *
         * Fórmula, massa e descritores já estão prontos; esperar a conformação
         * para mostrá-los faz a faixa ficar vazia enquanto o campo de força
         * trabalha — e numa molécula de sessenta átomos isso são segundos de
         * tela parada com a resposta já calculada do lado de dentro.
         */
        setReading((current) => ({
          ...current,
          analysis,
          geometry: null,
          trajectory: null,
          modes: null,
          geometryError: null,
          pending: true,
        }));

        const conformation = await client.geometry(molblock);
        if (!alive) return;

        if (!conformation.ok) {
          // A estrutura vale; o que faltou foi a forma. O motivo vai para a
          // cena em vez de sumir num erro de programa.
          shownTopology.current = null;
          setReading({
            analysis,
            geometry: null,
            trajectory: null,
            modes: null,
            geometryError: conformation.error.code,
            pending: false,
          });
          return;
        }

        shownTopology.current = topology;
        setReading({
          analysis,
          geometry: conformation.geometry,
          trajectory: null,
          modes: null,
          geometryError: null,
          pending: false,
        });

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

        // Os modos normais são a conta mais cara do produto — Hessiana por
        // diferenças finitas e diagonalização. Vêm por último, e a cena inteira
        // já está funcionando sem eles.
        const normal = await client.modes(molblock);
        if (!alive || !normal.ok) return;

        setReading((current) =>
          current.geometry === conformation.geometry
            ? { ...current, modes: normal.modes }
            : current,
        );
      };

      void read();
    }, QUIET_MS);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [molblock, topology, empty, client, graph.atoms, graph.bonds, onHydrogens, onStereo]);

  // Tela em branco não guarda leitura antiga: apagar tudo apaga os números.
  return empty ? NOTHING : reading;
}
