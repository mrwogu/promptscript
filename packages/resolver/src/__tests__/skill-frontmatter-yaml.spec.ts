import { describe, expect, it, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { parseSkillMd, resolveSkillReferences } from '../skills.js';

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

  it('preserves empty frontmatter and body boundaries', () => {
    const result = parseSkillMd('---\r\n---\r\n\r\nBody\r\n');

    expect(result.rawFrontmatter).toBe('');
    expect(result.content).toBe('Body');
    expect(result.name).toBeUndefined();
  });

  it.each([
    ['malformed YAML', 'name: ['],
    ['explicit tags', 'name: !custom value'],
    ['anchors', 'name: &base value'],
    ['aliases', 'name: &base value\ncopy: *base'],
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
});
