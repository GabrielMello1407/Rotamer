import { packageFactory } from '../src/chemistry/node';
import { configureRDKit } from '../src/chemistry/rdkit';
import { configureGeometry } from '../src/geometry/openchemlib';

/**
 * No Node os dois motores carregam do pacote npm: o RDKit com o `.wasm` ao lado
 * do módulo, e as tabelas do MMFF94 lidas do disco. No navegador quem configura
 * é o worker, com os arquivos que o app serve.
 */
configureRDKit({ loadFactory: packageFactory });
configureGeometry({
  registerResources: (ocl) => {
    ocl.Resources.registerFromNodejs();
  },
});
