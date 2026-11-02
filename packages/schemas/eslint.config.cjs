const { createBaseConfig } = require('../../eslint.base.config.cjs');

module.exports = [
  ...createBaseConfig(__dirname),
  {
    files: ['**/*.ts'],
    languageOptions: { parserOptions: { project: ['./tsconfig.spec.json'] } },
  },
];
