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
