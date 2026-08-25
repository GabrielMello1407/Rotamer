import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/** Opções de parser com informação de tipo, reaproveitadas pelo app. */
export const typedParserOptions = {
  parser: tseslint.parser,
  parserOptions: {
    projectService: true,
    tsconfigRootDir: import.meta.dirname,
  },
};

/**
 * Configuração raiz. `apps/web` estende esta e acrescenta as regras do Next.
 *
 * As duas regras de dependência da arquitetura são verificadas aqui, não só
 * documentadas: `core` não depende de ninguém e ninguém depende de `editor2d`.
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/next-env.d.ts',
    ],
  },

  js.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: typedParserOptions,
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Regra de dependência: nenhum pacote importa `editor2d` — só o app, que é
  // quem monta a tela. A interface de desenho continua substituível sem tocar
  // em nada abaixo dela.
  {
    files: ['packages/**/*.{ts,tsx}'],
    ignores: ['packages/editor2d/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@rotamer/editor2d', '@rotamer/editor2d/*'],
              message:
                'Nenhum pacote depende de editor2d — só o app. A interface de desenho é substituível: mova a lógica para core.',
            },
          ],
        },
      ],
    },
  },

  // Regra de dependência: `core` não depende de ninguém, nem conhece React,
  // Three.js ou o DOM. Ele precisa continuar rodando em teste de linha de comando.
  {
    files: ['packages/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                'react/*',
                'next',
                'next/*',
                'three',
                'three/*',
                '@react-three/*',
                'zustand',
                'zustand/*',
                '@rotamer/*',
              ],
              message:
                'core não depende de ninguém e não conhece React, Three.js nem o DOM. Se precisa disso, a lógica está na camada errada.',
            },
          ],
        },
      ],
    },
  },

  // Scripts e arquivos de configuração em JS puro: sem checagem de tipo.
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        URL: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
);
