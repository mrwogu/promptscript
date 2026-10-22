import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { Compiler } from '@promptscript/compiler';

const guide = readFileSync(
  new URL('../../../../docs/guides/application-prompts.md', import.meta.url),
  'utf8'
);

const block = (language: string): string => {
  const match = new RegExp('```' + language + '\\n([\\s\\S]*?)```').exec(guide);
  if (!match?.[1]) throw new Error(`The guide has no ${language} block`);
  return match[1];
};

const directories: string[] = [];

afterAll(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('the application prompts guide', () => {
  it('shows the bundle that its source compiles to', async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'prs-guide-')));
    directories.push(root);
    mkdirSync(join(root, '.promptscript'));
    const entry = join(root, '.promptscript', 'project.prs');
    writeFileSync(entry, block('promptscript'));

    const result = await new Compiler({
      resolver: { registryPath: root, projectRoot: root, localPath: join(root, '.promptscript') },
      formatters: ['bundle'],
    }).compile(entry);

    expect(result.errors).toEqual([]);
    expect(JSON.parse(result.outputs.get('prompts/refund-reply.json')?.content ?? 'null')).toEqual(
      JSON.parse(block('json'))
    );
  });

  it.each([
    'never escapes, delimits or filters the values',
    'Output schemas are not enforced',
    'extractable',
    'inside `"""` is prompt text',
    'internal git hosts',
    'A policy must evaluate the recompiled source',
    '`owner` and `reviewers` put names or addresses into production artifacts',
    'Composed text is public once shipped',
    'recompute `contentHash` and reject the bundle',
    'validate the structure against the schema',
    'never fetch the URL in `$schema`',
    'never deep-merge bundle JSON into defaults',
    'prs validate --strict',
    'not an approved artifact',
  ])('states: %s', (statement) => {
    expect(guide.replace(/\s+/g, ' ')).toContain(statement);
  });

  it('does not call a preview ready to paste', () => {
    expect(guide.toLowerCase()).not.toContain('ready to paste');
  });
});
