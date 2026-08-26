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
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { brotliCompress, constants, gzip } from 'node:zlib';
import { promisify } from 'node:util';

const comprimirBrotli = promisify(brotliCompress);
const comprimirGzip = promisify(gzip);

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

/**
 * Versões comprimidas, ao lado do original.
 *
 * O `.wasm` do RDKit tem 6,7 MB e encolhe 71% com gzip — a ideia de que "wasm já
 * vem compacto" é falsa, e custaria quarenta segundos de espera a um aluno em
 * rede lenta. Brotli aperta mais um pouco.
 *
 * Servidor que sabe servir arquivo pré-comprimido (Caddy com `precompressed br
 * gzip`) entrega estes; quem não sabe continua entregando o original. Nenhum dos
 * dois quebra.
 */
const paraComprimir = ['RDKit_minimal.js', 'RDKit_minimal.wasm', 'ocl-resources.json'];
const economia = [];

for (const file of paraComprimir) {
  const origem = path.join(target, file);
  const bruto = await readFile(origem);

  const br = await comprimirBrotli(bruto, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: 11,
      [constants.BROTLI_PARAM_SIZE_HINT]: bruto.length,
    },
  });
  const gz = await comprimirGzip(bruto, { level: 9 });

  await writeFile(`${origem}.br`, br);
  await writeFile(`${origem}.gz`, gz);

  const original = (await stat(origem)).size;
  economia.push(
    `${file}: ${Math.round(original / 1024)} KB -> br ${Math.round(br.length / 1024)} KB`,
  );
}

console.log(
  `copiado para public/chem/: RDKit ${rdkitPkg.version}, OpenChemLib ${oclPkg.version}`,
);
console.log(`pré-comprimido: ${economia.join(', ')}`);
