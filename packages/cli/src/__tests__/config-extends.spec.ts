import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../config/loader.js';

const directories: string[] = [];

function project(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'prs-config-extends-'));
  directories.push(root);
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, name)), { recursive: true });
    writeFileSync(join(root, name), content);
  }
  return root;
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('config extends', () => {
  it('should merge the base config under the project config', async () => {
    const root = project({
      'shared/base.yaml': [
        "syntax: '1.4.0'",
        'targets:',
        '  - claude',
        '  - cursor',
        'registries:',
        "  '@company': github.com/acme/base",
        'registry:',
        '  path: ./registry',
        '  cache:',
        '    enabled: true',
      ].join('\n'),
      'app/promptscript.yaml': [
        'id: app',
        'extends: ../shared/base.yaml',
        'targets:',
        '  - github',
        'registries:',
        "  '@team': github.com/acme/team",
        'registry:',
        '  cache:',
        '    ttl: 1000',
      ].join('\n'),
    });

    const config = await loadConfig(join(root, 'app/promptscript.yaml'));

    expect(config).toEqual({
      id: 'app',
      syntax: '1.4.0',
      targets: ['github'],
      registries: { '@company': 'github.com/acme/base', '@team': 'github.com/acme/team' },
      registry: { path: './registry', cache: { enabled: true, ttl: 1000 } },
    });
  });

  it('should let a project path registry replace a base git registry', async () => {
    const root = project({
      'base.yaml': 'registry:\n  git:\n    url: https://github.com/acme/base.git\n',
      'promptscript.yaml': 'id: app\nextends: ./base.yaml\nregistry:\n  path: ./registry\n',
    });

    const config = await loadConfig(join(root, 'promptscript.yaml'));

    expect(config.registry).toEqual({ path: './registry' });
  });

  it('should resolve each extends path relative to its own file', async () => {
    const root = project({
      'shared/org.yaml': "syntax: '1.4.0'\ndescription: org\n",
      'shared/team.yaml': 'extends: ./org.yaml\ndescription: team\n',
      'app/promptscript.yaml': 'id: app\nextends: ../shared/team.yaml\ntargets: [github]\n',
    });

    const config = await loadConfig(join(root, 'app/promptscript.yaml'));

    expect(config).toEqual({
      id: 'app',
      syntax: '1.4.0',
      description: 'team',
      targets: ['github'],
    });
  });

  it('should keep base policies first and append the project policies', async () => {
    const root = project({
      'base.yaml': [
        'policies:',
        '  - name: approved-registries',
        '    kind: registry-allowlist',
        "    allowed: ['@core']",
        '  - name: protect-content',
        '    kind: property-protection',
        "    properties: ['content']",
      ].join('\n'),
      'promptscript.yaml': [
        'id: app',
        'extends: ./base.yaml',
        'policies:',
        '  - name: adjacent-layers-only',
        '    kind: layer-boundary',
        "    layers: ['@core', '@team']",
      ].join('\n'),
    });

    const config = await loadConfig(join(root, 'promptscript.yaml'));

    expect(config.policies?.map((policy) => policy.name)).toEqual([
      'approved-registries',
      'protect-content',
      'adjacent-layers-only',
    ]);
  });

  it('should keep base policies when the project declares none', async () => {
    const root = project({
      'base.yaml':
        "policies:\n  - name: approved-registries\n    kind: registry-allowlist\n    allowed: ['@core']\n",
      'promptscript.yaml': 'id: app\nextends: ./base.yaml\ntargets: [github]\n',
    });

    const config = await loadConfig(join(root, 'promptscript.yaml'));

    expect(config.policies?.map((policy) => policy.name)).toEqual(['approved-registries']);
  });

  it('should reject a project policy that reuses a base policy name', async () => {
    const root = project({
      'base.yaml':
        "policies:\n  - name: approved-registries\n    kind: registry-allowlist\n    allowed: ['@core']\n",
      'promptscript.yaml': [
        'id: app',
        'extends: ./base.yaml',
        'policies:',
        '  - name: approved-registries',
        '    kind: registry-allowlist',
        "    allowed: ['@core', '@anything']",
      ].join('\n'),
    });

    await expect(loadConfig(join(root, 'promptscript.yaml'))).rejects.toThrow(
      `Policy "approved-registries" in ${join(root, 'promptscript.yaml')} is already defined in ${join(root, 'base.yaml')}`
    );
  });

  it('should reject policies set to null under extends', async () => {
    const root = project({
      'base.yaml':
        "policies:\n  - name: approved-registries\n    kind: registry-allowlist\n    allowed: ['@core']\n",
      'promptscript.yaml': 'id: app\nextends: ./base.yaml\npolicies: null\n',
    });

    await expect(loadConfig(join(root, 'promptscript.yaml'))).rejects.toThrow(
      /"policies" in .* is null, which would drop the policies of/
    );
  });

  it('should accept a bare policies key when no base in the chain has policies', async () => {
    const root = project({
      'base.yaml': "syntax: '1.4.0'\ntargets: [claude]\n",
      'promptscript.yaml': 'id: app\nextends: ./base.yaml\npolicies:\n  # - name: later\n',
    });

    const config = await loadConfig(join(root, 'promptscript.yaml'));

    expect(config.policies).toBeNull();
  });

  it('should reject a policy name defined two levels up the extends chain', async () => {
    const root = project({
      'org.yaml':
        "policies:\n  - name: org-allow\n    kind: registry-allowlist\n    allowed: ['@core']\n",
      'team.yaml': 'extends: ./org.yaml\ndescription: team\n',
      'promptscript.yaml': [
        'id: app',
        'extends: ./team.yaml',
        'policies:',
        '  - name: org-allow',
        '    kind: registry-allowlist',
        "    allowed: ['@core', '@team']",
      ].join('\n'),
    });

    await expect(loadConfig(join(root, 'promptscript.yaml'))).rejects.toThrow(
      `Policy "org-allow" in ${join(root, 'promptscript.yaml')} is already defined in ${join(root, 'team.yaml')} or a config it extends`
    );
  });

  it('should reject a non-list policies value under extends', async () => {
    const root = project({
      'base.yaml':
        "policies:\n  - name: approved-registries\n    kind: registry-allowlist\n    allowed: ['@core']\n",
      'promptscript.yaml': 'id: app\nextends: ./base.yaml\npolicies: not-a-list\n',
    });

    await expect(loadConfig(join(root, 'promptscript.yaml'))).rejects.toThrow(
      /"policies" in .* is a string, which would drop the policies of/
    );
  });

  it('should reject a circular extends chain', async () => {
    const root = project({
      'a.yaml': 'extends: ./b.yaml\n',
      'b.yaml': 'extends: ./a.yaml\n',
    });

    await expect(loadConfig(join(root, 'a.yaml'))).rejects.toThrow(/Circular config extends/);
  });

  it('should name the missing base file', async () => {
    const root = project({ 'promptscript.yaml': 'id: app\nextends: ./missing.yaml\n' });

    await expect(loadConfig(join(root, 'promptscript.yaml'))).rejects.toThrow(
      `Extended config not found: ${join(root, 'missing.yaml')}`
    );
  });
});
