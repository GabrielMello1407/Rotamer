/**
 * `@rotamer/viewer3d` — a cena tridimensional.
 *
 * Motor de render apenas: as coordenadas chegam prontas do worker e nenhuma
 * decisão química acontece aqui dentro.
 */
export { Viewer3D, type Viewer3DProps } from './Viewer3D';
export { Molecule, type MoleculeProps } from './Molecule';
export { centerOf, radiusOf as moleculeRadius, sampleFolding, FOLD_DURATION } from './folding';
export { readCpk, colorOf, radiusOf as atomRadius, type Cpk } from './cpk';
