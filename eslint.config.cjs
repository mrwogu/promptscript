const { createBaseConfig } = require('./eslint.base.config.cjs');

module.exports = [
  ...createBaseConfig(__dirname),
  {
    ignores: ['packages/**', 'dist/**', 'node_modules/**', '.nx/**'],
  },
];
