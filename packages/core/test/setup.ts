import { packageFactory } from '../src/chemistry/node';
import { configureRDKit } from '../src/chemistry/rdkit';

/**
 * No Node o RDKit vem do pacote npm, com o `.wasm` ao lado do módulo. No
 * navegador quem configura é o worker, com o script servido pelo app.
 */
configureRDKit({ loadFactory: packageFactory });
