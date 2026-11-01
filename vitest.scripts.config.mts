import { defineConfig } from 'vitest/config';

// Specs of the repo scripts. They are not part of any nx project.
export default defineConfig({
  root: __dirname,
  test: {
    name: 'scripts',
    watch: false,
    environment: 'node',
    include: ['scripts/**/*.spec.mts'],
  },
});
