/**
 * `@rotamer/core` — o núcleo determinístico.
 *
 * Não conhece React, Three.js nem o DOM, e roda em teste de linha de comando.
 * Toda pergunta química — validade, valência, fórmula, massa, SMILES, InChIKey,
 * descritores — é respondida aqui, pelo RDKit. O LLM só lê o que sai daqui.
 */
export { analyze } from './chemistry/analysis';
export { chemistryApi, type ChemistryApi } from './chemistry/api';
export { configureRDKit, loadRDKit, rdkitVersion, type RDKitOptions } from './chemistry/rdkit';
export { elementSymbol, hillFormula, maxValence } from './chemistry/elements';
export type {
  AnalysisResult,
  ChemistryError,
  ChemistryErrorCode,
  Descriptors,
  Molecule,
  OffendingAtom,
} from './chemistry/types';
