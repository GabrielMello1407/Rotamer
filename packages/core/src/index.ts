/**
 * `@rotamer/core` — o núcleo determinístico.
 *
 * Não conhece React, Three.js nem o DOM, e roda em teste de linha de comando.
 * Toda pergunta química — validade, valência, fórmula, massa, SMILES, InChIKey,
 * descritores — é respondida aqui, pelo RDKit. O LLM só lê o que sai daqui.
 */

// ---- química ----
export { analyze } from './chemistry/analysis';
export { chemistryApi, type ChemistryApi, type GeometryResult } from './chemistry/api';
export { depict, type DepictionOptions } from './chemistry/depiction';
export { configureRDKit, loadRDKit, rdkitVersion, type RDKitOptions } from './chemistry/rdkit';
export { elementSymbol, hillFormula, maxValence } from './chemistry/elements';
export {
  detectFunctionalGroups,
  type FunctionalGroup,
  type FunctionalGroupId,
} from './chemistry/groups';
export type {
  AnalysisResult,
  ChemistryError,
  ChemistryErrorCode,
  Descriptors,
  Molecule,
  OffendingAtom,
} from './chemistry/types';

// ---- grafo: a fonte de verdade ----
export {
  addAtom,
  addBond,
  bondBetween,
  cycleBondOrder,
  emptyGraph,
  findAtom,
  findBond,
  isEmpty,
  moveAtom,
  neighbors,
  removeAtom,
  removeBond,
  setBondOrder,
  setCharge,
  setElement,
  topologyKey,
  type AddAtomResult,
  type AddBondResult,
} from './graph/operations';
export { fromMolblock, toMolblock } from './graph/molfile';
export {
  BOND_LENGTH,
  type AtomId,
  type BondId,
  type BondOrder,
  type GraphAtom,
  type GraphBond,
  type MoleculeGraph,
  type NewAtom,
} from './graph/types';

// ---- geometria ----
export { generateGeometry } from './geometry/conformer';
export {
  configureGeometry,
  loadOpenChemLib,
  type OpenChemLib,
  type OpenChemLibOptions,
} from './geometry/openchemlib';
export type {
  FoldingFrame,
  Geometry,
  GeometryAtom,
  GeometryBond,
  GeometryOptions,
} from './geometry/types';
