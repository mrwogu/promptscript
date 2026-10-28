import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolve } from 'node:path';
import type { PromptScriptConfig } from '@promptscript/core';

const constructed = vi.hoisted(() => ({ options: undefined as unknown }));

vi.mock('@promptscript/compiler', () => ({
  Compiler: class {
    constructor(options: unknown) {
      constructed.options = options;
    }
  },
}));

import { createProjectCompiler } from './project-compiler.js';

const CONFIG = {
  id: 'acme',
  syntax: '1.0.0',
  validation: { rules: { 'blocked-patterns': 'warning' } },
  registries: { '@acme': 'https://example.com/registry.git' },
  skillTargets: ['claude'],
  universalDir: '.my-agents',
  customConventions: { mine: { name: 'mine' } },
  models: { profiles: {} },
} as unknown as PromptScriptConfig;

describe('createProjectCompiler', () => {
  beforeEach(() => {
    constructed.options = undefined;
  });

  it('builds the resolver options from the project and the effective config', () => {
    createProjectCompiler(CONFIG, {
      projectRoot: '/work/acme',
      registry: {
        path: '/work/acme/registry',
        isRemote: true,
        source: 'git',
        repositoryUrl: 'https://example.com/registry.git',
        repositoryPath: '/cache/registry',
      },
      vendorDir: '/work/acme/.promptscript/vendor',
      formatters: [{ name: 'bundle' }],
    });

    expect(constructed.options).toMatchObject({
      resolver: {
        registryPath: '/work/acme/registry',
        localPath: resolve('/work/acme', '.promptscript'),
        projectRoot: '/work/acme',
        vendorDir: '/work/acme/.promptscript/vendor',
        readOnly: true,
        referenceRoots: { 'https://example.com/registry.git': ['/cache/registry'] },
        registries: CONFIG.registries,
        skillTargets: ['claude'],
        skills: { universalDir: '.my-agents' },
      },
      validator: CONFIG.validation,
      customConventions: CONFIG.customConventions,
      models: CONFIG.models,
      formatters: [{ name: 'bundle' }],
    });
  });

  it('passes the arguments a command adds', () => {
    const logger = { verbose: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() };

    createProjectCompiler(CONFIG, {
      projectRoot: '/work/acme',
      registry: { path: 'registry', isRemote: false, source: 'local' },
      vendorDir: 'vendor',
      formatters: ['claude'],
      logger,
      skillContent: 'skill text',
      prettier: { printWidth: 80 },
    });

    expect(constructed.options).toMatchObject({
      logger,
      skillContent: 'skill text',
      prettier: { printWidth: 80 },
      formatters: ['claude'],
    });
  });
});
