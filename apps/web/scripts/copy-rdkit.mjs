/**
 * Copia o RDKit compilado para `public/rdkit/`.
 *
 * O worker carrega o `.js` e o `.wasm` por URL, então os dois precisam ser
 * servidos como arquivo estático — e precisam vir da versão exata que está
 * instalada, nunca de uma cópia versionada à mão que envelhece sem ninguém
 * notar. O bundle do pacote fala com o sistema de arquivos do Node e não
 * sobrevive a empacotamento para o navegador; servi-lo pronto é o caminho que a
 * própria RDKit.js documenta.
 */
import { createRequire } from 'node:module';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);

const source = path.dirname(require.resolve('@rdkit/rdkit'));
const target = path.join(import.meta.dirname, '..', 'public', 'rdkit');

const pkg = JSON.parse(await readFile(require.resolve('@rdkit/rdkit/package.json'), 'utf8'));

await mkdir(target, { recursive: true });

for (const file of ['RDKit_minimal.js', 'RDKit_minimal.wasm']) {
  await copyFile(path.join(source, file), path.join(target, file));
}

console.log(`RDKit ${pkg.version}: copiado para public/rdkit/`);
