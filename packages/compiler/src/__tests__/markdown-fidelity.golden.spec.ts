import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Compiler } from '../compiler.js';

/**
 * Golden tests for markdown that must reach the output with the same
 * meaning: tables, code spans, list nesting, glob paths, @context headings
 * and skill frontmatter. The inputs are the repro snippets from #754, #755
 * and #757.
 */

const GOLDEN = './__golden__/markdown-fidelity';

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

const SKILL_MD = `---
name: code-review
description: Review code
params:
  language:
    type: string
    default: typescript
---

You are a {{language}} code reviewer.

| Pattern | Flag | Note |
| --- | --- | --- |
| \`a\\|b\` | -- | x |

Paths: services/*, gateways/*

Keep \`__init__.py\` as it is.

- item one
  continuation line
- item two
  - nested item:
  - second nested item

1. Step one:
   | Col | Val |
   | --- | --- |
   | a   | b   |
2. Step two
`;

function contextBlock(header: string | undefined): string {
  return `@context {
${header ? `  @header "${header}"\n` : ''}  """
  ## A

  Text a.

  ### A.1

  Text a1.

  ## B

  Text b.
  """
}`;
}

async function compileProject(header: string | undefined): Promise<Map<string, string>> {
  const directory = mkdtempSync(join(tmpdir(), 'promptscript-markdown-fidelity-'));
  directories.push(directory);
  const skillDir = join(directory, '.promptscript', 'skills', 'code-review');
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, 'SKILL.md'), SKILL_MD);
  writeFileSync(
    join(directory, '.promptscript', 'project.prs'),
    `@meta {
  id: "markdown-fidelity"
  syntax: "1.5.0"
}

@identity {
  """
  You are a dev.
  """
}

${contextBlock(header)}

@skills {
  code-review: {
    language: "python"
  }
}
`
  );

  const compiler = new Compiler({
    resolver: {
      registryPath: directory,
      localPath: join(directory, '.promptscript'),
      projectRoot: directory,
    },
    formatters: [
      { name: 'claude', config: { version: 'full' } },
      { name: 'factory', config: { version: 'full' } },
    ],
  });
  const result = await compiler.compile(join(directory, '.promptscript', 'project.prs'));
  expect(result.errors).toEqual([]);
  expect(result.success).toBe(true);

  const outputs = new Map<string, string>();
  for (const [path, output] of result.outputs) {
    outputs.set(path, stable(output.content));
  }
  return outputs;
}

/** Replace generation timestamps and temp paths so the golden files stay stable. */
function stable(content: string): string {
  return content
    .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g, '[TIMESTAMP]')
    .replace(/source: \S+/g, 'source: [SOURCE]');
}

function requireOutput(outputs: Map<string, string>, path: string): string {
  const content = outputs.get(path);
  expect(content, `Missing compiler output: ${path}`).toBeDefined();
  return content!;
}

describe('markdown fidelity golden files', () => {
  it('keeps the Claude skill body and drops params from the frontmatter', async () => {
    const outputs = await compileProject('Background');

    const claudeSkill = requireOutput(outputs, '.claude/skills/code-review/SKILL.md');
    expect(claudeSkill).toContain('| `a\\|b`  | --   | x    |');
    expect(claudeSkill).toContain('- item one\n  continuation line\n- item two\n');
    expect(claudeSkill).toContain('2. Step two');
    expect(claudeSkill).not.toContain('params:');
    await expect(claudeSkill).toMatchFileSnapshot(`${GOLDEN}/claude-skill.md`);

    const factorySkill = requireOutput(outputs, '.factory/skills/code-review/SKILL.md');
    expect(factorySkill).not.toContain('params:');
    await expect(factorySkill).toMatchFileSnapshot(`${GOLDEN}/factory-skill.md`);
  });

  it('keeps @context headings and their levels with an explicit @header', async () => {
    const outputs = await compileProject('Background');

    const claude = requireOutput(outputs, 'CLAUDE.md');
    expect(claude).toContain('## Background\n\n### A\n\nText a.\n\n#### A.1\n\nText a1.\n\n### B');
    await expect(claude).toMatchFileSnapshot(`${GOLDEN}/claude-context-header.md`);

    const agents = requireOutput(outputs, 'AGENTS.md');
    expect(agents).toContain('## Background\n\n### A\n\nText a.\n\n#### A.1\n\nText a1.\n\n### B');
    await expect(agents).toMatchFileSnapshot(`${GOLDEN}/factory-context-header.md`);
  });

  it('keeps @context heading levels when the first heading is the section title', async () => {
    const outputs = await compileProject(undefined);

    const claude = requireOutput(outputs, 'CLAUDE.md');
    expect(claude).toContain('## A\n\nText a.\n\n#### A.1\n\nText a1.\n\n### B');
    await expect(claude).toMatchFileSnapshot(`${GOLDEN}/claude-context-legacy.md`);
  });
});
