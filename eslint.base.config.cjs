/**
 * Base ESLint configuration for all packages.
 * All package-level eslint.config.cjs files should extend this config.
 */
const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const nxPlugin = require('@nx/eslint-plugin');

/**
 * Creates the base ESLint config for a package.
 * @param {string} baseDirectory - The __dirname of the package's eslint.config.cjs
 * @returns {Array} ESLint flat config array
 */
function createBaseConfig(baseDirectory) {
  const compat = new FlatCompat({
    baseDirectory,
    recommendedConfig: js.configs.recommended,
  });

  return [
    js.configs.recommended,
    ...compat.extends('plugin:@typescript-eslint/recommended'),
    {
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: {
        parser: tsparser,
        parserOptions: {
          project: ['./tsconfig.lib.json', './tsconfig.spec.json'],
        },
      },
      plugins: {
        '@typescript-eslint': tseslint,
        '@nx': nxPlugin,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      },
    },
    {
      files: ['**/*.spec.ts', '**/*.test.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['**/*.json'],
      plugins: {
        '@nx': nxPlugin,
      },
      rules: {
        '@nx/dependency-checks': [
          'error',
          {
            ignoredFiles: [
              '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
              '{projectRoot}/vite.config.{js,ts,mjs,mts}',
              '{projectRoot}/vitest.config.{js,ts,mjs,mts}',
            ],
            ignoredDependencies: ['vitest', '@nx/vite'],
          },
        ],
      },
      languageOptions: {
        parser: require('jsonc-eslint-parser'),
      },
    },
    {
      ignores: ['dist/**', 'node_modules/**', 'eslint.config.cjs'],
    },
  ];
}

module.exports = { createBaseConfig };
