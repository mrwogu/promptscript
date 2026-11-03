import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { compileCommand } from '../commands/compile.js';

/**
 * Golden test for agent, command and skill files written as native markdown
 * in .promptscript/. It compiles them for factory and claude and compares the
 * generated files with __golden__/native-frontmatter.
 *
 * Update after an intended change:
 *   UPDATE_GOLDEN=true pnpm nx test cli
 */

const GOLDEN_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '__golden__',
  'native-frontmatter'
);
const UPDATE_GOLDEN = process.env['UPDATE_GOLDEN'] === 'true';

const SOURCES: Record<string, string> = {
  'agents/reviewer.md': `---
name: reviewer
description: >-
  Reviews one migrated module against the spec.
  Produces: a findings list with severity.
tools: Read, Grep, Execute
model: inherit
---

Review the module.
`,
  'agents/planner.md': `---
name: planner
description: "Plans a migration. Use when: the module has no plan yet"
tools:
  - Read
  - Grep
---

Plan the work.
`,
  'commands/migrate.md': `---
description: >-
  Run one migration step.
  Produces: a short report
argument-hint: <module> [--dry-run]
---

Migrate $ARGUMENTS.
`,
  'skills/spec-check/SKILL.md': `---
name: spec-check
description: >-
  Checks a module against its spec.
  Produces: a pass or fail table.
license: MIT
metadata:
  owner: platform
---

Check the spec.
`,
};

const EXPECTED_FILES = [
  '.factory/droids/reviewer.md',
  '.factory/droids/planner.md',
  '.factory/commands/migrate.md',
  '.factory/skills/spec-check/SKILL.md',
  '.claude/agents/reviewer.md',
  '.claude/agents/planner.md',
  '.claude/commands/migrate.md',
  '.claude/skills/spec-check/SKILL.md',
];

async function createProject(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'promptscript-native-frontmatter-'));
  await mkdir(join(directory, '.promptscript'), { recursive: true });
  await writeFile(
    join(directory, 'promptscript.yaml'),
    `version: '1'
project:
  id: native-frontmatter
targets:
  - factory:
      version: full
  - claude:
      version: full
`
  );
  await writeFile(
    join(directory, '.promptscript', 'project.prs'),
    `@meta {
  id: "native-frontmatter"
  syntax: "1.4.0"
}

@identity {
  """Native frontmatter"""
}
`
  );
  for (const [path, content] of Object.entries(SOURCES)) {
    const target = join(directory, '.promptscript', path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  return directory;
}

// The marker line has a timestamp and a temp path, so it is not compared.
function normalize(content: string): string {
  return content.replace(/^# promptscript-generated: .*$/m, '# promptscript-generated');
}

function frontmatterOf(content: string): string {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(content);
  if (!match) throw new Error('No frontmatter found');
  return match[1]!;
}

describe('compile native agent, command and skill frontmatter', () => {
  let directory = '';

  beforeAll(async () => {
    process.exitCode = undefined;
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    directory = await createProject();
    await compileCommand({ cwd: directory });
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
    await rm(directory, { recursive: true, force: true });
  });

  it('compiles without errors', () => {
    expect(process.exitCode).toBeUndefined();
  });

  it.each(EXPECTED_FILES)('matches the golden file %s', async (file) => {
    const actual = normalize(await readFile(join(directory, file), 'utf-8'));
    // Every generated frontmatter must be valid YAML.
    expect(() => parse(frontmatterOf(actual))).not.toThrow();

    const goldenPath = join(GOLDEN_DIR, file);
    if (UPDATE_GOLDEN || !existsSync(goldenPath)) {
      await mkdir(dirname(goldenPath), { recursive: true });
      await writeFile(goldenPath, actual);
      if (!UPDATE_GOLDEN) throw new Error(`Golden file was missing and is now written: ${file}`);
      return;
    }
    expect(actual).toBe(await readFile(goldenPath, 'utf-8'));
  });

  it('keeps the parsed values of every frontmatter field', async () => {
    const read = async (file: string): Promise<Record<string, unknown>> =>
      parse(frontmatterOf(await readFile(join(directory, file), 'utf-8'))) as Record<
        string,
        unknown
      >;
    const droid = await read('.factory/droids/reviewer.md');
    expect(droid['description']).toBe(
      'Reviews one migrated module against the spec. Produces: a findings list with severity.'
    );
    expect(droid['tools']).toEqual(['Read', 'Grep', 'Execute']);
    expect((await read('.factory/droids/planner.md'))['tools']).toEqual(['Read', 'Grep']);

    const claudeAgent = await read('.claude/agents/planner.md');
    expect(claudeAgent['description']).toBe(
      'Plans a migration. Use when: the module has no plan yet'
    );

    for (const file of ['.factory/commands/migrate.md', '.claude/commands/migrate.md']) {
      const content = await readFile(join(directory, file), 'utf-8');
      expect(content.match(/^---$/gm)).toHaveLength(2);
      const command = await read(file);
      expect(command['description']).toBe('Run one migration step. Produces: a short report');
      expect(command['argument-hint']).toBe('<module> [--dry-run]');
    }

    const skill = await read('.factory/skills/spec-check/SKILL.md');
    expect(skill['description']).toBe(
      'Checks a module against its spec. Produces: a pass or fail table.'
    );
    expect(skill['license']).toBeUndefined();
  });
});
