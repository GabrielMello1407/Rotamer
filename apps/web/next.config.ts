import path from 'node:path';
import type { NextConfig } from 'next';

const monorepoRoot = path.join(import.meta.dirname, '..', '..');

const config: NextConfig = {
  // Os pacotes internos são publicados como TypeScript, sem passo de build.
  transpilePackages: [
    '@rotamer/core',
    '@rotamer/editor2d',
    '@rotamer/quests',
    '@rotamer/ui',
    '@rotamer/viewer3d',
  ],

  turbopack: {
    // Sem isto o Turbopack tenta adivinhar a raiz e acha a pasta errada.
    root: monorepoRoot,
  },

  // O RDKit também roda no servidor, na página pública de molécula. O bundle
  // dele fala com o sistema de arquivos: precisa ficar fora do empacotamento.
  serverExternalPackages: ['@rdkit/rdkit'],

  outputFileTracingRoot: monorepoRoot,

  /**
   * O motor de química é imutável por versão.
   *
   * `RDKit_minimal.wasm` tem 6,7 MB (2 MB comprimido) e `ocl-resources.json`
   * mais 1,3 MB. Servidos com `max-age=0`, cada visita revalida e, na primeira
   * aula de uma turma inteira, cada aluno paga o download de novo.
   *
   * Os arquivos são copiados do `node_modules` no `prebuild` e só mudam quando a
   * versão do RDKit muda — que é exatamente o caso em que `immutable` vale: o
   * conteúdo daquele caminho não muda sem o pacote mudar junto.
   */
  headers() {
    return Promise.resolve([
      {
        source: '/chem/:file*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]);
  },

  typescript: { ignoreBuildErrors: false },
};

export default config;
