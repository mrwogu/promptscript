const { createBaseConfig } = require('../../eslint.base.config.cjs');

module.exports = [
  ...createBaseConfig(__dirname),
  {
    files: ['**/*.ts'],
    languageOptions: { parserOptions: { project: ['./tsconfig.json'] } },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { globals: { URL: 'readonly' } },
  },
  {
    files: ['package.json'],
    rules: {
      // Used through Astro and its integrations, never imported directly.
      '@nx/dependency-checks': [
        'error',
        {
          ignoredDependencies: [
            '@astrojs/markdown-remark',
            'mermaid',
            'sharp',
            'vitest',
            'path-browserify',
          ],
        },
      ],
    },
  },
  {
    ignores: ['public/**', '.astro/**'],
  },
];
