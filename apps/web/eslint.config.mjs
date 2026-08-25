import coreWebVitals from 'eslint-config-next/core-web-vitals';
import root, { typedParserOptions } from '../../eslint.config.mjs';

/** As regras da raiz — incluindo as duas de dependência — mais as do Next. */
const config = [
  ...root,
  ...coreWebVitals,
  {
    // O eslint-plugin-react tenta detectar a versão do React lendo o disco.
    // Dizendo a versão, ele nem tenta.
    settings: { react: { version: '19.2' } },
  },
  {
    // O preset do Next troca o parser. Devolvemos o parser com informação de
    // tipo, senão as regras type-aware da raiz não têm de onde ler os tipos.
    files: ['**/*.{ts,tsx}'],
    languageOptions: typedParserOptions,
  },
  {
    ignores: [
      '.next/**',
      'next-env.d.ts',
      'playwright-report/**',
      'test-results/**',
      // RDKit compilado, copiado de node_modules no build. Não é código nosso.
      'public/rdkit/**',
    ],
  },
];

export default config;
