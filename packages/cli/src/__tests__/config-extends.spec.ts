import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadConfig, loadConfigFileWith } from '../config/loader.js';

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

  it('should join governance admins and role owners with the base ones', async () => {
    const root = project({
      'org.yaml': [
        'governance:',
        "  admins: ['@acme/platform']",
        '  roles:',
        "    legal: ['@acme/legal']",
        "    security: ['@acme/appsec']",
        '  dataClasses: [pii, internal]',
        '  codeowners:',
        '    output: CODEOWNERS',
      ].join('\n'),
      'team.yaml': [
        'extends: ./org.yaml',
        'governance:',
        "  admins: ['@acme/support-leads', '@acme/platform']",
        '  roles:',
        "    legal: ['@acme/support-legal']",
      ].join('\n'),
      'promptscript.yaml': [
        'id: app',
        'extends: ./team.yaml',
        'governance:',
        '  roles:',
        "    privacy: ['@acme/dpo']",
        '  dataClasses: [pii]',
        '  codeowners:',
        '    prompts: false',
      ].join('\n'),
    });

    const config = await loadConfig(join(root, 'promptscript.yaml'));

    expect(config.governance).toEqual({
      admins: ['@acme/platform', '@acme/support-leads'],
      roles: {
        legal: ['@acme/legal', '@acme/support-legal'],
        security: ['@acme/appsec'],
        privacy: ['@acme/dpo'],
      },
      dataClasses: ['pii'],
      codeowners: { output: 'CODEOWNERS', prompts: false },
    });
  });

  it('should join protected paths and let the project change other codeowners keys', async () => {
    const root = project({
      'base.yaml': [
        'governance:',
        '  codeowners:',
        '    output: CODEOWNERS',
        "    protect: ['.github/workflows']",
      ].join('\n'),
      'promptscript.yaml': [
        'id: app',
        'extends: ./base.yaml',
        'governance:',
        '  codeowners:',
        '    output: .gitlab/CODEOWNERS',
        "    protect: ['scripts/release', '.github/workflows']",
        '    prompts: false',
      ].join('\n'),
    });

    const config = await loadConfig(join(root, 'promptscript.yaml'));

    expect(config.governance?.codeowners).toEqual({
      output: '.gitlab/CODEOWNERS',
      protect: ['.github/workflows', 'scripts/release'],
      prompts: false,
    });
  });

  it('should accept a bare codeowners key when the base protects no path', async () => {
    const root = project({
      'base.yaml': 'governance:\n  codeowners:\n    output: CODEOWNERS\n',
      'promptscript.yaml': 'id: app\nextends: ./base.yaml\ngovernance:\n  codeowners:\n',
    });

    const config = await loadConfig(join(root, 'promptscript.yaml'));

    expect(config.governance).toEqual({ codeowners: null });
  });

  it('should keep base governance when the project declares none', async () => {
    const root = project({
      'base.yaml': "governance:\n  admins: ['@acme/platform']\n",
      'promptscript.yaml': 'id: app\nextends: ./base.yaml\ntargets: [github]\n',
    });

    const config = await loadConfig(join(root, 'promptscript.yaml'));

    expect(config.governance).toEqual({ admins: ['@acme/platform'] });
  });

  it('should accept a bare governance key when no base in the chain has owners', async () => {
    const root = project({
      'base.yaml': "syntax: '1.4.0'\ngovernance:\n  dataClasses: [pii]\n",
      'promptscript.yaml': 'id: app\nextends: ./base.yaml\ngovernance:\n',
    });

    const config = await loadConfig(join(root, 'promptscript.yaml'));

    expect(config.governance).toBeNull();
  });

  it('should accept bare owner keys when the base sets no governance', async () => {
    const root = project({
      'base.yaml': "syntax: '1.4.0'\n",
      'promptscript.yaml': 'id: app\nextends: ./base.yaml\ngovernance:\n  admins:\n  roles:\n',
    });

    const config = await loadConfig(join(root, 'promptscript.yaml'));

    expect(config.governance).toEqual({ admins: null, roles: null });
  });

  it.each([
    ['governance set to null', 'governance: null', /"governance" in .* is null, which would drop/],
    ['admins set to null', 'governance:\n  admins: null', /"governance.admins" in .* is null/],
    ['admins as a string', "governance:\n  admins: '@acme/x'", /"governance.admins" .* a string/],
    ['roles set to null', 'governance:\n  roles: null', /"governance.roles" in .* is null/],
    ['roles as a list', "governance:\n  roles: ['@acme/x']", /"governance.roles" .* a list/],
    [
      'a role set to null',
      'governance:\n  roles:\n    legal: null',
      /"governance.roles.legal" in .* is null/,
    ],
    [
      'a __proto__ role',
      "governance:\n  roles:\n    __proto__: ['@acme/x']",
      /"governance.roles" in .* has a "__proto__" key/,
    ],
    [
      'codeowners set to null',
      'governance:\n  codeowners: null',
      /"governance.codeowners" in .* is null/,
    ],
    [
      'protect set to null',
      'governance:\n  codeowners:\n    protect: null',
      /"governance.codeowners.protect" in .* is null/,
    ],
    [
      'a __proto__ key in codeowners',
      'governance:\n  codeowners:\n    __proto__: { prompts: false }',
      /"governance.codeowners" in .* has a "__proto__" key/,
    ],
  ])('should reject %s under extends', async (_name, governance, message) => {
    const root = project({
      'base.yaml': [
        'governance:',
        "  admins: ['@acme/platform']",
        '  roles:',
        "    legal: ['@acme/legal']",
        '  codeowners:',
        "    protect: ['.github/workflows']",
      ].join('\n'),
      'promptscript.yaml': `id: app\nextends: ./base.yaml\n${governance}\n`,
    });

    await expect(loadConfig(join(root, 'promptscript.yaml'))).rejects.toThrow(message);
  });

  it('should refuse a reserved key anywhere in an extended config and name both files', async () => {
    const root = project({
      'base.yaml': "syntax: '1.4.0'\nvalidation:\n  strict: true\n",
      'promptscript.yaml': [
        'id: app',
        'extends: ./base.yaml',
        'validation:',
        '  __proto__:',
        '    strict: false',
      ].join('\n'),
    });

    await expect(loadConfig(join(root, 'promptscript.yaml'))).rejects.toMatchObject({
      code: 'PS3002',
      message: `The key "__proto__" under "validation" is reserved, so it cannot be merged. Rename or remove it. Found while merging ${join(root, 'promptscript.yaml')} over ${join(root, 'base.yaml')}.`,
      location: { file: join(root, 'promptscript.yaml'), line: 1, column: 1 },
    });
  });

  it('should report a reserved governance key under governance at the extending file', async () => {
    const root = project({
      'base.yaml': "governance:\n  admins: ['@acme/platform']\n",
      'promptscript.yaml': 'id: app\nextends: ./base.yaml\ngovernance:\n  constructor: x\n',
    });

    await expect(loadConfig(join(root, 'promptscript.yaml'))).rejects.toMatchObject({
      code: 'PS3002',
      message: expect.stringMatching(
        /^The key "constructor" under "governance" is reserved, so it cannot be merged\. Rename or remove it\. Found while merging .*promptscript\.yaml over .*base\.yaml\.$/
      ),
      location: { file: join(root, 'promptscript.yaml'), line: 1, column: 1 },
    });
  });

  it('should name both files when a project would drop base owners', async () => {
    const root = project({
      'base.yaml': "governance:\n  admins: ['@acme/platform']\n",
      'promptscript.yaml': 'id: app\nextends: ./base.yaml\ngovernance:\n  admins: null\n',
    });

    await expect(loadConfig(join(root, 'promptscript.yaml'))).rejects.toThrow(
      `"governance.admins" in ${join(root, 'promptscript.yaml')} is null, which would drop entries set in ${join(root, 'base.yaml')} or a config it extends.`
    );
  });

  it('should reject a circular extends chain', async () => {
    const root = project({
      'a.yaml': 'extends: ./b.yaml\n',
      'b.yaml': 'extends: ./a.yaml\n',
    });

    await expect(loadConfig(join(root, 'a.yaml'))).rejects.toThrow(/Circular config extends/);
  });

  it('should refuse an empty config file with a clear error', async () => {
    const root = project({ 'promptscript.yaml': '# nothing here yet\n' });
    const file = join(root, 'promptscript.yaml');

    await expect(loadConfig(file)).rejects.toThrow(
      `Failed to parse ${file}: it is empty or not a YAML mapping.`
    );
  });

  it('should name an empty base file', async () => {
    const root = project({
      'promptscript.yaml': 'id: app\nextends: ./base.yaml\n',
      'base.yaml': '',
    });

    await expect(loadConfig(join(root, 'promptscript.yaml'))).rejects.toThrow(
      `Failed to parse ${join(root, 'base.yaml')}: it is empty or not a YAML mapping.`
    );
  });

  it('should name the missing base file', async () => {
    const root = project({ 'promptscript.yaml': 'id: app\nextends: ./missing.yaml\n' });

    await expect(loadConfig(join(root, 'promptscript.yaml'))).rejects.toThrow(
      `Extended config not found: ${join(root, 'missing.yaml')}`
    );
  });
});

describe('loadConfigFileWith', () => {
  const app = resolve('/repo/app/promptscript.yaml');
  const org = resolve('/repo/org.yaml');

  it('reads the file and its extends chain through the reader only', async () => {
    const files = new Map([
      [app, 'extends: ../org.yaml\ntargets:\n  - claude\n'],
      [
        org,
        "syntax: '1.6.0'\npolicies:\n  - name: base\n    kind: registry-allowlist\n    allowed: ['@core']\n",
      ],
    ]);
    const read = async (path: string): Promise<string | undefined> => files.get(path);

    const config = await loadConfigFileWith(app, read);

    expect(config.syntax).toBe('1.6.0');
    expect(config.targets).toEqual(['claude']);
    expect(config.policies?.map((policy) => policy.name)).toEqual(['base']);
  });

  it('names the file that extends a missing one', async () => {
    const root = resolve('/repo/promptscript.yaml');
    const read = async (path: string): Promise<string | undefined> =>
      path === root ? 'extends: ./gone.yaml\n' : undefined;

    await expect(loadConfigFileWith(root, read)).rejects.toThrow(
      `Extended config not found: ${resolve('/repo/gone.yaml')} (from ${root})`
    );
    await expect(loadConfigFileWith(resolve('/repo/other.yaml'), read)).rejects.toThrow(
      `Configuration file not found: ${resolve('/repo/other.yaml')}`
    );
  });

  it('treats an extends path through a file as a missing file', async () => {
    const root = project({
      'promptscript.yaml': 'extends: ./notes.txt/base.yaml\n',
      'notes.txt': '',
    });

    await expect(loadConfig(join(root, 'promptscript.yaml'))).rejects.toThrow(
      'Extended config not found'
    );
  });

  it('passes through a read error other than a missing file', async () => {
    const root = project({ 'promptscript.yaml/keep': '' });

    await expect(loadConfig(join(root, 'promptscript.yaml'))).rejects.toMatchObject({
      code: 'EISDIR',
    });
  });
});

describe('loadConfig files', () => {
  it('lists the project file and every file of its extends chain', async () => {
    // Arrange
    const root = project({
      'shared/org.yaml': 'id: org\n',
      'shared/team.yaml': 'extends: ./org.yaml\n',
      'app/promptscript.yaml': 'id: app\nextends: ../shared/team.yaml\n',
    });
    const files: string[] = [];

    // Act
    await loadConfig(join(root, 'app/promptscript.yaml'), files);

    // Assert
    expect(files).toEqual([
      join(root, 'app/promptscript.yaml'),
      join(root, 'shared/team.yaml'),
      join(root, 'shared/org.yaml'),
    ]);
  });
});
