import { describe, it, expect } from 'vitest';
import { mergeConfigs } from '../config/merge-config.js';
import type { PromptScriptConfig, UserConfig } from '@promptscript/core';

describe('config/merge-config', () => {
  const baseProjectConfig: PromptScriptConfig = {
    version: '1',
    project: { id: 'test-project' },
    targets: ['github'],
  };

  const emptyUserConfig: UserConfig = { version: '1' };

  it('should return project config when no overrides', () => {
    const result = mergeConfigs(emptyUserConfig, baseProjectConfig, {});

    expect(result.project.id).toBe('test-project');
    expect(result.targets).toEqual(['github']);
  });

  it('should apply user config registry as base', () => {
    const userConfig: UserConfig = {
      version: '1',
      registry: {
        git: { url: 'https://github.com/user/reg.git', ref: 'main' },
      },
    };

    const result = mergeConfigs(userConfig, baseProjectConfig, {});

    expect(result.registry?.git?.url).toBe('https://github.com/user/reg.git');
    expect(result.registry?.git?.ref).toBe('main');
  });

  it('should let project config override user config registry', () => {
    const userConfig: UserConfig = {
      version: '1',
      registry: {
        git: { url: 'https://github.com/user/reg.git', ref: 'main' },
      },
    };

    const projectConfig: PromptScriptConfig = {
      ...baseProjectConfig,
      registry: {
        git: { url: 'https://github.com/project/reg.git' },
      },
    };

    const result = mergeConfigs(userConfig, projectConfig, {});

    expect(result.registry?.git?.url).toBe('https://github.com/project/reg.git');
  });

  it('should let env overrides override project config', () => {
    const projectConfig: PromptScriptConfig = {
      ...baseProjectConfig,
      registry: {
        git: { url: 'https://github.com/project/reg.git', ref: 'main' },
      },
    };

    const envOverrides: Partial<PromptScriptConfig> = {
      registry: {
        git: { url: 'https://github.com/env/reg.git' },
      },
    };

    const result = mergeConfigs(emptyUserConfig, projectConfig, envOverrides);

    expect(result.registry?.git?.url).toBe('https://github.com/env/reg.git');
  });

  it('should let CLI flags override everything', () => {
    const userConfig: UserConfig = {
      version: '1',
      registry: {
        git: { url: 'https://github.com/user/reg.git' },
      },
    };

    const envOverrides: Partial<PromptScriptConfig> = {
      registry: {
        git: { url: 'https://github.com/env/reg.git' },
      },
    };

    const cliFlags: Partial<PromptScriptConfig> = {
      registry: {
        git: { url: 'https://github.com/cli/reg.git' },
      },
    };

    const result = mergeConfigs(userConfig, baseProjectConfig, envOverrides, cliFlags);

    expect(result.registry?.git?.url).toBe('https://github.com/cli/reg.git');
  });

  it('should deep merge registry cache settings', () => {
    const userConfig: UserConfig = {
      version: '1',
      registry: {
        cache: { enabled: true, ttl: 60000 },
      },
    };

    const envOverrides: Partial<PromptScriptConfig> = {
      registry: {
        cache: { ttl: 120000 },
      },
    };

    const result = mergeConfigs(userConfig, baseProjectConfig, envOverrides);

    expect(result.registry?.cache?.enabled).toBe(true);
    expect(result.registry?.cache?.ttl).toBe(120000);
  });

  it('should override targets from CLI flags', () => {
    const cliFlags: Partial<PromptScriptConfig> = {
      targets: ['claude', 'cursor'],
    };

    const result = mergeConfigs(emptyUserConfig, baseProjectConfig, {}, cliFlags);

    expect(result.targets).toEqual(['claude', 'cursor']);
  });

  it('should preserve project config fields not in overrides', () => {
    const projectConfig: PromptScriptConfig = {
      ...baseProjectConfig,
      project: { id: 'test', team: 'frontend' },
      validation: { rules: { 'empty-block': 'warning' } },
    };

    const result = mergeConfigs(emptyUserConfig, projectConfig, {});

    expect(result.project.team).toBe('frontend');
    expect(result.validation?.rules?.['empty-block']).toBe('warning');
  });

  it('should atomically replace auth from source', () => {
    const userConfig: UserConfig = {
      version: '1',
      registry: {
        git: {
          url: 'https://github.com/user/reg.git',
          auth: { type: 'ssh', sshKeyPath: '/old/key' },
        },
      },
    };

    const envOverrides: Partial<PromptScriptConfig> = {
      registry: {
        git: {
          url: 'https://github.com/env/reg.git',
          auth: { type: 'token', tokenEnvVar: 'GH_TOKEN' },
        },
      },
    };

    const result = mergeConfigs(userConfig, baseProjectConfig, envOverrides);

    expect(result.registry?.git?.auth?.type).toBe('token');
    expect((result.registry?.git?.auth as { tokenEnvVar?: string })?.tokenEnvVar).toBe('GH_TOKEN');
  });

  it('should preserve auth from target when source has no auth', () => {
    const userConfig: UserConfig = {
      version: '1',
      registry: {
        git: {
          url: 'https://github.com/user/reg.git',
          auth: { type: 'ssh', sshKeyPath: '/my/key' },
        },
      },
    };

    const envOverrides: Partial<PromptScriptConfig> = {
      registry: {
        git: { url: 'https://github.com/env/reg.git' },
      },
    };

    const result = mergeConfigs(userConfig, baseProjectConfig, envOverrides);

    expect(result.registry?.git?.url).toBe('https://github.com/env/reg.git');
    expect(result.registry?.git?.auth?.type).toBe('ssh');
  });

  it('should deep merge registry-level auth settings', () => {
    const projectConfig: PromptScriptConfig = {
      ...baseProjectConfig,
      registry: {
        auth: { type: 'bearer' as const, tokenEnvVar: 'OLD_TOKEN' },
      },
    };

    const envOverrides: Partial<PromptScriptConfig> = {
      registry: {
        auth: { type: 'basic' as const, tokenEnvVar: 'NEW_TOKEN' },
      },
    };

    const result = mergeConfigs(emptyUserConfig, projectConfig, envOverrides);

    expect(result.registry?.auth?.type).toBe('basic');
    expect(result.registry?.auth?.tokenEnvVar).toBe('NEW_TOKEN');
  });

  it('should override url from user config', () => {
    const userConfig: UserConfig = {
      version: '1',
      registry: {
        url: 'https://user-registry.example.com',
      },
    };

    const projectConfig: PromptScriptConfig = {
      ...baseProjectConfig,
      registry: {
        url: 'https://project-registry.example.com',
      },
    };

    const result = mergeConfigs(userConfig, projectConfig, {});

    expect(result.registry?.url).toBe('https://project-registry.example.com');
  });
});
