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
 * Module boundary rules enforce the dependency architecture:
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                        PromptScript                             │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                                                                 │
 * │  ┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐  │
 * │  │  core    │───▶│  parser  │───▶│ resolver  │───▶│validator │  │
 * │  └──────────┘    └──────────┘    └───────────┘    └──────────┘  │
 * │       │                                                  │      │
 * │       │              ┌───────────┐                       │      │
 * │       └─────────────▶│ compiler  │◀──────────────────────┘      │
 * │                      └─────┬─────┘                              │
 * │                            │                                    │
 * │                      ┌───────────┐                              │
 * │                      │formatters │                              │
 * │                      └─────┬─────┘                              │
 * │                            │                                    │
 * │                      ┌──────────┐                               │
 * │                      │   cli    │                               │
 * │                      └──────────┘                               │
 * │                                                                 │
 * └─────────────────────────────────────────────────────────────────┘
 */
const moduleBoundaryRules = [
  // Core has no dependencies - it's the foundation
  {
    sourceTag: 'scope:core',
    onlyDependOnLibsWithTags: [],
  },
  // Parser depends only on core
  {
    sourceTag: 'scope:parser',
    onlyDependOnLibsWithTags: ['scope:core'],
  },
  // Resolver depends on core and parser
  {
    sourceTag: 'scope:resolver',
    onlyDependOnLibsWithTags: ['scope:core', 'scope:parser'],
  },
  // Validator depends only on core
  {
    sourceTag: 'scope:validator',
    onlyDependOnLibsWithTags: ['scope:core'],
  },
  // Formatters depends only on core
  {
    sourceTag: 'scope:formatters',
    onlyDependOnLibsWithTags: ['scope:core'],
  },
  // Compiler depends on core, resolver, validator, formatters
  {
    sourceTag: 'scope:compiler',
    onlyDependOnLibsWithTags: [
      'scope:core',
      'scope:resolver',
      'scope:validator',
      'scope:formatters',
    ],
  },
  // CLI (app) can depend on everything
  {
    sourceTag: 'type:app',
    onlyDependOnLibsWithTags: [
      'scope:core',
      'scope:parser',
      'scope:resolver',
      'scope:validator',
      'scope:compiler',
      'scope:formatters',
      'scope:browser-compiler',
    ],
  },
  // Browser compiler depends on core, parser, validator, formatters
  {
    sourceTag: 'scope:browser-compiler',
    onlyDependOnLibsWithTags: ['scope:core', 'scope:parser', 'scope:validator', 'scope:formatters'],
  },
  // Playground depends on browser-compiler and formatters (for types)
  {
    sourceTag: 'scope:playground',
    onlyDependOnLibsWithTags: ['scope:browser-compiler', 'scope:formatters'],
  },
];

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
        '@nx/enforce-module-boundaries': [
          'error',
          {
            enforceBuildableLibDependency: true,
            allow: [],
            depConstraints: moduleBoundaryRules,
          },
        ],
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
            ignoredDependencies: [
              'vitest',
              '@nx/vite',
              'path-browserify',
              'chokidar',
              'ora',
              'commander',
            ],
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
