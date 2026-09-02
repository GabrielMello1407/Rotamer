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
  /**
   * Quem pode falar com o servidor de desenvolvimento por outro endereço.
   *
   * Em desenvolvimento o Next recusa pedido vindo de origem diferente da que ele
   * está servindo, e recusa **sem quebrar a página**: o HTML chega, os pedaços
   * de JavaScript não. O efeito é a tela abrir e nada funcionar — foi o que
   * aconteceu ao mostrar o produto por um túnel do ngrok.
   *
   * A lista aceita **nome de máquina**, sem `https://` e sem barra no fim. Com
   * esquema ou barra a entrada nunca casa, e o aviso continua aparecendo como se
   * ninguém tivesse configurado nada.
   *
   * O endereço do ngrok muda a cada vez que o túnel sobe, então ele entra por
   * variável de ambiente: `NGROK_HOST=xxxx.ngrok-free.app pnpm dev`. O curinga
   * cobre o caso comum e a variável cobre domínio reservado ou outro serviço.
   */
  allowedDevOrigins: [
    '*.ngrok-free.app',
    '*.ngrok.app',
    ...(process.env['NGROK_HOST'] === undefined ? [] : [process.env['NGROK_HOST']]),
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
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]);
  },

  typescript: { ignoreBuildErrors: false },
};

export default config;
