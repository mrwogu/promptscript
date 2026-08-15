import { describe, expect, it, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  interpolateSkillContent,
  parseSkillMd,
  resolveNativeSkills,
  resolveSkillReferences,
  resolveSkillScripts,
} from '../skills.js';
import { discoverNativeContent } from '../auto-discovery.js';
import { Resolver } from '../resolver.js';
import { validateSkillFrontmatter } from '../skill-validation.js';
import type { ObjectContent, Program, Value } from '@promptscript/core';
import { makeBlock, makeObjectContent } from '../ast-factory.js';

describe('YAML skill frontmatter', () => {
  let temporaryDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true }))
    );
    temporaryDirectories = [];
  });

  it('parses CRLF, block scalars, quoted punctuation, arrays, and nested fields', () => {
    const content = [
      '---',
      'name: "data: #1"',
      'description: >-',
      '  Review data files: use when the file contains a # comment.',
      'params:',
      '  mode:',
      '    type: enum',
      '    options: ["a,b", standard, strict]',
      "    default: 'a,b'",
      'inputs:',
      '  files:',
      '    description: "Files: # to scan"',
      '    type: string',
      'outputs:',
      '  report:',
      '    description: Multiline report',
      '    type: string',
      'references: ["references/guide:one.md", references/guide-two.md]',
      'scripts:',
      '  - "scripts/check #1.py"',
      'license: "Apache-2.0: # license"',
      'compatibility: "Requires: Python 3.14+"',
      'metadata:',
      '  author: example-org',
      '  version: "1.0"',
      'allowed-tools: "Read Bash(git:*)"',
      'future-field:',
      '  nested: [one, two]',
      '---',
      '',
      'Body content.',
    ].join('\r\n');

    const result = parseSkillMd(content, '/tmp/skills/data/SKILL.md');

    expect(result.name).toBe('data: #1');
    expect(result.description).toBe('Review data files: use when the file contains a # comment.');
    expect(result.params?.[0]).toMatchObject({
      name: 'mode',
      paramType: { kind: 'enum', options: ['a,b', 'standard', 'strict'] },
      defaultValue: 'a,b',
      optional: true,
    });
    expect(result.inputs?.['files']).toEqual({
      description: 'Files: # to scan',
      type: 'string',
    });
    expect(result.outputs?.['report']).toEqual({
      description: 'Multiline report',
      type: 'string',
    });
    expect(result.references).toEqual(['references/guide:one.md', 'references/guide-two.md']);
    expect(result.scripts).toEqual(['scripts/check #1.py']);
    expect(result.license).toBe('Apache-2.0: # license');
    expect(result.compatibility).toBe('Requires: Python 3.14+');
    expect(result.metadata).toEqual({ author: 'example-org', version: '1.0' });
    expect(result.allowedTools).toEqual(['Read', 'Bash(git:*)']);
    expect(result.rawFrontmatter).toContain('future-field:');
    expect(result.content).toBe('Body content.');
  });

  it('keeps unknown fields in raw frontmatter while ignoring them structurally', () => {
    const result = parseSkillMd(
      [
        '---',
        'name: example',
        'unknown:',
        '  nested:',
        '    values: [one, two]',
        '---',
        'Body',
      ].join('\n')
    );

    expect(result.rawFrontmatter).toContain('unknown:');
    expect(result.rawFrontmatter).toContain('values: [one, two]');
    expect(result.name).toBe('example');
  });

  it('normalizes compatibility sequences used by existing skills', () => {
    const result = parseSkillMd(
      [
        '---',
        'name: example',
        'compatibility:',
        '  - claude-code',
        '  - github-copilot',
        '---',
        'Body',
      ].join('\n')
    );

    expect(result.compatibility).toBe('claude-code, github-copilot');
  });

  it.each([
    ['top-level sequence', '- item', /top-level frontmatter value must be a YAML mapping/],
    ['non-string name', 'name: 42', /field "name" must be a string/],
    [
      'invalid compatibility',
      'compatibility:\n  required: shell',
      /field "compatibility" must be a string/,
    ],
    [
      'scalar references',
      'references: references/guide.md',
      /field "references" must be a sequence/,
    ],
    ['non-string reference', 'references: [42]', /field "references" item 1 must be a string/],
    ['scalar params', 'params: []', /field "params" must be a mapping/],
    [
      'invalid parameter name',
      'params:\n  invalid-name: {}',
      /parameter name "invalid-name" must be a valid identifier/,
    ],
    ['scalar parameter definition', 'params:\n  mode: true', /parameter "mode" must be a mapping/],
    ['invalid parameter type', 'params:\n  mode:\n    type: date', /parameter "mode" type must be/],
    [
      'invalid parameter options',
      'params:\n  mode:\n    type: enum\n    options: [1]',
      /parameter "mode" options must be a sequence/,
    ],
    [
      'invalid number default',
      'params:\n  count:\n    type: number\n    default: nope',
      /parameter "count" default must be a finite number/,
    ],
    [
      'invalid boolean default',
      'params:\n  strict:\n    type: boolean\n    default: 1',
      /parameter "strict" default must be a boolean/,
    ],
    [
      'invalid enum default',
      'params:\n  mode:\n    type: enum\n    default: 1',
      /parameter "mode" default must be a string/,
    ],
    ['scalar inputs', 'inputs: []', /field "inputs" must be a mapping/],
    ['scalar contract field', 'inputs:\n  path: true', /inputs field "path" must be a mapping/],
    [
      'invalid contract type',
      'inputs:\n  path:\n    type: date',
      /inputs field "path" type must be/,
    ],
    [
      'invalid contract options',
      'inputs:\n  path:\n    options: [1]',
      /inputs field "path" options must be a sequence/,
    ],
    [
      'invalid contract description',
      'inputs:\n  path:\n    description: 1',
      /inputs field "path" description must be a string/,
    ],
    [
      'invalid contract number default',
      'inputs:\n  count:\n    type: number\n    default: nope',
      /inputs field "count" default must be a finite number/,
    ],
    [
      'invalid metadata value',
      'metadata:\n  version: 1',
      /metadata value "version" must be a string/,
    ],
    [
      'invalid allowed tools',
      'allowed-tools: [Read, 1]',
      /"allowed-tools" must be a sequence of strings/,
    ],
  ])('rejects %s with a field-specific error', (_caseName, yaml, expected) => {
    expect(() => parseSkillMd(`---\n${yaml}\n---\nBody`, '/tmp/skills/invalid/SKILL.md')).toThrow(
      expected
    );
  });

  it('parses empty optional fields and complex string defaults', () => {
    const result = parseSkillMd(
      [
        '---',
        'params:',
        '  plain:',
        '    default: { nested: [one, 2] }',
        '  strict:',
        '    type: boolean',
        '    default: "true"',
        '  relaxed:',
        '    type: boolean',
        '    default: "false"',
        'inputs:',
        '  path:',
        '    type: string',
        'outputs:',
        '  report:',
        '    type: string',
        'references:',
        'scripts:',
        'allowed-tools:',
        'metadata: some-value',
        '---',
        'Body',
      ].join('\n')
    );

    expect(result.params?.[0]?.defaultValue).toEqual({ nested: ['one', 2] });
    expect(result.params?.[1]?.defaultValue).toBe(true);
    expect(result.params?.[2]?.defaultValue).toBe(false);
    expect(result.inputs?.['path']).toEqual({ description: '', type: 'string' });
    expect(result.outputs?.['report']).toEqual({ description: '', type: 'string' });
    expect(result.references).toEqual([]);
    expect(result.scripts).toEqual([]);
    expect(result.allowedTools).toEqual([]);
    expect(result.metadata).toBeUndefined();
  });

  it('handles null optional fields', () => {
    const result = parseSkillMd(
      ['---', 'params:', '  mode:', '    default:', 'inputs:', 'outputs:', '---', 'Body'].join('\n')
    );

    expect(result.params?.[0]?.defaultValue).toBeNull();
    expect(result.inputs).toEqual({});
    expect(result.outputs).toEqual({});
  });

  it('leaves unresolved interpolation placeholders unchanged', () => {
    const result = interpolateSkillContent(
      'Keep {{missing}}',
      [
        {
          type: 'ParamDefinition',
          name: 'known',
          paramType: { kind: 'string' },
          optional: true,
          loc: { file: '<test>', line: 1, column: 1 },
        },
      ],
      {}
    );

    expect(result).toBe('Keep {{missing}}');
  });

  it('normalizes safe paths and preserves unsafe paths for resolver checks', () => {
    const result = parseSkillMd(
      [
        '---',
        'references:',
        '  - ./references/guide.md',
        '  - references//other.md',
        '  - .',
        '  - ../outside.md',
        '  - /absolute.md',
        '  - C:\\outside.md',
        '  - "unsafe\\u0000path.md"',
        '---',
        'Body',
      ].join('\n')
    );

    expect(result.references).toEqual([
      'references/guide.md',
      'references/other.md',
      '.',
      '../outside.md',
      '/absolute.md',
      'C:\\outside.md',
      'unsafe\0path.md',
    ]);
  });

  it('propagates parsed metadata through native skill resolution', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'skill-yaml-native-'));
    temporaryDirectories.push(directory);
    const localPath = join(directory, '.promptscript');
    const skillDirectory = join(localPath, 'skills', 'example');
    await mkdir(join(skillDirectory, 'references'), { recursive: true });
    await mkdir(join(skillDirectory, 'scripts'), { recursive: true });
    await writeFile(
      join(skillDirectory, 'SKILL.md'),
      [
        '---',
        'name: example',
        'description: Use when testing native metadata',
        'params:',
        '  mode:',
        '    type: string',
        '    default: standard',
        'inputs:',
        '  source:',
        '    type: string',
        'outputs:',
        '  result:',
        '    type: string',
        'references: [references/guide.md]',
        'scripts: [scripts/run.sh]',
        'license: MIT',
        'compatibility: Requires shell access',
        'metadata:',
        '  owner: tests',
        'allowed-tools: "Read Bash"',
        '---',
        'Run in {{mode}} mode.',
      ].join('\n')
    );
    await writeFile(join(skillDirectory, 'references', 'guide.md'), 'Guide');
    await writeFile(join(skillDirectory, 'scripts', 'run.sh'), 'echo run');

    const sourceFile = join(localPath, 'project.prs');
    const ast: Program = {
      type: 'Program',
      blocks: [
        makeBlock(
          'skills',
          makeObjectContent({
            example: {} as Value,
          })
        ),
      ],
      uses: [],
      extends: [],
      loc: { file: sourceFile, line: 1, column: 1 },
    };

    const result = await resolveNativeSkills(
      ast,
      join(directory, 'registry'),
      sourceFile,
      localPath
    );
    const content = result.blocks[0]?.content as ObjectContent;
    const skill = content.properties['example'] as Record<string, unknown>;

    expect(skill['params']).toBeDefined();
    expect(skill['inputs']).toBeDefined();
    expect(skill['outputs']).toBeDefined();
    expect(skill['compatibility']).toBe('Requires shell access');
    expect(skill['metadata']).toEqual({ owner: 'tests' });
    expect(skill['allowedTools']).toEqual(['Read', 'Bash']);
    expect(skill['license']).toBe('MIT');
    expect(skill['references']).toEqual(['references/guide.md']);
    expect(skill['scripts']).toEqual(['scripts/run.sh']);
  });

  it('propagates native resource errors as resolver errors', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'skill-yaml-native-error-'));
    temporaryDirectories.push(directory);
    const localPath = join(directory, '.promptscript');
    const skillDirectory = join(localPath, 'skills', 'example');
    await mkdir(skillDirectory, { recursive: true });
    await writeFile(
      join(skillDirectory, 'SKILL.md'),
      '---\nname: example\nreferences: [../outside.md]\n---\nBody'
    );

    const sourceFile = join(localPath, 'project.prs');
    const ast: Program = {
      type: 'Program',
      blocks: [
        makeBlock(
          'skills',
          makeObjectContent({
            example: {} as Value,
          })
        ),
      ],
      uses: [],
      extends: [],
      loc: { file: sourceFile, line: 1, column: 1 },
    };

    await expect(
      resolveNativeSkills(ast, join(directory, 'registry'), sourceFile, localPath)
    ).rejects.toThrow(/Unsafe path in references/);
  });

  it('propagates parsed metadata through native auto-discovery', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'skill-yaml-discovery-'));
    temporaryDirectories.push(directory);
    await writeFile(
      join(directory, 'SKILL.md'),
      [
        '---',
        'name: discovered',
        'description: Use when testing discovery',
        'params:',
        '  mode: { type: string }',
        'inputs: { source: { type: string } }',
        'outputs: { result: { type: string } }',
        'references: [guide.md]',
        'scripts: [run.sh]',
        'license: MIT',
        'compatibility: shell',
        'metadata: { owner: tests }',
        'allowed-tools: "Read Bash"',
        '---',
        'Body',
      ].join('\n')
    );

    const result = await discoverNativeContent(directory);
    const skills = result?.blocks.find((block) => block.name === 'skills')
      ?.content as ObjectContent;
    const skill = skills.properties['discovered'] as Record<string, unknown>;

    expect(skill['params']).toBeDefined();
    expect(skill['inputs']).toBeDefined();
    expect(skill['outputs']).toBeDefined();
    expect(skill['references']).toEqual(['guide.md']);
    expect(skill['scripts']).toEqual(['run.sh']);
    expect(skill['license']).toBe('MIT');
    expect(skill['compatibility']).toBe('shell');
    expect(skill['metadata']).toEqual({ owner: 'tests' });
    expect(skill['allowedTools']).toEqual(['Read', 'Bash']);
  });

  it('reports malformed frontmatter from native auto-discovery', async () => {
    const rootDirectory = await mkdtemp(join(tmpdir(), 'skill-yaml-bad-root-'));
    temporaryDirectories.push(rootDirectory);
    await writeFile(join(rootDirectory, 'SKILL.md'), '---\nname: [\n---\nBody');

    await expect(discoverNativeContent(rootDirectory)).rejects.toThrow(/Invalid YAML frontmatter/);

    const nestedDirectory = await mkdtemp(join(tmpdir(), 'skill-yaml-bad-nested-'));
    temporaryDirectories.push(nestedDirectory);
    await mkdir(join(nestedDirectory, 'bad'));
    await writeFile(join(nestedDirectory, 'bad', 'SKILL.md'), '---\nname: [\n---\nBody');

    await expect(discoverNativeContent(nestedDirectory)).rejects.toThrow(
      /Invalid YAML frontmatter/
    );
  });

  it('reports malformed frontmatter through Resolver markdown imports', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'skill-yaml-resolver-'));
    temporaryDirectories.push(directory);
    const markdownPath = join(directory, 'bad.md');
    await writeFile(markdownPath, '---\nname: [\n---\nBody');

    const resolver = new Resolver({
      registryPath: join(directory, 'registry'),
      localPath: directory,
      cache: false,
    });
    const result = await resolver.resolve(markdownPath);

    expect(result.ast).toBeNull();
    expect(result.errors[0]?.message).toContain('Invalid YAML frontmatter');
  });

  it('propagates metadata and scripts through Resolver markdown imports', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'skill-yaml-markdown-'));
    temporaryDirectories.push(directory);
    await mkdir(join(directory, 'references'));
    await mkdir(join(directory, 'scripts'));
    await writeFile(
      join(directory, 'skill.md'),
      [
        '---',
        'name: imported',
        'description: Use when testing markdown imports',
        'params: { mode: { type: string, default: standard } }',
        'inputs: { source: { type: string } }',
        'outputs: { result: { type: string } }',
        'compatibility: shell',
        'metadata: { owner: tests }',
        'allowed-tools: "Read Bash"',
        'license: MIT',
        'references: [references/guide.md]',
        'scripts: [scripts/run.sh]',
        '---',
        'Body',
      ].join('\n')
    );
    await writeFile(join(directory, 'references', 'guide.md'), 'Guide');
    await writeFile(join(directory, 'scripts', 'run.sh'), 'echo run');

    const resolver = new Resolver({
      registryPath: join(directory, 'registry'),
      localPath: directory,
      cache: false,
    });
    const result = await resolver.resolve(join(directory, 'skill.md'));
    const skills = result.ast?.blocks.find((block) => block.name === 'skills')
      ?.content as ObjectContent;
    const skill = skills.properties['imported'] as Record<string, unknown>;

    expect(skill['params']).toBeDefined();
    expect(skill['inputs']).toBeDefined();
    expect(skill['outputs']).toBeDefined();
    expect(skill['compatibility']).toBe('shell');
    expect(skill['metadata']).toEqual({ owner: 'tests' });
    expect(skill['allowedTools']).toEqual(['Read', 'Bash']);
    expect(skill['license']).toBe('MIT');
    expect(skill['references']).toEqual(['references/guide.md']);
    expect(skill['scripts']).toEqual(['scripts/run.sh']);
    expect(skill['resources']).toBeDefined();
  });

  it('propagates parsed metadata through Resolver directory scans', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'skill-yaml-scan-'));
    temporaryDirectories.push(directory);
    const skillDirectory = join(directory, 'skills', 'example');
    await mkdir(skillDirectory, { recursive: true });
    await writeFile(
      join(skillDirectory, 'SKILL.md'),
      [
        '---',
        'name: scanned',
        'description: Use when testing directory scans',
        'license: MIT',
        'compatibility: shell',
        'metadata: { owner: tests }',
        'allowed-tools: "Read Bash"',
        'references: [guide.md]',
        'scripts: [run.sh]',
        '---',
        'Body',
      ].join('\n')
    );
    await writeFile(join(skillDirectory, 'guide.md'), 'Guide');
    await writeFile(join(skillDirectory, 'run.sh'), 'echo run');

    const resolver = new Resolver({
      registryPath: join(directory, 'registry'),
      localPath: directory,
      cache: false,
    });
    const result = await resolver.resolve(join(directory, 'skills.prs'));
    const skills = result.ast?.blocks.find((block) => block.name === 'skills')
      ?.content as ObjectContent;
    const skill = skills.properties['scanned'] as Record<string, unknown>;

    expect(skill['license']).toBe('MIT');
    expect(skill['compatibility']).toBe('shell');
    expect(skill['metadata']).toEqual({ owner: 'tests' });
    expect(skill['allowedTools']).toEqual(['Read', 'Bash']);
  });

  it('reports malformed frontmatter through Resolver directory scans', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'skill-yaml-scan-bad-'));
    temporaryDirectories.push(directory);
    await mkdir(join(directory, 'skills', 'bad'), { recursive: true });
    await writeFile(join(directory, 'skills', 'bad', 'SKILL.md'), '---\nname: [\n---\nBody');

    const resolver = new Resolver({
      registryPath: join(directory, 'registry'),
      localPath: directory,
      cache: false,
    });

    await expect(resolver.resolve(join(directory, 'skills.prs'))).rejects.toThrow(
      /Invalid YAML frontmatter/
    );
  });

  it('reports malformed fallback frontmatter through Resolver directory scans', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'skill-yaml-fallback-bad-'));
    temporaryDirectories.push(directory);
    await mkdir(join(directory, 'skills', 'fallback'), { recursive: true });
    await writeFile(
      join(directory, 'skills', 'fallback', 'fallback.md'),
      '---\nname: [\n---\nBody'
    );

    const resolver = new Resolver({
      registryPath: join(directory, 'registry'),
      localPath: directory,
      cache: false,
    });

    await expect(resolver.resolve(join(directory, 'skills.prs'))).rejects.toThrow(
      /Invalid YAML frontmatter/
    );
  });

  it('collects script errors from Resolver markdown imports', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'skill-yaml-script-import-'));
    temporaryDirectories.push(directory);
    await writeFile(
      join(directory, 'skill.md'),
      '---\nname: imported\ndescription: Use when testing scripts\nscripts: [../outside.sh]\n---\nBody'
    );

    const resolver = new Resolver({
      registryPath: join(directory, 'registry'),
      localPath: directory,
      cache: false,
    });
    const result = await resolver.resolve(join(directory, 'skill.md'));

    expect(result.ast).not.toBeNull();
    expect(result.errors.some((error) => error.message.includes('Unsafe path in scripts'))).toBe(
      true
    );
  });

  it('validates malformed YAML as a SK000 issue', () => {
    const result = validateSkillFrontmatter('---\nname: [\n---\nBody', {
      filePath: '/tmp/skills/bad/SKILL.md',
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: 'SK000', severity: 'error' })
    );
  });

  it('preserves empty frontmatter and body boundaries', () => {
    const result = parseSkillMd('---\r\n---\r\n\r\nBody\r\n');

    expect(result.rawFrontmatter).toBe('');
    expect(result.content).toBe('Body');
    expect(result.name).toBeUndefined();
  });

  it.each([
    ['malformed YAML', 'name: ['],
    ['explicit tags', 'name: !!str value'],
    ['unresolved tags', 'name: !custom value'],
    ['anchors', 'name: &base value'],
    ['aliases', 'copy: *base\nname: &base value'],
  ])('rejects %s with an actionable resolver error', (_caseName, yaml) => {
    expect(() => parseSkillMd(`---\n${yaml}\n---\nBody`, '/tmp/skills/bad/SKILL.md')).toThrow(
      /Invalid YAML frontmatter/
    );
  });

  it('rejects oversized frontmatter before parsing it', () => {
    const description = 'x'.repeat(256 * 1024);

    expect(() =>
      parseSkillMd(`---\ndescription: "${description}"\n---\nBody`, '/tmp/skills/large/SKILL.md')
    ).toThrow(/frontmatter exceeds/);
  });

  it.each([
    ['oversized string', `unknown: "${'x'.repeat(64 * 1024 + 1)}"`, /string exceeds/],
    [
      'oversized sequence',
      `unknown: [${Array.from({ length: 2001 }, () => 'x').join(', ')}]`,
      /sequence exceeds/,
    ],
    [
      'oversized mapping',
      Array.from({ length: 2001 }, (_, index) => `key${index}: value`).join('\n'),
      /mapping exceeds/,
    ],
    [
      'too many values',
      Array.from(
        { length: 6 },
        (_, index) => `list${index}: [${Array.from({ length: 2000 }, () => 'x').join(', ')}]`
      ).join('\n'),
      /contains more than/,
    ],
    [
      'excessive nesting',
      `${Array.from({ length: 34 }, (_, index) => `${'  '.repeat(index)}level${index}:`).join('\n')}\n${'  '.repeat(34)}value`,
      /nesting exceeds/,
    ],
  ])('rejects %s frontmatter', (_caseName, yaml, expected) => {
    expect(() => parseSkillMd(`---\n${yaml}\n---\nBody`, '/tmp/skills/limited/SKILL.md')).toThrow(
      expected
    );
  });

  it('rejects unsafe reference paths before file access', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'skill-yaml-'));
    temporaryDirectories.push(directory);

    await expect(resolveSkillReferences(['../outside.md'], directory)).rejects.toThrow(
      /unsafe path/i
    );
  });

  it('rejects symlinked reference resources', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'skill-yaml-'));
    temporaryDirectories.push(directory);
    const referencesDirectory = join(directory, 'references');
    const outsideFile = join(directory, 'outside.md');
    await mkdir(referencesDirectory);
    await writeFile(outsideFile, 'secret');
    await symlink(outsideFile, join(referencesDirectory, 'linked.md'));

    await expect(resolveSkillReferences(['references/linked.md'], directory)).rejects.toThrow(
      /symbolic link|escapes skill directory/i
    );
  });

  it('rejects missing, directory, and escaping reference resources', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'skill-yaml-reference-errors-'));
    temporaryDirectories.push(directory);
    await mkdir(join(directory, 'references', 'directory'), { recursive: true });
    await writeFile(join(directory, 'references', 'empty.md'), '');
    await mkdir(join(directory, 'references', 'nested'));
    await writeFile(join(directory, 'references', 'nested', 'empty.md'), '');

    await expect(resolveSkillReferences(['references/missing.md'], directory)).rejects.toThrow(
      /Reference file not found/
    );
    await expect(resolveSkillReferences(['references/directory'], directory)).rejects.toThrow(
      /Reference file not found/
    );

    const outsideDirectory = await mkdtemp(join(tmpdir(), 'skill-yaml-reference-outside-'));
    temporaryDirectories.push(outsideDirectory);
    await writeFile(join(outsideDirectory, 'secret.md'), 'secret');
    await symlink(outsideDirectory, join(directory, 'references', 'external'));

    await expect(
      resolveSkillReferences(['references/external/secret.md'], directory)
    ).rejects.toThrow(/escapes skill directory/);

    const resources = await resolveSkillReferences(
      ['references/empty.md', 'references/nested/empty.md'],
      directory
    );
    expect(resources).toHaveLength(1);
    expect(resources[0]?.relativePath).toBe('references/nested/empty.md');
  });

  it('rejects symlinked, escaping, and directory script resources', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'skill-yaml-script-errors-'));
    temporaryDirectories.push(directory);
    await mkdir(join(directory, 'scripts', 'directory'), { recursive: true });
    const outsideDirectory = await mkdtemp(join(tmpdir(), 'skill-yaml-script-outside-'));
    temporaryDirectories.push(outsideDirectory);
    await writeFile(join(outsideDirectory, 'secret.sh'), 'secret');
    await symlink(join(outsideDirectory, 'secret.sh'), join(directory, 'scripts', 'linked.sh'));
    await symlink(outsideDirectory, join(directory, 'scripts', 'external'));

    await expect(resolveSkillScripts(['scripts/linked.sh'], directory)).rejects.toThrow(
      /symbolic link/
    );
    await expect(resolveSkillScripts(['scripts/external/secret.sh'], directory)).rejects.toThrow(
      /escapes skill directory/
    );
    await expect(resolveSkillScripts(['scripts/directory'], directory)).rejects.toThrow(
      /Script file not found/
    );
  });
});
