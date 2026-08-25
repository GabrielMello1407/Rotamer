/**
 * Copia os arquivos dos dois motores para `public/chem/`.
 *
 * - `RDKit_minimal.js` e `RDKit_minimal.wasm`: o RDKit, que decide toda pergunta
 *   química. O bundle npm fala com o sistema de arquivos do Node e não sobrevive
 *   a empacotamento para a web, então é servido pronto e carregado pelo worker.
 * - `ocl-resources.json`: as tabelas de parâmetros do MMFF94, usadas só depois
 *   que o RDKit já aprovou a estrutura (ver `DECISOES.md` D-10).
 *
 * Tudo sai de `node_modules`, sempre na versão travada no `pnpm-lock.yaml` —
 * nunca de uma cópia versionada à mão que envelhece sem ninguém notar.
 */
import { createRequire } from 'node:module';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);

const target = path.join(import.meta.dirname, '..', 'public', 'chem');
await mkdir(target, { recursive: true });

const rdkitDir = path.dirname(require.resolve('@rdkit/rdkit'));
const rdkitPkg = JSON.parse(await readFile(require.resolve('@rdkit/rdkit/package.json'), 'utf8'));

for (const file of ['RDKit_minimal.js', 'RDKit_minimal.wasm']) {
  await copyFile(path.join(rdkitDir, file), path.join(target, file));
}

// O OpenChemLib não expõe o próprio `package.json` no mapa de exports, então o
// caminho sai do arquivo de entrada.
const oclDist = path.dirname(require.resolve('openchemlib'));
const oclPkg = JSON.parse(await readFile(path.join(oclDist, '..', 'package.json'), 'utf8'));

await copyFile(path.join(oclDist, 'resources.json'), path.join(target, 'ocl-resources.json'));

console.log(
  `copiado para public/chem/: RDKit ${rdkitPkg.version}, OpenChemLib ${oclPkg.version}`,
);
