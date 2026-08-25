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

  typescript: { ignoreBuildErrors: false },
};

export default config;
